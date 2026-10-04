import Constants from 'expo-constants';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { parseSnapshotMessage, type Coordinate, type Snapshot } from '../../../shared/protocol.ts';
import { loadCache, storeCache } from './cache';
import { acceptsSnapshot, collectAlerts, normalizeSettings, type ConnectionSettings, type SnapshotEntry } from './policy.ts';
import { liveUrl, requestSnapshot, ServerConnectionError, updateFence } from './network.ts';

type SelectedServer = ConnectionSettings & { scope: string };
type Connection = 'unconfigured' | 'connecting' | 'live' | 'reconnecting' | 'background';
type TrackingContextValue = {
  entry: SnapshotEntry | null;
  settings: SelectedServer | null;
  connection: Connection;
  error: string | null;
  cacheError: string | null;
  alerts: string[];
  loading: boolean;
  now: number;
  localHttpHost: string | null;
  configure: (settings: ConnectionSettings) => Promise<void>;
  refresh: () => Promise<Snapshot>;
  saveFence: (vertices: Coordinate[], expectedVersion: number) => Promise<Snapshot>;
  dismissAlerts: () => void;
};

const TrackingContext = createContext<TrackingContextValue | null>(null);
const SETTINGS_KEY = 'glance.owner.connection';
const extra: unknown = Constants.expoConfig?.extra?.localHttpHost;
const localHttpHost = __DEV__ && typeof extra === 'string' && extra.length > 0 ? extra : null;

