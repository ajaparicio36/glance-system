import { Camera, GeoJSONSource, Layer, Map as MapLibreMap, Marker, type CameraRef, type PressEvent } from '@maplibre/maplibre-react-native';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { closePolygonRing, isValidCoordinate, validatePolygon } from '../../../shared/geofence.ts';
import type { LiveMapProps } from './live-map.types';
import { fromMapCoordinate, initialMapCenter, toMapCoordinate } from './live-map.geometry';
import { Button, Label, usePalette } from './tracking-ui';

function feature(geometry: GeoJSON.Geometry): GeoJSON.Feature {
  return { type: 'Feature', properties: {}, geometry };
}

export default function LiveMap({ polygon, devices, selectedDeviceId, onDevicePress, editMode = false, previewVertices = [], onMapPress }: LiveMapProps): React.JSX.Element {
  const camera = useRef<CameraRef>(null);
  const [initial] = useState(() => initialMapCenter(polygon, devices));
  const [mapError, setMapError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const colors = usePalette();
  const reducedMotion = useReducedMotion();
  const saved = useMemo(() => polygon.length >= 3 ? feature({ type: 'Polygon', coordinates: [closePolygonRing(polygon).map(toMapCoordinate)] }) : null, [polygon]);
  const validation = useMemo(() => validatePolygon(previewVertices), [previewVertices]);
  const previewFill = validation.valid ? feature({ type: 'Polygon', coordinates: [closePolygonRing(validation.vertices).map(toMapCoordinate)] }) : null;
  const previewLine = previewVertices.length >= 2 ? feature({ type: 'LineString', coordinates: (validation.valid ? closePolygonRing(validation.vertices) : previewVertices).map(toMapCoordinate) }) : null;

  function recenter(): void {
    const coordinates = [...polygon, ...devices.flatMap(device => device.location ? [device.location] : [])];
    if (!coordinates.length) { camera.current?.jumpTo({ center: initial, zoom: 16 }); return; }
    const longitudes = coordinates.map(coordinate => coordinate.longitude);
    const latitudes = coordinates.map(coordinate => coordinate.latitude);
    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);
    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);
    camera.current?.fitBounds([west - 0.001, south - 0.001, east + 0.001, north + 0.001], {
      padding: { top: 32, right: 32, bottom: 84, left: 32 }, duration: reducedMotion ? 0 : 180, easing: 'ease',
    });
  }

  function mapPress(event: NativeSyntheticEvent<PressEvent>): void {
    const coordinate = fromMapCoordinate(event.nativeEvent.lngLat);
    if (editMode && isValidCoordinate(coordinate)) onMapPress?.(coordinate);
  }

  return <View style={{ height: 320, backgroundColor: colors.muted }}>
    <MapLibreMap key={mapKey} androidView="texture" attribution attributionPosition={{ top: 12, left: 12 }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty" style={StyleSheet.absoluteFill}
      onPress={mapPress} onDidFailLoadingMap={() => setMapError(true)} onDidFinishLoadingMap={() => setMapError(false)}>
      <Camera ref={camera} initialViewState={{ center: initial, zoom: 16 }} minZoom={3} maxZoom={19} />
      {saved && <GeoJSONSource id="saved-fence" data={saved}>
        <Layer id="saved-fill" type="fill" paint={{ 'fill-color': colors['chart-1'], 'fill-opacity': 0.15 }} />
        <Layer id="saved-line" type="line" paint={{ 'line-color': colors.foreground, 'line-width': 3 }} />
      </GeoJSONSource>}
      {editMode && previewFill && <GeoJSONSource id="preview-fill-source" data={previewFill}>
        <Layer id="preview-fill" type="fill" paint={{ 'fill-color': colors['chart-1'], 'fill-opacity': 0.2 }} />
      </GeoJSONSource>}
      {editMode && previewLine && <GeoJSONSource id="preview-line-source" data={previewLine}>
        <Layer id="preview-line" type="line" paint={{ 'line-color': colors.foreground, 'line-width': 3, 'line-dasharray': [1.5, 1] }} />
      </GeoJSONSource>}
      {editMode && previewVertices.map((coordinate, index) => <Marker key={`vertex-${index}`} lngLat={toMapCoordinate(coordinate)} anchor="center">
        <View style={{ backgroundColor: colors.card, borderColor: colors.foreground, borderWidth: 2, borderRadius: 8, paddingHorizontal: 8 }}><Label accessibilityLabel={`Fence vertex ${index + 1}`}>{index + 1}</Label></View>
      </Marker>)}
      {devices.flatMap(device => device.location ? [<Marker key={device.deviceId} id={device.deviceId} lngLat={toMapCoordinate(device.location)} anchor="center" onPress={() => onDevicePress?.(device.deviceId)}>
        <View accessible accessibilityRole="button" accessibilityLabel={`Select tracker ${device.deviceId}`} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, borderWidth: device.deviceId === selectedDeviceId ? 4 : 2, borderColor: colors.foreground, backgroundColor: colors.card }}>
          <Label style={{ color: colors['chart-2'], fontSize: 24 }}>●</Label>
        </View>
      </Marker>] : [])}
    </MapLibreMap>
    {mapError && <View className="absolute left-4 right-4 top-12 gap-2 rounded-lg p-3" style={{ backgroundColor: colors.card }}>
      <Label>Basemap unavailable. Last confirmed coordinates remain below; tiles are not cached by SQLite.</Label>
      <Button label="Retry map" onPress={() => { setMapError(false); setMapKey(previous => previous + 1); }} />
    </View>}
    <View className="absolute bottom-3 right-3"><Button label="Recenter" onPress={recenter} /></View>
  </View>;
}
