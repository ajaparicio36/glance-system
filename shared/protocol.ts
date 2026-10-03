import { validatePolygon } from './geofence.ts';

export type Coordinate = { latitude: number; longitude: number };
export type PositionObservation = Coordinate & { deviceId: string; observedAt: string };
export type Geofence = { version: number; vertices: Coordinate[]; updatedAt: string };
export type Location = Coordinate & { observedAt: string; receivedAt: string };
export type BoundaryStatus = 'unknown' | 'inside' | 'outside';
export type TrackerSnapshot = {
  deviceId: string;
  location: Location | null;
  boundaryStatus: BoundaryStatus;
  activeViolationId: number | null;
};
export type Incident = {
  id: number;
  deviceId: string;
  outside: Coordinate & { observedAt: string };
  resolution: null | 'returned' | 'fence_changed';
  resolvedAt: string | null;
  returnPosition: (Coordinate & { observedAt: string }) | null;
};
export type Snapshot = {
  revision: number;
  serverTime: string;
  geofence: Geofence | null;
  devices: TrackerSnapshot[];
  incidents: Incident[];
};
export type GeofenceUpdate = { vertices: Coordinate[]; expectedVersion: number };
export type LocationAcceptance = { accepted: boolean; revision: number };
export type AuthenticateMessage = { type: 'authenticate'; token: string };
export type SnapshotMessage = { type: 'snapshot'; snapshot: Snapshot };

export const UPLOAD_INTERVAL_MS = 5_000;
export const STALE_AFTER_MS = 15_000;
export const MAX_OBSERVATION_AGE_MS = 15_000;
export const MAX_FUTURE_SKEW_MS = 5_000;
export const AUTHORIZATION_TIMEOUT_MS = 5_000;
export const SNAPSHOT_INCIDENT_LIMIT = 100;

function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Expected an object.');
  }
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).length !== keys.length || keys.some(key => !Object.hasOwn(candidate, key))) {
    throw new TypeError('Unexpected or missing fields.');
  }
  return candidate;
}

function integer(value: unknown, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    throw new TypeError('Expected a safe nonnegative integer.');
  }
  return value;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError('Expected nonempty text.');
  return value;
}

function deviceId(value: unknown): string {
  if (typeof value !== 'string' || /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.exec(value)?.[0] !== value) {
    throw new TypeError('Invalid device identity.');
  }
  return value;
}

export function parseTimestamp(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new TypeError('Expected a UTC ISO timestamp with milliseconds.');
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    throw new TypeError('Invalid timestamp.');
  }
  return value;
}

function coordinate(value: Record<string, unknown>): Coordinate {
  const { latitude, longitude } = value;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new TypeError('Invalid coordinate.');
  }
  return { latitude, longitude };
}

function position(value: unknown): Coordinate & { observedAt: string } {
  const candidate = record(value, ['latitude', 'longitude', 'observedAt']);
  return { ...coordinate(candidate), observedAt: parseTimestamp(candidate.observedAt) };
}

export function parsePositionObservation(value: unknown): PositionObservation {
  const candidate = record(value, ['deviceId', 'latitude', 'longitude', 'observedAt']);
  return { ...coordinate(candidate), deviceId: deviceId(candidate.deviceId), observedAt: parseTimestamp(candidate.observedAt) };
}

export function parseGeofenceUpdate(value: unknown): GeofenceUpdate {
  const candidate = record(value, ['vertices', 'expectedVersion']);
  if (!Array.isArray(candidate.vertices)) throw new TypeError('Expected vertices.');
  const vertices = candidate.vertices.map((vertex: unknown) => coordinate(record(vertex, ['latitude', 'longitude'])));
  const result = validatePolygon(vertices);
  if (!result.valid) throw new TypeError(result.error);
  return { vertices: result.vertices, expectedVersion: integer(candidate.expectedVersion) };
}

export function parseAuthenticateMessage(value: unknown): AuthenticateMessage {
  const candidate = record(value, ['type', 'token']);
  if (candidate.type !== 'authenticate') throw new TypeError('Expected authentication frame.');
  return { type: 'authenticate', token: text(candidate.token) };
}

