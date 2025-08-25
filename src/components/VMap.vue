<script setup lang="ts">
import type { AddLayerObject, LngLatLike, MapMouseEvent } from 'maplibre-gl'
import type { LoChaGroup } from '@/composables/useLoCha'
import turfBbox from '@turf/bbox'
import { vIntersectionObserver } from '@vueuse/components'
import maplibre from 'maplibre-gl'
import { shallowRef, watch } from 'vue'
import { loChaColors } from '@/composables/useLoCha'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  id: number
  features: LoChaGroup
}>()

type LayerKey = 'Polygon' | 'Point' | 'LineString'

type MapMouseEventWithFeatures = MapMouseEvent & {
  features?: maplibre.MapGeoJSONFeature[]
}

const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://vecto-dev.teritorio.xyz/styles/positron/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'
const LAYERS = {
  Polygon: {
    id: 'feature-polygons',
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5,
      ],
      'fill-color': [
        'case',
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
        ['==', ['get', 'is_deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
      'fill-outline-color': '#000000',
    },
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
  },
  LineString: {
    id: 'feature-lines',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        6,
        4,
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5,
      ],
      'line-color': [
        'case',
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
        ['==', ['get', 'is_deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
    },
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
  },
  Point: {
    id: 'feature-points',
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        14,
        12,
      ],
      'circle-stroke-color': '#000000',
      'circle-stroke-width': 2,
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5,

      ],
      'circle-color': [
        'case',
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
        ['==', ['get', 'is_deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
    },
    filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
  },
} satisfies Partial<Record<LayerKey, AddLayerObject>>

const map = shallowRef<maplibre.Map>()
const isVisible = shallowRef(false)
const popup = shallowRef<maplibre.Popup>()
const hoveredStateFeature = shallowRef<maplibre.MapGeoJSONFeature>()

watch(isVisible, (newState) => {
  if (newState) {
    initMap()
  }
  else {
    removeEventListeners()
    map.value = undefined
  }
})

function initMap() {
  if (!map.value) {
    map.value = new maplibre.Map({
      hash: false,
      container: `map-${props.id}`,
      bounds: new maplibre.LngLatBounds(
        turfBbox({
          type: 'FeatureCollection',
          features: props.features,
        }) as [number, number, number, number],
      ),
      fitBoundsOptions: {
        padding: {
          top: 20,
          left: 20,
          right: 20,
          bottom: 60,
        },
      },
      style: MAP_STYLE_URL,
    })

    map.value.addControl(new maplibre.NavigationControl())

    map.value.on('load', handleMapOnLoad)
  }
}

function handleMapOnLoad(): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  map.value!.addSource(SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: props.features,
    },
  })

  setupMapLayers()
  setEventListeners()
}

function setupMapLayers(): void {
  if (!map.value)
    throw new Error('Call useMap.init() function first.')

  if (!map.value.getLayer(LAYERS.Polygon.id)) {
    map.value.addLayer(LAYERS.Polygon)
  }

  if (!map.value.getLayer(LAYERS.LineString.id)) {
    map.value.addLayer(LAYERS.LineString)
  }

  if (!map.value.getLayer(LAYERS.Point.id)) {
    map.value.addLayer(LAYERS.Point)
  }
}

function handleMouseMove(e: MapMouseEventWithFeatures) {
  if (!e.features || e.features.length === 0)
    return

  if (hoveredStateFeature.value !== undefined) {
    removePopup()
  }

  hoveredStateFeature.value = e.features[0]

  openPopup(e.lngLat, e.features[0])
}

function handleMouseEnter(): void {
  map.value!.getCanvas().style.cursor = 'pointer'
}

function handleMouseLeave(): void {
  map.value!.getCanvas().style.cursor = ''

  if (hoveredStateFeature.value !== undefined) {
    hoveredStateFeature.value = undefined
  }

  removePopup()
}

function setEventListeners(): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  Object.values(LAYERS).forEach((layer) => {
    map.value!.on('mousemove', layer.id, handleMouseMove)

    map.value!.on('mouseenter', layer.id, handleMouseEnter)

    map.value!.on('mouseleave', layer.id, handleMouseLeave)
  })
}

function removeEventListeners(): void {
  map.value!.off('load', handleMapOnLoad)

  Object.values(LAYERS).forEach((layer) => {
    map.value!.off('mousemove', layer.id, handleMouseMove)
    map.value!.off('mouseenter', layer.id, handleMouseEnter)
    map.value!.off('mouseleave', layer.id, handleMouseLeave)
  })
}

function openPopup(coords: LngLatLike, feature: maplibre.MapGeoJSONFeature): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  popup.value = new maplibre.Popup()
    .setLngLat(coords)
    .setHTML(`${feature.properties.objtype}-${feature.properties.id}-v${feature.properties.version}`)
    .addTo(map.value)
}

function removePopup(): void {
  popup.value?.remove()
  popup.value = undefined
}

function onIntersectionObserver([entry]: IntersectionObserverEntry[]) {
  isVisible.value = entry?.isIntersecting || false
}
</script>

<template>
  <div :id="`map-${id}`" v-intersection-observer="onIntersectionObserver" />
</template>

<style lang="css" scoped>
div {
  height: 280px;
  width: 100%;
}
</style>
