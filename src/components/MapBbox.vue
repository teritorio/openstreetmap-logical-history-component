<script setup lang="ts">
import type * as GeoJSON from 'geojson'
import maplibre from 'maplibre-gl'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { MAP_STYLE_URL } from '@/constants/map'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = withDefaults(defineProps<{
  bbox?: string
  mapStyleUrl?: string
}>(), {
  mapStyleUrl: MAP_STYLE_URL,
})

const emit = defineEmits<{
  (e: 'updateBbox', bbox: string): void
}>()

const map = shallowRef<maplibre.Map | null>(null)
const isDrawing = ref(false)

const BBOX_SOURCE = 'bbox-rect'
const BBOX_FILL_LAYER = 'bbox-fill'
const BBOX_OUTLINE_LAYER = 'bbox-outline'

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

// Draw mode
let drawStart: maplibre.LngLat | null = null

function onDrawMouseMove(e: maplibre.MapMouseEvent): void {
  if (!drawStart)
    return
  const west = Math.min(drawStart.lng, e.lngLat.lng)
  const east = Math.max(drawStart.lng, e.lngLat.lng)
  const south = Math.min(drawStart.lat, e.lngLat.lat)
  const north = Math.max(drawStart.lat, e.lngLat.lat)
  drawRect(`${west},${south},${east},${north}`)
}

function onDrawMouseUp(e: maplibre.MapMouseEvent): void {
  if (!drawStart || !map.value)
    return
  map.value.off('mousemove', onDrawMouseMove)
  map.value.off('mousedown', onDrawMouseDown)
  map.value.getCanvas().style.cursor = ''
  map.value.dragPan.enable()
  isDrawing.value = false

  const west = Math.min(drawStart.lng, e.lngLat.lng)
  const east = Math.max(drawStart.lng, e.lngLat.lng)
  const south = Math.min(drawStart.lat, e.lngLat.lat)
  const north = Math.max(drawStart.lat, e.lngLat.lat)
  drawStart = null

  const bbox = `${west},${south},${east},${north}`
  drawRect(bbox)
  emit('updateBbox', bbox)
}

function onDrawMouseDown(e: maplibre.MapMouseEvent): void {
  e.preventDefault()
  drawStart = e.lngLat
  map.value!.on('mousemove', onDrawMouseMove)
  map.value!.once('mouseup', onDrawMouseUp)
}

function toggleDrawMode(): void {
  if (!map.value)
    return
  isDrawing.value = !isDrawing.value
  if (isDrawing.value) {
    map.value.getCanvas().style.cursor = 'crosshair'
    map.value.dragPan.disable()
    map.value.on('mousedown', onDrawMouseDown)
  }
  else {
    map.value.getCanvas().style.cursor = ''
    map.value.dragPan.enable()
    map.value.off('mousedown', onDrawMouseDown)
    map.value.off('mousemove', onDrawMouseMove)
    drawStart = null
  }
}

onMounted(() => {
  map.value = new maplibre.Map({
    container: 'bbox-selector',
    style: props.mapStyleUrl,
    attributionControl: { compact: false },
  })

  map.value.addControl(new maplibre.NavigationControl())

  map.value.on('load', () => {
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
    <div id="bbox-selector" class="map-bbox" />
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
