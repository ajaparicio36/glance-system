import { createContext, useContext, type ReactNode } from 'react';
import { Platform, Pressable, Text, TextInput, View, useColorScheme, type TextInputProps, type TextProps } from 'react-native';
import { palettes } from '../tracking/colors';

export const FontsReady = createContext(false);

export function usePalette(): Record<string, string> {
  return palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export function useFont(mono = false, weight: 'regular' | 'medium' | 'semibold' = 'regular'): string | undefined {
  const loaded = useContext(FontsReady);
  if (!loaded) return mono ? Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) : undefined;
  return mono ? 'GeistMono' : { regular: 'Geist', medium: 'GeistMedium', semibold: 'GeistSemiBold' }[weight];
}

export function Label({ title = false, mono = false, muted = false, style, ...props }: TextProps & { title?: boolean; mono?: boolean; muted?: boolean }): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont(mono, title ? 'semibold' : 'regular');
  return <Text {...props} style={[{ color: colors[muted ? 'muted-foreground' : 'foreground'], fontFamily, fontSize: title ? 28 : mono || muted ? 14 : 16, lineHeight: title ? 34 : mono || muted ? 20 : 24, letterSpacing: title ? -0.3 : 0 }, style]} />;
}

export function Button({ label, onPress, disabled = false, primary = false }: { label: string; onPress: () => void; disabled?: boolean; primary?: boolean }): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont(false, 'medium');
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    className="min-h-[48px] justify-center rounded-lg border px-4 py-3"
    style={({ pressed }) => ({ borderColor: colors.foreground, backgroundColor: colors[primary ? 'primary' : 'card'], opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
    <Text style={{ fontFamily, fontSize: 16, lineHeight: 22, textAlign: 'center', color: colors[primary ? 'primary-foreground' : 'foreground'] }}>{label}</Text>
  </Pressable>;
}

export function Card({ children }: { children: ReactNode }): React.JSX.Element {
  const colors = usePalette();
  return <View className="gap-3 rounded-lg border p-4" style={{ borderColor: colors.border, backgroundColor: colors.card }}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont();
  return <View className="gap-1">
    <Label>{label}</Label>
    <TextInput {...props} accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors['muted-foreground']}
      style={{ borderColor: colors.foreground, borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 48, color: colors.foreground, backgroundColor: colors.background, fontFamily, fontSize: 16, lineHeight: 24 }} />
  </View>;
}
