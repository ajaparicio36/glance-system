import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import postgres from 'postgres';
import { isLocationStale } from '../../shared/lifecycle.ts';
import { parseSnapshot, parseSnapshotMessage } from '../../shared/protocol.ts';
import type { Snapshot } from '../../shared/protocol.ts';
import { createApp } from '../src/app.ts';
import { readConfig } from '../src/config.ts';
import { createStore } from '../src/store.ts';

test('real PostgreSQL, HTTP, websocket, lifecycle, durability and concurrent writers', { timeout: 120000 }, async context => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'Set TEST_DATABASE_URL to a NEW dedicated glance_test_* database');
  assert.match(new URL(databaseUrl).pathname, /^\/glance_test_[a-z0-9_]+$/);
  const admin = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  context.after(async () => { await admin.end({ timeout: 5 }); });
  const existing = await admin`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  assert.equal(existing.length, 0, 'Refusing an existing/nonempty test database');
  const config = readConfig({ DATABASE_URL: databaseUrl, DEVICE_ID: 'prototype-001', DEVICE_TOKEN: randomBytes(32).toString('base64url'), OWNER_TOKEN: randomBytes(32).toString('base64url'), TRANSPORT_MODE: 'trusted-local' });
  const app = await createApp(config, await createStore(databaseUrl, config.deviceId), false);
  const second = await createApp(config, await createStore(databaseUrl, config.deviceId), false);
  const sockets: WebSocket[] = [];
  let closed = false;
  try {
    const base = await app.listen({ host: '127.0.0.1', port: 0 });
    const otherBase = await second.listen({ host: '127.0.0.1', port: 0 });
    const request = async (path: string, method = 'GET', token: string | null = config.ownerToken, body?: unknown, endpoint = base): Promise<Response> => {
      return fetch(`${endpoint}${path}`, { method, headers: { ...(token === null ? {} : { Authorization: `Bearer ${token}` }), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    };
    const snapshot = async (): Promise<Snapshot> => {
      const response = await request('/api/snapshot');
      assert.equal(response.status, 200);
      return parseSnapshot(await response.json() as unknown);
    };
    let lastTime = Date.now() - 100;
    const observation = (latitude = 2, longitude = 2): { deviceId: string; latitude: number; longitude: number; observedAt: string } => {
      lastTime = Math.max(Date.now(), lastTime + 1);
      return { deviceId: config.deviceId, latitude, longitude, observedAt: new Date(lastTime).toISOString() };
    };
    const upload = async (body: unknown, endpoint = base): Promise<{ accepted: boolean; revision: number }> => {
      const response = await request('/api/locations', 'POST', config.deviceToken, body, endpoint);
      assert.equal(response.status, 200);
      return await response.json() as { accepted: boolean; revision: number };
    };
    const vertices = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, { latitude: 1, longitude: 1 }, { latitude: 1, longitude: 0 }];
    const fence = async (expectedVersion: number): Promise<Response> => request('/api/geofence', 'PUT', config.ownerToken, { vertices, expectedVersion });
    assert.deepEqual(await (await request('/health', 'GET', null)).json(), { ok: true });
    assert.equal((await request('/missing')).status, 404);
    for (const token of [null, 'invalid', config.deviceToken]) {
      assert.equal((await request('/api/snapshot', 'GET', token)).status, 401);
      assert.equal((await request('/api/geofence', 'PUT', token, { vertices, expectedVersion: 0 })).status, 401);
    }
    assert.equal((await request('/api/locations', 'POST', config.ownerToken, observation())).status, 401);
    assert.equal((await request('/api/snapshot?token=not-a-secret')).status, 400);
    assert.equal((await snapshot()).revision, 0);
    for (const body of [null, {}, { ...observation(), latitude: 91 }, { ...observation(), longitude: '2' }, { ...observation(), extra: true }, { ...observation(), observedAt: '2026-02-30T00:00:00.000Z' }, { ...observation(), deviceId: 'bad identity' }]) {
      assert.equal((await request('/api/locations', 'POST', config.deviceToken, body)).status, 400);
    }
    assert.equal((await request('/api/locations', 'POST', config.deviceToken, { ...observation(), deviceId: 'another-device' })).status, 403);
    assert.equal((await snapshot()).revision, 0);
    for (const badVertices of [[], vertices.slice(0, 2), [vertices[0], vertices[2], vertices[1], vertices[3]], [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, { latitude: 0, longitude: 2 }]]) {
      assert.equal((await request('/api/geofence', 'PUT', config.ownerToken, { vertices: badVertices, expectedVersion: 0 })).status, 400);
    }
    assert.equal((await snapshot()).revision, 0);
    assert.equal((await upload(observation())).accepted, true);
    assert.equal((await snapshot()).devices[0].boundaryStatus, 'unknown');
    assert.equal((await snapshot()).incidents.length, 0);
    assert.equal((await fence(0)).status, 200);
    const afterFence = await snapshot();
    assert.equal(afterFence.geofence?.version, 1);
    assert.equal(afterFence.devices[0].boundaryStatus, 'unknown');
    assert.equal((await fence(0)).status, 409);
    assert.equal((await snapshot()).revision, afterFence.revision);
    const firstOutside = observation();
    assert.equal((await upload(firstOutside)).accepted, true);
    const outside = await snapshot();
    assert.equal(outside.devices[0].boundaryStatus, 'outside');
    assert.equal(outside.incidents.length, 1);
    const initialId = outside.devices[0].activeViolationId;
    for (const ignored of [firstOutside, { ...firstOutside, observedAt: new Date(Date.parse(firstOutside.observedAt) - 1).toISOString() }, { ...firstOutside, observedAt: new Date(Date.now() - 16000).toISOString() }, { ...firstOutside, observedAt: new Date(Date.now() + 6000).toISOString() }]) {
      assert.deepEqual(await upload(ignored), { accepted: false, revision: outside.revision });
      assert.deepEqual((await snapshot()).devices[0], outside.devices[0]);
    }
    assert.equal((await upload(observation())).accepted, true);
    assert.equal((await snapshot()).devices[0].activeViolationId, initialId);
    assert.equal((await snapshot()).incidents.length, 1);
    await delay(15100);
    const stale = await snapshot();
    assert.ok(isLocationStale(stale.devices[0].location, stale.serverTime));
    assert.equal(stale.devices[0].activeViolationId, initialId);
    assert.equal(stale.incidents[0].resolution, null);
    assert.deepEqual(await upload(firstOutside), { accepted: false, revision: stale.revision });
    assert.deepEqual((await snapshot()).devices[0].location, stale.devices[0].location);
    const delayed = { ...observation(), observedAt: new Date(Date.now() - 14000).toISOString() };
    assert.equal((await upload(delayed)).accepted, true);
    const delayedSnapshot = await snapshot();
    assert.equal(isLocationStale(delayedSnapshot.devices[0].location, delayedSnapshot.serverTime), false);
    await delay(1100);
    const expiredObservation = await snapshot();
    assert.equal(isLocationStale(expiredObservation.devices[0].location, expiredObservation.serverTime), true);
    assert.equal(expiredObservation.devices[0].activeViolationId, initialId);
    await upload(observation(0, 0.5));
    const returned = await snapshot();
    assert.equal(returned.devices[0].boundaryStatus, 'inside');
    assert.equal(returned.devices[0].activeViolationId, null);
    assert.equal(returned.incidents[0].resolution, 'returned');
    assert.equal(returned.incidents[0].returnPosition?.latitude, 0);
    const nextOutside = observation();
    await upload(nextOutside);
    assert.equal((await snapshot()).incidents.length, 2);
    assert.equal((await fence(1)).status, 200);
    const replacement = await snapshot();
    assert.equal(replacement.incidents[0].resolution, 'fence_changed');
    assert.equal(replacement.incidents[0].returnPosition, null);
    assert.equal(replacement.devices[0].boundaryStatus, 'unknown');
    assert.equal(replacement.devices[0].activeViolationId, null);
    assert.equal(replacement.devices[0].location?.observedAt, nextOutside.observedAt);
    assert.deepEqual(await upload(nextOutside), { accepted: false, revision: replacement.revision });
    assert.equal((await snapshot()).devices[0].boundaryStatus, 'unknown');
    await upload(observation());
    assert.equal((await snapshot()).devices[0].boundaryStatus, 'outside');

    const beforeParallel = await snapshot();
    const older = observation();
    const newer = observation();
    await Promise.all([upload(newer, otherBase), upload(older), upload(newer)]);
    const concurrent = await snapshot();
    assert.equal(concurrent.devices[0].location?.observedAt, newer.observedAt);
    assert.ok(concurrent.revision > beforeParallel.revision);
    assert.equal(concurrent.incidents.filter(episode => episode.resolution === null).length, 1);
    const version = concurrent.geofence?.version ?? 0;
    const races = await Promise.all([fence(version), request('/api/geofence', 'PUT', config.ownerToken, { vertices, expectedVersion: version }, otherBase), upload(observation(), otherBase)]);
    assert.deepEqual(races.slice(0, 2).map(response => (response as Response).status).sort(), [200, 409]);
    parseSnapshot(await (await request('/api/snapshot', 'GET', config.ownerToken, undefined, otherBase)).json() as unknown);

    const connect = async (): Promise<WebSocket> => {
      const socket = new WebSocket(base.replace('http:', 'ws:') + '/api/live');
      sockets.push(socket);
      await once(socket, 'open');
      return socket;
    };
    const nextSnapshot = async (socket: WebSocket): Promise<Snapshot> => {
      const [event] = await once(socket, 'message', { signal: AbortSignal.timeout(10000) });
      assert.ok(event instanceof MessageEvent);
      return parseSnapshotMessage(JSON.parse(String(event.data)) as unknown).snapshot;
    };
    for (const token of [config.deviceToken, 'invalid']) {
      const socket = await connect();
      let leaked = false;
      socket.addEventListener('message', () => { leaked = true; });
      const closure = once(socket, 'close');
      socket.send(JSON.stringify({ type: 'authenticate', token }));
      const [event] = await closure;
      assert.ok(event instanceof CloseEvent);
      assert.equal(event.code, 1008);
      assert.equal(leaked, false);
    }
    const unauthenticated = await connect();
    let leaked = false;
    unauthenticated.addEventListener('message', () => { leaked = true; });
    const [timeoutEvent] = await once(unauthenticated, 'close', { signal: AbortSignal.timeout(7000) });
    assert.equal(leaked, false);
    assert.ok(timeoutEvent instanceof CloseEvent);
    assert.equal(timeoutEvent.code, 1008);
    const malformed = await connect();
    const malformedClose = once(malformed, 'close');
    malformed.send('{broken-json');
    assert.equal(((await malformedClose)[0] as CloseEvent).code, 1008);
    const oversized = await connect();
    const oversizedClose = once(oversized, 'close');
    oversized.send('x'.repeat(2048));
    assert.equal(((await oversizedClose)[0] as CloseEvent).code, 1009);
    const authorized = await connect();
    const initialFrame = nextSnapshot(authorized);
    authorized.send(JSON.stringify({ type: 'authenticate', token: config.ownerToken }));
    assert.equal((await initialFrame).revision, (await snapshot()).revision);
    const refresh = nextSnapshot(authorized);
    const acceptance = await upload(observation(0.5, 0.5), otherBase);
    assert.equal((await refresh).revision, acceptance.revision);
    const heartbeatFrame = await nextSnapshot(authorized);
    assert.equal(heartbeatFrame.revision, acceptance.revision);
    const reconnect = await connect();
    const recovered = nextSnapshot(reconnect);
    reconnect.send(JSON.stringify({ type: 'authenticate', token: config.ownerToken }));
    assert.equal((await recovered).revision, acceptance.revision);
    for (const trustedProxy of ['127.0.0.1', '127.0.0.2']) {
      const secured = await createApp({ ...config, transportMode: 'https-proxy', trustedProxy }, await createStore(databaseUrl, config.deviceId), false);
      try {
        const secureBase = await secured.listen({ host: '127.0.0.1', port: 0 });
        assert.equal((await fetch(`${secureBase}/health`)).status, 200);
        assert.equal((await fetch(`${secureBase}/api/snapshot`, { headers: { Authorization: `Bearer ${config.ownerToken}` } })).status, 403);
        const forwarded = await fetch(`${secureBase}/api/snapshot`, { headers: { Authorization: `Bearer ${config.ownerToken}`, 'X-Forwarded-Proto': 'https' } });
        assert.equal(forwarded.status, trustedProxy === '127.0.0.1' ? 200 : 403);
        if (forwarded.ok) parseSnapshot(await forwarded.json() as unknown);
      } finally { await secured.close(); }
    }

    const edgeConfig = readConfig({ DATABASE_URL: databaseUrl, DEVICE_ID: config.deviceId, DEVICE_TOKEN: config.deviceToken, OWNER_TOKEN: config.ownerToken, TRANSPORT_MODE: 'render-edge', NODE_ENV: 'production', RENDER: 'true', RENDER_SERVICE_TYPE: 'web' });
    const edge = await createApp(edgeConfig, await createStore(databaseUrl, config.deviceId), false);
    edge.get('/test-transport', async request => ({ protocol: request.protocol, host: request.host, ip: request.ip }));
    try {
      const edgeBase = await edge.listen({ host: '127.0.0.1', port: 0 });
      for (const forwardedProtocol of ['http', 'https', 'https, http']) {
        const headers = { 'X-Forwarded-Proto': forwardedProtocol, 'X-Forwarded-Host': 'spoof.invalid', 'X-Forwarded-For': '203.0.113.7' };
        const transport = await fetch(`${edgeBase}/test-transport`, { headers });
        assert.deepEqual(await transport.json(), { protocol: 'http', host: new URL(edgeBase).host, ip: '127.0.0.1' });
        assert.equal((await fetch(`${edgeBase}/api/snapshot`, { headers })).status, 401);
        assert.equal((await fetch(`${edgeBase}/api/snapshot`, { headers: { ...headers, Authorization: `Bearer ${config.deviceToken}` } })).status, 401);
        assert.equal((await fetch(`${edgeBase}/api/snapshot`, { headers: { ...headers, Authorization: `Bearer ${config.ownerToken}` } })).status, 200);
      }
      assert.equal((await request('/api/locations', 'POST', config.ownerToken, observation(), edgeBase)).status, 401);
      assert.equal((await upload(observation(0.5, 0.5), edgeBase)).accepted, true);
      for (const token of [config.deviceToken, config.ownerToken]) {
        const socket = new WebSocket(`${edgeBase.replace('http:', 'ws:')}/api/live`);
        sockets.push(socket);
        await once(socket, 'open', { signal: AbortSignal.timeout(5000) });
        const outcome = once(socket, token === config.ownerToken ? 'message' : 'close', { signal: AbortSignal.timeout(5000) });
        socket.send(JSON.stringify({ type: 'authenticate', token }));
        const [event] = await outcome;
        if (token === config.ownerToken) parseSnapshotMessage(JSON.parse(String((event as MessageEvent).data)) as unknown);
        else assert.equal((event as CloseEvent).code, 1008);
        socket.close();
      }
      const silent = new WebSocket(`${edgeBase.replace('http:', 'ws:')}/api/live`);
      sockets.push(silent);
      await once(silent, 'open', { signal: AbortSignal.timeout(5000) });
      let leaked = false;
      silent.addEventListener('message', () => { leaked = true; });
      const [closure] = await once(silent, 'close', { signal: AbortSignal.timeout(7000) });
      assert.equal(closure.code, 1008);
      assert.equal(leaked, false);
    } finally { await edge.close(); }

    for (let index = 0; index < 101; index += 1) {
      await upload(observation());
      await upload(observation(0.5, 0.5));
    }
    await upload(observation());
    const limited = await snapshot();
    assert.equal(limited.incidents.length, 100);
    assert.equal(limited.incidents[0].id, limited.devices[0].activeViolationId);
    const [{ count }] = await admin`SELECT count(*)::integer AS count FROM incidents`;
    assert.ok(Number(count) > 100);
    await assert.rejects(admin`INSERT INTO incidents (device_id, outside) VALUES (${config.deviceId}, ${admin.json({ latitude: 2, longitude: 2, observedAt: new Date().toISOString() })})`, error => typeof error === 'object' && error !== null && 'code' in error && error.code === '23505');

    const final = await snapshot();
    for (const socket of sockets) socket.close();
    await app.close();
    await second.close();
    closed = true;
    const restored = await createStore(databaseUrl, config.deviceId);
    try {
      const persisted = await restored.snapshot();
      assert.equal(persisted.revision, final.revision);
      assert.deepEqual(persisted.devices, final.devices);
      assert.deepEqual(persisted.incidents, final.incidents);
      assert.deepEqual(persisted.geofence, final.geofence);
    } finally { await restored.close(); }
    const reservation = createServer();
    reservation.listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const address = reservation.address();
    assert.ok(address && typeof address !== 'string');
    await new Promise<void>(resolve => { reservation.close(() => { resolve(); }); });
    const child = spawn(process.execPath, ['src/main.ts'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, DATABASE_URL: databaseUrl, DEVICE_ID: config.deviceId, DEVICE_TOKEN: config.deviceToken, OWNER_TOKEN: config.ownerToken, TRANSPORT_MODE: 'trusted-local', NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(address.port) },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    try {
      let started = false;
      for (let attempt = 0; attempt < 50; attempt += 1) {
        try {
          const health = await fetch(`http://127.0.0.1:${address.port}/health`);
          if (health.ok) { started = true; break; }
        } catch {}
        await delay(100);
      }
      assert.equal(started, true, 'main.ts must actually listen');
      const persisted = await fetch(`http://127.0.0.1:${address.port}/api/snapshot`, { headers: { Authorization: `Bearer ${config.ownerToken}` } });
      assert.equal(parseSnapshot(await persisted.json() as unknown).revision, final.revision);
      assert.equal(output.includes(config.ownerToken), false);
      assert.equal(output.includes(config.deviceToken), false);
    } finally {
      const exit = once(child, 'exit');
      child.kill('SIGTERM');
      await exit;
    }
    console.log('Verified auth, validation, lifecycle, timestamp gates, stale retention, delayed-fix freshness, fence replacement, two writers, DB invariant, 100-view retention, websocket authorization/update/reconnect, trusted proxy boundary, durable restart and executable startup.');
  } finally {
    for (const socket of sockets) socket.close();
    if (!closed) await Promise.all([app.close(), second.close()]);
  }
});

