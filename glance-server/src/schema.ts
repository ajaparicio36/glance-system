import { sql } from 'drizzle-orm';
import { bigint, bigserial, check, integer, jsonb, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import type { BoundaryStatus, Geofence, Incident, Location } from '../../shared/protocol.ts';

export const state = pgTable('prototype_state', {
  id: integer('id').primaryKey(),
  deviceId: text('device_id').notNull().unique(),
  revision: bigint('revision', { mode: 'number' }).notNull().default(0),
  geofence: jsonb('geofence').$type<Geofence>(),
  location: jsonb('location').$type<Location>(),
  boundaryStatus: text('boundary_status').$type<BoundaryStatus>().notNull().default('unknown'),
}, table => [check('singleton', sql`${table.id} = 1`)]);

export const incidents = pgTable('incidents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  deviceId: text('device_id').notNull().references(() => state.deviceId),
  outside: jsonb('outside').$type<Incident['outside']>().notNull(),
  resolution: text('resolution').$type<Incident['resolution']>(),
  resolvedAt: text('resolved_at'),
  returnPosition: jsonb('return_position').$type<Incident['returnPosition']>(),
}, table => [uniqueIndex('one_active_incident').on(table.deviceId).where(sql`${table.resolution} is null`)]);
