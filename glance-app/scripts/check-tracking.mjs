import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/node-sqlite';
import { eq } from 'drizzle-orm';
import { cacheMigration, snapshotCache } from '../src/db/schema.ts';
import { cacheWrite } from '../src/db/cache-query.ts';
import { acceptsSnapshot, collectAlerts, normalizeSettings, parseCache, safetyLabel } from '../src/tracking/policy.ts';
import { FenceConflict, liveUrl, requestSnapshot, ServerConnectionError, updateFence } from '../src/tracking/network.ts';
import { DEFAULT_MAP_POSITION, fromMapCoordinate, initialMapCenter, mapCameraPadding, toMapCoordinate } from '../src/components/live-map.geometry.ts';
import { clientTimeZone, connectionLabel, deviceHistoryPage, episodeLabel, formatLocalTimestamp, historyPage } from '../src/tracking/presentation.ts';
import { createFenceDraft, fenceDraftReducer, inputCoordinate, toVertexInput, validateFenceDraft } from '../src/tracking/fence-draft.ts';
import { palettes } from '../src/tracking/colors.ts';
import { parseSnapshot, parseSnapshotMessage } from '../../shared/protocol.ts';
import { validatePolygon } from '../../shared/geofence.ts';

const time = '2026-10-03T00:00:00.000Z';
const vertices = [{ latitude: 11, longitude: 124 }, { latitude: 11, longitude: 125 }, { latitude: 12, longitude: 125 }];
const empty = parseSnapshot({ revision: 0, serverTime: time, geofence: null, devices: [{ deviceId: 'prototype-001', location: null, boundaryStatus: 'unknown', activeViolationId: null }], incidents: [] });
const located = parseSnapshot({ ...empty, revision: 2, geofence: { version: 1, vertices, updatedAt: time }, devices: [{ deviceId: 'prototype-001', location: { latitude: 11.1, longitude: 124.2, observedAt: time, receivedAt: time }, boundaryStatus: 'inside', activeViolationId: null }] });
assert.deepEqual(initialMapCenter([], empty.devices), [122.54782989758861, 10.730972921778378]);
assert.deepEqual(initialMapCenter(vertices, empty.devices), [124, 11]);
assert.deepEqual(initialMapCenter(vertices, located.devices), [124.2, 11.1]);
assert.deepEqual(fromMapCoordinate(toMapCoordinate(DEFAULT_MAP_POSITION)), DEFAULT_MAP_POSITION);
assert.deepEqual(mapCameraPadding(820, 144, 464, 24), { top: 168, right: 72, bottom: 504, left: 32 });
assert.equal(mapCameraPadding(820, 144, 464, 48).bottom, 528);
const crowdedCameraPadding = mapCameraPadding(820, 300, 600, 48);
assert.ok(820 - crowdedCameraPadding.top - crowdedCameraPadding.bottom >= 96);
assert.ok(crowdedCameraPadding.bottom > crowdedCameraPadding.top);
assert.equal(mapCameraPadding(0, 144, 464, 24).bottom, 0);
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
const selectedHistory = Array.from({ length: 14 }, (_, index) => ({ ...incident, id: index + 1, deviceId: index % 2 === 0 ? 'prototype-001' : 'slave-02' }));
assert.deepEqual(deviceHistoryPage(selectedHistory, 'prototype-001', 0).incidents.map(episode => episode.id), [13, 11, 9, 7, 5]);
assert.deepEqual(deviceHistoryPage(selectedHistory, 'slave-02', 1).incidents.map(episode => episode.id), [4, 2]);
assert.equal(deviceHistoryPage(selectedHistory, 'slave-02', 1).total, 7);
assert.equal(deviceHistoryPage(selectedHistory, 'absent-device', 2).total, 0);
assert.equal(deviceHistoryPage(selectedHistory.slice(0, 4), 'slave-02', 1).page, 0);
assert.equal(episodeLabel(null), 'Outside boundary · open');
assert.equal(episodeLabel('returned'), 'Back inside fence');
assert.equal(episodeLabel('fence_changed'), 'Boundary updated');
assert.equal(connectionLabel('live', null), 'Connected');
assert.notEqual(connectionLabel('live', 'Invalid server update'), 'Connected');
assert.notEqual(connectionLabel('connecting', null), 'Connected');
const initialDraft = createFenceDraft(located.geofence);
const changedDraft = fenceDraftReducer(initialDraft, { type: 'vertices', vertices: tappedDraft.map(toVertexInput) });
assert.equal(changedDraft.dirty, true);
assert.equal(changedDraft.expectedVersion, 1);
assert.equal(validateFenceDraft(changedDraft.vertices).valid, true);
assert.match(validateFenceDraft(changedDraft.vertices.slice(0, 2)).error, /1 more distinct corner/);
assert.equal(validateFenceDraft([{ latitude: '', longitude: '124' }]).valid, false);
assert.equal(Number.isNaN(inputCoordinate({ latitude: '', longitude: '124' }).latitude), true);
assert.equal(validateFenceDraft([{ latitude: '11', longitude: '124' }, { latitude: '12', longitude: '125' }, { latitude: '11', longitude: '125' }, { latitude: '12', longitude: '124' }]).valid, false);
const failedDraft = fenceDraftReducer(changedDraft, { type: 'failed' });
assert.equal(failedDraft.needsReload, true);
assert.equal(failedDraft.vertices, changedDraft.vertices);
assert.equal(failedDraft.expectedVersion, 1);
const reloadedDraft = fenceDraftReducer(failedDraft, { type: 'reload', version: 9 });
assert.equal(reloadedDraft.vertices, changedDraft.vertices);
assert.equal(reloadedDraft.expectedVersion, 9);
assert.equal(reloadedDraft.needsReload, false);
assert.equal(reloadedDraft.dirty, true);
assert.equal(reloadedDraft.confirmedVersion, null);
const confirmedDraft = fenceDraftReducer(reloadedDraft, { type: 'confirmed', fence: { ...located.geofence, version: 10 } });
assert.equal(confirmedDraft.dirty, false);
assert.equal(confirmedDraft.confirmedVersion, 10);
assert.equal(fenceDraftReducer(confirmedDraft, { type: 'vertices', vertices: [] }).confirmedVersion, null);
assert.equal(createFenceDraft(null).expectedVersion, 0);
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
for (const screen of ['map-screen', 'setup-screen', 'history-screen', 'fence-screen']) {
  const source = readFileSync(new URL(`../src/screens/${screen}.tsx`, import.meta.url), 'utf8');
  assert.match(source, /import \{ ScrollView \} from 'react-native-gesture-handler'/);
  assert.doesNotMatch(source, /scrollEnabled=\{false\}/);
}
const appRoot = new URL('../src/app/', import.meta.url);
assert.deepEqual(readdirSync(new URL('(tabs)/', appRoot)).sort(), ['_layout.tsx', 'explore.tsx', 'index.tsx']);
const rootLayout = readFileSync(new URL('_layout.tsx', appRoot), 'utf8');
assert.match(rootLayout, /<Stack.Screen name="fence"/);
assert.match(rootLayout, /<Stack.Screen name="history"/);
assert.match(rootLayout, /presentation: 'formSheet'/);
const tabsSource = readFileSync(new URL('../src/components/app-tabs.tsx', import.meta.url), 'utf8');
assert.deepEqual([...tabsSource.matchAll(/<Tabs.Screen name="([^"]+)"/g)].map(match => match[1]), ['index', 'explore']);
const mapSource = readFileSync(new URL('../src/screens/map-screen.tsx', import.meta.url), 'utf8');
assert.match(mapSource, /return largeText \? <ScrollView\b[^>]*>\{header\}\{map\}\{inspector\}<\/ScrollView>/);
assert.match(mapSource, /<MapContent key={settings\?\.scope/);
assert.match(mapSource, /pathname: '\/history', params: { deviceId: selectedDevice.deviceId }/);
const historySource = readFileSync(new URL('../src/screens/history-screen.tsx', import.meta.url), 'utf8');
assert.match(historySource, /key={\(settings\?\.scope \?\? 'unconfigured'\) \+ ':' \+ selected}/);
assert.match(historySource, /const \[expanded, setExpanded\] = useState\(false\)/);
const editorSource = readFileSync(new URL('../src/screens/fence-screen.tsx', import.meta.url), 'utf8');
assert.match(editorSource, /usePreventRemove\(draft.dirty \|\| pending/);
assert.match(editorSource, /navigation.dispatch\(data.action\)/);
assert.match(editorSource, /if \(inFlight.current \|\| !scopeMatches/);
assert.doesNotMatch(editorSource, /<FenceEditor key=/);
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
const twoTrackerHistory = Array.from({ length: 6 }, (_, index) => ({
  ...incident,
  id: index + 1,
  deviceId: index % 2 === 0 ? 'prototype-001' : 'slave-02',
  resolution: index % 2 === 0 ? 'returned' : 'fence_changed',
  resolvedAt: time,
  returnPosition: index % 2 === 0 ? { latitude: 11.1, longitude: 124.2, observedAt: time } : null,
}));
const twoTrackerBaseline = parseSnapshot({
  ...located,
  devices: [located.devices[0], {
    deviceId: 'slave-02',
    location: { latitude: 11.5, longitude: 124.7, observedAt: '2026-10-02T23:59:50.000Z', receivedAt: time },
    boundaryStatus: 'inside',
    activeViolationId: null,
  }],
  incidents: twoTrackerHistory,
});
const twoTrackers = parseSnapshot({
  ...twoTrackerBaseline,
  revision: 5,
  devices: [twoTrackerBaseline.devices[0], { ...twoTrackerBaseline.devices[1], location: { ...twoTrackerBaseline.devices[1].location, latitude: 13 }, boundaryStatus: 'outside', activeViolationId: 7 }],
  incidents: [...twoTrackerHistory, { ...incident, id: 7, deviceId: 'slave-02', outside: { latitude: 13, longitude: 124.7, observedAt: twoTrackerBaseline.devices[1].location.observedAt } }],
});
assert.deepEqual(twoTrackers.devices.map(device => [device.deviceId, toMapCoordinate(device.location), device.boundaryStatus, device.activeViolationId]), [
  ['prototype-001', [124.2, 11.1], 'inside', null],
  ['slave-02', [124.7, 13], 'outside', 7],
]);
assert.deepEqual(parseSnapshotMessage(JSON.parse(JSON.stringify({ type: 'snapshot', snapshot: twoTrackers }))).snapshot, twoTrackers);
assert.deepEqual(parseCache(JSON.stringify(twoTrackers), 1000).snapshot, twoTrackers);
assert.deepEqual(initialMapCenter([], [empty.devices[0], twoTrackers.devices[1]]), [124.7, 13]);
const twoTrackerEntry = { snapshot: twoTrackers, savedAt: 1000 };
assert.deepEqual(twoTrackers.devices.map(device => safetyLabel(device, twoTrackerEntry, 1000, true)), ['Inside geofence', 'Outside geofence']);
assert.deepEqual(twoTrackers.devices.map(device => safetyLabel(device, twoTrackerEntry, 6000, true)), ['Inside geofence', 'Unknown · stale location']);
assert.deepEqual(twoTrackers.devices.map(device => safetyLabel(device, twoTrackerEntry, 1000, false)), ['Unknown · disconnected', 'Unknown · disconnected']);
const prototypeUpdated = parseSnapshot({
  ...twoTrackers,
  revision: 6,
  serverTime: '2026-10-03T00:00:05.000Z',
  devices: [{ ...twoTrackers.devices[0], location: { ...twoTrackers.devices[0].location, observedAt: '2026-10-03T00:00:05.000Z', receivedAt: '2026-10-03T00:00:05.000Z' } }, twoTrackers.devices[1]],
});
assert.equal(acceptsSnapshot(twoTrackers, prototypeUpdated), true);
assert.deepEqual(prototypeUpdated.devices[1], twoTrackers.devices[1]);
assert.deepEqual(prototypeUpdated.devices.map(device => safetyLabel(device, { snapshot: prototypeUpdated, savedAt: 6000 }, 6000, true)), ['Inside geofence', 'Unknown · stale location']);
const bothOutside = parseSnapshot({
  ...twoTrackers,
  revision: 7,
  devices: [{ ...twoTrackers.devices[0], location: { ...twoTrackers.devices[0].location, ...incident.outside }, boundaryStatus: 'outside', activeViolationId: 8 }, twoTrackers.devices[1]],
  incidents: [...twoTrackers.incidents, { ...incident, id: 8 }],
});
const twoTrackerSeen = new Set();
assert.deepEqual(collectAlerts(twoTrackerBaseline, twoTrackerSeen, true), []);
assert.deepEqual(collectAlerts(bothOutside, twoTrackerSeen, false), ['slave-02 · geofence violation (#7)', 'prototype-001 · geofence violation (#8)']);
assert.deepEqual(collectAlerts(bothOutside, twoTrackerSeen, false), []);
const prototypeReturned = parseSnapshot({
  ...bothOutside,
  revision: 8,
  devices: [twoTrackers.devices[0], twoTrackers.devices[1]],
  incidents: bothOutside.incidents.map(episode => episode.id === 8 ? { ...episode, resolution: 'returned', resolvedAt: time, returnPosition: { latitude: 11.1, longitude: 124.2, observedAt: time } } : episode),
});
assert.deepEqual(collectAlerts(prototypeReturned, twoTrackerSeen, false), ['prototype-001 · returned inside (#8)']);
assert.deepEqual(prototypeReturned.devices[1], bothOutside.devices[1]);
const slaveFenceChanged = parseSnapshot({
  ...prototypeReturned,
  revision: 9,
  geofence: { ...prototypeReturned.geofence, version: 2 },
  devices: prototypeReturned.devices.map(device => ({ ...device, boundaryStatus: 'unknown', activeViolationId: null })),
  incidents: prototypeReturned.incidents.map(episode => episode.id === 7 ? { ...episode, resolution: 'fence_changed', resolvedAt: time } : episode),
});
assert.deepEqual(collectAlerts(slaveFenceChanged, twoTrackerSeen, false), ['slave-02 · episode closed: fence changed (#7)']);
assert.deepEqual(slaveFenceChanged.devices.map(device => device.location), twoTrackers.devices.map(device => device.location));
const reconnectedSeen = new Set();
assert.deepEqual(collectAlerts(bothOutside, reconnectedSeen, true), []);
assert.deepEqual(collectAlerts(prototypeReturned, reconnectedSeen, true), []);
assert.deepEqual(collectAlerts(prototypeReturned, reconnectedSeen, false), []);
assert.deepEqual(collectAlerts(slaveFenceChanged, reconnectedSeen, false), ['slave-02 · episode closed: fence changed (#7)']);
assert.deepEqual(historyPage(prototypeReturned.incidents, 0).incidents.map(episode => [episode.id, episode.deviceId]), [[8, 'prototype-001'], [7, 'slave-02'], [6, 'slave-02'], [5, 'prototype-001'], [4, 'slave-02']]);
assert.deepEqual(historyPage(prototypeReturned.incidents, 1).incidents.map(episode => [episode.id, episode.deviceId]), [[3, 'prototype-001'], [2, 'slave-02'], [1, 'prototype-001']]);
assert.throws(() => parseSnapshot({ ...bothOutside, devices: bothOutside.devices.map(device => ({ ...device, activeViolationId: device.deviceId === 'slave-02' ? 8 : 7 })) }), /Missing active incident/);
assert.throws(() => parseSnapshot({ ...bothOutside, incidents: bothOutside.incidents.filter(episode => episode.id !== 7) }), /Missing active incident/);
assert.throws(() => parseSnapshot({ ...bothOutside, devices: [bothOutside.devices[0], { ...bothOutside.devices[1], boundaryStatus: 'inside', activeViolationId: null }] }), /Unlinked active incident/);
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
  for (const background of ['background', 'card', 'popover', 'secondary', 'muted', 'input']) {
    const foreground = luminance(palette['muted-foreground']);
    const surface = luminance(palette[background]);
    assert.ok((Math.max(foreground, surface) + 0.05) / (Math.min(foreground, surface) + 0.05) >= 4.5);
  }
  const primaryText = luminance(palette['primary-foreground']);
  const primarySurface = luminance(palette.primary);
  assert.ok((Math.max(primaryText, primarySurface) + 0.05) / (Math.min(primaryText, primarySurface) + 0.05) >= 4.5);
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
const twoTrackerRow = { ...row, scope: 'synthetic-two-tracker-scope', revision: twoTrackers.revision, payload: JSON.stringify(twoTrackers) };
await cacheWrite(database, twoTrackerRow);
await cacheWrite(database, { ...twoTrackerRow, revision: located.revision, payload: JSON.stringify(located), savedAt: 2000 });
sqlite.close();
sqlite = new DatabaseSync(databasePath);
database = drizzle({ client: sqlite });
const cached = await database.select().from(snapshotCache).where(eq(snapshotCache.scope, row.scope));
assert.equal(parseCache(cached[0].payload, cached[0].savedAt).snapshot.revision, 2);
assert.equal(cached[0].savedAt, 1000);
const duplicateRetained = parseCache(cached[0].payload, cached[0].savedAt);
assert.equal(safetyLabel(duplicateRetained.snapshot.devices[0], duplicateRetained, 16000, true), 'Unknown · stale location');
assert.equal((await database.select().from(snapshotCache).where(eq(snapshotCache.scope, 'other-owner')))[0].revision, 0);
const twoTrackerCachedRow = (await database.select().from(snapshotCache).where(eq(snapshotCache.scope, twoTrackerRow.scope)))[0];
const twoTrackerCached = parseCache(twoTrackerCachedRow.payload, twoTrackerCachedRow.savedAt);
assert.deepEqual(twoTrackerCached, twoTrackerEntry);
assert.deepEqual(twoTrackerCached.snapshot.devices.map(device => safetyLabel(device, twoTrackerCached, 6000, true)), ['Inside geofence', 'Unknown · stale location']);
assert.deepEqual(historyPage(twoTrackerCached.snapshot.incidents, 1).incidents.map(episode => episode.deviceId), ['slave-02', 'prototype-001']);
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
  responseSnapshot = twoTrackers;
  assert.deepEqual(await requestSnapshot(settings), twoTrackers);
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
console.log('PASS: prototype-001 + slave-02 HTTP/frame/cache round trips, durable two-tracker SQLite retention against older single-tracker writes, independent freshness/status, simultaneous linked episodes, per-device return/fence-change alerts and reconnect suppression, cross-device five-item history pagination (synthetic fixtures; no native rendering or hardware exercised).');
console.log('PASS: selected-device filtering before five-item pagination, missing-device isolation and clamping, truthful connection/resolution labels, draft validation and failed/reload/confirmed transitions, grouped route and removal-guard source wiring. Native navigation, focus, gestures and rendering remain unverified.');