async function selectServer(settings: ConnectionSettings): Promise<SelectedServer> {
  const scope = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${settings.serverUrl}\n${settings.ownerToken}`);
  return { ...settings, scope };
}

export function TrackingProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<SelectedServer | null>(null);
  const [entry, setEntry] = useState<SnapshotEntry | null>(null);
  const [connection, setConnection] = useState<Connection>('unconfigured');
  const [error, setError] = useState<string | null>(null);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const currentEntry = useRef<SnapshotEntry | null>(null);
  const currentScope = useRef<string | null>(null);
  const seen = useRef(new Set<string>());
  const accept = useRef<(snapshot: Snapshot, baseline: boolean) => void>(() => {});
  const refreshCurrent = useRef<(() => Promise<Snapshot>) | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
        if (stored) {
          const value: unknown = JSON.parse(stored);
          const selected = await selectServer(normalizeSettings(value, localHttpHost, Platform.OS));
          if (!cancelled) setSettings(selected);
        }
      } catch {
        if (!cancelled) setError('Connection settings could not be loaded. Enter them in Setup.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const configure = useCallback(async (candidate: ConnectionSettings): Promise<void> => {
    const normalized = normalizeSettings(candidate, localHttpHost, Platform.OS);
    const selected = await selectServer(normalized);
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(normalized));
    currentScope.current = selected.scope;
    currentEntry.current = null;
    setEntry(null);
    setAlerts([]);
    setError(null);
    setCacheError(null);
    setLoading(true);
    setSettings(selected);
  }, []);

  useEffect(() => {
    if (!settings) return;
    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let handshakeTimer: ReturnType<typeof setTimeout> | undefined;
    let reconcileTimer: ReturnType<typeof setInterval> | undefined;
    let attempt = 0;
    let active = AppState.currentState === 'active';
    let initialized = false;
    let reconcilePending = false;
    let httpBaseline = true;
    let writeQueue = Promise.resolve();
    const requests = new Set<AbortController>();
    const isCurrent = (): boolean => !disposed && currentScope.current === settings.scope;
    currentScope.current = settings.scope;
    currentEntry.current = null;
    seen.current = new Set();

    const publish = (snapshot: Snapshot, baseline: boolean): void => {
      if (!isCurrent() || !acceptsSnapshot(currentEntry.current?.snapshot ?? null, snapshot)) return;
      const next = { snapshot, savedAt: Date.now() };
      currentEntry.current = next;
      setEntry(next);
      setNow(next.savedAt);
      const messages = collectAlerts(snapshot, seen.current, baseline);
      if (messages.length > 0 && active) setAlerts(previous => [...previous, ...messages]);
      writeQueue = writeQueue.then(() => storeCache(settings.scope, snapshot, next.savedAt)).then(() => {
        if (isCurrent()) setCacheError(null);
      }).catch(() => {
        if (isCurrent()) setCacheError('Live data is available, but could not be cached. Restart may show older data.');
      });
    };
    accept.current = publish;

    const refresh = async (): Promise<Snapshot> => {
      if (!isCurrent() || !active) throw new Error('Return to the foreground to refresh.');
      const controller = new AbortController();
      requests.add(controller);
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const snapshot = await requestSnapshot(settings, controller.signal);
        if (!isCurrent() || !active) throw new Error('Connection changed; refresh discarded.');
        publish(snapshot, httpBaseline);
        httpBaseline = false;
        setError(null);
        return snapshot;
      } finally {
        clearTimeout(timeout);
        requests.delete(controller);
      }
    };
    refreshCurrent.current = refresh;

    const stop = (): void => {
      clearTimeout(reconnectTimer);
      clearTimeout(handshakeTimer);
      clearInterval(reconcileTimer);
      for (const controller of requests) controller.abort();
      const previousSocket = socket;
      socket = null;
      if (previousSocket) {
        previousSocket.onclose = null;
        previousSocket.onerror = null;
        previousSocket.onmessage = null;
        previousSocket.close();
      }
    };

    const connect = (): void => {
      if (!isCurrent() || !active) return;
      setConnection(attempt === 0 ? 'connecting' : 'reconnecting');
      httpBaseline = true;
      void refresh().catch(error => { if (isCurrent() && active) setError(error instanceof ServerConnectionError ? error.message : 'Snapshot unavailable. Cached data is retained; retrying.'); });
      let socketBaseline = true;
      const currentSocket = new WebSocket(liveUrl(settings));
      socket = currentSocket;
      handshakeTimer = setTimeout(() => currentSocket.close(), 10000);
      currentSocket.onopen = () => {
        if (isCurrent() && active && socket === currentSocket) {
          currentSocket.send(JSON.stringify({ type: 'authenticate', token: settings.ownerToken }));
        } else currentSocket.close();
      };
      currentSocket.onmessage = event => {
        if (!isCurrent() || !active || socket !== currentSocket) return;
        try {
          if (typeof event.data !== 'string') throw new Error('Invalid frame.');
          const payload: unknown = JSON.parse(event.data);
          const message = parseSnapshotMessage(payload);
          publish(message.snapshot, socketBaseline);
          socketBaseline = false;
          httpBaseline = false;
          attempt = 0;
          clearTimeout(handshakeTimer);
          setConnection('live');
          setError(null);
        } catch {
          setError('Invalid server update rejected. Last confirmed data retained.');
          currentSocket.close();
        }
      };
      currentSocket.onerror = () => currentSocket.close();
      currentSocket.onclose = event => {
        if (!isCurrent() || !active || socket !== currentSocket) return;
        socket = null;
        clearTimeout(handshakeTimer);
        setConnection('reconnecting');
        setError(previous => previous ?? (event.code === 1008 ? 'Live authorization failed. In Setup use OWNER_TOKEN, not DEVICE_TOKEN.' : 'Live connection lost. Check phone LAN access and backend port 3000; reconnecting. Current safety is unknown.'));
        attempt += 1;
        reconnectTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempt - 1, 5)));
      };
      clearInterval(reconcileTimer);
      reconcileTimer = setInterval(() => {
        if (reconcilePending) return;
        reconcilePending = true;
        void refresh().catch(error => {
          if (isCurrent() && active) {
            setError(error instanceof ServerConnectionError ? error.message : 'Server reconciliation failed. Current safety is unknown.');
            socket?.close();
          }
        }).finally(() => { reconcilePending = false; });
      }, 10000);
    };

    const subscription = AppState.addEventListener('change', state => {
      active = state === 'active';
      stop();
      setAlerts([]);
      if (active && initialized) connect();
      else setConnection('background');
    });

    void (async () => {
      try {
        const cached = await loadCache(settings.scope);
        if (isCurrent() && cached && acceptsSnapshot(currentEntry.current?.snapshot ?? null, cached.snapshot)) {
          currentEntry.current = cached;
          setEntry(cached);
          collectAlerts(cached.snapshot, seen.current, true);
        }
      } catch {
        if (isCurrent()) setCacheError('Saved cache unavailable or invalid. It will not be used.');
      } finally {
        if (isCurrent()) {
          initialized = true;
          setLoading(false);
          if (active) connect();
          else setConnection('background');
        }
      }
    })();

    return () => {
      disposed = true;
      stop();
      subscription.remove();
      refreshCurrent.current = null;
    };
  }, [settings]);

  const refresh = useCallback(async (): Promise<Snapshot> => {
    if (!refreshCurrent.current) throw new Error('Configure a connection in Setup first.');
    return refreshCurrent.current();
  }, []);

  const saveFence = useCallback(async (vertices: Coordinate[], expectedVersion: number): Promise<Snapshot> => {
    if (!settings || AppState.currentState !== 'active') throw new Error('Configure the server and return to the foreground before saving.');
    const scope = settings.scope;
    const controller = new AbortController();
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') controller.abort(); });
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const snapshot = await updateFence(settings, vertices, expectedVersion, controller.signal);
      if (currentScope.current !== scope) throw new Error('Connection changed. Save result belongs to the previous server; reload before retrying.');
      accept.current(snapshot, false);
      return snapshot;
    } finally {
      clearTimeout(timeout);
      subscription.remove();
    }
  }, [settings]);

  return <TrackingContext.Provider value={{ entry, settings, connection, error, cacheError, alerts, loading, now, localHttpHost, configure, refresh, saveFence, dismissAlerts: () => setAlerts([]) }}>
    {children}
  </TrackingContext.Provider>;
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);
  if (!context) throw new Error('TrackingProvider missing.');
  return context;
}
