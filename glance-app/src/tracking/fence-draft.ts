import { isValidCoordinate, validatePolygon, type PolygonValidation } from '../../../shared/geofence.ts';
import type { Coordinate, Geofence } from '../../../shared/protocol.ts';

export type VertexInput = { latitude: string; longitude: string };
export type FenceDraft = {
  vertices: VertexInput[];
  expectedVersion: number;
  dirty: boolean;
  needsReload: boolean;
  confirmedVersion: number | null;
};
export type FenceDraftAction =
  | { type: 'vertices'; vertices: VertexInput[] }
  | { type: 'failed' }
  | { type: 'reload'; version: number }
  | { type: 'confirmed'; fence: Geofence };

export function inputCoordinate(vertex: VertexInput): Coordinate {
  return { latitude: vertex.latitude.trim() ? Number(vertex.latitude) : NaN, longitude: vertex.longitude.trim() ? Number(vertex.longitude) : NaN };
}

export function toVertexInput(coordinate: Coordinate): VertexInput {
  return { latitude: String(coordinate.latitude), longitude: String(coordinate.longitude) };
}

export function createFenceDraft(fence: Geofence | null | undefined): FenceDraft {
  return { vertices: fence?.vertices.map(toVertexInput) ?? [], expectedVersion: fence?.version ?? 0, dirty: false, needsReload: false, confirmedVersion: null };
}

export function fenceDraftReducer(state: FenceDraft, action: FenceDraftAction): FenceDraft {
  switch (action.type) {
    case 'vertices':
      return { ...state, vertices: action.vertices, dirty: true, confirmedVersion: null };
    case 'failed':
      return { ...state, needsReload: true };
    case 'reload':
      return { ...state, expectedVersion: action.version, needsReload: false };
    case 'confirmed':
      return { ...createFenceDraft(action.fence), confirmedVersion: action.fence.version };
  }
}

export function validateFenceDraft(vertices: VertexInput[]): PolygonValidation {
  const coordinates = vertices.map(inputCoordinate);
  const validation = validatePolygon(coordinates);
  if (!validation.valid && coordinates.every(isValidCoordinate) && coordinates.length < 3) {
    const distinct = new Set(coordinates.map(point => point.latitude + ',' + point.longitude)).size;
    const remaining = 3 - distinct;
    return { valid: false, error: 'Add ' + remaining + ' more distinct ' + (remaining === 1 ? 'corner' : 'corners') + ' to close the polygon.' };
  }
  return validation;
}