test('configuration requires explicit transport, separate secrets and bounded identity', () => {
  const environment = { DATABASE_URL: 'postgres://localhost/glance', DEVICE_ID: 'tracker.001', DEVICE_TOKEN: randomBytes(32).toString('base64url'), OWNER_TOKEN: randomBytes(32).toString('base64url'), TRANSPORT_MODE: 'trusted-local' };
  assert.equal(readConfig(environment).deviceId, 'tracker.001');
  assert.throws(() => readConfig({ ...environment, OWNER_TOKEN: environment.DEVICE_TOKEN }));
  assert.throws(() => readConfig({ ...environment, OWNER_TOKEN: 'placeholder' }));
  assert.throws(() => readConfig({ ...environment, DEVICE_ID: 'bad identity' }));
  assert.throws(() => readConfig({ ...environment, TRANSPORT_MODE: undefined }));
  assert.throws(() => readConfig({ ...environment, NODE_ENV: 'production' }));
  assert.throws(() => readConfig({ ...environment, TRANSPORT_MODE: 'https-proxy', TRUSTED_PROXY: '0.0.0.0/0' }));
  const edge = { ...environment, TRANSPORT_MODE: 'render-edge', NODE_ENV: 'production', RENDER: 'true', RENDER_SERVICE_TYPE: 'web' };
  assert.equal(readConfig(edge).transportMode, 'render-edge');
  for (const markers of [{ RENDER: undefined }, { RENDER: 'false' }, { RENDER_SERVICE_TYPE: undefined }, { RENDER_SERVICE_TYPE: 'pserv' }, { RENDER_SERVICE_TYPE: 'worker' }]) {
    assert.throws(() => readConfig({ ...edge, ...markers }));
  }
});
