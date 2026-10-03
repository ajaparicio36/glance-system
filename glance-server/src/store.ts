import { readFile } from 'node:fs/promises';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { isPointInPolygon } from '../../shared/geofence.ts';
import { evaluateLifecycle, shouldAcceptObservation } from '../../shared/lifecycle.ts';
import { SNAPSHOT_INCIDENT_LIMIT } from '../../shared/protocol.ts';
import type { GeofenceUpdate, LocationAcceptance, PositionObservation, Snapshot } from '../../shared/protocol.ts';
import { incidents, state } from './schema.ts';

export class VersionConflict extends Error {}

export type Store = {
  snapshot: () => Promise<Snapshot>;
  accept: (observation: PositionObservation) => Promise<LocationAcceptance>;
  replaceFence: (update: GeofenceUpdate) => Promise<void>;
  healthy: () => Promise<boolean>;
  close: () => Promise<void>;
};

export async function createStore(databaseUrl: string, deviceId: string): Promise<Store> {
  const client = postgres(databaseUrl, { max: 5, connect_timeout: 5, idle_timeout: 20, connection: { statement_timeout: 10000 }, onnotice: () => {} });
  const database = drizzle(client);
  try {
    const migration = await readFile(new URL('../migrations/0001.sql', import.meta.url), 'utf8');
    await client.begin(async transaction => {
      await transaction`SELECT pg_advisory_xact_lock(71920261005)`;
      await transaction.unsafe(migration);
    });
    await database.insert(state).values({ id: 1, deviceId }).onConflictDoNothing();
    const [existing] = await database.select().from(state).where(eq(state.id, 1));
    if (existing.deviceId !== deviceId) throw new Error('Stored identity differs from DEVICE_ID');
  } catch (error) {
    await client.end({ timeout: 2 });
    throw error;
  }

  async function snapshot(): Promise<Snapshot> {
    return database.transaction(async transaction => {
      const [current] = await transaction.select().from(state).where(eq(state.id, 1)).for('share');
      const active = await transaction.select().from(incidents).where(isNull(incidents.resolution));
      const recent = await transaction.select().from(incidents).orderBy(desc(incidents.id)).limit(SNAPSHOT_INCIDENT_LIMIT);
      const episodes = [...active, ...recent.filter(episode => !active.some(open => open.id === episode.id))]
        .slice(0, SNAPSHOT_INCIDENT_LIMIT).sort((left, right) => right.id - left.id);
      return {
        revision: current.revision,
        serverTime: new Date().toISOString(),
        geofence: current.geofence,
        devices: [{ deviceId, location: current.location, boundaryStatus: current.boundaryStatus, activeViolationId: active[0]?.id ?? null }],
        incidents: episodes,
      };
    });
  }

  async function accept(observation: PositionObservation): Promise<LocationAcceptance> {
    return database.transaction(async transaction => {
      const [current] = await transaction.select().from(state).where(eq(state.id, 1)).for('update');
      const receivedAt = new Date().toISOString();
      if (!shouldAcceptObservation(observation, current.location, receivedAt)) return { accepted: false, revision: current.revision };
      const position = { latitude: observation.latitude, longitude: observation.longitude, observedAt: observation.observedAt };
      const [active] = await transaction.select().from(incidents).where(and(eq(incidents.deviceId, deviceId), isNull(incidents.resolution)));
      const decision = current.geofence === null ? null : evaluateLifecycle(isPointInPolygon(position, current.geofence.vertices), active !== undefined);
      if (decision?.createViolation) await transaction.insert(incidents).values({ deviceId, outside: position });
      if (decision?.resolveActiveViolation) {
        await transaction.update(incidents).set({ resolution: 'returned', resolvedAt: receivedAt, returnPosition: position }).where(eq(incidents.id, active.id));
      }
      const [updated] = await transaction.update(state).set({
        location: { ...position, receivedAt },
        boundaryStatus: decision?.status ?? 'unknown',
        revision: sql`${state.revision} + 1`,
      }).where(eq(state.id, 1)).returning({ revision: state.revision });
      return { accepted: true, revision: updated.revision };
    });
  }

  async function replaceFence(update: GeofenceUpdate): Promise<void> {
    await database.transaction(async transaction => {
      const [current] = await transaction.select().from(state).where(eq(state.id, 1)).for('update');
      if ((current.geofence?.version ?? 0) !== update.expectedVersion) throw new VersionConflict('Fence version conflict');
      const updatedAt = new Date().toISOString();
      await transaction.update(incidents).set({ resolution: 'fence_changed', resolvedAt: updatedAt, returnPosition: null })
        .where(and(eq(incidents.deviceId, deviceId), isNull(incidents.resolution)));
      await transaction.update(state).set({
        geofence: { vertices: update.vertices, version: update.expectedVersion + 1, updatedAt },
        boundaryStatus: 'unknown',
        revision: sql`${state.revision} + 1`,
      }).where(eq(state.id, 1));
    });
  }

  async function healthy(): Promise<boolean> {
    try {
      await client`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  return { snapshot, accept, replaceFence, healthy, close: async (): Promise<void> => { await client.end({ timeout: 5 }); } };
}
