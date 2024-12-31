<script setup lang="ts">
import type { Error } from 'src/types'
import { bbox as turfBbox } from '@turf/bbox'
import { LngLatBounds, Map, NavigationControl } from 'maplibre-gl'
import { onMounted, shallowRef, watchEffect } from 'vue'
import VLoading from './VLoading.vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = withDefaults(defineProps<{
  loading?: boolean
  data?: GeoJSON.FeatureCollection
}>(), {
  loading: false,
})

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
const isLoaded = shallowRef(false)

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
    isLoaded.value = true
    map.value?.on('moveend', updateBoundingBox)
  })
}

// Watch for changes in `props.data` and react accordingly
watchEffect(() => {
  if (props.data && map.value && isLoaded.value) {
    handleMapDataUpdate(props.data)
  }
})

// Handle updates to the map data
function handleMapDataUpdate(data: GeoJSON.FeatureCollection) {
  resetMapLayers()
  setupMapLayers(data)

  if (data.features.length) {
    map.value!.fitBounds(getBoundingBox(data), { padding: 20 })
  }
  else {
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
        ['==', ['get', 'is_removed'], true],
        '#FF0000',
        ['==', ['get', 'is_created'], true],
        '#FFBB00',
        '#F0F0F0',
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
        ['==', ['get', 'is_removed'], true],
        '#FF0000',
        ['==', ['get', 'is_created'], true],
        '#FFBB00',
        '#F0F0F0',
      ],
    },
    filter: ['==', '$type', 'LineString'],
  })
}

// Get the bounding box from the data
function getBoundingBox(data: GeoJSON.FeatureCollection): LngLatBounds {
  const bbox = turfBbox(data)
  return new LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]])
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

  const bounds = map.value.getBounds()
  const bbox = [
    bounds.getSouthWest().lng,
    bounds.getSouthWest().lat,
    bounds.getNorthEast().lng,
    bounds.getNorthEast().lat,
  ].join(',')

  emit('updateBbox', bbox)
}
</script>

<template>
  <div id="map">
    <VLoading v-if="loading" />
  </div>
</template>

<style lang="css" scoped>
#map {
  flex: 1;
  position: relative;
}
</style>
