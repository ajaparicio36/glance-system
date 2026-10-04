import { parseTimestamp, type Incident } from '../../../shared/protocol.ts';

export const HISTORY_PAGE_SIZE = 5;

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
