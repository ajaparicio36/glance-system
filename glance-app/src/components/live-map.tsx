import { View } from 'react-native';
import { Label } from './tracking-ui';
import type { LiveMapProps } from './live-map.types';

export default function LiveMap(_props: LiveMapProps): React.JSX.Element {
  return <View className="min-h-[240px] justify-center p-4"><Label>MapLibre requires an Android or iOS development build. Coordinates and the vertex form remain available below.</Label></View>;
}
