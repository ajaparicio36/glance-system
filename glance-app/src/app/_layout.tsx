import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppTabs from '@/components/app-tabs';
import { FontsReady } from '@/components/tracking-ui';
import { TrackingProvider } from '@/tracking/provider';
import '@/tracking.css';

export default function Layout(): React.JSX.Element {
  const dark = useColorScheme() === 'dark';
  const [fontsLoaded] = useFonts({
    Geist: require('@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf'),
    GeistMedium: require('@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf'),
    GeistSemiBold: require('@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf'),
    GeistMono: require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf'),
  });
  return <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider><FontsReady.Provider value={fontsLoaded}>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}><TrackingProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <AppTabs />
      </TrackingProvider></ThemeProvider>
    </FontsReady.Provider></SafeAreaProvider>
  </GestureHandlerRootView>;
}
