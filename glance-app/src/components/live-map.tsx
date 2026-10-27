import { View } from 'react-native';
import { Label, usePalette } from './tracking-ui';
import type { LiveMapProps } from './live-map.types';

export default function LiveMap({ style, controlsTop = 16 }: LiveMapProps): React.JSX.Element {
  const colors = usePalette();
  return <View style={[{ height: 320, backgroundColor: colors.muted, justifyContent: 'center', padding: 24 }, style]}>
    <View style={{ marginTop: controlsTop, marginBottom: 160 }}>
      <Label muted>MapLibre needs an Android or iOS development build. Confirmed coordinates and manual fence entry remain available.</Label>
    </View>
  </View>;
}
