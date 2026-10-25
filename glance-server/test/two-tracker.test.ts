import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import postgres from 'postgres';
import { isLocationStale } from '../../shared/lifecycle.ts';
import { parseSnapshot, parseSnapshotMessage } from '../../shared/protocol.ts';
import type { LocationAcceptance, PositionObservation, Snapshot } from '../../shared/protocol.ts';
import { createApp } from '../src/app.ts';
import { readConfig } from '../src/config.ts';
import { createStore } from '../src/store.ts';

test('configured identity allowlist retains legacy identity and fails closed', () => {
  const environment = {
    DATABASE_URL: 'postgres://localhost/unused', DEVICE_ID: 'prototype-001',
    DEVICE_TOKEN: randomBytes(32).toString('base64url'), OWNER_TOKEN: randomBytes(32).toString('base64url'),
    TRANSPORT_MODE: 'trusted-local',
  };
  assert.deepEqual(readConfig(environment).deviceIds, ['prototype-001']);
  assert.deepEqual(readConfig({ ...environment, DEVICE_IDS: 'prototype-001,slave-02' }).deviceIds, ['prototype-001', 'slave-02']);
  for (const DEVICE_IDS of ['', 'slave-02', 'prototype-001,prototype-001', 'prototype-001,slave-02,third',
    'prototype-001, slave-02', 'prototype-001,', 'prototype-001,slave-02\n', `prototype-001,${'a'.repeat(65)}`]) {
    assert.throws(() => readConfig({ ...environment, DEVICE_IDS }));
  }
});

