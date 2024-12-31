<script setup lang="ts">
import type { Error } from 'src/types'
import { bbox as turfBbox } from '@turf/bbox'
import { LngLatBounds, Map, NavigationControl } from 'maplibre-gl'
import { onMounted, ref, watch } from 'vue'
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
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/teritorio-basic/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'

const map = ref<Map>()
const isLoaded = ref(false)

onMounted(() => {
  // Initialize Map
  map.value = new Map({
    hash: true,
    container: 'map',
    center: [0, 0],
    style: MAP_STYLE_URL,
  })

  map.value.addControl(new NavigationControl())

  map.value.on('load', () => {
    isLoaded.value = true
    map.value!.on('moveend', setBBox)
  })
})

watch(() => props.data, (newValue) => {
  if (map.value && isLoaded.value && newValue) {
    setupMapLayers(newValue)

    if (newValue.features.length) {
      map.value.fitBounds(getBoundingBox(newValue), { padding: 20 })
    }
    else {
      emit('error', { message: '0 changes has been found ! ', type: 'warning' })
      map.value.setCenter([0, 0])
      map.value.setZoom(0)
    }
  }
})

// Set up map source and layers
function setupMapLayers(data: GeoJSON.FeatureCollection): void {
  resetMapLayers()

  if (map.value) {
    map.value.addSource(SOURCE_ID, { type: 'geojson', data })

    // Point type
    map.value.addLayer({
      id: 'feature-points',
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
      id: 'feature-lines',
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
}

// Get bounding box from data
function getBoundingBox(data: GeoJSON.FeatureCollection): LngLatBounds {
  const bbox = turfBbox(data)

  return new LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]])
}

// Reset map source and layers
function resetMapLayers(): void {
  if (map.value) {
    // Remove existing layers if they exist
    if (map.value.getLayer('points')) {
      map.value.removeLayer('points')
    }

    if (map.value.getLayer('lines')) {
      map.value.removeLayer('lines')
    }

    // Remove the source if it exists
    if (map.value.getSource(SOURCE_ID)) {
      map.value.removeSource(SOURCE_ID)
    }
  }
}

// Update bbox input value based on current map position
function setBBox(): void {
  if (map.value) {
    const bounds = map.value.getBounds()
    const bbox = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ].join(',')

    emit('updateBbox', bbox)
  }
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
