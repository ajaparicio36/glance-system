import { router, useFocusEffect, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, Platform, View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidCoordinate } from '../../../shared/geofence.ts';
import type { Coordinate } from '../../../shared/protocol.ts';
import LiveMap from '@/components/live-map';
import { Button, Field, Icon, IconButton, Label, StatusPill, Surface, ui, usePalette } from '@/components/tracking-ui';
import { createFenceDraft, fenceDraftReducer, inputCoordinate, toVertexInput, validateFenceDraft, type VertexInput } from '@/tracking/fence-draft';
import { FenceConflict, ServerConnectionError } from '@/tracking/network';
import { useTracking } from '@/tracking/provider';

export default function FenceScreen(): React.JSX.Element {
  const { loading } = useTracking();
  const [ready, setReady] = useState(!loading);
  if (!ready && !loading) setReady(true);
  if (!ready) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000000', padding: 24 }}><Label>Loading confirmed fence…</Label><Button label="Back to Setup" onPress={() => router.replace('/explore')} /></SafeAreaView>;
  return <FenceEditor />;
}

function FenceEditor(): React.JSX.Element {
  const { entry, settings, loading, error, refresh, saveFence } = useTracking();
  const [origin] = useState(() => ({ scope: settings?.scope ?? null, fence: entry?.snapshot.geofence ?? null }));
  const [draft, dispatch] = useReducer(fenceDraftReducer, origin.fence, createFenceDraft);
  const [action, setAction] = useState<'save' | 'reload' | 'confirm' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingVertex, setEditingVertex] = useState<number | null>(null);
  const inFlight = useRef(false);
  const confirming = useRef(false);
  const discardPrompt = useRef(false);
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.4;
  const navigation = useNavigation();
  const pending = action !== null;
  const scopeMatches = origin.scope !== null && settings?.scope === origin.scope;
  const savedFence = scopeMatches ? entry?.snapshot.geofence ?? origin.fence : origin.fence;
  const coordinates = useMemo(() => draft.vertices.map(inputCoordinate), [draft.vertices]);
  const validation = useMemo(() => validateFenceDraft(draft.vertices), [draft.vertices]);
  const preview = coordinates.every(isValidCoordinate) ? coordinates : [];

  const exit = useCallback((): void => {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back();
    else router.replace('/explore');
  }, []);

  usePreventRemove(draft.dirty || pending, ({ data }) => {
    if (pending || inFlight.current) {
      setMessage('Wait for the current request before leaving. Your draft is retained.');
      return;
    }
    if (discardPrompt.current) return;
    discardPrompt.current = true;
    const keep = (): void => { discardPrompt.current = false; };
    const discard = (): void => {
      discardPrompt.current = false;
      navigation.dispatch(data.action);
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Discard your unsaved fence draft? The confirmed server fence is kept.')) discard();
      else keep();
    } else Alert.alert('Discard unsaved fence?', 'Your local draft will be discarded. The confirmed server fence is kept.', [
      { text: 'Keep editing', style: 'cancel', onPress: keep },
      { text: 'Discard', style: 'destructive', onPress: discard },
    ], { cancelable: false });
  });

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { exit(); return true; });
    return () => subscription.remove();
  }, [exit]));

  useEffect(() => {
    if (Platform.OS !== 'web' || (!draft.dirty && !pending)) return;
    const beforeUnload = (event: BeforeUnloadEvent): void => { event.preventDefault(); };
    globalThis.addEventListener('beforeunload', beforeUnload);
    return () => globalThis.removeEventListener('beforeunload', beforeUnload);
  }, [draft.dirty, pending]);

  function changeVertices(vertices: VertexInput[]): void {
    if (pending) return;
    dispatch({ type: 'vertices', vertices });
    setMessage(null);
  }

  function addMapVertex(coordinate: Coordinate): void {
    changeVertices([...draft.vertices, toVertexInput(coordinate)]);
  }

  function undo(): void {
    changeVertices(draft.vertices.slice(0, -1));
    setEditingVertex(null);
  }

  function addCoordinate(): void {
    setEditingVertex(draft.vertices.length);
    changeVertices([...draft.vertices, { latitude: '', longitude: '' }]);
  }

  function changeVertex(index: number, axis: keyof VertexInput, value: string): void {
    changeVertices(draft.vertices.map((vertex, current) => current === index ? { ...vertex, [axis]: value } : vertex));
  }

  async function persist(): Promise<void> {
    confirming.current = false;
    if (inFlight.current || !scopeMatches || !validation.valid || draft.needsReload || !draft.dirty) { setAction(null); return; }
    inFlight.current = true;
    Keyboard.dismiss();
    setAction('save');
    setMessage(null);
    try {
      const snapshot = await saveFence(validation.vertices, draft.expectedVersion);
      if (!snapshot.geofence) throw new Error('The server did not confirm a polygon.');
      dispatch({ type: 'confirmed', fence: snapshot.geofence });
      setEditingVertex(null);
      setMessage('Fence v' + snapshot.geofence.version + ' confirmed by the server. Prior open episodes close as fence changed, not returned. Evaluation waits for the next fresh GPS observation.');
    } catch (error) {
      dispatch({ type: 'failed' });
      setMessage(error instanceof FenceConflict ? error.message : error instanceof ServerConnectionError ? error.message + ' Save not confirmed; draft retained. Reload before retrying.' : 'Save not confirmed. Your draft is retained. Reload before retrying in case the acknowledgement was lost.');
    } finally { inFlight.current = false; setAction(null); }
  }

  function save(): void {
    if (pending || inFlight.current || confirming.current || !scopeMatches || !validation.valid || !draft.dirty || draft.needsReload) return;
    if (!savedFence) { void persist(); return; }
    confirming.current = true;
    setAction('confirm');
    const keep = (): void => { confirming.current = false; setAction(null); };
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Replace the saved fence? Active episodes will close as fence changed, not returned. Latest positions and history are retained.')) void persist();
      else keep();
    } else Alert.alert('Replace saved fence?', 'Active episodes will close as fence changed, not returned. Latest GPS positions and history are retained.', [
      { text: 'Keep editing', style: 'cancel', onPress: keep },
      { text: 'Replace', onPress: () => void persist() },
    ], { cancelable: false });
  }

  async function reloadVersion(): Promise<void> {
    if (pending || inFlight.current || !scopeMatches) return;
    inFlight.current = true;
    setAction('reload');
    Keyboard.dismiss();
    try {
      const latest = await refresh();
      dispatch({ type: 'reload', version: latest.geofence?.version ?? 0 });
      setMessage('Latest server fence v' + (latest.geofence?.version ?? 0) + ' loaded. Your draft is unchanged. Review the solid saved outline, then explicitly Save fence.');
    } catch (error) {
      setMessage(error instanceof ServerConnectionError ? error.message + ' Draft and expected version retained.' : 'Reload failed. Your draft and original expected version are retained.');
    } finally { inFlight.current = false; setAction(null); }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {!largeText && <IconButton label="Back to Setup" icon="back" onPress={exit} />}
      <Label accessibilityRole="header" weight="semibold" style={{ flex: largeText ? undefined : 1, width: largeText ? '100%' : undefined, fontSize: 20, lineHeight: 26 }}>Geofence setup</Label>
      {largeText && <View style={{ flex: 1 }}><IconButton label="Back to Setup" icon="back" onPress={exit} /></View>}
      <Button label={draft.confirmedVersion !== null ? 'Done' : 'Cancel'} onPress={exit} />
    </View>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View>
          {largeText && <View style={{ padding: 16 }}><StatusPill label={pending ? 'Draft retained · ' + (action === 'save' ? 'saving' : action === 'reload' ? 'reloading' : 'review replacement') : 'Tap to plot boundary · ' + draft.vertices.length + ' corners'} caution /></View>}
          <LiveMap polygon={savedFence?.vertices ?? []} devices={scopeMatches ? entry?.snapshot.devices ?? [] : []}
            style={{ height: Math.max(280, height * 0.45) }} controlsTop={largeText ? 16 : 88} contentBottom={32} editMode={!pending && scopeMatches}
            previewVertices={preview} onMapPress={addMapVertex} onUndo={undo} undoDisabled={pending || draft.vertices.length === 0} />
          {!largeText && <View pointerEvents="none" style={{ position: 'absolute', top: 16, left: 16, right: 16 }}>
            <StatusPill label={pending ? 'Draft retained · ' + (action === 'save' ? 'saving' : action === 'reload' ? 'reloading' : 'review replacement') : 'Tap to plot boundary · ' + draft.vertices.length + ' corners'} caution />
          </View>}
        </View>
        <Surface style={{ marginTop: -16, padding: 16, gap: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <View style={ui.spread}>
            <Label weight="semibold" style={ui.sectionTitle}>{draft.confirmedVersion !== null ? 'Saved fence v' + draft.confirmedVersion : 'Draft · ' + draft.vertices.length + ' vertices'}</Label>
            <View style={ui.row}><Icon name="fence" color={colors['chart-1']} /><Label muted>Polygon</Label></View>
          </View>
          <Label muted>{validation.valid ? 'Valid polygon · ' + (draft.dirty ? 'not yet saved' : 'no unsaved changes') : validation.error}</Label>
          <View style={{ gap: 4 }}>
            <Label mono muted>Saved: solid amber · Draft: dashed amber</Label>
            <Label muted>Editing version {draft.expectedVersion}. Edges cannot cross. Coordinates must be valid.</Label>
          </View>
          {!scopeMatches && <Label accessibilityLiveRegion="assertive">{origin.scope ? 'The connection changed. This draft is retained for the original server and cannot be saved here. Cancel to return to Setup.' : 'Connect your server in Setup before creating a fence.'}</Label>}
          {error && <Label accessibilityLiveRegion="polite">{error}</Label>}
          {message && <Surface accessibilityLiveRegion="polite" style={{ padding: 16, borderRadius: 16, gap: 8 }}>
            <View style={ui.row}><Icon name={draft.confirmedVersion !== null ? 'check' : 'info'} /><Label weight="medium">{draft.confirmedVersion !== null ? 'Server confirmed' : 'Fence update'}</Label></View>
            <Label>{message}</Label>
          </Surface>}
          {draft.needsReload && <Label style={{ color: colors['chart-1'] }}>Reload and review the latest saved fence before another save.</Label>}
          <View style={ui.actions}>
            <Button label="Add coordinate" icon="add" disabled={pending || !scopeMatches} style={{ flex: 1, minWidth: largeText ? '100%' : 136 }} onPress={addCoordinate} />
            <Button label={action === 'reload' ? 'Reloading…' : 'Reload fence'} icon="refresh" busy={action === 'reload'} disabled={pending || !scopeMatches} style={{ flex: 1, minWidth: largeText ? '100%' : 136 }} onPress={() => void reloadVersion()} />
          </View>
          <Label muted>Reload keeps your draft and updates the expected server version.</Label>
          {draft.vertices.map((vertex, index) => <Surface key={index} style={{ padding: 12, gap: 12, borderRadius: 20, backgroundColor: colors.muted }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 140, gap: 4 }}>
                <Label weight="medium">Corner {index + 1}</Label>
                <Label mono selectable>{vertex.latitude && vertex.longitude ? vertex.latitude + ', ' + vertex.longitude : 'Coordinate required'}</Label>
              </View>
              <IconButton label={'Edit corner ' + (index + 1)} icon="edit" disabled={pending} onPress={() => setEditingVertex(editingVertex === index ? null : index)} />
              <IconButton label={'Remove corner ' + (index + 1)} icon="trash" disabled={pending} onPress={() => { changeVertices(draft.vertices.filter((_, current) => current !== index)); setEditingVertex(null); }} />
            </View>
            {editingVertex === index && <View style={{ gap: 12 }}>
              <Field label={'Corner ' + (index + 1) + ' latitude'} value={vertex.latitude} editable={!pending} autoFocus onChangeText={value => changeVertex(index, 'latitude', value)} inputMode="text" />
              <Field label={'Corner ' + (index + 1) + ' longitude'} value={vertex.longitude} editable={!pending} onChangeText={value => changeVertex(index, 'longitude', value)} inputMode="text" returnKeyType="done" onSubmitEditing={() => { Keyboard.dismiss(); setEditingVertex(null); }} />
              <Button label="Done editing corner" icon="check" disabled={pending} onPress={() => { Keyboard.dismiss(); setEditingVertex(null); }} />
            </View>}
          </Surface>)}
          {draft.vertices.length > 0 && <Button label="Undo last vertex" icon="undo" disabled={pending} onPress={undo} />}
          <Button label={action === 'save' ? 'Saving fence…' : 'Save fence'} icon="check" primary busy={action === 'save'} disabled={pending || !validation.valid || draft.needsReload || !draft.dirty || !scopeMatches || loading} onPress={save} />
          <Button label={draft.confirmedVersion !== null ? 'Back to Setup' : draft.dirty ? 'Discard draft' : 'Back to Setup'} disabled={pending} onPress={exit} />
          <Label muted>Drafts are local until the server acknowledges the save. Last positions and episode history are retained; the server evaluates the next fresh GPS fix.</Label>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
