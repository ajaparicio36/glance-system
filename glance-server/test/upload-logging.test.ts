import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { shouldAcceptObservation } from '../../shared/lifecycle.ts';
import { MAX_OBSERVATION_AGE_MS } from '../../shared/protocol.ts';
import type { Location } from '../../shared/protocol.ts';
import { createApp } from '../src/app.ts';
import { readConfig } from '../src/config.ts';
import type { Store } from '../src/store.ts';

test('GPS upload logs distinguish accepted, ignored and rejected without secrets', async context => {
  const config = readConfig({
    DATABASE_URL: 'postgres://unused@127.0.0.1/unopened_logging_fixture',
    DEVICE_ID: 'prototype-001',
    DEVICE_TOKEN: randomBytes(32).toString('base64url'),
    OWNER_TOKEN: randomBytes(32).toString('base64url'),
    TRANSPORT_MODE: 'trusted-local',
  });
  let latest: Location | null = null;
  let revision = 0;
  let storeCalls = 0;
  let output = '';
  const store = {
    accept: async observation => {
      storeCalls += 1;
      if (observation.latitude === 80) throw new Error(config.ownerToken);
      const receivedAt = new Date().toISOString();
      if (!shouldAcceptObservation(observation, latest, receivedAt)) return { accepted: false, revision };
      latest = { latitude: observation.latitude, longitude: observation.longitude, observedAt: observation.observedAt, receivedAt };
      revision += 1;
      return { accepted: true, revision };
    },
    snapshot: async () => { throw new Error('Snapshot not used by logging check'); },
    replaceFence: async () => { throw new Error('Fence not used by logging check'); },
    healthy: async () => true,
    close: async () => {},
  } satisfies Store;
  const app = await createApp(config, store, { stream: { write: (message: string): void => { output += message; } } });
  context.after(async () => { await app.close(); });
  const upload = async (payload: unknown, token: string | null = config.deviceToken): Promise<{ statusCode: number; payload: string }> => {
    return app.inject({ method: 'POST', url: '/api/locations', headers: { 'content-type': 'application/json', ...(token === null ? {} : { authorization: `Bearer ${token}` }) }, payload: JSON.stringify(payload) });
  };
  const observation = { deviceId: config.deviceId, latitude: 11.1, longitude: 124.2, observedAt: new Date().toISOString() };
  const accepted = await upload(observation);
  assert.equal(accepted.statusCode, 200);
  assert.deepEqual(JSON.parse(accepted.payload), { accepted: true, revision: 1 });
  assert.deepEqual(JSON.parse((await upload(observation)).payload), { accepted: false, revision: 1 });
  const stale = { ...observation, observedAt: new Date(Date.now() - MAX_OBSERVATION_AGE_MS - 1000).toISOString() };
  assert.deepEqual(JSON.parse((await upload(stale)).payload), { accepted: false, revision: 1 });
  const unsafeBody = { ...observation, token: config.ownerToken, extra: 'untrusted-body-marker' };
  assert.equal((await upload(unsafeBody)).statusCode, 400);
  assert.equal((await upload(unsafeBody, config.ownerToken)).statusCode, 401);
  assert.equal((await upload(unsafeBody, null)).statusCode, 401);
  assert.equal((await upload({ ...observation, latitude: 91 })).statusCode, 400);
  assert.equal((await upload({ ...observation, deviceId: 'another-device' })).statusCode, 403);
  assert.equal((await upload({ ...observation, latitude: 80 })).statusCode, 503);
  assert.equal(storeCalls, 4);
  assert.equal(revision, 1);
  const records = output.trim().split('\n').map(line => {
    const value: unknown = JSON.parse(line);
    assert.ok(typeof value === 'object' && value !== null && !Array.isArray(value));
    return value as Record<string, unknown>;
  });
  const outcomes = records.filter(record => record.msg === 'GPS upload accepted' || record.msg === 'GPS upload ignored');
  assert.equal(outcomes.length, 3);
  for (const [index, record] of outcomes.entries()) {
    assert.equal(record.deviceId, config.deviceId);
    assert.equal(record.latitude, observation.latitude);
    assert.equal(record.longitude, observation.longitude);
    assert.equal(record.observedAt, index === 2 ? stale.observedAt : observation.observedAt);
    assert.equal(record.revision, 1);
    assert.equal(record.accepted, index === 0);
    assert.equal(record.msg, index === 0 ? 'GPS upload accepted' : 'GPS upload ignored');
    assert.equal(typeof record.reqId, 'string');
  }
  const rejected = records.filter(record => record.msg === 'GPS upload rejected');
  assert.deepEqual(rejected.map(record => record.statusCode), [400, 401, 401, 400, 403, 503]);
  for (const record of rejected) {
    assert.equal(typeof record.reqId, 'string');
    assert.equal(record.deviceId, undefined);
    assert.equal(record.latitude, undefined);
    assert.equal(record.accepted, undefined);
  }
  for (const secret of [config.deviceToken, config.ownerToken, 'untrusted-body-marker']) assert.ok(!output.includes(secret));
  for (const record of records) {
    for (const field of ['req', 'body', 'headers', 'authorization', 'token', 'url']) assert.equal(record[field], undefined);
  }
});
