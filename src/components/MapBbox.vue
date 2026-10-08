<script setup lang="ts">
import type * as GeoJSON from 'geojson'
import maplibre from 'maplibre-gl'
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useDrawMode } from '@/composables/useDrawMode'
import { MAP_STYLE_URL, MIN_ZOOM } from '@/constants/map'
import { parseBbox } from '@/utils/bbox'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = withDefaults(defineProps<{
  bbox?: string
  mapStyleUrl?: string
  heatmapData?: GeoJSON.FeatureCollection | null
}>(), {
  mapStyleUrl: MAP_STYLE_URL,
  heatmapData: null,
})

const emit = defineEmits<{
  (e: 'updateBbox', bbox: string): void
  (e: 'viewportChange', bbox: string): void
}>()

const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer')
const map = shallowRef<maplibre.Map | null>(null)

const BBOX_SOURCE = 'bbox-rect'
const BBOX_FILL_LAYER = 'bbox-fill'
const BBOX_OUTLINE_LAYER = 'bbox-outline'
const BBOX_HANDLES_SOURCE = 'bbox-handles'
const BBOX_HANDLES_LAYER = 'bbox-corner-handles'
const H3_SOURCE = 'h3-heatmap'
const H3_FILL_LAYER = 'h3-fill'
const H3_OUTLINE_LAYER = 'h3-outline'

const H3_FILL_PAINT: maplibre.FillLayerSpecification['paint'] = {
  'fill-color': [
    'interpolate',
    ['linear'],
    ['get', 'count'],
    0,
    '#ffffb2',
    10,
    '#fecc5c',
    50,
    '#fd8d3c',
    200,
    '#e31a1c',
    1000,
    '#800026',
  ],
  'fill-opacity': 0.35,
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'

const CORNER_CURSORS: Record<Corner, string> = {
  nw: 'nw-resize',
  ne: 'ne-resize',
  sw: 'sw-resize',
  se: 'se-resize',
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

let isInteracting = false
let stopInteraction: (() => void) | undefined

function bboxToPolygon(coords: [number, number, number, number]): GeoJSON.Feature<GeoJSON.Polygon> {
  const [west, south, east, north] = coords
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
    },
    properties: {},
  }
}

function bboxToHandles(coords: [number, number, number, number]): GeoJSON.FeatureCollection {
  const [west, south, east, north] = coords
  const corners: [Corner, [number, number]][] = [
    ['nw', [west, north]],
    ['ne', [east, north]],
    ['sw', [west, south]],
    ['se', [east, south]],
  ]
  return {
    type: 'FeatureCollection',
    features: corners.map(([corner, [lng, lat]]) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { corner },
    })),
  }
}

// Updates both the fill/outline rect and the corner handles in one call.
// Pass undefined to clear both layers.
function syncBboxLayers(bbox: string | undefined): void {
  const rectSource = map.value?.getSource(BBOX_SOURCE) as maplibre.GeoJSONSource | undefined
  const handleSource = map.value?.getSource(BBOX_HANDLES_SOURCE) as maplibre.GeoJSONSource | undefined
  const coords = bbox ? parseBbox(bbox) : null
  rectSource?.setData(coords ? bboxToPolygon(coords) : EMPTY_FC)
  handleSource?.setData(coords ? bboxToHandles(coords) : EMPTY_FC)
}

// Updates only the rect — used during live draw before the bbox is committed.
function drawRect(bbox: string): void {
  const source = map.value?.getSource(BBOX_SOURCE) as maplibre.GeoJSONSource | undefined
  const coords = parseBbox(bbox)
  source?.setData(coords ? bboxToPolygon(coords) : EMPTY_FC)
}

function fitMapToBbox(bbox: string): void {
  const coords = parseBbox(bbox)
  if (!coords || !map.value)
    return
  const [west, south, east, north] = coords
  map.value.fitBounds([[west, south], [east, north]], { padding: 20, duration: 0 })
}

function getZoom(): number {
  if (!map.value)
    throw new Error('Init map first.')
  return map.value.getZoom()
}

