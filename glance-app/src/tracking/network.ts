import { parseSnapshot, parseGeofenceUpdate, type Coordinate, type Snapshot } from '../../../shared/protocol.ts';
import type { ConnectionSettings } from './policy.ts';

export class FenceConflict extends Error {
  constructor() {
    super('Fence changed on the server. Your draft is retained. Reload the latest fence, review, then retry.');
  }
}

export class ServerConnectionError extends Error {}

export async function requestSnapshot(settings: ConnectionSettings, signal?: AbortSignal): Promise<Snapshot> {
  return request(settings, '/api/snapshot', { signal });
}

export async function updateFence(settings: ConnectionSettings, vertices: Coordinate[], expectedVersion: number, signal?: AbortSignal): Promise<Snapshot> {
  const body = parseGeofenceUpdate({ vertices, expectedVersion });
  return request(settings, '/api/geofence', { method: 'PUT', body: JSON.stringify(body), signal });
}

async function request(settings: ConnectionSettings, path: string, options: RequestInit): Promise<Snapshot> {
  let response: Response;
  try {
    response = await fetch(`${settings.serverUrl}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${settings.ownerToken}`, 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ServerConnectionError(options.signal?.aborted ? 'Request timed out or was interrupted. Keep the app open and retry.' : 'Cannot reach the backend. Check the server origin, phone LAN access and Android trusted-HTTP build. Backend API uses port 3000, not Metro 8081.');
  }
  if (response.status === 409) throw new FenceConflict();
  if (response.status === 401) throw new ServerConnectionError('Owner authorization failed (401). In Setup use OWNER_TOKEN, not DEVICE_TOKEN.');
  if (response.status === 403) throw new ServerConnectionError('Server access denied (403). Check the owner credential and HTTPS/trusted-local configuration.');
  if (response.status === 404) throw new ServerConnectionError('Glance API not found (404). Use the backend origin on port 3000, not Metro 8081.');
  if (!response.ok) throw new ServerConnectionError(`Server request failed (${response.status}). Retry; cached data is retained.`);
  try {
    const payload: unknown = await response.json();
    return parseSnapshot(payload);
  } catch {
    throw new ServerConnectionError('Invalid Glance snapshot. Check the backend origin; last confirmed data is retained.');
  }
}

export function liveUrl(settings: ConnectionSettings): string {
  const url = new URL('/api/live', settings.serverUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
