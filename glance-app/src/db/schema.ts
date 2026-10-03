import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const snapshotCache = sqliteTable('snapshot_cache', {
  scope: text('scope').primaryKey(),
  revision: integer('revision').notNull(),
  serverTime: text('server_time').notNull(),
  savedAt: integer('saved_at').notNull(),
  payload: text('payload').notNull(),
});

export const cacheMigration = `PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS snapshot_cache (
  scope TEXT PRIMARY KEY NOT NULL,
  revision INTEGER NOT NULL,
  server_time TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  payload TEXT NOT NULL
);`;
