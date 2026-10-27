import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { parseSnapshot, type Coordinate, type Snapshot } from '../../../shared/protocol';
import { FenceConflict, ServerConnectionError } from '../../../glance-app/src/tracking/network';
import fixtureState from './fixture-state.json';

type TrackingValue = ReturnType<typeof import('../../../glance-app/src/tracking/provider').useTracking>;
const Context = createContext<TrackingValue | null>(null);
const settings = { serverUrl: 'https://synthetic-qa.invalid', ownerToken: 'SYNTHETIC-NOT-A-CREDENTIAL', scope: 'synthetic-qa-only' };
const fence = [{ latitude: 10.705, longitude: 122.5435 }, { latitude: 10.705, longitude: 122.5445 }, { latitude: 10.706, longitude: 122.5445 }, { latitude: 10.706, longitude: 122.5435 }];

function initialSnapshot(): Snapshot {
  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  return parseSnapshot({
    revision: 1,
    serverTime: timestamp,
    geofence: { version: 10, vertices: fence, updatedAt: timestamp },
    devices: ['prototype-001', 'slave-02'].map((deviceId, deviceIndex) => ({
      deviceId,
      location: { latitude: 10.7048 + deviceIndex * 0.0001, longitude: 122.5438, observedAt: timestamp, receivedAt: timestamp },
      boundaryStatus: 'outside',
      activeViolationId: deviceIndex * 100 + 7,
    })),
    incidents: ['prototype-001', 'slave-02'].flatMap((deviceId, deviceIndex) => Array.from({ length: 7 }, (_, index) => {
      const resolution = index === 6 ? null : index % 2 === 0 ? 'fence_changed' : 'returned';
      const observedAt = new Date(now - (8 - index) * 60_000).toISOString();
      const resolvedAt = resolution ? new Date(now - (7 - index) * 60_000).toISOString() : null;
      return { id: deviceIndex * 100 + index + 1, deviceId, outside: { latitude: 10.7048, longitude: 122.5438, observedAt }, resolution, resolvedAt, returnPosition: resolution === 'returned' ? { latitude: 10.7055, longitude: 122.544, observedAt: resolvedAt } : null };
    })),
  });
}

export function TrackingProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [savedAt, setSavedAt] = useState(() => Date.now());
  const remote = useRef(snapshot);
  const saves = useRef(0);
  const [alerts, setAlerts] = useState<string[]>([]);
  const mode = fixtureState.mode;
  useEffect(() => {
    const next = initialSnapshot();
    remote.current = next;
    setSnapshot(next);
    setSavedAt(Date.now());
    saves.current = 0;
  }, [mode]);

  async function refresh(): Promise<Snapshot> {
    if (mode === 'error') throw new ServerConnectionError('Synthetic refresh failure. No server request was made.');
    setSnapshot(remote.current);
    setSavedAt(Date.now());
    return remote.current;
  }

  async function saveFence(vertices: Coordinate[], expectedVersion: number): Promise<Snapshot> {
    saves.current += 1;
    await new Promise<void>(resolve => setTimeout(resolve, 1500));
    if (mode === 'failure' && saves.current === 1) throw new ServerConnectionError('Synthetic save failure. No server request was made.');
    if (mode === 'conflict' && saves.current === 1) {
      remote.current = parseSnapshot({ ...remote.current, revision: remote.current.revision + 1, geofence: { ...remote.current.geofence, version: 11 } });
      throw new FenceConflict();
    }
    if (expectedVersion !== remote.current.geofence?.version) throw new FenceConflict();
    const timestamp = new Date().toISOString();
    const next = parseSnapshot({ ...remote.current, revision: remote.current.revision + 1, serverTime: timestamp, geofence: { version: expectedVersion + 1, vertices, updatedAt: timestamp }, devices: remote.current.devices.map(device => ({ ...device, boundaryStatus: 'unknown', activeViolationId: null })), incidents: remote.current.incidents.map(incident => incident.resolution === null ? { ...incident, resolution: 'fence_changed', resolvedAt: timestamp } : incident) });
    remote.current = next;
    setSnapshot(next);
    setSavedAt(Date.now());
    return next;
  }

  const value: TrackingValue = {
    entry: { snapshot, savedAt }, settings,
    connection: mode === 'reconnecting' ? 'reconnecting' : 'live',
    error: mode === 'error' ? 'Synthetic invalid response. Last confirmed data is retained.' : null,
    cacheError: null, alerts, loading: false,
    now: savedAt + (mode === 'stale' ? 16_000 : 0), localHttpHost: null,
    configure: async () => { throw new Error('Synthetic QA does not store connection settings.'); },
    refresh, saveFence, dismissAlerts: () => setAlerts([]),
  };

  return <Context.Provider value={value}><View style={{ flex: 1 }}>
    {children}
    <View pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, bottom: 40, padding: 4, backgroundColor: '#8b2020', zIndex: 10000 }}>
      <Text allowFontScaling={false} style={{ color: '#ffffff', fontSize: 12, textAlign: 'center' }}>SYNTHETIC QA · {mode} · no server writes</Text>
    </View>
  </View></Context.Provider>;
}

export function useTracking(): TrackingValue {
  const value = useContext(Context);
  if (!value) throw new Error('Synthetic QA provider is required.');
  return value;
}