export function parseSnapshot(value: unknown): Snapshot {
  const candidate = record(value, ['revision', 'serverTime', 'geofence', 'devices', 'incidents']);
  let geofence: Geofence | null = null;
  if (candidate.geofence !== null) {
    const fence = record(candidate.geofence, ['version', 'vertices', 'updatedAt']);
    const parsed = parseGeofenceUpdate({ vertices: fence.vertices, expectedVersion: 0 });
    geofence = { version: integer(fence.version, 1), vertices: parsed.vertices, updatedAt: parseTimestamp(fence.updatedAt) };
  }
  if (!Array.isArray(candidate.devices) || !Array.isArray(candidate.incidents)) throw new TypeError('Expected snapshot arrays.');
  const devices = candidate.devices.map((value: unknown): TrackerSnapshot => {
    const tracker = record(value, ['deviceId', 'location', 'boundaryStatus', 'activeViolationId']);
    let location: Location | null = null;
    if (tracker.location !== null) {
      const fix = record(tracker.location, ['latitude', 'longitude', 'observedAt', 'receivedAt']);
      location = { ...coordinate(fix), observedAt: parseTimestamp(fix.observedAt), receivedAt: parseTimestamp(fix.receivedAt) };
    }
    const boundaryStatus = tracker.boundaryStatus;
    if (boundaryStatus !== 'unknown' && boundaryStatus !== 'inside' && boundaryStatus !== 'outside') {
      throw new TypeError('Invalid boundary status.');
    }
    const activeViolationId = tracker.activeViolationId === null ? null : integer(tracker.activeViolationId, 1);
    if ((!location || !geofence) && boundaryStatus !== 'unknown') throw new TypeError('Boundary requires a fix and fence.');
    if ((activeViolationId !== null) !== (boundaryStatus === 'outside')) throw new TypeError('Outside requires an active violation.');
    return { deviceId: deviceId(tracker.deviceId), location, boundaryStatus, activeViolationId };
  });
  const incidents = candidate.incidents.map((value: unknown): Incident => {
    const episode = record(value, ['id', 'deviceId', 'outside', 'resolution', 'resolvedAt', 'returnPosition']);
    const resolution = episode.resolution;
    if (resolution !== null && resolution !== 'returned' && resolution !== 'fence_changed') throw new TypeError('Invalid resolution.');
    const resolvedAt = episode.resolvedAt === null ? null : parseTimestamp(episode.resolvedAt);
    const returnPosition = episode.returnPosition === null ? null : position(episode.returnPosition);
    if ((resolution === null) !== (resolvedAt === null) || (resolution === 'returned') !== (returnPosition !== null)) {
      throw new TypeError('Inconsistent incident resolution.');
    }
    return { id: integer(episode.id, 1), deviceId: deviceId(episode.deviceId), outside: position(episode.outside), resolution, resolvedAt, returnPosition };
  });
  if (new Set(devices.map(device => device.deviceId)).size !== devices.length ||
      new Set(incidents.map(incident => incident.id)).size !== incidents.length) throw new TypeError('Duplicate snapshot identity.');
  for (const tracker of devices) {
    if (tracker.activeViolationId === null) continue;
    const active = incidents.find(incident => incident.id === tracker.activeViolationId);
    if (!active || active.deviceId !== tracker.deviceId || active.resolution !== null) throw new TypeError('Missing active incident.');
  }
  for (const incident of incidents) {
    if (incident.resolution !== null) continue;
    if (!devices.some(device => device.deviceId === incident.deviceId && device.activeViolationId === incident.id)) {
      throw new TypeError('Unlinked active incident.');
    }
  }
  return { revision: integer(candidate.revision), serverTime: parseTimestamp(candidate.serverTime), geofence, devices, incidents };
}

export function parseSnapshotMessage(value: unknown): SnapshotMessage {
  const candidate = record(value, ['type', 'snapshot']);
  if (candidate.type !== 'snapshot') throw new TypeError('Expected snapshot frame.');
  return { type: 'snapshot', snapshot: parseSnapshot(candidate.snapshot) };
}
