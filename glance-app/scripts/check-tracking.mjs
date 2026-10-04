import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { eq } from 'drizzle-orm';
import { cacheMigration, snapshotCache } from '../src/db/schema.ts';
import { cacheWrite } from '../src/db/cache-query.ts';
import { acceptsSnapshot, collectAlerts, normalizeSettings, parseCache, safetyLabel } from '../src/tracking/policy.ts';
import { FenceConflict, liveUrl, requestSnapshot, ServerConnectionError, updateFence } from '../src/tracking/network.ts';
import { DEFAULT_MAP_POSITION, fromMapCoordinate, initialMapCenter, toMapCoordinate } from '../src/components/live-map.geometry.ts';
import { clientTimeZone, formatLocalTimestamp, historyPage } from '../src/tracking/presentation.ts';
import { palettes } from '../src/tracking/colors.ts';
import { parseSnapshot } from '../../shared/protocol.ts';
import { validatePolygon } from '../../shared/geofence.ts';

const time = '2026-10-03T00:00:00.000Z';
const vertices = [{ latitude: 11, longitude: 124 }, { latitude: 11, longitude: 125 }, { latitude: 12, longitude: 125 }];
const empty = parseSnapshot({ revision: 0, serverTime: time, geofence: null, devices: [{ deviceId: 'prototype-001', location: null, boundaryStatus: 'unknown', activeViolationId: null }], incidents: [] });
const located = parseSnapshot({ ...empty, revision: 2, geofence: { version: 1, vertices, updatedAt: time }, devices: [{ deviceId: 'prototype-001', location: { latitude: 11.1, longitude: 124.2, observedAt: time, receivedAt: time }, boundaryStatus: 'inside', activeViolationId: null }] });
assert.deepEqual(initialMapCenter([], empty.devices), [122.54782989758861, 10.730972921778378]);
assert.deepEqual(initialMapCenter(vertices, empty.devices), [124, 11]);
assert.deepEqual(initialMapCenter(vertices, located.devices), [124.2, 11.1]);
assert.deepEqual(fromMapCoordinate(toMapCoordinate(DEFAULT_MAP_POSITION)), DEFAULT_MAP_POSITION);
const tappedDraft = [[122.544, 10.705], [122.545, 10.705], [122.545, 10.706]].map(fromMapCoordinate);
assert.equal(validatePolygon(tappedDraft).valid, true);
assert.equal(validatePolygon(tappedDraft.slice(0, -1)).valid, false);
assert.equal(empty.geofence, null);
assert.equal(acceptsSnapshot(located, empty), false);
assert.equal(acceptsSnapshot(located, located), false);
assert.equal(acceptsSnapshot(located, { ...located, serverTime: '2026-10-03T00:00:01.000Z' }), true);
assert.equal(acceptsSnapshot(located, { ...located, serverTime: '2026-10-02T23:59:59.000Z' }), false);
assert.throws(() => parseCache(JSON.stringify({ ...empty, devices: [{ ...empty.devices[0], boundaryStatus: 'returned' }] }), 1));
assert.equal(safetyLabel(located.devices[0], { snapshot: located, savedAt: 1000 }, 15999, true), 'Inside geofence');
assert.equal(safetyLabel(located.devices[0], { snapshot: located, savedAt: 1000 }, 16000, true), 'Unknown · stale location');
assert.equal(safetyLabel(located.devices[0], { snapshot: located, savedAt: 1000 }, 1000, false), 'Unknown · disconnected');
const delayed = { ...located.devices[0], location: { ...located.devices[0].location, observedAt: '2026-10-02T23:59:45.000Z' } };
assert.equal(safetyLabel(delayed, { snapshot: located, savedAt: 1000 }, 1000, true), 'Unknown · stale location');
const future = { ...located.devices[0], location: { ...located.devices[0].location, observedAt: '2026-10-03T00:00:05.000Z' } };
assert.equal(safetyLabel(future, { snapshot: located, savedAt: 1000 }, 16000, true), 'Unknown · stale location');
assert.equal(validatePolygon([{ latitude: NaN, longitude: 0 }, ...vertices]).valid, false);
assert.equal(validatePolygon([{ latitude: 11, longitude: 124 }, { latitude: 12, longitude: 125 }, { latitude: 11, longitude: 125 }, { latitude: 12, longitude: 124 }]).valid, false);
const incident = { id: 1, deviceId: 'prototype-001', outside: { latitude: 13, longitude: 124, observedAt: time }, resolution: null, resolvedAt: null, returnPosition: null };
const episodes = Array.from({ length: 12 }, (_, index) => ({ ...incident, id: index + 1 }));
assert.deepEqual(historyPage([], 9), { incidents: [], page: 0, pageCount: 1, total: 0 });
assert.deepEqual(historyPage(episodes, 0).incidents.map(episode => episode.id), [12, 11, 10, 9, 8]);
assert.deepEqual(historyPage(episodes, 1).incidents.map(episode => episode.id), [7, 6, 5, 4, 3]);
assert.deepEqual(historyPage(episodes, 99).incidents.map(episode => episode.id), [2, 1]);
assert.equal(historyPage(episodes, -1).page, 0);
assert.equal(historyPage(episodes, NaN).page, 0);
assert.equal(historyPage(episodes.slice(0, 4), 2).page, 0);
assert.deepEqual(episodes.map(episode => episode.id), Array.from({ length: 12 }, (_, index) => index + 1));
assert.equal(historyPage(episodes, 0).incidents[0], episodes[11]);
assert.equal(clientTimeZone(), Intl.DateTimeFormat().resolvedOptions().timeZone);
assert.equal(formatLocalTimestamp('invalid'), 'Time unavailable');
assert.equal(formatLocalTimestamp('2026-10-03T00:00:00Z'), 'Time unavailable');
assert.notEqual(formatLocalTimestamp(time), time);
assert.equal(incident.outside.observedAt, time);
const presentationUrl = new URL('../src/tracking/presentation.ts', import.meta.url).href;
function presentationInZone(zone) {
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import { clientTimeZone, formatLocalTimestamp } from ${JSON.stringify(presentationUrl)}; console.log(JSON.stringify({ zone: clientTimeZone(), formatted: formatLocalTimestamp(${JSON.stringify(time)}) }));`], { env: { ...process.env, TZ: zone }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}
const utcTime = presentationInZone('UTC');
const honoluluTime = presentationInZone('Pacific/Honolulu');
assert.equal(utcTime.zone, 'UTC');
assert.equal(honoluluTime.zone, 'Pacific/Honolulu');
assert.notEqual(utcTime.formatted, honoluluTime.formatted);
const nativeMap = readFileSync(new URL('../src/components/live-map.native.tsx', import.meta.url), 'utf8');
assert.match(nativeMap, /Gesture\.Native\(\)\.shouldActivateOnStart\(true\)\.disallowInterruption\(true\)/);
assert.match(nativeMap, /<GestureDetector gesture={mapGesture}>/);
assert.match(nativeMap, /<GestureDetector gesture={mapGesture}>\s*<View collapsable={false} style={StyleSheet\.absoluteFill}>\s*<MapLibreMap/);
for (const screen of ['map-screen', 'setup-screen']) {
  const source = readFileSync(new URL(`../src/screens/${screen}.tsx`, import.meta.url), 'utf8');
  assert.match(source, /import \{ ScrollView \} from 'react-native-gesture-handler'/);
  assert.doesNotMatch(source, /scrollEnabled=/);
}
const outside = { ...located, revision: 3, devices: [{ ...located.devices[0], boundaryStatus: 'outside', activeViolationId: 1 }], incidents: [incident] };
const seen = new Set();
assert.deepEqual(collectAlerts(empty, seen, true), []);
assert.equal(collectAlerts(outside, seen, false).length, 1);
assert.deepEqual(collectAlerts(outside, seen, false), []);
const returned = { ...located, revision: 4, incidents: [{ ...incident, resolution: 'returned', resolvedAt: time, returnPosition: incident.outside }] };
assert.match(collectAlerts(returned, seen, false)[0], /returned inside/);
assert.deepEqual(collectAlerts(returned, seen, false), []);
assert.deepEqual(collectAlerts(outside, new Set(), true), []);
assert.match(collectAlerts({ ...located, incidents: [{ ...incident, id: 2, resolution: 'fence_changed', resolvedAt: time }] }, seen, false).at(-1), /fence changed/);
assert.throws(() => normalizeSettings({ serverUrl: 'http://public.example', ownerToken: 'synthetic-owner' }, null, 'android'));
assert.throws(() => normalizeSettings({ serverUrl: 'https://example.com?token=secret', ownerToken: 'synthetic-owner' }, null, 'android'));
assert.throws(() => normalizeSettings({ serverUrl: 'http://192.168.1.2', ownerToken: 'synthetic-owner' }, '192.168.1.2', 'ios'));
assert.equal(normalizeSettings({ serverUrl: 'http://192.168.1.2:3000', ownerToken: 'synthetic-owner' }, '192.168.1.2', 'android').serverUrl, 'http://192.168.1.2:3000');
assert.equal(liveUrl({ serverUrl: 'https://example.com', ownerToken: 'synthetic-owner' }), 'wss://example.com/api/live');

function luminance(hex) {
  const channels = [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
for (const palette of Object.values(palettes)) {
  for (const background of ['background', 'card']) {
    const foreground = luminance(palette['muted-foreground']);
    const surface = luminance(palette[background]);
    assert.ok((Math.max(foreground, surface) + 0.05) / (Math.min(foreground, surface) + 0.05) >= 4.5);
  }
}

mkdirSync(new URL('../dist/', import.meta.url), { recursive: true });
const databasePath = new URL('../dist/cache-check.sqlite', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
let sqlite = new DatabaseSync(databasePath);
sqlite.exec(cacheMigration);
let database = drizzle({ client: sqlite });
const row = { scope: 'synthetic-server-owner-scope', revision: located.revision, serverTime: located.serverTime, savedAt: 1000, payload: JSON.stringify(located) };
await cacheWrite(database, row);
await cacheWrite(database, { ...row, revision: 0, payload: JSON.stringify(empty), savedAt: 2000 });
await cacheWrite(database, { ...row, savedAt: 999, payload: 'older asynchronous write' });
await cacheWrite(database, { ...row, savedAt: 3000, payload: 'duplicate timestamp must not reset freshness' });
await cacheWrite(database, { ...row, scope: 'other-owner', revision: 0, payload: JSON.stringify(empty) });
sqlite.close();
sqlite = new DatabaseSync(databasePath);
database = drizzle({ client: sqlite });
const cached = await database.select().from(snapshotCache).where(eq(snapshotCache.scope, row.scope));
assert.equal(parseCache(cached[0].payload, cached[0].savedAt).snapshot.revision, 2);
assert.equal(cached[0].savedAt, 1000);
const duplicateRetained = parseCache(cached[0].payload, cached[0].savedAt);
assert.equal(safetyLabel(duplicateRetained.snapshot.devices[0], duplicateRetained, 16000, true), 'Unknown · stale location');
assert.equal((await database.select().from(snapshotCache).where(eq(snapshotCache.scope, 'other-owner')))[0].revision, 0);
sqlite.close();
unlinkSync(databasePath);

let responseSnapshot = located;
let responseStatus = 200;
const server = createServer(async (request, response) => {
  assert.equal(request.headers.authorization, 'Bearer synthetic-owner');
  if (responseStatus !== 200) { response.writeHead(responseStatus); response.end('untrusted-server-detail'); return; }
  if (request.method === 'PUT') {
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    assert.deepEqual(payload.vertices, vertices);
    if (payload.expectedVersion !== 1) { response.writeHead(409); response.end(); return; }
    responseSnapshot = { ...located, revision: 3, geofence: { ...located.geofence, version: 2 } };
  }
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(responseSnapshot));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const settings = { serverUrl: `http://127.0.0.1:${server.address().port}`, ownerToken: 'synthetic-owner' };
try {
  assert.equal((await requestSnapshot(settings)).revision, 2);
  await assert.rejects(updateFence(settings, vertices, 0), FenceConflict);
  assert.equal((await updateFence(settings, vertices, 1)).geofence.version, 2);
  responseStatus = 401;
  await assert.rejects(requestSnapshot(settings), /OWNER_TOKEN.*DEVICE_TOKEN/);
  responseStatus = 404;
  await assert.rejects(requestSnapshot(settings), /3000.*8081/);
  responseStatus = 503;
  await assert.rejects(requestSnapshot(settings), /503/);
  responseStatus = 200;
  responseSnapshot = { token: 'untrusted-server-detail' };
  await assert.rejects(requestSnapshot(settings), error => error instanceof ServerConnectionError && /Invalid Glance snapshot/.test(error.message) && !error.message.includes('untrusted-server-detail'));
  await assert.rejects(requestSnapshot(settings, AbortSignal.abort()), /timed out or was interrupted/);
} finally { await new Promise(resolve => server.close(resolve)); }
await assert.rejects(requestSnapshot(settings), /Cannot reach the backend/);
console.log('PASS: initial empty-map origin and coordinate/tap-draft geometry, five-episode pagination/clamping/identity, detected local timezone formatting (UTC and Pacific/Honolulu) with unchanged wire timestamps, native gesture source wiring (not device behavior), strict cache parsing, monotonic durable Drizzle SQLite writes, server/owner isolation, freshness, alert dedup/baselines, polygon validation, contrast, HTTPS policy, HTTP bearer/version/conflict and sanitized connection-error client contract (synthetic local fixture).');
