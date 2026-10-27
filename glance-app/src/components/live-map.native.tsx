import { Camera, GeoJSONSource, Layer, Map as MapLibreMap, Marker, type CameraRef, type PressEvent } from '@maplibre/maplibre-react-native';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { closePolygonRing, isValidCoordinate, validatePolygon } from '../../../shared/geofence.ts';
import type { LiveMapProps } from './live-map.types';
import { fromMapCoordinate, initialMapCenter, mapCameraPadding, toMapCoordinate } from './live-map.geometry';
import { Button, IconButton, Label, Surface, usePalette } from './tracking-ui';

function feature(geometry: GeoJSON.Geometry): GeoJSON.Feature {
  return { type: 'Feature', properties: {}, geometry };
}

export default function LiveMap({ polygon, devices, selectedDeviceId, onDevicePress, editMode = false, previewVertices = [], onMapPress, style, controlsTop = 16, contentBottom = 32, onRefresh, refreshing = false, refreshDisabled = false, onUndo, undoDisabled = false }: LiveMapProps): React.JSX.Element {
  const camera = useRef<CameraRef>(null);
  const [initial] = useState(() => initialMapCenter(polygon, devices));
  const [mapError, setMapError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapHeight, setMapHeight] = useState(320);
  const [attributionHeight, setAttributionHeight] = useState(24);
  const colors = usePalette();
  const reducedMotion = useReducedMotion();
  const mapGesture = useMemo(() => Gesture.Native().shouldActivateOnStart(true).disallowInterruption(true), []);
  const saved = useMemo(() => polygon.length >= 3 ? feature({ type: 'Polygon', coordinates: [closePolygonRing(polygon).map(toMapCoordinate)] }) : null, [polygon]);
  const validation = useMemo(() => validatePolygon(previewVertices), [previewVertices]);
  const previewFill = validation.valid ? feature({ type: 'Polygon', coordinates: [closePolygonRing(validation.vertices).map(toMapCoordinate)] }) : null;
  const previewLine = previewVertices.length >= 2 ? feature({ type: 'LineString', coordinates: (validation.valid ? closePolygonRing(validation.vertices) : previewVertices).map(toMapCoordinate) }) : null;

  function recenter(): void {
    const coordinates = [...polygon, ...previewVertices, ...devices.flatMap(device => device.location ? [device.location] : [])];
    if (!coordinates.length) { camera.current?.jumpTo({ center: initial, zoom: 16 }); return; }
    const longitudes = coordinates.map(coordinate => coordinate.longitude);
    const latitudes = coordinates.map(coordinate => coordinate.latitude);
    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);
    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);
    camera.current?.fitBounds([west - 0.001, south - 0.001, east + 0.001, north + 0.001], {
      padding: mapCameraPadding(mapHeight, controlsTop, contentBottom, attributionHeight), duration: reducedMotion ? 0 : 180, easing: 'ease',
    });
  }

  function mapPress(event: NativeSyntheticEvent<PressEvent>): void {
    const coordinate = fromMapCoordinate(event.nativeEvent.lngLat);
    if (editMode && isValidCoordinate(coordinate)) onMapPress?.(coordinate);
  }

  return <View onLayout={event => setMapHeight(event.nativeEvent.layout.height)} style={[{ height: 320, backgroundColor: colors.background }, style]}>
    <GestureDetector gesture={mapGesture}>
      <View collapsable={false} style={StyleSheet.absoluteFill}>
        <MapLibreMap key={mapKey} androidView="texture" attribution attributionPosition={{ bottom: contentBottom + 8, left: 16 }}
          mapStyle="https://tiles.openfreemap.org/styles/dark" style={StyleSheet.absoluteFill}
          onPress={mapPress} onDidFailLoadingMap={() => setMapError(true)} onDidFinishLoadingMap={() => setMapError(false)}>
          <Camera ref={camera} initialViewState={{ center: initial, zoom: 16 }} minZoom={3} maxZoom={19} />
          {saved && <GeoJSONSource id="saved-fence" data={saved}>
            <Layer id="saved-fill" type="fill" paint={{ 'fill-color': colors['chart-1'], 'fill-opacity': previewVertices.length > 0 ? 0.05 : 0.14 }} />
            <Layer id="saved-line" type="line" paint={{ 'line-color': colors['chart-1'], 'line-width': 2, 'line-opacity': previewVertices.length > 0 ? 0.6 : 1 }} />
          </GeoJSONSource>}
          {previewFill && <GeoJSONSource id="preview-fill-source" data={previewFill}>
            <Layer id="preview-fill" type="fill" paint={{ 'fill-color': colors['chart-1'], 'fill-opacity': 0.14 }} />
          </GeoJSONSource>}
          {previewLine && <GeoJSONSource id="preview-line-source" data={previewLine}>
            <Layer id="preview-line" type="line" paint={{ 'line-color': colors['chart-1'], 'line-width': 3, 'line-dasharray': [2, 2] }} />
          </GeoJSONSource>}
          {previewVertices.map((coordinate, index) => <Marker key={index} lngLat={toMapCoordinate(coordinate)} anchor="center">
            <View accessible accessibilityLabel={'Draft vertex ' + (index + 1)} style={{ backgroundColor: colors['chart-1'], borderColor: '#121212', borderWidth: 3, borderRadius: 24, minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
              <Label weight="semibold" style={{ color: '#000000' }}>{index + 1}</Label>
            </View>
          </Marker>)}
          {devices.flatMap(device => device.location ? [<Marker key={device.deviceId} id={device.deviceId} lngLat={toMapCoordinate(device.location)} anchor="center" onPress={() => onDevicePress?.(device.deviceId)}>
            <View accessible accessibilityRole={onDevicePress ? 'button' : 'text'} accessibilityLabel={onDevicePress ? 'Select tracker ' + device.deviceId : 'Tracker ' + device.deviceId} accessibilityState={{ selected: device.deviceId === selectedDeviceId }} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: device.deviceId === selectedDeviceId ? 30 : 24, height: device.deviceId === selectedDeviceId ? 30 : 24, borderRadius: 18, borderWidth: 3, borderColor: colors.foreground, backgroundColor: colors['chart-2'], alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.foreground }} />
              </View>
            </View>
          </Marker>] : [])}
        </MapLibreMap>
      </View>
    </GestureDetector>
    {mapError && <Surface style={{ position: 'absolute', top: controlsTop, left: 16, right: 76, maxHeight: 180 }}>
      <ScrollView contentContainerStyle={{ gap: 12, padding: 12 }}>
        <Label accessibilityLiveRegion="polite">Basemap unavailable. Confirmed coordinates remain available. Tiles are not cached.</Label>
        <Button label="Retry map" icon="refresh" onPress={() => { setMapError(false); setMapKey(previous => previous + 1); }} />
      </ScrollView>
    </Surface>}
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, top: controlsTop, gap: 8 }}>
      <IconButton label="Recenter fence and trackers" icon="locate" onPress={recenter} />
      {onRefresh && <IconButton label="Refresh server" icon="refresh" onPress={onRefresh} busy={refreshing} disabled={refreshDisabled} />}
      {onUndo && <IconButton label="Undo last vertex" icon="undo" onPress={onUndo} disabled={undoDisabled} />}
    </View>
    <View pointerEvents="none" onLayout={event => setAttributionHeight(event.nativeEvent.layout.height)} style={{ position: 'absolute', bottom: contentBottom + 8, right: 12, left: 44, alignItems: 'flex-start' }}>
      <Label muted style={{ backgroundColor: '#121212', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, lineHeight: 16 }}>© OpenStreetMap contributors · OpenFreeMap</Label>
    </View>
  </View>;
}
