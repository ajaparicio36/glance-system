import { parseSnapshot, parseGeofenceUpdate, type Coordinate, type Snapshot } from '../../../shared/protocol.ts';
import type { ConnectionSettings } from './policy.ts';

export class FenceConflict extends Error {
  constructor() {
    super('Fence changed on the server. Your draft is retained. Reload the latest fence, review, then retry.');
  }
}

export async function requestSnapshot(settings: ConnectionSettings, signal?: AbortSignal): Promise<Snapshot> {
  return request(settings, '/api/snapshot', { signal });
}

export async function updateFence(settings: ConnectionSettings, vertices: Coordinate[], expectedVersion: number, signal?: AbortSignal): Promise<Snapshot> {
  const body = parseGeofenceUpdate({ vertices, expectedVersion });
  return request(settings, '/api/geofence', { method: 'PUT', body: JSON.stringify(body), signal });
}

async function request(settings: ConnectionSettings, path: string, options: RequestInit): Promise<Snapshot> {
  const response = await fetch(`${settings.serverUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${settings.ownerToken}`, 'Content-Type': 'application/json' },
  });
  if (response.status === 409) throw new FenceConflict();
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Owner authorization failed. Check Setup.' : `Server request failed (${response.status}). Retry; cached data is retained.`);
  const payload: unknown = await response.json();
  return parseSnapshot(payload);
}

export function liveUrl(settings: ConnectionSettings): string {
  const url = new URL('/api/live', settings.serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
