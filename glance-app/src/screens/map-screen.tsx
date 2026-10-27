import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LiveMap from '@/components/live-map';
import { Button, Icon, InsetRow, Label, StatusPill, Surface, ui, usePalette } from '@/components/tracking-ui';
import { useTracking } from '@/tracking/provider';
import { locationAge, safetyLabel } from '@/tracking/policy';
import { clientTimeZone, connectionLabel, deviceHistoryPage, formatLocalTimestamp } from '@/tracking/presentation';

export default function MapScreen(): React.JSX.Element {
  const { settings } = useTracking();
  return <MapContent key={settings?.scope ?? 'unconfigured'} />;
}

function MapContent(): React.JSX.Element {
  const { entry, settings, connection, error, cacheError, alerts, loading, now, refresh, dismissAlerts } = useTracking();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refreshing = useRef(false);
  const [headerHeight, setHeaderHeight] = useState(100);
  const [inspectorHeight, setInspectorHeight] = useState(280);
  const [showTimes, setShowTimes] = useState(false);
  const historyButton = useRef<View>(null);
  const restoreHistoryFocus = useRef(false);
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.4;
  const bottom = insets.bottom + 88 + Math.max(0, fontScale - 1) * 24;
  const snapshot = entry?.snapshot;
  const devices = snapshot?.devices ?? [];
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId) ?? devices[0];
  const age = selectedDevice && entry ? locationAge(selectedDevice, entry, now) : null;
  const connected = connection === 'live' && error === null;
  const safety = selectedDevice && entry ? safetyLabel(selectedDevice, entry, now, connected) : 'Unknown · waiting for GPS';
  const historyCount = selectedDevice ? deviceHistoryPage(snapshot?.incidents ?? [], selectedDevice.deviceId, 0).total : 0;

  useFocusEffect(useCallback(() => {
    if (!restoreHistoryFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(historyButton.current);
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
      restoreHistoryFocus.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, []));

  async function reload(): Promise<void> {
    if (refreshing.current) return;
    refreshing.current = true;
    setBusy(true);
    try { await refresh(); setRefreshError(null); }
    catch { setRefreshError('Refresh failed. Last confirmed data is retained.'); }
    finally { refreshing.current = false; setBusy(false); }
  }

  function openHistory(): void {
    if (!selectedDevice) return;
    restoreHistoryFocus.current = true;
    router.push({ pathname: '/history', params: { deviceId: selectedDevice.deviceId } });
  }

  const map = <LiveMap polygon={snapshot?.geofence?.vertices ?? []} devices={devices} selectedDeviceId={selectedDevice?.deviceId} onDevicePress={setSelectedDeviceId}
    style={largeText ? { height: Math.max(360, height * 0.5) } : [StyleSheet.absoluteFill, { height: '100%' }]} controlsTop={largeText ? 16 : insets.top + headerHeight + 20} contentBottom={largeText ? 32 : bottom + inspectorHeight + 12}
    onRefresh={() => void reload()} refreshing={busy} refreshDisabled={!settings || loading} />;
  const header = <View pointerEvents="box-none" style={largeText ? { paddingHorizontal: 16 } : { position: 'absolute', top: insets.top + 12, left: insets.left + 16, right: insets.right + 16 }}>
      <ScrollView scrollEnabled={!largeText} style={{ maxHeight: largeText ? undefined : height * 0.3 }} contentContainerStyle={{ gap: 8 }} onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}>
        <View style={ui.spread}>
          <Surface glass style={{ borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="fence" color={colors['chart-2']} /><Label weight="semibold" style={ui.sectionTitle}>Glance</Label>
          </Surface>
          <StatusPill label={connectionLabel(connection, error)} caution={!connected && !!settings} />
        </View>
        <StatusPill label={(selectedDevice ? selectedDevice.deviceId + ' · ' : '') + safety + (age === null ? '' : ' · ' + Math.floor(age / 1000) + 's ago')} caution={safety.startsWith('Outside')} />
        {loading && <Surface style={{ padding: 12 }}><Label muted>Loading confirmed cache…</Label></Surface>}
        {(error || refreshError || cacheError) && <Surface style={{ padding: 12, gap: 8 }} accessibilityLiveRegion="polite">
          {error && <Label>{error}</Label>}
          {refreshError && <Label>{refreshError}</Label>}
          {cacheError && <Label muted>{cacheError}</Label>}
        </Surface>}
        {alerts.length > 0 && <Surface style={{ padding: 12, gap: 8 }}>
          <View style={ui.row}><Icon name="bell" color={colors['chart-1']} /><Label weight="medium">Foreground alerts</Label></View>
          <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={{ gap: 4 }}>
            {alerts.map((message, index) => <Label key={message + index}>{message}</Label>)}
          </View>
          <Button label="Dismiss alerts" onPress={dismissAlerts} />
        </Surface>}
      </ScrollView>
    </View>;
  const inspector = <Surface style={largeText ? { marginHorizontal: 16 } : { position: 'absolute', bottom, left: insets.left + 16, right: insets.right + 16, maxHeight: height * 0.43 }}
      onLayout={event => setInspectorHeight(event.nativeEvent.layout.height)}>
      <ScrollView scrollEnabled={!largeText} style={{ flexShrink: largeText ? 0 : 1 }} contentContainerStyle={{ gap: 12, padding: 16 }} keyboardShouldPersistTaps="handled">
        {devices.length > 1 && <View style={ui.actions}>{devices.map(device => <Button key={device.deviceId}
          label={device.deviceId} selected={device.deviceId === selectedDevice?.deviceId} primary={device.deviceId === selectedDevice?.deviceId}
          style={{ flexGrow: 1 }} onPress={() => { setSelectedDeviceId(device.deviceId); setShowTimes(false); }} />)}</View>}
        <View style={ui.spread}>
          <Label weight="semibold" style={ui.sectionTitle}>{selectedDevice?.deviceId ?? 'Your tracker'}</Label>
          <Label mono muted>{snapshot?.geofence ? 'Fence v' + snapshot.geofence.version : 'No saved fence'}</Label>
        </View>
        <View style={ui.row}>
          <Icon name={safety.startsWith('Inside') ? 'check' : safety.startsWith('Outside') ? 'warning' : 'info'} color={safety.startsWith('Outside') ? colors['chart-1'] : colors['muted-foreground']} />
          <Label style={{ flex: 1 }}>{safety}</Label>
        </View>
        {selectedDevice?.location ? <>
          <InsetRow icon="pin" label={connected && age !== null && age < 15000 ? 'Last GPS coordinates' : 'Last-known coordinates'}>
            <Label mono selectable>{selectedDevice.location.latitude.toFixed(6) + ', ' + selectedDevice.location.longitude.toFixed(6)}</Label>
          </InsetRow>
          <InsetRow icon="clock" label="Last seen · GPS observation">
            <Label mono selectable>{formatLocalTimestamp(selectedDevice.location.observedAt)}</Label>
          </InsetRow>
          <Button label={showTimes ? 'Hide timing details' : 'Timing details'} icon={showTimes ? 'up' : 'down'} expanded={showTimes} onPress={() => setShowTimes(previous => !previous)} />
          {showTimes && <View style={{ gap: 8 }}>
            <Label muted>Local times · {clientTimeZone()}</Label>
            <Label mono selectable>Received: {formatLocalTimestamp(selectedDevice.location.receivedAt)}</Label>
            <Label muted>Freshness uses the older GPS or receipt time. Stale at 15 seconds; uploads every 5 seconds.</Label>
          </View>}
        </> : <Label muted>{settings ? 'Waiting for a valid GPS position. Your tracker will appear here when it reports.' : 'Connect your server in Setup to see your trackers and saved fence.'}</Label>}
      </ScrollView>
      <View style={{ padding: 16, paddingTop: 8 }}>
        {!settings ? <Button label="Connect in Setup" icon="setup" primary onPress={() => router.navigate('/explore')} /> : <View style={ui.actions}>
          <Button label={busy ? 'Refreshing…' : 'Refresh'} icon="refresh" busy={busy} disabled={loading} style={{ flex: 1, minWidth: largeText ? '100%' : 120 }} onPress={() => void reload()} />
          <Button buttonRef={historyButton} label={'History (' + historyCount + ')'} icon="history" disabled={!selectedDevice} style={{ flex: 1, minWidth: largeText ? '100%' : 120 }} onPress={openHistory} />
        </View>}
      </View>
    </Surface>;
  return largeText ? <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom + 24, gap: 16 }}>{header}{map}{inspector}</ScrollView>
    : <View style={{ flex: 1, backgroundColor: colors.background }}>{map}{header}{inspector}</View>;
}
