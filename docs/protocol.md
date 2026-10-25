# Prototype API contract

Frozen integration contract, 3 October 2026; accepted behavior: ADR-0004. Route implementation and end-to-end verification belong to server/app/firmware owners; this document does not certify them.

October 26 extension: one owner and one polygon now serve one or two explicitly configured trackers. Keep `DEVICE_ID=prototype-001` for Slave 1 and its history; opt into Slave 2 with server `DEVICE_IDS=prototype-001,slave-02`. Omit `DEVICE_IDS` for legacy single-device operation. Both trackers share the existing upload token; the separate owner token is unchanged. No device registration or management route is added. The server rejects valid but unconfigured upload identities with 403 before storage.

## Shared modules

- `shared/protocol.ts`: `Coordinate`, `PositionObservation`, `Geofence`, `Location`, `BoundaryStatus`, `TrackerSnapshot`, `Incident`, `Snapshot`, `GeofenceUpdate`, `LocationAcceptance`, `AuthenticateMessage`, `SnapshotMessage`; strict throwing parsers `parseTimestamp`, `parsePositionObservation`, `parseGeofenceUpdate`, `parseAuthenticateMessage`, `parseSnapshot`, `parseSnapshotMessage`.
- `shared/geofence.ts`: `isValidCoordinate`, `validatePolygon`, `getValidatedPolygon`, `closePolygonRing`, `isPointInPolygon`. Reused from the native prototype, without simulation fixture generators. Validation normalizes one repeated closing vertex; rejects invalid coordinates, fewer than three unique points, duplicate vertices, zero area, self-crossing/touching, and overlapping adjacent edges. Exact edges/vertices are inside; no GPS uncertainty tolerance is implied.
- `shared/lifecycle.ts`: `evaluateLifecycle(isInside, hasActiveViolation)` returns `{event,status,resolveActiveViolation,createViolation}`. `status` is inside/outside, even for the returned event. No simulation prerequisite applies to live GPS. `shouldAcceptObservation(observation,latest,receivedAt)` applies timestamp ordering/age/skew after strict parsing; `isLocationStale(location,serverTime)` checks both observation and accepted receipt ages and treats invalid timestamps as stale.
- `.ts` relative imports, erasable TypeScript, no runtime dependencies. Node 24 consumes directly; Metro imports the same modules. No shared SQL/entities or root workspace orchestration. Check: `node shared/check.mjs`.

## Wire shapes

Every object has exactly the named keys; parsers reject missing/extra fields, invalid finite coordinates, unsafe integer IDs/versions, and invalid calendar timestamps. Timestamps are canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ`, sourced from actual GPS for observations. JSON keys are case-sensitive.

Device identities at observation, tracker snapshot, and incident boundaries must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`: 1–64 ASCII characters, beginning with an alphanumeric character, then only alphanumeric, dot, underscore, or hyphen. No whitespace or trailing newline is accepted. Authentication tokens use a separate text guard and transport body/frame limits, not the device identity pattern.

```ts
type Coordinate = {latitude:number, longitude:number};
type PositionObservation = Coordinate & {deviceId:string, observedAt:string};
type Geofence = {version:number, vertices:Coordinate[], updatedAt:string};
type Location = Coordinate & {observedAt:string, receivedAt:string};
type TrackerSnapshot = {deviceId:string, location:Location|null,
  boundaryStatus:'unknown'|'inside'|'outside', activeViolationId:number|null};
type Incident = {id:number, deviceId:string, outside:Coordinate & {observedAt:string},
  resolution:null|'returned'|'fence_changed', resolvedAt:string|null,
  returnPosition:(Coordinate & {observedAt:string})|null};
type Snapshot = {revision:number, serverTime:string, geofence:Geofence|null,
  devices:TrackerSnapshot[], incidents:Incident[]};
```

Revision and expectedVersion are nonnegative safe integers; fence version and incident IDs start at 1. A return has both resolvedAt (server resolution time) and returnPosition (fresh GPS observation); fence_changed has resolvedAt but no returnPosition. Open episodes have neither. Active episode IDs must reference included open episodes of the same device; at most one active episode per device. No fence/fix means unknown, and fence replacement resets status to unknown even with retained coordinates.

## Endpoints and authorization

| Endpoint | Authorization | Request / success |
| --- | --- | --- |
| `GET /health` | Public | Nonsecret health; not a readiness/security guarantee. |
| `POST /api/locations` | `Bearer DEVICE_TOKEN` | PositionObservation; HTTP 200 `{accepted:boolean,revision:number}`. deviceId must belong to the configured allowlist. |
| `GET /api/snapshot` | `Bearer OWNER_TOKEN` | Snapshot directly, no envelope. |
| `PUT /api/geofence` | `Bearer OWNER_TOKEN` | `{vertices:Coordinate[],expectedVersion:number}`; HTTP 200 updated Snapshot; 409 on version conflict. Use 0 when no fence exists. |
| `GET /api/live` | RFC6455 first-frame authorization | First JSON `{type:'authenticate',token:OWNER_TOKEN}` within 5 seconds; authorized updates `{type:'snapshot',snapshot:Snapshot}`. |

