import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { parseSnapshot, type Snapshot } from '../../../shared/protocol.ts';
import { cacheMigration, snapshotCache } from '../db/schema.ts';
import { cacheWrite } from '../db/cache-query.ts';
import { parseCache, type SnapshotEntry } from './policy.ts';

let database: ReturnType<typeof drizzle> | null = null;

function getDatabase(): ReturnType<typeof drizzle> {
  if (!database) {
    const sqlite = openDatabaseSync('glance-confirmed.db');
    sqlite.execSync(cacheMigration);
    database = drizzle(sqlite);
  }
  return database;
}

export async function loadCache(scope: string): Promise<SnapshotEntry | null> {
  const rows = await getDatabase().select().from(snapshotCache).where(eq(snapshotCache.scope, scope)).limit(1);
  return rows[0] ? parseCache(rows[0].payload, rows[0].savedAt) : null;
}

export async function storeCache(scope: string, candidate: Snapshot, savedAt: number): Promise<void> {
  const snapshot = parseSnapshot(candidate);
  const row = { scope, revision: snapshot.revision, serverTime: snapshot.serverTime, savedAt, payload: JSON.stringify(snapshot) };
  await cacheWrite(getDatabase(), row);
}
