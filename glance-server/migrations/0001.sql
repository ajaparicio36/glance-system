CREATE TABLE IF NOT EXISTS prototype_state (
  id integer PRIMARY KEY CHECK (id = 1),
  device_id text NOT NULL UNIQUE CHECK (device_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0 AND revision <= 9007199254740991),
  geofence jsonb,
  location jsonb,
  boundary_status text NOT NULL DEFAULT 'unknown' CHECK (boundary_status IN ('unknown', 'inside', 'outside'))
);
CREATE TABLE IF NOT EXISTS incidents (
  id bigserial PRIMARY KEY CHECK (id <= 9007199254740991),
  device_id text NOT NULL REFERENCES prototype_state(device_id),
  outside jsonb NOT NULL,
  resolution text CHECK (resolution IN ('returned', 'fence_changed')),
  resolved_at text,
  return_position jsonb,
  CONSTRAINT incident_resolution CHECK (
    (resolution IS NULL AND resolved_at IS NULL AND return_position IS NULL) OR
    (resolution IS NOT NULL AND resolution = 'returned' AND resolved_at IS NOT NULL AND return_position IS NOT NULL) OR
    (resolution IS NOT NULL AND resolution = 'fence_changed' AND resolved_at IS NOT NULL AND return_position IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_incident ON incidents (device_id) WHERE resolution IS NULL;