Invalid payloads are rejected, not repaired. Invalid credentials cannot read/write data; device credentials cannot manage fences or subscribe. Credentials never appear in URL/logs. HTTP/ws is an explicit trusted-local exception only; public cloud requires HTTPS/wss with verified certificates. Firmware must not use setInsecure; native configuration must not globally weaken cleartext/TLS policy.

Upload interval is 5000ms; a location is stale when either observation age or accepted receipt age reaches 15000ms relative to serverTime, or a timestamp is invalid. Receipt cannot relabel a delayed historical fix as current; source-clock skew cannot extend the no-receipt timeout. Implementation clock gate: age must be strictly less than 15000ms, future skew at most 5000ms, observedAt strictly newer than stored latest. Ignored fixes return accepted=false with unchanged revision and receivedAt, and cannot evaluate a replacement fence. No-fix uploads must not fabricate coordinates/times.

Serialize fence mutation and telemetry state changes inside PostgreSQL transactions, with uniqueness protection for one active episode per device. Persist monotonic revision atomically with state. Fence edits compare only fence version, never telemetry revision. Native cache rejects older revisions; equal revisions may refresh serverTime but must not create duplicate foreground alerts. Time passage changes display freshness without creating a revision or episode. Preserve all server episodes; project the newest 100 by ID including active episodes (reserve room for an older active episode), with devices' active IDs always resolvable. No GPS trail.

Snapshots contain every configured tracker, ordered by device ID, including identities with null location/unknown status. Timestamp ordering, accepted receipt time, boundary state and active episode are independent per tracker: both may upload the same GPS UTC timestamp. Revision is global. Returning one tracker resolves only its episode. Fence replacement closes all active episodes as `fence_changed`, retains both last positions, resets both states to unknown, and waits for each tracker's next accepted fresh fix. The 100-episode projection reserves space for both active episodes, even when older than the newest 100. Shared parsers already validate multiple tracker entries and each active-episode linkage; the wire shape is unchanged.

## Runnable Node 24 usage

Set BASE_URL, DEVICE_TOKEN, and OWNER_TOKEN in the environment; use the actual endpoint and fresh GPS observation for hardware runs. This local example uses a clearly synthetic point/time solely to exercise the HTTP contract, not to prove live GPS.

Run synthetic writes only against a disposable local database, never the live bench/cloud history. For two-tracker verification set server `DEVICE_IDS=prototype-001,slave-02` first, then use this replacement upload block in the example below. Snapshot GET, fence PUT, and authenticated live frames all return both devices:

```js
const observedAt = new Date().toISOString();
for (const deviceId of ['prototype-001', 'slave-02']) {
  const response = await fetch(`${base}/api/locations`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${process.env.DEVICE_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({deviceId, latitude: 11.123456, longitude: 124.123456, observedAt})
  });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  console.log(deviceId, await response.json());
}
const snapshot = await (await fetch(`${base}/api/snapshot`, {headers: ownerHeaders})).json();
console.log(snapshot.devices.map(device => ({deviceId: device.deviceId, activeViolationId: device.activeViolationId})));
```

```js
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const ownerHeaders = {Authorization: `Bearer ${process.env.OWNER_TOKEN}`, 'Content-Type': 'application/json'};
const health = await fetch(`${base}/health`);
console.log('health', health.status);
const before = await (await fetch(`${base}/api/snapshot`, {headers: ownerHeaders})).json();
const fence = await fetch(`${base}/api/geofence`, {
  method: 'PUT', headers: ownerHeaders,
  body: JSON.stringify({expectedVersion: before.geofence?.version ?? 0, vertices: [
    {latitude:11,longitude:124}, {latitude:11,longitude:125},
    {latitude:12,longitude:125}, {latitude:12,longitude:124}
  ]})
});
console.log('fence', fence.status, await fence.json());
const upload = await fetch(`${base}/api/locations`, {
  method: 'POST', headers: {Authorization: `Bearer ${process.env.DEVICE_TOKEN}`, 'Content-Type':'application/json'},
  body: JSON.stringify({deviceId:'prototype-001',latitude:11.123456,longitude:124.123456,observedAt:new Date().toISOString()})
});
console.log('upload', upload.status, await upload.json());
const socketUrl = new URL('/api/live', base);
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(socketUrl);
socket.addEventListener('open', () => socket.send(JSON.stringify({type:'authenticate',token:process.env.OWNER_TOKEN})));
socket.addEventListener('message', event => { console.log(JSON.parse(event.data)); socket.close(); });
```

Server end-to-end checks must cover unauthorized access, conflicting fence versions, initial outside/repeated outside/return, duplicate/delayed/expired rejection without freshness changes, fence_changed and next-fix evaluation, and socket authorization deadline. Native checks must verify strict parsing, older-cache rejection, foreground alerts/history, and stale last-known presentation. Device evidence must separately prove actual GPS, USB bring-up, and verified transport; shared checks alone prove none of those.
