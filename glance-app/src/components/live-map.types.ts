import type { Coordinate, TrackerSnapshot } from '../../../shared/protocol.ts';

export type LiveMapProps = {
  polygon: Coordinate[];
  devices: TrackerSnapshot[];
  selectedDeviceId?: string | null;
  onDevicePress?: (deviceId: string) => void;
  editMode?: boolean;
  previewVertices?: Coordinate[];
  onMapPress?: (coordinate: Coordinate) => void;
};
