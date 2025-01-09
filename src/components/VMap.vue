<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import type { GeoJSONSource } from 'maplibre-gl'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import { LngLatBounds, Map, NavigationControl } from 'maplibre-gl'
import { onMounted, ref, shallowRef, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const emit = defineEmits<{
  (e: 'error', payload: Error): void
  (e: 'updateBbox', bbox: string): void
}>()

const { loCha, featureCount } = useLoCha()

const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/teritorio-tourism-latest/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'
const LAYERS = {
  LineStringCreate: 'feature-lines-create',
  LineStringDelete: 'feature-lines-delete',
  LineStringAfter: 'feature-lines-after',
  LineStringBefore: 'feature-lines-before',
  PointCreate: 'feature-points-create',
  PointDelete: 'feature-points-delete',
  PointBefore: 'feature-points-before',
  PointAfter: 'feature-points-after',
}

const map = shallowRef<Map>()
const source = ref<GeoJSONSource>()

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
    // console.log('load', loCha.value)

    map.value?.addSource(SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    source.value = map.value?.getSource(SOURCE_ID)

    setupMapLayers()
  })
}

// Handle updates to the map data
function handleMapDataUpdate(data: ApiResponse) {
  source.value?.setData(data)

  if (featureCount.value && data.bbox) {
    map.value?.fitBounds(new LngLatBounds(data.bbox as [number, number, number, number]), { padding: 20 })
  }
  else {
    map.value?.setCenter([0, 0])
    map.value?.setZoom(0)
    emit('error', { message: '0 changes have been found!', type: 'warning' })
  }
}

// Set up map layers
function setupMapLayers(): void {
  if (!map.value)
    return

  // LineString type
  map.value.addLayer({
    id: LAYERS.LineStringCreate,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 2,
      'line-color': loChaColors.create,
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'LineString'],
      ['==', ['get', 'is_created'], true],
    ],
  })

  map.value.addLayer({
    id: LAYERS.LineStringDelete,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 2,
      'line-color': loChaColors.delete,
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'LineString'],
      ['==', ['get', 'is_deleted'], true],
    ],
  })

  map.value.addLayer({
    id: LAYERS.LineStringBefore,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 2,
      'line-color': loChaColors.update,
      'line-opacity': 0.5,
      'line-offset': 8,
      'line-dasharray': [4, 2],
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'LineString'],
      ['==', ['get', 'is_before'], true],
    ],
  })

  map.value.addLayer({
    id: LAYERS.LineStringAfter,
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 2,
      'line-color': loChaColors.update,
      'line-dasharray': [4, 2],
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'LineString'],
      ['==', ['get', 'is_after'], true],
    ],
  })

  // Point type
  map.value.addLayer({
    id: LAYERS.PointCreate,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': loChaColors.create,
      'circle-radius': 12,
      'circle-stroke-color': '#000000',
      'circle-stroke-width': 4,
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['==', ['get', 'is_created'], true],
    ],
  })

  map.value.addLayer({
    id: LAYERS.PointDelete,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': loChaColors.delete,
      'circle-radius': 12,
      'circle-stroke-color': '#000000',
      'circle-stroke-width': 4,
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['==', ['get', 'is_deleted'], true],
    ],
  })

  map.value.addLayer({
    id: LAYERS.PointBefore,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': loChaColors.update,
      'circle-radius': 12,
      'circle-stroke-color': '#000000',
      'circle-stroke-width': 4,
      'circle-opacity': 0.5,
      'circle-translate': [28, 0],
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['==', ['get', 'is_before'], true],
    ],
  })

  map.value.addLayer({
    id: LAYERS.PointAfter,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': loChaColors.update,
      'circle-radius': 12,
      'circle-stroke-color': '#000000',
      'circle-stroke-width': 4,
    },
    filter: [
      'all',
      ['==', ['geometry-type'], 'Point'],
      ['==', ['get', 'is_after'], true],
    ],
  })
}

// Update bounding box and emit event
function updateBoundingBox(): void {
  if (!map.value)
    return

  const bounds = map.value.getBounds()
  const { lat: neLat, lng: neLng } = bounds.getNorthEast()
  const { lat: swLat, lng: swLng } = bounds.getSouthWest()
  emit('updateBbox', [[swLat, swLng], [neLat, neLng]].toString())
}

onMounted(() => initializeMap())

watch(() => loCha, (newValue) => {
  if (source.value && newValue.value) {
    handleMapDataUpdate(newValue.value)
  }
}, { deep: true })
</script>

<template>
  <div id="map" />
</template>

<style lang="css" scoped>
#map {
  position: relative;
}
</style>
