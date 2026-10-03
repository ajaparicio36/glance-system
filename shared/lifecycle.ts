import { MAX_FUTURE_SKEW_MS, MAX_OBSERVATION_AGE_MS, STALE_AFTER_MS, parseTimestamp } from './protocol.ts';
import type { BoundaryStatus, Location, PositionObservation } from './protocol.ts';

export type PositionEvent = 'inside' | 'breached' | 'outside_unchanged' | 'returned';
export type LifecycleDecision = {
  event: PositionEvent;
  status: Exclude<BoundaryStatus, 'unknown'>;
  resolveActiveViolation: boolean;
  createViolation: boolean;
};

export function evaluateLifecycle(isInside: boolean, hasActiveViolation: boolean): LifecycleDecision {
  return {
    event: isInside ? (hasActiveViolation ? 'returned' : 'inside') : (hasActiveViolation ? 'outside_unchanged' : 'breached'),
    status: isInside ? 'inside' : 'outside',
    resolveActiveViolation: isInside && hasActiveViolation,
    createViolation: !isInside && !hasActiveViolation,
  };
}

export function shouldAcceptObservation(observation: PositionObservation, latest: Location | null, receivedAt: string): boolean {
  const observedMilliseconds = Date.parse(observation.observedAt);
  const receivedMilliseconds = Date.parse(receivedAt);
  const previousMilliseconds = latest === null ? -Infinity : Date.parse(latest.observedAt);
  return Number.isFinite(observedMilliseconds) && Number.isFinite(receivedMilliseconds) &&
    observedMilliseconds > previousMilliseconds &&
    receivedMilliseconds - observedMilliseconds < MAX_OBSERVATION_AGE_MS &&
    observedMilliseconds - receivedMilliseconds <= MAX_FUTURE_SKEW_MS;
}

export function isLocationStale(location: Location | null, serverTime: string): boolean {
  if (location === null) return true;
  try {
    const serverMilliseconds = Date.parse(parseTimestamp(serverTime));
    const observationAge = serverMilliseconds - Date.parse(parseTimestamp(location.observedAt));
    const receiptAge = serverMilliseconds - Date.parse(parseTimestamp(location.receivedAt));
    return observationAge >= STALE_AFTER_MS || receiptAge >= STALE_AFTER_MS;
  } catch {
    return true;
  }
}
