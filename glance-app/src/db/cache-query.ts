import { sql } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { snapshotCache } from './schema.ts';

export function cacheWrite(database: Pick<ExpoSQLiteDatabase, 'insert'>, row: typeof snapshotCache.$inferInsert): ReturnType<ReturnType<typeof database.insert<typeof snapshotCache>>['values']> {
  return database.insert(snapshotCache).values(row).onConflictDoUpdate({
    target: snapshotCache.scope,
    set: row,
    setWhere: sql`${snapshotCache.revision} < ${row.revision} OR (${snapshotCache.revision} = ${row.revision} AND ${snapshotCache.serverTime} < ${row.serverTime} AND ${snapshotCache.savedAt} <= ${row.savedAt})`,
  });
}
