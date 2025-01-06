<script setup lang="ts">
import type { Error } from '@/types'
import { loChaColors } from '@/composables/useLoCha'
import { LngLatBounds, Map, NavigationControl } from 'maplibre-gl'
import { onMounted, shallowRef } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  data: GeoJSON.FeatureCollection
}>()

const emit = defineEmits<{
  (e: 'updateBbox', payload: string): void
  (e: 'error', payload: Error): void
}>()

const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/teritorio-tourism-latest/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'
const LAYERS = {
  Point: 'feature-points',
  LineString: 'feature-lines',
}

const map = shallowRef<Map>()

onMounted(() => initializeMap())

// Initialize the map and set up event listeners
function initializeMap() {
  map.value = new Map({
    hash: true,
    container: 'map',
    center: [0, 0],
    style: MAP_STYLE_URL,
  })

  map.value.addControl(new NavigationControl())

  map.value.on('load', () => {
    map.value?.on('moveend', updateBoundingBox)
    handleMapDataUpdate(props.data)
  })
}

// Handle updates to the map data
function handleMapDataUpdate(data: GeoJSON.FeatureCollection) {
  resetMapLayers()
  setupMapLayers(data)

  if (data.features.length) {
    if (data.bbox)
      map.value!.fitBounds(new LngLatBounds(data.bbox as [number, number, number, number]), { padding: 20 })
  }

  if (!data.features.length) {
    emit('error', { message: '0 changes have been found!', type: 'warning' })
    map.value!.setCenter([0, 0])
    map.value!.setZoom(0)
  }
}

// Set up map layers based on provided data
function setupMapLayers(data: GeoJSON.FeatureCollection): void {
  if (!map.value)
    return

  map.value.addSource(SOURCE_ID, { type: 'geojson', data })

  // Point type
  map.value.addLayer({
    id: LAYERS.Point,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'is_deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
        loChaColors.update,
      ],
      'circle-radius': 12,
    },
    filter: ['==', '$type', 'Point'],
  })

  // LineString type
  map.value.addLayer({
    id: LAYERS.LineString,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 6,
      'line-color': [
        'case',
        ['==', ['get', 'is_deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
        loChaColors.update,
      ],
    },
    filter: ['==', '$type', 'LineString'],
  })
}

// Reset map layers
function resetMapLayers(): void {
  if (!map.value)
    return

  Object.values(LAYERS).forEach((layer) => {
    if (map.value!.getLayer(layer)) {
      map.value!.removeLayer(layer)
    }
  })

  resetMapSource()
}

// Reset map source
function resetMapSource(): void {
  if (!map.value)
    return

  if (map.value.getSource(SOURCE_ID)) {
    map.value.removeSource(SOURCE_ID)
  }
}

// Update bounding box and emit event
function updateBoundingBox(): void {
  if (!map.value)
    return

  emit('updateBbox', map.value.getBounds().toArray().join(','))
}
</script>

<template>
  <div id="map" />
</template>

<style lang="css" scoped>
#map {
  flex: 1;
  position: relative;
}
</style>
