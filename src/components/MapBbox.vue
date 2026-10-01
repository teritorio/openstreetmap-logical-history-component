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
  (e: 'viewportChange', bbox: string): void
}>()

const mapContainer = useTemplateRef<HTMLDivElement>('mapContainer')
const wrapperRef = useTemplateRef<HTMLDivElement>('bboxWrapper')
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

type Corner = 'nw' | 'ne' | 'sw' | 'se'
type HandlePositions = Record<Corner, { x: number, y: number }>

const handlePositions = shallowRef<HandlePositions | null>(null)
let cleanupDrag: (() => void) | undefined

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

function emitViewport(): void {
  if (!map.value)
    return
  const b = map.value.getBounds()
  emit('viewportChange', `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
}

function updateHandlePositionsFromBbox(bbox: string): void {
  if (!map.value) {
    handlePositions.value = null
    return
  }
  const parsed = parseBbox(bbox)
  if (!parsed) {
    handlePositions.value = null
    return
  }
  const [west, south, east, north] = parsed
  handlePositions.value = {
    nw: map.value.project([west, north] as [number, number]),
    ne: map.value.project([east, north] as [number, number]),
    sw: map.value.project([west, south] as [number, number]),
    se: map.value.project([east, south] as [number, number]),
  }
}

function updateHandlePositions(): void {
  if (!props.bbox) {
    handlePositions.value = null
    return
  }
  updateHandlePositionsFromBbox(props.bbox)
}

function startResize(corner: Corner, e: MouseEvent): void {
  e.preventDefault()
  e.stopPropagation()
  if (!map.value || !props.bbox || !wrapperRef.value)
    return

  const parsed = parseBbox(props.bbox)
  if (!parsed)
    return
  const [west, south, east, north] = parsed

  const anchor: [number, number] = corner === 'nw'
    ? [east, south]
    : corner === 'ne'
      ? [west, south]
      : corner === 'sw'
        ? [east, north]
        : [west, north]

  map.value.dragPan.disable()

  const wrapperEl = wrapperRef.value

  function onMove(ev: MouseEvent): void {
    if (!map.value)
      return
    const rect = wrapperEl.getBoundingClientRect()
    const pt = map.value.unproject([ev.clientX - rect.left, ev.clientY - rect.top] as [number, number])
    const newBbox = `${Math.min(anchor[0], pt.lng)},${Math.min(anchor[1], pt.lat)},${Math.max(anchor[0], pt.lng)},${Math.max(anchor[1], pt.lat)}`
    drawRect(newBbox)
    updateHandlePositionsFromBbox(newBbox)
  }

  function onUp(ev: MouseEvent): void {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    cleanupDrag = undefined
    if (!map.value)
      return
    map.value.dragPan.enable()
    const rect = wrapperEl.getBoundingClientRect()
    const pt = map.value.unproject([ev.clientX - rect.left, ev.clientY - rect.top] as [number, number])
    const newBbox = `${Math.min(anchor[0], pt.lng)},${Math.min(anchor[1], pt.lat)},${Math.max(anchor[0], pt.lng)},${Math.max(anchor[1], pt.lat)}`
    emit('updateBbox', newBbox)
  }

  cleanupDrag = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    map.value?.dragPan.enable()
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
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
      updateHandlePositionsFromBbox(newBbox)
    }
    else {
      clearRect()
      handlePositions.value = null
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

    map.value!.on('move', updateHandlePositions)
    map.value!.on('zoom', updateHandlePositions)
    map.value!.on('moveend', emitViewport)
    emitViewport()

    if (props.bbox) {
      fitMapToBbox(props.bbox)
      drawRect(props.bbox)
      updateHandlePositionsFromBbox(props.bbox)
    }
  })
})

onUnmounted(() => {
  cleanupDrag?.()
  map.value?.remove()
})

defineExpose({ getZoom })
</script>

<template>
  <div ref="bboxWrapper" class="map-bbox-wrapper">
    <div ref="mapContainer" class="map-bbox" />
    <button
      class="draw-bbox-btn"
      :class="{ 'draw-bbox-btn--active': isDrawing }"
      type="button"
      @click="toggleDrawMode"
    >
      {{ isDrawing ? 'Cancel draw' : 'Draw bbox' }}
    </button>
    <template v-if="handlePositions">
      <div
        v-for="corner in (['nw', 'ne', 'sw', 'se'] as const)"
        :key="corner"
        class="bbox-handle"
        :class="`bbox-handle--${corner}`"
        :style="{
          left: `${handlePositions[corner].x}px`,
          top: `${handlePositions[corner].y}px`,
        }"
        @mousedown="startResize(corner, $event)"
      />
    </template>
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

.bbox-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #082e4e;
  border: 2px solid #fff;
  border-radius: 2px;
  transform: translate(-50%, -50%);
  z-index: 5;
  pointer-events: all;
}

.bbox-handle--nw {
  cursor: nw-resize;
}
.bbox-handle--ne {
  cursor: ne-resize;
}
.bbox-handle--sw {
  cursor: sw-resize;
}
.bbox-handle--se {
  cursor: se-resize;
}
</style>
