<script setup lang="ts">
import type * as GeoJSON from 'geojson'
import maplibre from 'maplibre-gl'
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useDrawMode } from '@/composables/useDrawMode'
import { MAP_STYLE_URL } from '@/constants/map'
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
}>()

const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer')
const map = shallowRef<maplibre.Map | null>(null)

const BBOX_SOURCE = 'bbox-rect'
const BBOX_FILL_LAYER = 'bbox-fill'
const BBOX_OUTLINE_LAYER = 'bbox-outline'
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
  'fill-opacity': 0.6,
}

function parseBbox(bbox: string): [number, number, number, number] | null {
  const parts = bbox.split(',').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN))
    return null
  return parts as [number, number, number, number]
}

function bboxToGeoJSON(bbox: string): GeoJSON.Feature<GeoJSON.Polygon> | null {
  const parsed = parseBbox(bbox)
  if (!parsed)
    return null
  const [west, south, east, north] = parsed
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
    },
    properties: {},
  }
}

function drawRect(bbox: string): void {
  const source = map.value?.getSource(BBOX_SOURCE) as maplibre.GeoJSONSource | undefined
  if (!source)
    return
  const feature = bboxToGeoJSON(bbox)
  source.setData(feature ?? ({ type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection))
}

function clearRect(): void {
  const source = map.value?.getSource(BBOX_SOURCE) as maplibre.GeoJSONSource | undefined
  source?.setData({ type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection)
}

function fitMapToBbox(bbox: string): void {
  const parsed = parseBbox(bbox)
  if (!parsed || !map.value)
    return
  const [west, south, east, north] = parsed
  map.value.fitBounds([[west, south], [east, north]], { padding: 20, duration: 0 })
}

function getZoom(): number {
  if (!map.value)
    throw new Error('Init map first.')
  return map.value.getZoom()
}

const { isDrawing, toggle: toggleDrawMode } = useDrawMode(map, {
  onDrawMove: bbox => drawRect(bbox),
  onDrawEnd: (bbox) => {
    drawRect(bbox)
    emit('updateBbox', bbox)
  },
  onDrawCancel: () => {
    if (props.bbox)
      drawRect(props.bbox)
    else
      clearRect()
  },
})

watch(
  () => props.bbox,
  (newBbox) => {
    if (!map.value)
      return
    if (newBbox) {
      fitMapToBbox(newBbox)
      drawRect(newBbox)
    }
    else {
      clearRect()
    }
  },
)

watch(
  () => props.heatmapData,
  (data) => {
    const source = map.value?.getSource(H3_SOURCE) as maplibre.GeoJSONSource | undefined
    if (!source)
      return
    source.setData(data ?? { type: 'FeatureCollection', features: [] })
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
      data: props.heatmapData ?? { type: 'FeatureCollection', features: [] },
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
      data: { type: 'FeatureCollection', features: [] },
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

    if (props.bbox) {
      fitMapToBbox(props.bbox)
      drawRect(props.bbox)
    }
  })
})

onUnmounted(() => {
  map.value?.remove()
})

defineExpose({ getZoom })
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
