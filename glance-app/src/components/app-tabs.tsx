import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useFont, usePalette } from './tracking-ui';

export default function AppTabs(): React.JSX.Element {
  const colors = usePalette();
  const fontFamily = useFont(false, 'medium');
  return <NativeTabs backgroundColor={colors.background} tintColor={colors.foreground}
    labelStyle={{ fontFamily, fontSize: 14, color: colors.foreground }}>
    <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="map" md="map" /><NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="explore"><NativeTabs.Trigger.Icon sf="gearshape" md="settings" /><NativeTabs.Trigger.Label>Setup</NativeTabs.Trigger.Label></NativeTabs.Trigger>
  </NativeTabs>;
}
