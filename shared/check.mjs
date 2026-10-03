import assert from 'node:assert/strict';
import { closePolygonRing, isPointInPolygon, validatePolygon } from './geofence.ts';
import { evaluateLifecycle, isLocationStale, shouldAcceptObservation } from './lifecycle.ts';
import { parseAuthenticateMessage, parseGeofenceUpdate, parsePositionObservation, parseSnapshot, parseSnapshotMessage, parseTimestamp } from './protocol.ts';

const vertices = [
  { latitude: 11, longitude: 124 },
  { latitude: 11, longitude: 125 },
  { latitude: 12, longitude: 125 },
  { latitude: 12, longitude: 124 },
];
const observedAt = '2026-10-03T04:00:00.000Z';
const observation = { deviceId: 'prototype-001', latitude: 11.5, longitude: 124.5, observedAt };
assert.deepEqual(parsePositionObservation(observation), observation);
for (const invalid of [null, { ...observation, extra: true }, { ...observation, latitude: NaN }, { ...observation, longitude: 181 }, { ...observation, deviceId: '' }, { ...observation, observedAt: '2026-02-30T04:00:00.000Z' }]) {
  assert.throws(() => parsePositionObservation(invalid), TypeError);
}
assert.throws(() => parseTimestamp('2026-10-03T04:00:00+00:00'));
assert.equal(validatePolygon(vertices).valid, true);
assert.deepEqual(parseGeofenceUpdate({ vertices: [...vertices, vertices[0]], expectedVersion: 0 }).vertices, vertices);
assert.equal(closePolygonRing(vertices).length, 5);
for (const point of [observation, vertices[0], { latitude: 11, longitude: 124.5 }]) assert.equal(isPointInPolygon(point, vertices), true);
assert.equal(isPointInPolygon({ latitude: 10, longitude: 124.5 }, vertices), false);
for (const invalid of [vertices.slice(0, 2), [...vertices, vertices[1]], [vertices[0], vertices[2], vertices[1], vertices[3]], [{ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 }, { latitude: 2, longitude: 2 }], [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 2 }, { latitude: 0, longitude: 1 }, { latitude: 1, longitude: 1 }]]) {
  assert.equal(validatePolygon(invalid).valid, false);
}
assert.throws(() => parseGeofenceUpdate({ vertices: vertices.map(vertex => ({ ...vertex, extra: true })), expectedVersion: 0 }));
assert.throws(() => parseGeofenceUpdate({ vertices, expectedVersion: -1 }));
assert.deepEqual(evaluateLifecycle(false, false), { event: 'breached', status: 'outside', createViolation: true, resolveActiveViolation: false });
assert.equal(evaluateLifecycle(false, true).createViolation, false);
assert.equal(evaluateLifecycle(true, true).resolveActiveViolation, true);
assert.equal(evaluateLifecycle(true, true).status, 'inside');
assert.equal(evaluateLifecycle(true, false).resolveActiveViolation, false);
const location = { latitude: 11.5, longitude: 124.5, observedAt, receivedAt: observedAt };
assert.equal(shouldAcceptObservation(observation, null, observedAt), true);
assert.equal(shouldAcceptObservation(observation, location, observedAt), false);
assert.equal(shouldAcceptObservation({ ...observation, observedAt: '2026-10-03T03:59:59.000Z' }, location, observedAt), false);
assert.equal(shouldAcceptObservation(observation, null, '2026-10-03T04:00:15.000Z'), false);
assert.equal(shouldAcceptObservation(observation, null, '2026-10-03T03:59:54.000Z'), false);
assert.equal(shouldAcceptObservation(observation, null, '2026-10-03T03:59:55.000Z'), true);
assert.equal(isLocationStale(location, '2026-10-03T04:00:14.999Z'), false);
assert.equal(isLocationStale(location, '2026-10-03T04:00:15.000Z'), true);
assert.equal(isLocationStale(null, observedAt), true);
const delayedLocation = { ...location, receivedAt: '2026-10-03T04:00:14.000Z' };
assert.equal(shouldAcceptObservation(observation, null, delayedLocation.receivedAt), true);
assert.equal(isLocationStale(delayedLocation, '2026-10-03T04:00:16.000Z'), true);
const aheadLocation = { ...location, observedAt: '2026-10-03T04:00:05.000Z' };
assert.equal(shouldAcceptObservation({ ...observation, observedAt: aheadLocation.observedAt }, null, aheadLocation.receivedAt), true);
assert.equal(isLocationStale(aheadLocation, '2026-10-03T04:00:14.999Z'), false);
assert.equal(isLocationStale(aheadLocation, '2026-10-03T04:00:15.000Z'), true);
for (const invalidDate of ['invalid', '2026-02-30T04:00:00.000Z']) {
  assert.equal(isLocationStale({ ...location, observedAt: invalidDate }, observedAt), true);
  assert.equal(isLocationStale({ ...location, receivedAt: invalidDate }, observedAt), true);
  assert.equal(isLocationStale(location, invalidDate), true);
}
const snapshot = {
  revision: 1,
  serverTime: observedAt,
  geofence: { version: 1, vertices, updatedAt: observedAt },
  devices: [{ deviceId: observation.deviceId, location, boundaryStatus: 'inside', activeViolationId: null }],
  incidents: [],
};
assert.deepEqual(parseSnapshot(snapshot), snapshot);
assert.deepEqual(parseSnapshotMessage({ type: 'snapshot', snapshot }).snapshot, snapshot);
assert.deepEqual(parseAuthenticateMessage({ type: 'authenticate', token: 'secret' }), { type: 'authenticate', token: 'secret' });
assert.throws(() => parseAuthenticateMessage({ type: 'authenticate', token: 'secret', extra: true }));
const outside = { latitude: 10, longitude: 124.5, observedAt };
const incident = { id: 1, deviceId: observation.deviceId, outside, resolution: null, resolvedAt: null, returnPosition: null };
const breached = { ...snapshot, devices: [{ ...snapshot.devices[0], boundaryStatus: 'outside', activeViolationId: 1 }], incidents: [incident] };
assert.deepEqual(parseSnapshot(breached), breached);
for (const validId of ['A', 'tracker_01.test-1', 'A'.repeat(64)]) {
  assert.equal(parsePositionObservation({ ...observation, deviceId: validId }).deviceId, validId);
  assert.equal(parseSnapshot({ ...breached, devices: [{ ...breached.devices[0], deviceId: validId }], incidents: [{ ...incident, deviceId: validId }] }).devices[0].deviceId, validId);
}
for (const invalidId of ['', 'invalid device with spaces', '-tracker', 'A'.repeat(65), 'tracker\n', 'träckér']) {
  assert.throws(() => parsePositionObservation({ ...observation, deviceId: invalidId }), TypeError);
  assert.throws(() => parseSnapshot({ ...snapshot, devices: [{ ...snapshot.devices[0], deviceId: invalidId }] }), TypeError);
  assert.throws(() => parseSnapshot({ ...snapshot, incidents: [{ ...incident, deviceId: invalidId, resolution: 'fence_changed', resolvedAt: observedAt }] }), TypeError);
}
for (const resolution of ['returned', 'fence_changed']) {
  const resolved = { ...snapshot, incidents: [{ ...incident, resolution, resolvedAt: observedAt, returnPosition: resolution === 'returned' ? { ...outside, latitude: 11.5 } : null }] };
  assert.deepEqual(parseSnapshot(resolved), resolved);
}
assert.deepEqual(parseSnapshot({ ...snapshot, devices: [{ ...snapshot.devices[0], boundaryStatus: 'unknown' }] }).devices[0].boundaryStatus, 'unknown');
for (const invalid of [
  { ...snapshot, extra: true },
  { ...snapshot, revision: 1.5 },
  { ...snapshot, revision: Number.MAX_SAFE_INTEGER + 1 },
  { ...snapshot, geofence: { ...snapshot.geofence, version: 0 } },
  { ...snapshot, devices: [snapshot.devices[0], snapshot.devices[0]] },
  { ...breached, incidents: [] },
  { ...snapshot, incidents: [incident] },
  { ...snapshot, incidents: [{ ...incident, resolution: 'returned', resolvedAt: observedAt }] },
  { ...snapshot, devices: [{ ...snapshot.devices[0], location: null }] },
]) assert.throws(() => parseSnapshot(invalid), TypeError);
console.log('Shared protocol, polygon, lifecycle, and freshness checks passed.');