test('PG migration preserves legacy history; two trackers share a durable fence with isolated lifecycle', { timeout: 30000 }, async context => {
  const databaseUrl = process.env.TEST_TWO_DATABASE_URL;
  assert.ok(databaseUrl, 'Set TEST_TWO_DATABASE_URL to a NEW dedicated glance_test_* database');
  assert.match(new URL(databaseUrl).pathname, /^\/glance_test_[a-z0-9_]+$/);
  const admin = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  context.after(async () => { await admin.end({ timeout: 5 }); });
  assert.equal((await admin`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`).length, 0, 'Refusing a nonempty database');
  await admin.unsafe(await readFile(new URL('../migrations/0001.sql', import.meta.url), 'utf8'));
  const vertices = [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, { latitude: 1, longitude: 1 }, { latitude: 1, longitude: 0 }];
  const oldTime = '2026-01-01T00:00:00.000Z';
  const oldLocation = { latitude: 2, longitude: 2, observedAt: oldTime, receivedAt: oldTime };
  const oldFence = { version: 3, vertices, updatedAt: oldTime };
  await admin`INSERT INTO prototype_state (id, device_id, revision, geofence, location, boundary_status)
    VALUES (1, 'prototype-001', 7, ${admin.json(oldFence)}, ${admin.json(oldLocation)}, 'outside')`;
  await admin`INSERT INTO incidents (device_id, outside) VALUES ('prototype-001', ${admin.json({ latitude: 2, longitude: 2, observedAt: oldTime })})`;
  await admin`INSERT INTO incidents (device_id, outside, resolution, resolved_at, return_position)
    VALUES ('prototype-001', ${admin.json({ latitude: 2, longitude: 2, observedAt: oldTime })}, 'returned', ${oldTime},
    ${admin.json({ latitude: 0.5, longitude: 0.5, observedAt: oldTime })})`;
  await assert.rejects(createStore(databaseUrl, 'wrong-identity'));
  const legacy = await createStore(databaseUrl, 'prototype-001');
  const before = await legacy.snapshot();
  assert.equal(before.revision, 7);
  assert.deepEqual(before.devices[0].location, oldLocation);
  assert.deepEqual(before.geofence, oldFence);
  assert.equal(before.devices[0].activeViolationId, before.incidents.find(incident => incident.resolution === null)?.id);
  assert.equal(before.incidents.length, 2);
  await legacy.close();
  const config = readConfig({
    DATABASE_URL: databaseUrl, DEVICE_ID: 'prototype-001', DEVICE_IDS: 'prototype-001,slave-02',
    DEVICE_TOKEN: randomBytes(32).toString('base64url'), OWNER_TOKEN: randomBytes(32).toString('base64url'),
    TRANSPORT_MODE: 'trusted-local',
  });
  const firstStore = await createStore(databaseUrl, config.deviceId, config.deviceIds);
  const app = await createApp(config, firstStore, false);
  const other = await createApp(config, await createStore(databaseUrl, config.deviceId, config.deviceIds), false);
  const sockets: WebSocket[] = [];
  context.after(async () => {
    for (const socket of sockets) socket.close();
    await Promise.all([app.close(), other.close()]);
  });
  const base = await app.listen({ host: '127.0.0.1', port: 0 });
  const secondBase = await other.listen({ host: '127.0.0.1', port: 0 });
  const request = async (path: string, method = 'GET', token = config.ownerToken, body?: unknown, origin = base): Promise<Response> => {
    return fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  };
  const snapshot = async (): Promise<Snapshot> => parseSnapshot(await (await request('/api/snapshot')).json() as unknown);
  const upload = async (observation: PositionObservation, origin = base): Promise<LocationAcceptance> => {
    const response = await request('/api/locations', 'POST', config.deviceToken, observation, origin);
    assert.equal(response.status, 200);
    return await response.json() as LocationAcceptance;
  };
  let time = Date.now() - 1000;
  const fix = (deviceId: string, latitude = 2, observedAt = new Date(++time).toISOString()): PositionObservation => ({ deviceId, latitude, longitude: 0.5, observedAt });
  const seeded = await snapshot();
  assert.equal(seeded.revision, 8);
  assert.deepEqual(seeded.geofence, before.geofence);
  assert.deepEqual(seeded.incidents, before.incidents);
  assert.deepEqual(seeded.devices[0], before.devices[0]);
  assert.deepEqual(seeded.devices[1], { deviceId: 'slave-02', location: null, boundaryStatus: 'unknown', activeViolationId: null });
  await assert.rejects(createStore(databaseUrl, config.deviceId));
  await assert.rejects(createStore(databaseUrl, 'slave-02', config.deviceIds));
  assert.deepEqual({ ...await snapshot(), serverTime: seeded.serverTime }, seeded);
  await assert.rejects(firstStore.accept(fix('unknown')));
  for (const id of config.deviceIds) {
    assert.equal((await request('/api/locations', 'POST', config.ownerToken, fix(id))).status, 401);
  }
  assert.equal((await request('/api/snapshot', 'GET', config.deviceToken)).status, 401);
  assert.equal((await request('/api/geofence', 'PUT', config.deviceToken, { expectedVersion: 3, vertices })).status, 401);
  assert.equal((await request('/api/locations', 'POST', config.deviceToken, fix('unknown'))).status, 403);
  assert.deepEqual({ ...await snapshot(), serverTime: seeded.serverTime }, seeded);
  const sameTime = new Date(++time).toISOString();
  const fixes = config.deviceIds.map(id => fix(id, 2, sameTime));
  const accepted = await Promise.all(fixes.map((observation, index) => upload(observation, index === 0 ? base : secondBase)));
  assert.ok(accepted.every(result => result.accepted));
  assert.deepEqual(accepted.map(result => result.revision).sort((a, b) => a - b), [9, 10]);
  const bothOutside = await snapshot();
  assert.equal(bothOutside.incidents.filter(incident => incident.resolution === null).length, 2);
  assert.ok(bothOutside.devices.every(device => device.boundaryStatus === 'outside' && device.activeViolationId !== null));
  for (const observation of fixes) {
    for (const observedAt of [sameTime, new Date(Date.parse(sameTime) - 1).toISOString(),
      new Date(Date.now() - 16000).toISOString(), new Date(Date.now() + 6000).toISOString()]) {
      assert.deepEqual(await upload({ ...observation, observedAt }), { accepted: false, revision: 10 });
    }
  }
  const unchanged = await snapshot();
  assert.deepEqual(unchanged.devices, bothOutside.devices);
  assert.deepEqual(unchanged.incidents, bothOutside.incidents);
  for (const device of unchanged.devices) {
    assert.ok(device.location);
    assert.equal(isLocationStale(device.location, new Date(Date.parse(device.location.receivedAt) + 15000).toISOString()), true);
  }
  await upload(fix(config.deviceId, 0.5));
  const oneReturned = await snapshot();
  assert.equal(oneReturned.devices[0].activeViolationId, null);
  assert.equal(oneReturned.devices[0].boundaryStatus, 'inside');
  assert.equal(oneReturned.devices[1].activeViolationId, bothOutside.devices[1].activeViolationId);
  assert.equal(oneReturned.incidents.find(incident => incident.id === bothOutside.devices[0].activeViolationId)?.resolution, 'returned');
  await upload(fix(config.deviceId));
  const activeBeforeLimit = await snapshot();
  for (let index = 0; index < 101; index += 1) {
    await admin`INSERT INTO incidents (device_id, outside, resolution, resolved_at)
      VALUES ('prototype-001', ${admin.json({ latitude: 2, longitude: 2, observedAt: oldTime })}, 'fence_changed', ${oldTime})`;
  }
  const projected = await snapshot();
  assert.equal(projected.incidents.length, 100);
  for (const device of projected.devices) assert.ok(projected.incidents.some(incident => incident.id === device.activeViolationId));
  const socket = new WebSocket(base.replace('http:', 'ws:') + '/api/live');
  sockets.push(socket);
  await once(socket, 'open', { signal: AbortSignal.timeout(5000) });
  const frame = once(socket, 'message', { signal: AbortSignal.timeout(5000) });
  socket.send(JSON.stringify({ type: 'authenticate', token: config.ownerToken }));
  const [event] = await frame;
  const live = parseSnapshotMessage(JSON.parse(String((event as MessageEvent).data)) as unknown).snapshot;
  assert.deepEqual(live.devices, projected.devices);
  const replacement = await request('/api/geofence', 'PUT', config.ownerToken, { expectedVersion: 3, vertices });
  assert.equal(replacement.status, 200);
  const replaced = parseSnapshot(await replacement.json() as unknown);
  assert.equal(replaced.geofence?.version, 4);
  assert.ok(replaced.devices.every(device => device.boundaryStatus === 'unknown' && device.activeViolationId === null));
  assert.deepEqual(replaced.devices.map(device => device.location), projected.devices.map(device => device.location));
  for (const device of activeBeforeLimit.devices) {
    const [episode] = await admin`SELECT resolution, return_position FROM incidents WHERE id = ${device.activeViolationId!}`;
    assert.equal(episode.resolution, 'fence_changed');
    assert.equal(episode.return_position, null);
  }
  const beforeRejected = await snapshot();
  for (const device of beforeRejected.devices) {
    assert.ok(device.location);
    assert.equal((await upload(fix(device.deviceId, 2, device.location.observedAt))).accepted, false);
  }
  assert.deepEqual((await snapshot()).devices, beforeRejected.devices);
  const races = await Promise.all([
    request('/api/geofence', 'PUT', config.ownerToken, { expectedVersion: 4, vertices }),
    request('/api/geofence', 'PUT', config.ownerToken, { expectedVersion: 4, vertices }, secondBase),
    ...config.deviceIds.map(id => upload(fix(id))),
    ...Array.from({ length: 8 }, () => snapshot()),
  ]);
  assert.deepEqual(races.slice(0, 2).map(value => (value as Response).status).sort(), [200, 409]);
  const freshTime = new Date(++time).toISOString();
  const duplicates = await Promise.all(Array.from({ length: 8 }, (_, index) => upload(fix('slave-02', 2, freshTime), index % 2 ? base : secondBase)));
  assert.equal(duplicates.filter(value => value.accepted).length, 1);
  const final = await snapshot();
  const restored = await createStore(databaseUrl, config.deviceId, config.deviceIds);
  try {
    const persisted = await restored.snapshot();
    assert.deepEqual({ ...persisted, serverTime: final.serverTime }, final);
  } finally { await restored.close(); }
  const [legacyRow] = await admin`SELECT location, boundary_status FROM prototype_state`;
  assert.deepEqual(legacyRow.location, oldLocation);
  assert.equal(legacyRow.boundary_status, 'outside');
  assert.ok((await admin`SELECT count(*)::integer AS count FROM incidents`)[0].count > 100);
});
