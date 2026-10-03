import { parseSnapshot, STALE_AFTER_MS, type Snapshot, type TrackerSnapshot } from '../../../shared/protocol.ts';

export type ConnectionSettings = { serverUrl: string; ownerToken: string };
export type SnapshotEntry = { snapshot: Snapshot; savedAt: number };

export function normalizeSettings(value: unknown, localHttpHost: string | null, platform: string): ConnectionSettings {
  if (typeof value !== 'object' || value === null) throw new Error('Enter server and owner credential.');
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.serverUrl !== 'string' || typeof candidate.ownerToken !== 'string' || !candidate.ownerToken.trim()) {
    throw new Error('Enter server and owner credential.');
  }
  const server = new URL(candidate.serverUrl.trim());
  if (server.username || server.password || server.search || server.hash || server.pathname !== '/') {
    throw new Error('Use a server origin only, without credentials, path, query, or fragment.');
  }
  const trustedLocal = server.protocol === 'http:' && localHttpHost !== null && server.hostname === localHttpHost;
  if (server.protocol !== 'https:' && !trustedLocal) throw new Error('HTTPS is required. Local HTTP must match the host configured in a trusted-development build.');
  if (trustedLocal && platform === 'ios' && /^\d+\.\d+\.\d+\.\d+$/.test(server.hostname)) {
    throw new Error('iOS local HTTP requires a configured hostname, not a numeric IP. Use HTTPS or a resolvable .local hostname.');
  }
  return { serverUrl: server.origin, ownerToken: candidate.ownerToken.trim() };
}

export function acceptsSnapshot(previous: Snapshot | null, next: Snapshot): boolean {
  return previous === null || next.revision > previous.revision ||
    (next.revision === previous.revision && next.serverTime > previous.serverTime);
}

export function parseCache(payload: string, savedAt: number): SnapshotEntry {
  if (!Number.isFinite(savedAt) || savedAt < 0) throw new Error('Invalid cache timestamp.');
  const value: unknown = JSON.parse(payload);
  return { snapshot: parseSnapshot(value), savedAt };
}

export function serverNow(entry: SnapshotEntry, now: number): number {
  return Date.parse(entry.snapshot.serverTime) + Math.max(0, now - entry.savedAt);
}

export function locationAge(device: TrackerSnapshot, entry: SnapshotEntry, now: number): number | null {
  return device.location ? Math.max(0,
    serverNow(entry, now) - Date.parse(device.location.receivedAt),
    serverNow(entry, now) - Date.parse(device.location.observedAt)) : null;
}

export function safetyLabel(device: TrackerSnapshot, entry: SnapshotEntry, now: number, connected: boolean): string {
  const age = locationAge(device, entry, now);
  if (age === null) return 'Unknown · waiting for GPS';
  if (!connected) return 'Unknown · disconnected';
  if (age >= STALE_AFTER_MS) return 'Unknown · stale location';
  if (device.boundaryStatus === 'unknown') return 'Unknown · waiting for evaluation';
  return device.boundaryStatus === 'outside' ? 'Outside geofence' : 'Inside geofence';
}

export function incidentKeys(snapshot: Snapshot): string[] {
  return snapshot.incidents.flatMap(incident => [
    `${incident.id}:outside`,
    ...(incident.resolution ? [`${incident.id}:${incident.resolution}`] : []),
  ]);
}

export function collectAlerts(snapshot: Snapshot, seen: Set<string>, baseline: boolean): string[] {
  const alerts: string[] = [];
  for (const incident of [...snapshot.incidents].sort((left, right) => left.id - right.id)) {
    if (!baseline && !seen.has(`${incident.id}:outside`)) alerts.push(`${incident.deviceId} · geofence violation (#${incident.id})`);
    if (!baseline && incident.resolution && !seen.has(`${incident.id}:${incident.resolution}`)) {
      alerts.push(`${incident.deviceId} · ${incident.resolution === 'returned' ? 'returned inside' : 'episode closed: fence changed'} (#${incident.id})`);
    }
  }
  for (const key of incidentKeys(snapshot)) seen.add(key);
  return alerts;
}
