import { useCallback, useMemo, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { isValidCoordinate, validatePolygon } from '../../../shared/geofence.ts';
import type { Coordinate } from '../../../shared/protocol.ts';
import LiveMap from '@/components/live-map';
import { Button, Card, Field, Label, usePalette } from '@/components/tracking-ui';
import { useTracking } from '@/tracking/provider';
import { FenceConflict } from '@/tracking/network';
import fontLicense from '@/tracking/font-license.json';

type VertexInput = { latitude: string; longitude: string };

function inputCoordinate(vertex: VertexInput): Coordinate {
  return { latitude: vertex.latitude.trim() ? Number(vertex.latitude) : NaN, longitude: vertex.longitude.trim() ? Number(vertex.longitude) : NaN };
}

function toInput(coordinate: Coordinate): VertexInput {
  return { latitude: String(coordinate.latitude), longitude: String(coordinate.longitude) };
}

export default function SetupScreen(): React.JSX.Element {
  const { settings } = useTracking();
  return <SetupContent key={settings?.scope ?? 'unconfigured'} />;
}

function SetupContent(): React.JSX.Element {
  const { entry, settings, loading, localHttpHost, configure, refresh, saveFence } = useTracking();
  const colors = usePalette();
  const [serverUrl, setServerUrl] = useState(settings?.serverUrl ?? '');
  const [ownerToken, setOwnerToken] = useState(settings?.ownerToken ?? '');
  const [draft, setDraft] = useState<VertexInput[]>([]);
  const [editing, setEditing] = useState(false);
  const [expectedVersion, setExpectedVersion] = useState(0);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showFontLicense, setShowFontLicense] = useState(false);
  const draftCoordinates = useMemo(() => draft.map(inputCoordinate), [draft]);
  const validation = useMemo(() => validatePolygon(draftCoordinates), [draftCoordinates]);
  const savedFence = entry?.snapshot.geofence;

  function discard(): void {
    setDraft([]); setEditing(false); setConflict(false); setMessage(null);
  }

  const confirmDiscard = useCallback((): void => {
    Alert.alert('Discard unsaved polygon?', 'The confirmed server fence is kept.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { setDraft([]); setEditing(false); setConflict(false); setMessage(null); } },
    ]);
  }, []);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!editing) return false;
      if (!pending) confirmDiscard();
      return true;
    });
    return () => subscription.remove();
  }, [editing, pending, confirmDiscard]));

  async function connect(): Promise<void> {
    if (editing) { setMessage('Save or cancel your polygon before changing server.'); return; }
    setPending(true);
    try { await configure({ serverUrl, ownerToken }); setMessage('Connection settings stored securely. Waiting for server confirmation.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Connection could not be configured.'); }
    finally { setPending(false); }
  }

  function begin(): void {
    setDraft(savedFence?.vertices.map(toInput) ?? []);
    setExpectedVersion(savedFence?.version ?? 0);
    setEditing(true); setConflict(false); setMessage(null);
  }

  async function persist(): Promise<void> {
    if (!validation.valid) { setMessage(validation.error); return; }
    setPending(true); setMessage(null);
    try {
      await saveFence(validation.vertices, expectedVersion);
      discard();
      setMessage('Polygon confirmed by server. Existing violations close as fence changed; evaluation waits for the next fresh GPS observation.');
    } catch (error) {
      setConflict(error instanceof FenceConflict);
      setMessage(error instanceof FenceConflict ? error.message : 'Save not confirmed. Draft retained. Refresh the server before retrying if the acknowledgement was lost.');
    } finally { setPending(false); }
  }

  function save(): void {
    if (savedFence) Alert.alert('Replace saved polygon?', 'Active episodes will close as fence changed, not returned. Latest GPS position and history are retained.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Replace', onPress: () => void persist() },
    ]);
    else void persist();
  }

  async function reloadVersion(): Promise<void> {
    setPending(true);
    try {
      const latest = await refresh();
      setExpectedVersion(latest.geofence?.version ?? 0);
      setConflict(false);
      setMessage(`Latest server fence v${latest.geofence?.version ?? 0} loaded. Your draft is unchanged. Review the saved outline, then explicitly Save to replace it.`);
    } catch { setMessage('Reload failed. Your draft and original expected version are retained.'); }
    finally { setPending(false); }
  }

  function changeVertex(index: number, axis: keyof VertexInput, value: string): void {
    setDraft(previous => previous.map((vertex, vertexIndex) => vertexIndex === index ? { ...vertex, [axis]: value } : vertex));
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}>
        <Label title>Setup</Label>
        <Label muted>One server-owned polygon. SQLite stores confirmed data, never offline saves.</Label>
        <Card>
          <Field label="Server URL" placeholder="https://your-server.example" value={serverUrl} onChangeText={setServerUrl} editable={!pending && !editing} keyboardType="url" />
          <Field label="Owner credential" value={ownerToken} onChangeText={setOwnerToken} editable={!pending && !editing} secureTextEntry textContentType="password" />
          <Label muted>The owner credential reads tracking and edits fences. Device upload credentials cannot be used here.</Label>
          <Label muted>{localHttpHost ? `Trusted development permits HTTP only to ${localHttpHost}. Tokens are exposed to network observers. Use HTTPS outside this trusted network.` : 'This build requires HTTPS / wss with certificate verification.'}</Label>
          <Button label={pending ? 'Working…' : 'Connect server'} onPress={() => void connect()} disabled={pending || loading || editing} primary />
        </Card>
        {message && <Label accessibilityLiveRegion="polite">{message}</Label>}
        <Label style={{ fontSize: 20, lineHeight: 26 }}>Polygon geofence</Label>
        <Label muted>{savedFence ? `Confirmed fence v${savedFence.version} · ${savedFence.vertices.length} vertices` : 'No confirmed polygon'}</Label>
        <LiveMap polygon={savedFence?.vertices ?? []} devices={entry?.snapshot.devices ?? []} editMode={editing && !pending}
          previewVertices={draftCoordinates.every(isValidCoordinate) ? draftCoordinates : []}
          onMapPress={coordinate => setDraft(previous => [...previous, toInput(coordinate)])} />
        <Label muted>© OpenStreetMap contributors · OpenFreeMap</Label>
        {!editing ? <Button label={savedFence ? 'Edit polygon' : 'Draw polygon'} disabled={!settings || loading || pending} onPress={begin} primary /> : <>
          <Label>Tap the map in vertex order, or enter coordinates below. Edges count as inside. No phone location permission required.</Label>
          <Label muted>{validation.valid ? 'Draft valid · not saved' : validation.error}</Label>
          {draft.map((vertex, index) => <Card key={index}>
            <Label>Vertex {index + 1}</Label>
            <Field label={`Vertex ${index + 1} latitude`} value={vertex.latitude} editable={!pending} onChangeText={value => changeVertex(index, 'latitude', value)} inputMode="text" />
            <Field label={`Vertex ${index + 1} longitude`} value={vertex.longitude} editable={!pending} onChangeText={value => changeVertex(index, 'longitude', value)} inputMode="text" />
            <Button label={`Remove vertex ${index + 1}`} disabled={pending} onPress={() => setDraft(previous => previous.filter((_, vertexIndex) => vertexIndex !== index))} />
          </Card>)}
          <Button label="Add coordinate vertex" disabled={pending} onPress={() => setDraft(previous => [...previous, { latitude: '', longitude: '' }])} />
          <Button label="Undo last vertex" disabled={pending || draft.length === 0} onPress={() => setDraft(previous => previous.slice(0, -1))} />
          <Button label="Reload latest fence · keep draft" disabled={pending} onPress={() => void reloadVersion()} />
          {conflict && <Label>Conflict: reload and review before saving. Nothing was overwritten.</Label>}
          <Button label={pending ? 'Saving…' : 'Save polygon'} disabled={pending || !validation.valid || conflict} onPress={save} primary />
          <Button label="Cancel polygon edit" disabled={pending} onPress={confirmDiscard} />
        </>}
        <Button label={showFontLicense ? 'Hide font license' : 'Geist / Geist Mono font license'} onPress={() => setShowFontLicense(previous => !previous)} />
        {showFontLicense && <Label selectable>{fontLicense.license}</Label>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
