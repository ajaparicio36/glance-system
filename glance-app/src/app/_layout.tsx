import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontsReady } from '@/components/tracking-ui';
import { TrackingProvider } from '@/tracking/provider';
import '@/tracking.css';

export default function Layout(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const [fontsLoaded] = useFonts({
    Geist: require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
    GeistMedium: require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
    GeistSemiBold: require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
    GeistMono: require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf'),
  });
  return <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider><FontsReady.Provider value={fontsLoaded}>
      <ThemeProvider value={DarkTheme}><TrackingProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: reducedMotion ? 'fade' : 'default' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="fence" options={{ title: 'Geofence setup' }} />
          <Stack.Screen name="history" options={{ title: 'Tracker history', presentation: 'formSheet', sheetAllowedDetents: [0.55, 0.9], sheetInitialDetentIndex: 1, sheetGrabberVisible: true, sheetCornerRadius: 24, contentStyle: { backgroundColor: '#121212' } }} />
        </Stack>
      </TrackingProvider></ThemeProvider>
    </FontsReady.Provider></SafeAreaProvider>
  </GestureHandlerRootView>;
}

export const unstable_settings = { anchor: '(tabs)' };
