import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Label, Surface, usePalette } from './tracking-ui';

export default function AppTabs(): React.JSX.Element {
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, animation: 'none', sceneStyle: { backgroundColor: colors.background } }}
    tabBar={({ state, navigation }) => <View pointerEvents="box-none" style={{ position: 'absolute', left: 16 + insets.left, right: 16 + insets.right, bottom: insets.bottom + 16, alignItems: 'center' }}>
      <Surface glass style={{ borderRadius: 100, padding: 4, flexDirection: 'row', gap: 4, maxWidth: '100%' }}>
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const label = route.name === 'index' ? 'Map' : 'Setup';
          return <Pressable cssInterop={false} key={route.key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!selected && !event.defaultPrevented) navigation.navigate(route.name);
            }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={({ pressed }) => ({ minHeight: 48, minWidth: 104, flexShrink: 1, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: selected ? colors.primary : 'transparent', opacity: pressed ? 0.7 : 1 })}>
            <Icon name={route.name === 'index' ? 'map' : 'setup'} color={selected ? colors['primary-foreground'] : colors['muted-foreground']} />
            <Label weight="medium" style={{ flexShrink: 1, color: selected ? colors['primary-foreground'] : colors['muted-foreground'] }}>{label}</Label>
          </Pressable>;
        })}
      </Surface>
    </View>}>
    <Tabs.Screen name="index" options={{ title: 'Map' }} />
    <Tabs.Screen name="explore" options={{ title: 'Setup' }} />
  </Tabs>;
}
