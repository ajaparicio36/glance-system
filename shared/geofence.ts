import type { Coordinate } from './protocol.ts';

export type { Coordinate } from './protocol.ts';

export type PolygonValidation =
  | { valid: true; vertices: Coordinate[] }
  | { valid: false; error: string };

export const isValidCoordinate = (value: unknown): value is Coordinate => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.latitude === 'number' &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === 'number' &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
};

const samePoint = (left: Coordinate, right: Coordinate): boolean =>
  left.latitude === right.latitude && left.longitude === right.longitude;

const cross = (first: Coordinate, second: Coordinate, third: Coordinate): number =>
  (second.longitude - first.longitude) * (third.latitude - first.latitude) -
  (second.latitude - first.latitude) * (third.longitude - first.longitude);

const onSegment = (first: Coordinate, second: Coordinate, point: Coordinate): boolean =>
  cross(first, second, point) === 0 &&
  point.longitude >= Math.min(first.longitude, second.longitude) &&
  point.longitude <= Math.max(first.longitude, second.longitude) &&
  point.latitude >= Math.min(first.latitude, second.latitude) &&
  point.latitude <= Math.max(first.latitude, second.latitude);

const segmentsIntersect = (
  first: Coordinate,
  second: Coordinate,
  third: Coordinate,
  fourth: Coordinate,
): boolean => {
  const abC = cross(first, second, third);
  const abD = cross(first, second, fourth);
  const cdA = cross(third, fourth, first);
  const cdB = cross(third, fourth, second);

  if (
    ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) &&
    ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0))
  ) {
    return true;
  }

  return (
    (abC === 0 && onSegment(first, second, third)) ||
    (abD === 0 && onSegment(first, second, fourth)) ||
    (cdA === 0 && onSegment(third, fourth, first)) ||
    (cdB === 0 && onSegment(third, fourth, second))
  );
};

const signedDoubleArea = (vertices: readonly Coordinate[]): number => {
  let area = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    area += current.longitude * next.latitude - next.longitude * current.latitude;
  }
  return area;
};

export function validatePolygon(value: unknown): PolygonValidation {
  if (!Array.isArray(value)) {
    return { valid: false, error: 'Add at least three map vertices.' };
  }

  const vertices: Coordinate[] = [];
  for (const candidate of value) {
    if (!isValidCoordinate(candidate)) {
      return {
        valid: false,
        error: 'Every vertex must use first valid latitude and longitude.',
      };
    }
    vertices.push({
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    });
  }

  if (vertices.length > 1 && samePoint(vertices[0], vertices[vertices.length - 1])) {
    vertices.pop();
  }

  if (vertices.length < 3) {
    return { valid: false, error: 'Add at least three distinct map vertices.' };
  }

  const uniquePoints = new Set(vertices.map(({ latitude, longitude }) => `${latitude},${longitude}`));
  if (uniquePoints.size !== vertices.length) {
    return {
      valid: false,
      error: 'A vertex can only appear once; the closing point is added automatically.',
    };
  }

  for (let left = 0; left < vertices.length; left += 1) {
    const leftNext = (left + 1) % vertices.length;
    for (let right = left + 1; right < vertices.length; right += 1) {
      const rightNext = (right + 1) % vertices.length;
      if (leftNext === right || rightNext === left) continue;
      if (segmentsIntersect(vertices[left], vertices[leftNext], vertices[right], vertices[rightNext])) {
        return {
          valid: false,
          error: 'The fence edges cannot cross or touch each other.',
        };
      }
    }
  }

  for (let index = 0; index < vertices.length; index += 1) {
    const previous = vertices[(index + vertices.length - 1) % vertices.length];
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    if (
      cross(previous, current, next) === 0 &&
      (previous.longitude - current.longitude) * (next.longitude - current.longitude) +
        (previous.latitude - current.latitude) * (next.latitude - current.latitude) >
        0
    ) {
      return {
        valid: false,
        error: 'Two neighboring fence edges cannot overlap.',
      };
    }
  }

  if (signedDoubleArea(vertices) === 0) {
    return { valid: false, error: 'The fence must enclose an area.' };
  }

  return { valid: true, vertices };
}

export function getValidatedPolygon(vertices: readonly Coordinate[]): Coordinate[] {
  const result = validatePolygon(vertices);
  if (!result.valid) throw new Error(result.error);
  return result.vertices;
}

export function closePolygonRing(vertices: readonly Coordinate[]): Coordinate[] {
  const polygon = getValidatedPolygon(vertices);
  return [...polygon, { ...polygon[0] }];
}

const pointInValidatedPolygon = (
  point: Coordinate,
  polygon: readonly Coordinate[],
): boolean => {
  let inside = false;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];

    if (onSegment(current, next, point)) return true;

    const crossesLatitude =
      (current.latitude > point.latitude) !== (next.latitude > point.latitude);
    if (!crossesLatitude) continue;

    const crossingLongitude =
      current.longitude +
      ((point.latitude - current.latitude) * (next.longitude - current.longitude)) /
        (next.latitude - current.latitude);
    if (point.longitude < crossingLongitude) inside = !inside;
  }

  return inside;
};

export function isPointInPolygon(point: Coordinate, vertices: readonly Coordinate[]): boolean {
  if (!isValidCoordinate(point)) return false;
  return pointInValidatedPolygon(point, getValidatedPolygon(vertices));
}