function getViewportBbox(): string {
  if (!map.value)
    return ''
  const bounds = map.value.getBounds()
  return `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
}

function emitViewport(): void {
  emit('viewportChange', map.value && map.value.getZoom() >= MIN_ZOOM ? getViewportBbox() : '')
}

// Shared boilerplate for resize and drag: disables pan, registers move/up,
// calls computeBbox on each event and emits the final value on mouseup.
function beginInteraction(cursor: string, computeBbox: (e: maplibre.MapMouseEvent) => string): void {
  if (!map.value)
    return
  isInteracting = true
  map.value.dragPan.disable()
  map.value.getCanvas().style.cursor = cursor

  function onMove(e: maplibre.MapMouseEvent): void {
    syncBboxLayers(computeBbox(e))
  }

  function onUp(e: maplibre.MapMouseEvent): void {
    map.value!.off('mousemove', onMove)
    map.value!.off('mouseup', onUp)
    stopInteraction = undefined
    isInteracting = false
    map.value!.dragPan.enable()
    map.value!.getCanvas().style.cursor = ''
    emit('updateBbox', computeBbox(e))
  }

  stopInteraction = () => {
    map.value?.off('mousemove', onMove)
    map.value?.off('mouseup', onUp)
    map.value?.dragPan.enable()
    isInteracting = false
    if (map.value)
      map.value.getCanvas().style.cursor = ''
  }

  map.value.on('mousemove', onMove)
  map.value.on('mouseup', onUp)
}

function startResize(corner: Corner): void {
  if (!map.value || !props.bbox)
    return
  const coords = parseBbox(props.bbox)
  if (!coords)
    return
  const [west, south, east, north] = coords
  const anchor: [number, number] = corner === 'nw'
    ? [east, south]
    : corner === 'ne'
      ? [west, south]
      : corner === 'sw'
        ? [east, north]
        : [west, north]

  beginInteraction(CORNER_CURSORS[corner], (e) => {
    const { lng, lat } = e.lngLat
    return `${Math.min(anchor[0], lng)},${Math.min(anchor[1], lat)},${Math.max(anchor[0], lng)},${Math.max(anchor[1], lat)}`
  })
}

function startDrag(origin: maplibre.LngLat): void {
  if (!map.value || !props.bbox)
    return
  const coords = parseBbox(props.bbox)
  if (!coords)
    return
  const [west, south, east, north] = coords
  const width = east - west
  const height = north - south

  beginInteraction('grabbing', (e) => {
    const dLng = e.lngLat.lng - origin.lng
    const dLat = e.lngLat.lat - origin.lat
    const newWest = west + dLng
    const newSouth = south + dLat
    return `${newWest},${newSouth},${newWest + width},${newSouth + height}`
  })
}

const { isDrawing, toggle: toggleDrawMode } = useDrawMode(map, {
  onDrawMove: bbox => drawRect(bbox),
  onDrawEnd: (bbox) => {
    syncBboxLayers(bbox)
    emit('updateBbox', bbox)
  },
  onDrawCancel: () => syncBboxLayers(props.bbox),
})

watch(
  () => props.bbox,
  (newBbox, oldBbox) => {
    if (!map.value)
      return
    syncBboxLayers(newBbox)
    if (newBbox && newBbox !== oldBbox)
      fitMapToBbox(newBbox)
  },
)

watch(
  () => props.heatmapData,
  (data) => {
    const source = map.value?.getSource(H3_SOURCE) as maplibre.GeoJSONSource | undefined
    source?.setData(data ?? EMPTY_FC)
  },
)

onMounted(() => {
  map.value = new maplibre.Map({
    container: mapContainer.value!,
    style: props.mapStyleUrl,
    attributionControl: { compact: false },
    renderWorldCopies: false,
  })

  map.value.addControl(new maplibre.NavigationControl())

  map.value.on('load', () => {
    map.value!.addSource(H3_SOURCE, {
      type: 'geojson',
      data: props.heatmapData ?? EMPTY_FC,
    })
    map.value!.addLayer({
      id: H3_FILL_LAYER,
      type: 'fill',
      source: H3_SOURCE,
      paint: H3_FILL_PAINT,
    })
    map.value!.addLayer({
      id: H3_OUTLINE_LAYER,
      type: 'line',
      source: H3_SOURCE,
      paint: { 'line-color': '#333333', 'line-width': 0.5 },
    })

    map.value!.addSource(BBOX_SOURCE, {
      type: 'geojson',
      data: EMPTY_FC,
    })
    map.value!.addLayer({
      id: BBOX_FILL_LAYER,
      type: 'fill',
      source: BBOX_SOURCE,
      paint: { 'fill-color': '#082e4e', 'fill-opacity': 0.1 },
    })
    map.value!.addLayer({
      id: BBOX_OUTLINE_LAYER,
      type: 'line',
      source: BBOX_SOURCE,
      paint: { 'line-color': '#082e4e', 'line-width': 2 },
    })

    map.value!.addSource(BBOX_HANDLES_SOURCE, {
      type: 'geojson',
      data: EMPTY_FC,
    })
    map.value!.addLayer({
      id: BBOX_HANDLES_LAYER,
      type: 'circle',
      source: BBOX_HANDLES_SOURCE,
      paint: {
        'circle-radius': 6,
        'circle-color': '#082e4e',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    // Cursor: handles take priority over fill (handles > fill > default).
    map.value!.on('mousemove', (e) => {
      if (isDrawing.value || isInteracting)
        return
      const handles = map.value!.queryRenderedFeatures(e.point, { layers: [BBOX_HANDLES_LAYER] })
      if (handles.length > 0) {
        const corner = handles[0].properties?.corner as Corner | undefined
        map.value!.getCanvas().style.cursor = corner ? CORNER_CURSORS[corner] : 'grab'
        return
      }
      const fill = map.value!.queryRenderedFeatures(e.point, { layers: [BBOX_FILL_LAYER] })
      map.value!.getCanvas().style.cursor = fill.length > 0 ? 'grab' : ''
    })

    map.value!.on('mousedown', BBOX_HANDLES_LAYER, (e) => {
      e.preventDefault()
      const corner = e.features?.[0]?.properties?.corner as Corner | undefined
      if (corner)
        startResize(corner)
    })

    map.value!.on('mousedown', (e) => {
      if (isDrawing.value || !props.bbox)
        return
      const handles = map.value!.queryRenderedFeatures(e.point, { layers: [BBOX_HANDLES_LAYER] })
      if (handles.length > 0)
        return
      const fill = map.value!.queryRenderedFeatures(e.point, { layers: [BBOX_FILL_LAYER] })
      if (fill.length > 0) {
        e.preventDefault()
        startDrag(e.lngLat)
      }
    })

    map.value!.on('moveend', emitViewport)

    if (props.bbox) {
      fitMapToBbox(props.bbox)
      syncBboxLayers(props.bbox)
    }
    else {
      emitViewport()
    }
  })
})

onUnmounted(() => {
  stopInteraction?.()
  map.value?.remove()
})

defineExpose({ getZoom, getViewportBbox })
</script>

<template>
  <div class="map-bbox-wrapper">
    <div ref="mapContainer" class="map-bbox" />
    <button
      class="draw-bbox-btn"
      :class="{ 'draw-bbox-btn--active': isDrawing }"
      type="button"
      @click="toggleDrawMode"
    >
      {{ isDrawing ? 'Cancel draw' : 'Draw bbox' }}
    </button>
  </div>
</template>

<style scoped>
.map-bbox-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.map-bbox {
  border: 1px solid grey;
  height: 100%;
  width: 100%;
}

.draw-bbox-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.draw-bbox-btn--active {
  background: #082e4e;
  color: #fff;
  border-color: #082e4e;
}

.draw-bbox-btn:not(.draw-bbox-btn--active):hover {
  background: #f0f4f8;
  border-color: #082e4e;
}
</style>
