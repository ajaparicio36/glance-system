import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, InsetRow, Label, Surface, ui, usePalette } from '@/components/tracking-ui';
import { useTracking } from '@/tracking/provider';
import { clientTimeZone, deviceHistoryPage, episodeLabel, formatLocalTimestamp } from '@/tracking/presentation';
import type { Incident } from '../../../shared/protocol.ts';

function IncidentRow({ incident }: { incident: Incident }): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const colors = usePalette();
  const open = incident.resolution === null;
  return <Surface style={{ padding: 16, gap: 12, backgroundColor: colors.muted, borderColor: open ? '#72501c' : colors.border }}>
    <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={'Episode ' + incident.id + ', ' + episodeLabel(incident.resolution)} accessibilityState={{ expanded }}
      accessibilityHint="Show or hide episode details" onPress={() => setExpanded(previous => !previous)} style={({ pressed }) => ({ gap: 12, minHeight: 80, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Icon name={open ? 'warning' : incident.resolution === 'returned' ? 'check' : 'fence'} color={open ? colors['chart-1'] : colors.foreground} />
        <View style={{ flex: 1, gap: 4 }}>
          <Label weight="semibold">{episodeLabel(incident.resolution)}</Label>
          <Label muted>{formatLocalTimestamp(incident.resolvedAt ?? incident.outside.observedAt)}</Label>
          {incident.resolution === 'fence_changed' && <Label muted>Prior episode closed because the fence changed.</Label>}
        </View>
        <Label mono muted>#{incident.id}</Label>
      </View>
      <View style={ui.spread}><Label muted>{expanded ? 'Hide details' : 'Show details'}</Label><Icon name={expanded ? 'up' : 'down'} size={18} color={colors['muted-foreground']} /></View>
    </Pressable>
    {expanded && <View style={{ gap: 12 }}>
      <InsetRow icon="pin" label="Outside observation">
        <Label mono selectable>{formatLocalTimestamp(incident.outside.observedAt)}</Label>
        <Label mono selectable>{incident.outside.latitude.toFixed(6) + ', ' + incident.outside.longitude.toFixed(6)}</Label>
      </InsetRow>
      {incident.resolvedAt && <InsetRow icon="clock" label={incident.resolution === 'returned' ? 'Resolved · returned inside' : 'Resolved · fence changed, not a return'}>
        <Label mono selectable>{formatLocalTimestamp(incident.resolvedAt)}</Label>
      </InsetRow>}
      {incident.returnPosition && <InsetRow icon="check" label="Return GPS observation">
        <Label mono selectable>{formatLocalTimestamp(incident.returnPosition.observedAt)}</Label>
        <Label mono selectable>{incident.returnPosition.latitude.toFixed(6) + ', ' + incident.returnPosition.longitude.toFixed(6)}</Label>
      </InsetRow>}
      {open && <Label muted>No resolution recorded in this snapshot. Current tracker safety is shown on Map.</Label>}
    </View>}
  </Surface>;
}

export default function HistoryScreen(): React.JSX.Element {
  const { deviceId } = useLocalSearchParams<{ deviceId?: string | string[] }>();
  const { settings, entry } = useTracking();
  const selected = typeof deviceId === 'string' ? deviceId : entry?.snapshot.devices[0]?.deviceId ?? '';
  return <HistoryContent key={(settings?.scope ?? 'unconfigured') + ':' + selected} deviceId={selected} />;
}

function HistoryContent({ deviceId }: { deviceId: string }): React.JSX.Element {
  const { fontScale } = useWindowDimensions();
  const { entry, loading, error } = useTracking();
  const [requestedPage, setRequestedPage] = useState(0);
  const current = deviceHistoryPage(entry?.snapshot.incidents ?? [], deviceId, requestedPage);
  if (requestedPage !== current.page) setRequestedPage(current.page);
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  const closeButton = useRef<View>(null);
  useFocusEffect(useCallback(() => {
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(closeButton.current);
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => cancelAnimationFrame(frame);
  }, []));

  function close(): void {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return <View style={{ flex: 1, backgroundColor: colors.popover, paddingTop: 20 }} accessibilityViewIsModal>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <View style={ui.spread}>
        <Label title accessibilityRole="header">History</Label>
        <Button buttonRef={closeButton} label="Map" icon="down" onPress={close} />
      </View>
      <View style={{ gap: 4 }}>
        <Label mono selectable>{deviceId || 'No tracker selected'}</Label>
        <Label muted>{current.total} episodes in the current snapshot · page {current.page + 1} of {current.pageCount}</Label>
        <Label muted>Local times · {clientTimeZone()}</Label>
      </View>
      {loading && <Label muted>Loading confirmed history…</Label>}
      {error && <Label accessibilityLiveRegion="polite">{error} Showing last confirmed history.</Label>}
      {current.total === 0 ? <Surface style={{ padding: 24, gap: 12 }}>
        <Icon name="history" size={28} />
        <Label weight="semibold" style={ui.sectionTitle}>No recorded episodes</Label>
        <Label muted>Outside observations and their resolutions will appear here for this tracker.</Label>
      </Surface> : current.incidents.map(incident => <IncidentRow key={current.page + ':' + incident.id} incident={incident} />)}
      {current.total > 0 && <View style={{ gap: 12 }}>
        <View style={ui.actions}>
          <Button label="Previous" icon="back" disabled={current.page === 0} style={{ flex: 1, minWidth: fontScale > 1.4 ? '100%' : 120 }} onPress={() => setRequestedPage(current.page - 1)} />
          <Button label="Next" icon="forward" disabled={current.page + 1 === current.pageCount} style={{ flex: 1, minWidth: fontScale > 1.4 ? '100%' : 120 }} onPress={() => setRequestedPage(current.page + 1)} />
        </View>
        <Label muted style={{ textAlign: 'center' }}>Page {current.page + 1} of {current.pageCount} · {current.incidents.length} of {current.total} episodes</Label>
      </View>}
      <Label muted style={{ textAlign: 'center' }}>Server-recorded episodes, not a continuous GPS trail. Reconnection does not replay foreground alerts.</Label>
    </ScrollView>
  </View>;
}
