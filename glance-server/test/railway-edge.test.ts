import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import postgres from 'postgres';
import { parseSnapshot, parseSnapshotMessage } from '../../shared/protocol.ts';
import type { Snapshot } from '../../shared/protocol.ts';
import { createApp } from '../src/app.ts';
import { readConfig } from '../src/config.ts';
import { createStore } from '../src/store.ts';

function environment(): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgres://localhost/unused', DEVICE_ID: 'prototype-001', DEVICE_IDS: 'prototype-001,slave-02',
    DEVICE_TOKEN: randomBytes(32).toString('base64url'), OWNER_TOKEN: randomBytes(32).toString('base64url'),
    NODE_ENV: 'production', TRANSPORT_MODE: 'railway-edge',
    RAILWAY_PROJECT_ID: randomUUID(), RAILWAY_ENVIRONMENT_ID: randomUUID(), RAILWAY_SERVICE_ID: randomUUID(),
    RAILWAY_PUBLIC_DOMAIN: 'glance-fixture.up.railway.app',
  };
}

test('Railway edge requires platform UUID markers and validates optional public hostname', () => {
  const values = environment();
  assert.equal(readConfig(values).transportMode, 'railway-edge');
  assert.equal(readConfig({ ...values, RAILWAY_PUBLIC_DOMAIN: undefined }).transportMode, 'railway-edge');
  for (const name of ['RAILWAY_PROJECT_ID', 'RAILWAY_ENVIRONMENT_ID', 'RAILWAY_SERVICE_ID']) {
    for (const value of [undefined, '', 'true', 'project-name', '00000000-0000-0000-0000-000000000000', `${randomUUID()}\n`]) {
      assert.throws(() => readConfig({ ...values, [name]: value }));
    }
  }
  for (const domain of ['', 'https://glance.up.railway.app', 'glance.up.railway.app/path', 'glance.up.railway.app:3000', 'host\n', '-host.up.railway.app']) {
    assert.throws(() => readConfig({ ...values, RAILWAY_PUBLIC_DOMAIN: domain }));
  }
  assert.throws(() => readConfig({ ...values, TRANSPORT_MODE: 'trusted-local' }));
  assert.throws(() => readConfig({ ...values, TRANSPORT_MODE: 'render-edge' }));
  assert.throws(() => readConfig({ ...values, TRANSPORT_MODE: 'https-proxy' }));
});

test('Railway internal HTTP/WS keeps auth and ignores forwarded claims; fresh PG seeds two empty trackers', { timeout: 15000 }, async context => {
  const databaseUrl = process.env.TEST_RAILWAY_DATABASE_URL;
  assert.ok(databaseUrl, 'Set TEST_RAILWAY_DATABASE_URL to a NEW dedicated glance_test_* database');
  assert.match(new URL(databaseUrl).pathname, /^\/glance_test_[a-z0-9_]+$/);
  const admin = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  context.after(async () => { await admin.end({ timeout: 5 }); });
  assert.equal((await admin`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`).length, 0, 'Refusing a nonempty database');
  const config = readConfig({ ...environment(), DATABASE_URL: databaseUrl });
  const app = await createApp(config, await createStore(databaseUrl, config.deviceId, config.deviceIds), false);
  app.get('/test-transport', async request => ({ protocol: request.protocol, host: request.host, ip: request.ip }));
  const sockets: WebSocket[] = [];
  context.after(async () => {
    for (const socket of sockets) socket.close();
    await app.close();
  });
  const base = await app.listen({ host: '127.0.0.1', port: 0 });
  const request = async (path: string, method = 'GET', token?: string, body?: unknown, forwarded = 'https'): Promise<Response> => {
    return fetch(`${base}${path}`, { method, headers: {
      'X-Forwarded-Proto': forwarded, 'X-Forwarded-Host': 'spoof.invalid', 'X-Forwarded-For': '203.0.113.7',
      'Content-Type': 'application/json', ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  };
  const snapshot = async (): Promise<Snapshot> => parseSnapshot(await (await request('/api/snapshot', 'GET', config.ownerToken)).json() as unknown);
  assert.equal((await request('/health')).status, 200);
  const initial = await snapshot();
  assert.equal(initial.revision, 0);
  assert.equal(initial.geofence, null);
  assert.deepEqual(initial.incidents, []);
  assert.deepEqual(initial.devices, config.deviceIds.map(deviceId => ({ deviceId, location: null, boundaryStatus: 'unknown', activeViolationId: null })));
  const vertices = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, { latitude: 1, longitude: 1 }, { latitude: 1, longitude: 0 }];
  for (const forwarded of ['http', 'https', 'https, http']) {
    assert.deepEqual(await (await request('/test-transport', 'GET', undefined, undefined, forwarded)).json(),
      { protocol: 'http', host: new URL(base).host, ip: '127.0.0.1' });
    for (const token of [undefined, config.deviceToken]) {
      assert.equal((await request('/api/snapshot', 'GET', token, undefined, forwarded)).status, 401);
      assert.equal((await request('/api/geofence', 'PUT', token, { expectedVersion: 0, vertices }, forwarded)).status, 401);
    }
    assert.equal((await request('/api/snapshot', 'GET', config.ownerToken, undefined, forwarded)).status, 200);
  }
  const observedAt = new Date().toISOString();
  for (const deviceId of config.deviceIds) {
    const fix = { deviceId, latitude: 2, longitude: 0.5, observedAt };
    for (const token of [undefined, config.ownerToken]) assert.equal((await request('/api/locations', 'POST', token, fix)).status, 401);
  }
  assert.equal((await request('/api/locations', 'POST', config.deviceToken, { deviceId: 'unknown', latitude: 2, longitude: 0.5, observedAt })).status, 403);
  assert.deepEqual({ ...await snapshot(), serverTime: initial.serverTime }, initial);
  assert.equal((await request('/api/geofence', 'PUT', config.ownerToken, { expectedVersion: 0, vertices })).status, 200);
  for (const deviceId of config.deviceIds) {
    const fix = { deviceId, latitude: 2, longitude: 0.5, observedAt };
    assert.equal((await request('/api/locations', 'POST', config.deviceToken, { ...fix, latitude: 91 })).status, 400);
    const response = await request('/api/locations', 'POST', config.deviceToken, fix);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { accepted: boolean }).accepted, true);
  }
  const current = await snapshot();
  assert.equal(current.devices.filter(device => device.activeViolationId !== null).length, 2);
  for (const token of [config.deviceToken, 'invalid', config.ownerToken]) {
    const socket = new WebSocket(base.replace('http:', 'ws:') + '/api/live');
    sockets.push(socket);
    await once(socket, 'open', { signal: AbortSignal.timeout(5000) });
    let frames = 0;
    socket.addEventListener('message', () => { frames += 1; });
    const outcome = once(socket, token === config.ownerToken ? 'message' : 'close', { signal: AbortSignal.timeout(5000) });
    socket.send(JSON.stringify({ type: 'authenticate', token }));
    const [event] = await outcome;
    if (token === config.ownerToken) {
      const live = parseSnapshotMessage(JSON.parse(String((event as MessageEvent).data)) as unknown).snapshot;
      assert.deepEqual(live.devices, current.devices);
    } else {
      assert.equal((event as CloseEvent).code, 1008);
      assert.equal(frames, 0);
    }
    socket.close();
  }
  const restored = await createStore(databaseUrl, config.deviceId, config.deviceIds);
  try {
    const persisted = await restored.snapshot();
    assert.deepEqual({ ...persisted, serverTime: current.serverTime }, current);
  } finally { await restored.close(); }
});
