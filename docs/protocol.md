# Prototype API contract

Frozen integration contract, 3 October 2026; accepted behavior: ADR-0004. Route implementation and end-to-end verification belong to server/app/firmware owners; this document does not certify them.

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
| `POST /api/locations` | `Bearer DEVICE_TOKEN` | PositionObservation; HTTP 200 `{accepted:boolean,revision:number}`. Configured deviceId must match. |
| `GET /api/snapshot` | `Bearer OWNER_TOKEN` | Snapshot directly, no envelope. |
| `PUT /api/geofence` | `Bearer OWNER_TOKEN` | `{vertices:Coordinate[],expectedVersion:number}`; HTTP 200 updated Snapshot; 409 on version conflict. Use 0 when no fence exists. |
| `GET /api/live` | RFC6455 first-frame authorization | First JSON `{type:'authenticate',token:OWNER_TOKEN}` within 5 seconds; authorized updates `{type:'snapshot',snapshot:Snapshot}`. |

Invalid payloads are rejected, not repaired. Invalid credentials cannot read/write data; device credentials cannot manage fences or subscribe. Credentials never appear in URL/logs. HTTP/ws is an explicit trusted-local exception only; public cloud requires HTTPS/wss with verified certificates. Firmware must not use setInsecure; native configuration must not globally weaken cleartext/TLS policy.

Upload interval is 5000ms; a location is stale when either observation age or accepted receipt age reaches 15000ms relative to serverTime, or a timestamp is invalid. Receipt cannot relabel a delayed historical fix as current; source-clock skew cannot extend the no-receipt timeout. Implementation clock gate: age must be strictly less than 15000ms, future skew at most 5000ms, observedAt strictly newer than stored latest. Ignored fixes return accepted=false with unchanged revision and receivedAt, and cannot evaluate a replacement fence. No-fix uploads must not fabricate coordinates/times.

Serialize fence mutation and telemetry state changes inside PostgreSQL transactions, with uniqueness protection for one active episode per device. Persist monotonic revision atomically with state. Fence edits compare only fence version, never telemetry revision. Native cache rejects older revisions; equal revisions may refresh serverTime but must not create duplicate foreground alerts. Time passage changes display freshness without creating a revision or episode. Preserve all server episodes; project the newest 100 by ID including active episodes (reserve room for an older active episode), with devices' active IDs always resolvable. No GPS trail.

## Runnable Node 24 usage

Set BASE_URL, DEVICE_TOKEN, and OWNER_TOKEN in the environment; use the actual endpoint and fresh GPS observation for hardware runs. This local example uses a clearly synthetic point/time solely to exercise the HTTP contract, not to prove live GPS.

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
