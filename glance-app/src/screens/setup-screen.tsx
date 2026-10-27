import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LiveMap from '@/components/live-map';
import { Button, Card, Field, Icon, InsetRow, Label, StatusPill, ui, usePalette } from '@/components/tracking-ui';
import { useTracking } from '@/tracking/provider';
import { connectionLabel, formatLocalTimestamp } from '@/tracking/presentation';
import fontLicense from '@/tracking/font-license.json';

export default function SetupScreen(): React.JSX.Element {
  const { settings } = useTracking();
  return <SetupContent key={settings?.scope ?? 'unconfigured'} />;
}

function SetupContent(): React.JSX.Element {
  const { entry, settings, connection, error, cacheError, loading, localHttpHost, configure } = useTracking();
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const [serverUrl, setServerUrl] = useState(settings?.serverUrl ?? '');
  const [ownerToken, setOwnerToken] = useState(settings?.ownerToken ?? '');
  const [editingConnection, setEditingConnection] = useState(!settings);
  const [pending, setPending] = useState(false);
  const connecting = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showFontLicense, setShowFontLicense] = useState(false);
  const savedFence = entry?.snapshot.geofence;
  const connected = connection === 'live' && error === null;

  async function connect(): Promise<void> {
    if (connecting.current || loading) return;
    connecting.current = true;
    Keyboard.dismiss();
    setPending(true);
    setMessage(null);
    try {
      await configure({ serverUrl, ownerToken });
      setEditingConnection(false);
      setMessage('Credentials stored securely. Waiting for authenticated live updates.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Connection could not be configured.');
    } finally { connecting.current = false; setPending(false); }
  }

  function cancelConnection(): void {
    setServerUrl(settings?.serverUrl ?? '');
    setOwnerToken(settings?.ownerToken ?? '');
    setEditingConnection(false);
    setMessage(null);
    Keyboard.dismiss();
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ gap: 24, padding: 16, paddingBottom: insets.bottom + 112 + Math.max(0, fontScale - 1) * 24 }}>
        <View style={{ gap: 12 }}>
          <StatusPill label={connectionLabel(connection, error)} caution={!connected && !!settings} />
          <Label title accessibilityRole="header">Setup</Label>
          <Label muted>Your server connection and shared boundary.</Label>
        </View>
        <Card style={{ backgroundColor: colors.card }}>
          <View style={ui.row}><Icon name="server" /><Label weight="semibold" style={ui.sectionTitle}>Server connection</Label></View>
          <Label muted>{connected ? 'Authenticated live updates' : settings ? 'Credentials saved on this phone. Live connection is not confirmed.' : 'Connect with your owner credential to get started.'}</Label>
          {loading && <Label muted>Loading saved settings and confirmed cache…</Label>}
          {error && <Label accessibilityLiveRegion="polite">{error}</Label>}
          {cacheError && <Label accessibilityLiveRegion="polite">{cacheError}</Label>}
          {editingConnection ? <>
            <Field label="Server URL" placeholder="https://your-server.example" value={serverUrl} onChangeText={setServerUrl} editable={!pending && !loading} keyboardType="url" returnKeyType="next" />
            <Field label="Owner credential" value={ownerToken} onChangeText={setOwnerToken} editable={!pending && !loading} secureTextEntry textContentType="password" returnKeyType="done" onSubmitEditing={() => void connect()} />
            <Button label={pending ? 'Saving credentials…' : 'Save credentials & connect'} icon="lock" busy={pending} disabled={loading} primary onPress={() => void connect()} />
            {settings && <Button label="Cancel connection edit" disabled={pending} onPress={cancelConnection} />}
            <Label muted>The owner credential reads tracking and edits fences. The device upload credential cannot be used here.</Label>
          </> : <>
            <InsetRow icon="server" label="Server URL"><Label mono selectable>{settings?.serverUrl}</Label></InsetRow>
            <InsetRow icon="lock" label="Owner credential"><Label mono accessibilityLabel="Owner credential saved securely and hidden">••••••••••••</Label></InsetRow>
            <Button label="Edit connection" icon="edit" disabled={pending || loading} onPress={() => { setEditingConnection(true); setMessage(null); }} />
          </>}
          {message && <Label accessibilityLiveRegion="polite">{message}</Label>}
          <Label muted>{localHttpHost ? 'Trusted development permits HTTP only to ' + localHttpHost + '. Tokens are exposed to network observers. Use HTTPS outside this trusted network.' : 'HTTPS and secure WebSockets with certificate verification. The owner credential authenticates requests and the first live frame.'}</Label>
        </Card>
        <Card style={{ backgroundColor: colors.card }}>
          <View style={ui.row}><Icon name="fence" color={colors['chart-1']} /><Label weight="semibold" style={ui.sectionTitle}>Shared geofence</Label></View>
          <Label muted>{savedFence ? 'Last confirmed fence · v' + savedFence.version + ' · ' + savedFence.vertices.length + ' vertices' : 'No confirmed fence yet'}</Label>
          {savedFence ? <>
            <View style={{ borderRadius: 16, overflow: 'hidden' }}>
              <LiveMap key={savedFence.version} polygon={savedFence.vertices} devices={[]} style={{ height: 240 }} />
            </View>
            <Label mono selectable>Updated {formatLocalTimestamp(savedFence.updatedAt)}</Label>
          </> : <View style={{ gap: 8, paddingVertical: 16 }}>
            <Label>Create one polygon for your configured trackers.</Label>
            <Label muted>Add corners on the map or enter their coordinates. The server confirms and evaluates the boundary.</Label>
          </View>}
          <Button label={savedFence ? 'Edit fence' : 'Create fence'} icon={savedFence ? 'edit' : 'add'} primary disabled={!settings || loading || pending} onPress={() => router.push('/fence')} />
          {!settings && <Label muted>Save your connection above to enable the editor.</Label>}
          <Label muted>{connected ? 'The server evaluates fresh tracker observations.' : 'This is last confirmed data. Cached geometry does not prove current tracker safety.'}</Label>
        </Card>
        <View style={{ gap: 12 }}>
          <Button label="Font license & disclosures" icon={showFontLicense ? 'up' : 'down'} expanded={showFontLicense} onPress={() => setShowFontLicense(previous => !previous)} />
          {showFontLicense && <Card><Label weight="medium">Geist & Geist Mono · SIL OFL 1.1</Label><Label selectable>{fontLicense.license}</Label></Card>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
