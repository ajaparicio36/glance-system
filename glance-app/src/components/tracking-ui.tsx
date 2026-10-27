import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { createContext, useContext, useEffect, useState, type ReactNode, type Ref } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type StyleProp, type TextInputProps, type TextProps, type ViewProps, type ViewStyle } from 'react-native';
import { palettes } from '../tracking/colors';

export const FontsReady = createContext(false);

export function usePalette(): Record<string, string> {
  return palettes.dark;
}

export function useFont(mono = false, weight: 'regular' | 'medium' | 'semibold' = 'regular'): string | undefined {
  const loaded = useContext(FontsReady);
  if (!loaded) return mono ? Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) : undefined;
  return mono ? 'GeistMono' : { regular: 'Geist', medium: 'GeistMedium', semibold: 'GeistSemiBold' }[weight];
}

const symbols = {
  map: { ios: 'map', android: 'map', web: 'map' },
  setup: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  locate: { ios: 'scope', android: 'my_location', web: 'my_location' },
  refresh: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  pin: { ios: 'mappin', android: 'location_on', web: 'location_on' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  forward: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  down: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  up: { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' },
  fence: { ios: 'pentagon', android: 'pentagon', web: 'pentagon' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  undo: { ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  server: { ios: 'network', android: 'dns', web: 'dns' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  bell: { ios: 'bell.badge', android: 'notifications_active', web: 'notifications_active' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof symbols;

export function Icon({ name, color, size = 20 }: { name: IconName; color?: string; size?: number }): React.JSX.Element {
  const colors = usePalette();
  const { fontScale } = useWindowDimensions();
  const extent = Platform.OS === 'android' ? Math.ceil(size * Math.max(1, fontScale)) : size;
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width: extent, height: extent, flexShrink: 0 }}><SymbolView name={symbols[name]} size={size} tintColor={color ?? colors.foreground} style={{ width: extent, height: extent }} accessible={false} /></View>;
}

export function Label({ title = false, mono = false, muted = false, weight, style, ...props }: TextProps & { title?: boolean; mono?: boolean; muted?: boolean; weight?: 'regular' | 'medium' | 'semibold' }): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont(mono, weight ?? (title ? 'semibold' : 'regular'));
  return <Text {...props} style={[{ color: colors[muted ? 'muted-foreground' : 'foreground'], fontFamily, fontSize: title ? 28 : mono || muted ? 14 : 16, lineHeight: title ? 34 : mono || muted ? 20 : 24, letterSpacing: title ? -0.5 : 0 }, style]} />;
}

export function Surface({ glass = false, style, children, ...props }: ViewProps & { glass?: boolean }): React.JSX.Element {
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    if (!glass || Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => { if (active) setReduceTransparency(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => { active = false; subscription.remove(); };
  }, [glass]);
  const glassAvailable = glass && Platform.OS === 'ios' && !reduceTransparency && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return <View {...props} style={[styles.surface, style, glassAvailable && { backgroundColor: 'transparent' }]}>
    {glassAvailable && <GlassView pointerEvents="none" colorScheme="dark" tintColor="#121212ef" glassEffectStyle="regular" style={StyleSheet.absoluteFill} />}
    {children}
  </View>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  busy?: boolean;
  icon?: IconName;
  selected?: boolean;
  expanded?: boolean;
  style?: StyleProp<ViewStyle>;
  buttonRef?: Ref<View>;
};

export function Button({ label, onPress, disabled = false, primary = false, busy = false, icon, selected, expanded, style, buttonRef }: ButtonProps): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont(false, 'medium');
  const [focused, setFocused] = useState(false);
  const foreground = colors[primary ? 'primary-foreground' : 'foreground'];
  return <Pressable cssInterop={false} ref={buttonRef} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy, selected, expanded }} disabled={disabled || busy} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} pressRetentionOffset={16}
    style={({ pressed }) => [styles.button, { borderColor: focused ? colors.ring : 'transparent', backgroundColor: colors[primary ? 'primary' : 'secondary'], opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }, style]}>
    {busy ? <ActivityIndicator color={foreground} /> : icon ? <Icon name={icon} color={foreground} /> : null}
    <Text style={{ flexShrink: 1, fontFamily, fontSize: 16, lineHeight: 22, textAlign: 'center', color: foreground }}>{label}</Text>
  </Pressable>;
}

export function IconButton({ label, icon, onPress, disabled = false, busy = false }: Pick<ButtonProps, 'label' | 'onPress' | 'disabled' | 'busy'> & { icon: IconName }): React.JSX.Element {
  const colors = usePalette();
  const { fontScale } = useWindowDimensions();
  const extent = Math.max(48, 20 * fontScale + 16);
  const [focused, setFocused] = useState(false);
  return <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.iconButton, { width: extent, height: extent, borderRadius: extent / 2, opacity: disabled ? 0.4 : pressed ? 0.65 : 1, borderColor: focused ? colors.ring : colors.border }]}>
    {busy ? <ActivityIndicator color={colors.foreground} /> : <Icon name={icon} />}
  </Pressable>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }): React.JSX.Element {
  return <Surface style={[{ padding: 16, gap: 16 }, style]}>{children}</Surface>;
}

export function Field({ label, style, onFocus, onBlur, ...props }: TextInputProps & { label: string }): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont();
  const [focused, setFocused] = useState(false);
  return <View style={{ gap: 8 }}>
    <Label muted>{label}</Label>
    <TextInput {...props} accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors['muted-foreground']} selectionColor={colors.foreground}
      onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }}
      style={[{ borderColor: focused ? colors.ring : '#707070', borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 48, color: colors.foreground, backgroundColor: colors.muted, fontFamily, fontSize: 16, lineHeight: 24 }, style]} />
  </View>;
}

export function InsetRow({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }): React.JSX.Element {
  const colors = usePalette();
  return <View style={{ padding: 12, gap: 8, borderRadius: 16, backgroundColor: colors.muted }}>
    <View style={ui.row}><Icon name={icon} color={colors['muted-foreground']} size={18} /><Label muted style={{ flex: 1 }}>{label}</Label></View>
    {children}
  </View>;
}

export function StatusPill({ label, caution = false }: { label: string; caution?: boolean }): React.JSX.Element {
  const colors = usePalette();
  return <Surface glass style={{ borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', maxWidth: '100%' }}>
    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors[caution ? 'chart-1' : 'foreground'] }} />
    <Label muted style={{ flexShrink: 1, color: colors[caution ? 'chart-1' : 'foreground'] }}>{label}</Label>
  </Surface>;
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  sectionTitle: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

const styles = StyleSheet.create({
  surface: { backgroundColor: '#121212', borderRadius: 24, borderWidth: 1, borderColor: '#2b2b2b', overflow: 'hidden' },
  button: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 100, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 12 },
  iconButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
});
