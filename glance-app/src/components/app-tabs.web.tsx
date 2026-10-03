import { Tabs } from 'expo-router';
import { usePalette } from './tracking-ui';

export default function AppTabs(): React.JSX.Element {
  const colors = usePalette();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.foreground, tabBarStyle: { backgroundColor: colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'Map' }} />
    <Tabs.Screen name="explore" options={{ title: 'Setup' }} />
  </Tabs>;
}
