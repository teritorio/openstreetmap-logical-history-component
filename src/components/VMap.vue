<script setup lang="ts">
import type { BBox } from 'geojson'
import type { LngLatLike, MapMouseEvent } from 'maplibre-gl'
import type { LoChaGroup } from '@/types'
import turfBbox from '@turf/bbox'
import { featureCollection as turfFeatureCollection } from '@turf/helpers'
import { vIntersectionObserver } from '@vueuse/components'
import maplibre from 'maplibre-gl'
import { shallowRef, watch } from 'vue'
import { MAP_STYLE_URL } from '@/constants/map'
import { BBOX_SOURCE_ID, LAYERS, SOURCE_ID } from '@/constants/mapLayers'
import { clipAndEnvelope, normalizeBbox } from '@/utils/geom'
import { OBJTYPE_FULL } from '@/utils/osm-links'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  id: string | number
  features: LoChaGroup
  bbox?: GeoJSON.BBox
}>()

type MapMouseEventWithFeatures = MapMouseEvent & {
  features?: maplibre.MapGeoJSONFeature[]
}

const paddingOptions = {
  top: 60,
  left: 60,
  right: 60,
  bottom: 80,
}

const map = shallowRef<maplibre.Map>()
const isVisible = shallowRef(false)
const popup = shallowRef<maplibre.Popup>()
const hoveredStateFeature = shallowRef<maplibre.MapGeoJSONFeature>()

watch(isVisible, (newState) => {
  if (newState) {
    initMap()
  }
  else {
    if (map.value)
      map.value.remove()

    map.value = undefined
  }
})

watch(() => props.features, (newValue) => {
  if (map.value && isVisible.value && newValue) {
    map.value.remove()
    map.value = undefined
    initMap()
  }
})

function initMap() {
  if (!map.value) {
    const clipped = props.bbox
      ? clipAndEnvelope(props.features, normalizeBbox(props.bbox))
      : turfFeatureCollection(props.features)

    if (clipped) {
      const boundsArray = turfBbox(clipped)

      const bounds: [[number, number], [number, number]] = [
        [boundsArray[0], boundsArray[1]],
        [boundsArray[2], boundsArray[3]],
      ]

      map.value = new maplibre.Map({
        hash: false,
        container: `map-${props.id}`,
        bounds,
        fitBoundsOptions: {
          padding: paddingOptions,
          animate: false,
          maxZoom: 17,
        },
        style: MAP_STYLE_URL,
        attributionControl: {
          compact: false,
        },
      })
      map.value.addControl(new maplibre.NavigationControl())

      map.value.on('load', handleMapOnLoad)
    }
  }
}

function displayBbox(bbox: BBox): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  map.value.addSource(BBOX_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]],
        ]],
      },
      properties: {},
    },
  })

  map.value.addLayer(LAYERS.Bbox)
}

function handleMapOnLoad(): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  if (props.bbox) {
    displayBbox(props.bbox)
  }

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
    throw new Error('Call initMap() function first.')

  if (!map.value.getLayer(LAYERS.Polygon.id)) {
    map.value.addLayer(LAYERS.Polygon)
  }

  if (!map.value.getLayer(LAYERS.PolygonBorder.id)) {
    map.value.addLayer(LAYERS.PolygonBorder)
  }

  if (!map.value.getLayer(LAYERS.LineStringBorder.id)) {
    map.value.addLayer(LAYERS.LineStringBorder)
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
    if (layer.id === 'bbox-layer')
      return

    map.value!.on('mousemove', layer.id, handleMouseMove)

    map.value!.on('mouseenter', layer.id, handleMouseEnter)

    map.value!.on('mouseleave', layer.id, handleMouseLeave)
  })
}

function openPopup(coords: LngLatLike, feature: maplibre.MapGeoJSONFeature): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  popup.value = new maplibre.Popup()
    .setLngLat(coords)
    .setHTML(`${OBJTYPE_FULL[feature.properties.objtype as keyof typeof OBJTYPE_FULL]}-${feature.properties.id}-v${feature.properties.version}`)
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
  <div :id="`map-${id}`" v-intersection-observer="onIntersectionObserver" class="v-map" />
</template>

<style lang="css" scoped>
.v-map {
  height: 280px;
  width: 100%;
}
</style>
