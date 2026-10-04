import { timingSafeEqual } from 'node:crypto';
import Fastify, { LogController } from 'fastify';
import type { FastifyInstance, FastifyLoggerOptions, FastifyReply, FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import { AUTHORIZATION_TIMEOUT_MS, parseAuthenticateMessage, parseGeofenceUpdate, parsePositionObservation, UPLOAD_INTERVAL_MS } from '../../shared/protocol.ts';
import type { Snapshot, SnapshotMessage } from '../../shared/protocol.ts';
import type { Config } from './config.ts';
import { VersionConflict } from './store.ts';
import type { Store } from './store.ts';

function equalSecret(candidate: unknown, secret: string): boolean {
  if (typeof candidate !== 'string') return false;
  const encoded = Buffer.from(candidate);
  const expected = Buffer.from(secret);
  return encoded.length === expected.length && timingSafeEqual(encoded, expected);
}

export async function createApp(config: Config, store: Store, logger: boolean | FastifyLoggerOptions = true): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger ? { ...(typeof logger === 'object' ? logger : {}), redact: ['req.headers.authorization', 'req.body.token', 'token'] } : false,
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: 16384,
    requestTimeout: 10000,
    connectionTimeout: 10000,
    keepAliveTimeout: 5000,
    trustProxy: config.transportMode === 'https-proxy' ? config.trustedProxy : false,
  });
  await app.register(websocket, {
    options: { maxPayload: 1024, perMessageDeflate: false },
    errorHandler: (_error, socket) => { socket.terminate(); },
    preClose: async () => {
      for (const socket of app.websocketServer.clients) socket.terminate();
      app.server.removeAllListeners('upgrade');
      await new Promise<void>(resolve => { app.websocketServer.close(() => { resolve(); }); });
    },
  });
  const connections = new Map<WebSocket, { authorized: boolean; authenticating: boolean; revision: number; sentAt: number; alive: boolean }>();
  let polling = false;

  function send(socket: WebSocket, snapshot: Snapshot): void {
    const connection = connections.get(socket);
    if (!connection?.authorized || socket.readyState !== 1 || snapshot.revision < connection.revision) return;
    if (socket.bufferedAmount > 256 * 1024) { socket.terminate(); return; }
    const message = { type: 'snapshot', snapshot } satisfies SnapshotMessage;
    socket.send(JSON.stringify(message), error => { if (error) socket.terminate(); });
    connection.revision = snapshot.revision;
    connection.sentAt = Date.now();
  }

  const poll = setInterval(() => {
    if (polling || ![...connections.values()].some(connection => connection.authorized)) return;
    polling = true;
    void store.snapshot().then(snapshot => {
      for (const [socket, connection] of connections) {
        if (snapshot.revision !== connection.revision || Date.now() - connection.sentAt >= UPLOAD_INTERVAL_MS) send(socket, snapshot);
      }
    }).catch(() => {
      app.log.error('Snapshot refresh failed');
      for (const socket of connections.keys()) socket.close(1011, 'Service unavailable');
    }).finally(() => { polling = false; });
  }, 1000);
  poll.unref();
  const heartbeat = setInterval(() => {
    for (const [socket, connection] of connections) {
      if (!connection.alive) { socket.terminate(); continue; }
      connection.alive = false;
      socket.ping();
    }
  }, 30000);
  heartbeat.unref();

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (request.url !== '/health' && config.transportMode === 'https-proxy' && request.protocol !== 'https') {
      return reply.code(403).send({ error: 'HTTPS required' });
    }
    if (request.url.includes('?')) return reply.code(400).send({ error: 'Query parameters are not supported' });
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof VersionConflict) return reply.code(409).send({ error: 'Fence version conflict' });
    if (error instanceof TypeError) return reply.code(400).send({ error: 'Invalid payload' });
    if (typeof error === 'object' && error !== null && 'statusCode' in error &&
        typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: 'Invalid request' });
    }
    app.log.error('Request failed');
    return reply.code(503).send({ error: 'Service unavailable' });
  });
  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Not found' }));
  app.get('/health', async (_request, reply) => {
    const healthy = await store.healthy();
    return reply.code(healthy ? 200 : 503).send({ ok: healthy });
  });
  app.post('/api/locations', {
    onRequest: async (request, reply) => {
      if (!equalSecret(request.headers.authorization, `Bearer ${config.deviceToken}`)) return reply.code(401).send({ error: 'Unauthorized' });
    },
    onResponse: async (request, reply) => {
      if (reply.statusCode >= 400) request.log.warn({ statusCode: reply.statusCode }, 'GPS upload rejected');
    },
  }, async (request, reply) => {
    const observation = parsePositionObservation(request.body);
    if (observation.deviceId !== config.deviceId) return reply.code(403).send({ error: 'Device not configured' });
    const result = await store.accept(observation);
    request.log.info({
      deviceId: config.deviceId,
      latitude: observation.latitude,
      longitude: observation.longitude,
      observedAt: observation.observedAt,
      accepted: result.accepted,
      revision: result.revision,
    }, result.accepted ? 'GPS upload accepted' : 'GPS upload ignored');
    return result;
  });
  const ownerOnly = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!equalSecret(request.headers.authorization, `Bearer ${config.ownerToken}`)) await reply.code(401).send({ error: 'Unauthorized' });
  };
  app.get('/api/snapshot', { onRequest: ownerOnly }, async () => store.snapshot());
  app.put('/api/geofence', { onRequest: ownerOnly }, async request => {
    const update = parseGeofenceUpdate(request.body);
    if (update.vertices.length > 100 || update.expectedVersion >= Number.MAX_SAFE_INTEGER) throw new TypeError('Fence exceeds demo limits');
    await store.replaceFence(update);
    return store.snapshot();
  });
  app.get('/api/live', { websocket: true }, socket => {
    if (connections.size >= 32) { socket.close(1013, 'Connection limit'); return; }
    const connection = { authorized: false, authenticating: false, revision: -1, sentAt: 0, alive: true };
    connections.set(socket, connection);
    const timeout = setTimeout(() => { if (!connection.authorized) socket.close(1008, 'Authentication required'); }, AUTHORIZATION_TIMEOUT_MS);
    timeout.unref();
    socket.on('error', () => { socket.terminate(); });
    socket.on('close', () => { clearTimeout(timeout); connections.delete(socket); });
    socket.on('pong', () => { connection.alive = true; });
    socket.on('message', (data, binary) => {
      if (connection.authorized || connection.authenticating || binary) { socket.close(1008, 'Unexpected frame'); return; }
      connection.authenticating = true;
      try {
        const message = parseAuthenticateMessage(JSON.parse(data.toString()) as unknown);
        if (!equalSecret(message.token, config.ownerToken)) { socket.close(1008, 'Unauthorized'); return; }
        connection.authorized = true;
        clearTimeout(timeout);
        void store.snapshot().then(snapshot => send(socket, snapshot)).catch(() => { socket.close(1011, 'Service unavailable'); });
      } catch {
        socket.close(1008, 'Invalid authentication');
      }
    });
  });
  app.addHook('preClose', async () => {
    clearInterval(poll);
    clearInterval(heartbeat);
    for (const socket of connections.keys()) socket.terminate();
  });
  app.addHook('onClose', async () => { await store.close(); });
  return app;
}
