import type { Coordinate, TrackerSnapshot } from '../../../shared/protocol.ts';

export const DEFAULT_MAP_POSITION: Coordinate = { latitude: 10.705114643903741, longitude: 122.54401588672367 };

export function toMapCoordinate(position: Coordinate): [number, number] {
  return [position.longitude, position.latitude];
}

export function fromMapCoordinate(position: readonly [number, number]): Coordinate {
  return { latitude: position[1], longitude: position[0] };
}

export function initialMapCenter(polygon: Coordinate[], devices: TrackerSnapshot[]): [number, number] {
  const location = devices.find(device => device.location)?.location;
  return toMapCoordinate(location ?? polygon[0] ?? DEFAULT_MAP_POSITION);
}
