import { parseTimestamp, type Incident } from '../../../shared/protocol.ts';

export const HISTORY_PAGE_SIZE = 5;

export function deviceHistoryPage(incidents: readonly Incident[], deviceId: string, requestedPage: number): ReturnType<typeof historyPage> {
  return historyPage(incidents.filter(incident => incident.deviceId === deviceId), requestedPage);
}

export function connectionLabel(connection: string, error: string | null): string {
  if (error) return 'Connection unavailable';
  if (connection === 'live') return 'Connected';
  if (connection === 'background') return 'Paused in background';
  if (connection === 'connecting') return 'Connecting';
  if (connection === 'reconnecting') return 'Reconnecting';
  return 'Not connected';
}

export function episodeLabel(resolution: Incident['resolution']): string {
  if (resolution === 'returned') return 'Back inside fence';
  if (resolution === 'fence_changed') return 'Boundary updated';
  return 'Outside boundary · open';
}

export function historyPage(incidents: readonly Incident[], requestedPage: number): { incidents: Incident[]; page: number; pageCount: number; total: number } {
  const pageCount = Math.max(1, Math.ceil(incidents.length / HISTORY_PAGE_SIZE));
  const page = Math.max(0, Math.min(pageCount - 1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 0));
  return { incidents: [...incidents].sort((left, right) => right.id - left.id).slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE), page, pageCount, total: incidents.length };
}

export function clientTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'device local time';
}

export function formatLocalTimestamp(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(new Date(parseTimestamp(value)));
  } catch {
    return 'Time unavailable';
  }
}
