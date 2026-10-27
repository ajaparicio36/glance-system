import type { Coordinate, TrackerSnapshot } from '../../../shared/protocol.ts';
import type { StyleProp, ViewStyle } from 'react-native';

export type LiveMapProps = {
  polygon: Coordinate[];
  devices: TrackerSnapshot[];
  selectedDeviceId?: string | null;
  onDevicePress?: (deviceId: string) => void;
  editMode?: boolean;
  previewVertices?: Coordinate[];
  onMapPress?: (coordinate: Coordinate) => void;
  style?: StyleProp<ViewStyle>;
  controlsTop?: number;
  contentBottom?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshDisabled?: boolean;
  onUndo?: () => void;
  undoDisabled?: boolean;
};
