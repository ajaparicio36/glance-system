CREATE TABLE IF NOT EXISTS tracker_state (
  device_id text PRIMARY KEY CHECK (device_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'),
  location jsonb,
  boundary_status text NOT NULL DEFAULT 'unknown' CHECK (boundary_status IN ('unknown', 'inside', 'outside'))
);
INSERT INTO tracker_state (device_id, location, boundary_status)
SELECT device_id, location, boundary_status FROM prototype_state
ON CONFLICT (device_id) DO NOTHING;
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_device_id_fkey;
ALTER TABLE incidents ADD CONSTRAINT incidents_device_id_fkey
  FOREIGN KEY (device_id) REFERENCES tracker_state(device_id);
