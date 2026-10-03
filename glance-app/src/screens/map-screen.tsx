import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveMap from '@/components/live-map';
import { Button, Card, Label, usePalette } from '@/components/tracking-ui';
import { useTracking } from '@/tracking/provider';
import { locationAge, safetyLabel } from '@/tracking/policy';

export default function MapScreen(): React.JSX.Element {
  const { entry, settings, connection, error, cacheError, alerts, loading, now, refresh, dismissAlerts } = useTracking();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const colors = usePalette();
  const snapshot = entry?.snapshot;
  const devices = snapshot?.devices ?? [];
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId) ?? devices[0];
  const age = selectedDevice && entry ? locationAge(selectedDevice, entry, now) : null;
  const connected = connection === 'live' && error === null;

  async function reload(): Promise<void> {
    setBusy(true);
    try { await refresh(); setRefreshError(null); }
    catch { setRefreshError('Refresh failed. Last confirmed data is retained.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View className="gap-2 px-4 pt-4">
        <Label title>Glance</Label>
        <Label muted>{connection === 'live' ? 'Live connection · foreground only' : connection === 'unconfigured' ? 'Not connected' : connection === 'background' ? 'Paused in background' : 'Connecting · last confirmed data only'}</Label>
        {loading && <Label muted>Loading confirmed cache…</Label>}
        {(error || refreshError) && <Label accessibilityLiveRegion="polite">{error ?? refreshError}</Label>}
        {cacheError && <Label>{cacheError}</Label>}
        {!settings && <Link href="/explore" accessibilityLabel="Open Setup to connect server" style={{ color: colors.foreground, fontSize: 16, paddingVertical: 12, textDecorationLine: 'underline' }}>Connect in Setup →</Link>}
      </View>
      {alerts.length > 0 && <View className="px-4"><Card>
        <View accessibilityLiveRegion="assertive" accessibilityRole="alert">{alerts.map((message, index) => <Label key={`${message}-${index}`}>{message}</Label>)}</View>
        <Button label="Dismiss alerts" onPress={dismissAlerts} />
      </Card></View>}
      <LiveMap key={settings?.scope ?? 'unconfigured'} polygon={snapshot?.geofence?.vertices ?? []} devices={devices} selectedDeviceId={selectedDevice?.deviceId} onDevicePress={setSelectedDeviceId} />
      <View className="gap-4 px-4">
        <Label muted>© OpenStreetMap contributors · OpenFreeMap</Label>
        {devices.length > 1 && <View className="gap-2">{devices.map(device => <Button key={device.deviceId} label={`Select ${device.deviceId}`} onPress={() => setSelectedDeviceId(device.deviceId)} />)}</View>}
        <Card>
          <Label style={{ fontSize: 20, lineHeight: 26 }}>{selectedDevice?.deviceId ?? 'Tracker'}</Label>
          <Label>{selectedDevice && entry ? safetyLabel(selectedDevice, entry, now, connected) : 'Unknown · waiting for server GPS'}</Label>
          {selectedDevice?.location ? <>
            <Label mono selectable>{selectedDevice.location.latitude.toFixed(6)}, {selectedDevice.location.longitude.toFixed(6)}</Label>
            <Label muted>Freshness age {age === null ? 'unknown' : `${Math.floor(age / 1000)}s`} · oldest of GPS/receipt · stale at 15s</Label>
            <Label mono selectable>GPS: {selectedDevice.location.observedAt}</Label>
            <Label mono selectable>Received: {selectedDevice.location.receivedAt}</Label>
          </> : <Label muted>No valid position received. Phone GPS permission is not needed.</Label>}
          <Label muted>{snapshot?.geofence ? `Saved fence v${snapshot.geofence.version}` : 'No confirmed geofence'}</Label>
          <Button label={busy ? 'Refreshing…' : 'Refresh server'} disabled={busy || !settings || loading} onPress={() => void reload()} />
        </Card>
        <Label style={{ fontSize: 20, lineHeight: 26 }}>Violation history</Label>
        <Label muted>Server-recorded episodes, not a GPS trail. Reconnection shows history without replaying alerts.</Label>
        {!snapshot?.incidents.length && <Label>No recorded episodes in the current snapshot.</Label>}
        {[...(snapshot?.incidents ?? [])].sort((left, right) => right.id - left.id).map(incident => <Card key={incident.id}>
          <Label>{incident.deviceId} · #{incident.id}</Label>
          <Label>{incident.resolution === null ? 'Violation open' : incident.resolution === 'returned' ? 'Returned inside' : 'Closed · fence changed (not a return)'}</Label>
          <Label mono selectable>Outside: {incident.outside.observedAt}</Label>
          <Label mono selectable>{incident.outside.latitude.toFixed(6)}, {incident.outside.longitude.toFixed(6)}</Label>
          {incident.resolvedAt && <Label mono selectable>Resolved: {incident.resolvedAt}</Label>}
          {incident.returnPosition && <>
            <Label mono selectable>Return GPS: {incident.returnPosition.observedAt}</Label>
            <Label mono selectable>{incident.returnPosition.latitude.toFixed(6)}, {incident.returnPosition.longitude.toFixed(6)}</Label>
          </>}
        </Card>)}
      </View>
    </ScrollView>
  </SafeAreaView>;
}
