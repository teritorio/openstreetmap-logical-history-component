<script setup lang="ts">
import type { BBox } from 'geojson'
import type { AddLayerObject, GeoJSONSource, LngLatLike, MapMouseEvent } from 'maplibre-gl'
import type { LoChaGroup } from '@/composables/useLoCha'
import turfBbox from '@turf/bbox'
import turfBboxClip from '@turf/bbox-clip'
import turfBboxPolygon from '@turf/bbox-polygon'
import turfBooleanContains from '@turf/boolean-contains'
import turfEnvelope from '@turf/envelope'
import { featureCollection as turfFeatureCollection } from '@turf/helpers'
import { vIntersectionObserver } from '@vueuse/components'
import maplibre from 'maplibre-gl'
import { shallowRef, watch } from 'vue'
import { loChaColors } from '@/composables/useLoCha'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  id: number
  features: LoChaGroup
  bbox?: GeoJSON.BBox
}>()

type LayerKey = 'Polygon' | 'PolygonBorder' | 'Point' | 'LineString' | 'LineStringBorder' | 'Bbox'

type MapMouseEventWithFeatures = MapMouseEvent & {
  features?: maplibre.MapGeoJSONFeature[]
}

const BBOX_SOURCE_ID = 'bbox'
const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://maps.cartoway.com/styles/positron/style.json'
const LAYERS = {
  Bbox: {
    id: 'bbox-layer',
    type: 'line',
    source: BBOX_SOURCE_ID,
    paint: {
      'line-color': '#000000',
      'line-width': 1,
      'line-dasharray': [2, 2],
    },
  },
  PolygonBorder: {
    id: 'feature-polygons-border',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': [
        'case',
        ['==', ['get', 'is_before'], true],
        1,
        2,
      ],
      'line-color': '#000000',
    },
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
  },
  Polygon: {
    id: 'feature-polygons',
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.3,
      ],
      'fill-color': [
        'case',
        ['==', ['get', 'geom'], false],
        '#f4f4f5',
        ['==', ['get', 'is_new'], true],
        loChaColors.new,
        ['==', ['get', 'deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
    },
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
  },
  LineString: {
    id: 'feature-lines',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 6,
      'line-color': [
        'case',
        ['==', ['get', 'geom'], false],
        '#f4f4f5',
        ['==', ['get', 'is_new'], true],
        loChaColors.new,
        ['==', ['get', 'deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.5,
      ],
      'line-offset': [
        'case',
        ['==', ['get', 'is_before'], true],
        -3,
        3,
      ],
    },
    layout: {
      'line-cap': 'round',
    },
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
  },
  LineStringBorder: {
    id: 'feature-lines-border',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': [
        'case',
        ['==', ['get', 'is_before'], true],
        1,
        2,
      ],
      'line-color': '#000000',
      'line-offset': [
        'case',
        ['==', ['get', 'is_before'], true],
        -2,
        2,
      ],
    },
    layout: {
      'line-cap': 'round',
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
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'is_before'], true],
        1,
        2,
      ],
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.3,

      ],
      'circle-color': [
        'case',
        ['==', ['get', 'geom'], false],
        '#f4f4f5',
        ['==', ['get', 'is_new'], true],
        loChaColors.new,
        ['==', ['get', 'deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
    },
    filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
  },
} satisfies Partial<Record<LayerKey, AddLayerObject>>

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
const source = shallowRef<GeoJSONSource>()

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
    if (props.bbox) {
      const clipped = clipAndEnvelope(props.features, normalizeBbox(props.bbox))

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
          [bbox[1], bbox[0]],
          [bbox[3], bbox[0]],
          [bbox[3], bbox[2]],
          [bbox[1], bbox[2]],
          [bbox[1], bbox[0]],
        ]],
      },
      properties: {},
    },
  })

  map.value.addLayer(LAYERS.Bbox)
}

function isPolygonOrLine(
  f: GeoJSON.Feature<GeoJSON.Geometry>,
): f is GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString | GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  return (
    f.geometry && (
      f.geometry.type === 'LineString'
      || f.geometry.type === 'MultiLineString'
      || f.geometry.type === 'Polygon'
      || f.geometry.type === 'MultiPolygon'
    )
  )
}

function clipAndEnvelope(
  features: GeoJSON.Feature[],
  bbox: BBox,
): GeoJSON.Feature<GeoJSON.Polygon> | null {
  const clipped = features
    .map((f) => {
      if (!f.geometry)
        return null

      if (f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint') {
        return turfBooleanContains(turfBboxPolygon(bbox), f) ? f : null
      }
      else if (isPolygonOrLine(f)) {
        return turfBboxClip(f, bbox)
      }

      return null
    })
    .filter((f): f is GeoJSON.Feature => f !== null)

  if (clipped.length === 0)
    return null

  const fc = turfFeatureCollection(clipped)

  return turfEnvelope(fc)
}

function normalizeBbox(
  bbox: GeoJSON.BBox,
): [number, number, number, number] {
  let minX = bbox[0]
  let minY = bbox[1]
  let maxX = bbox[2]
  let maxY = bbox[3]

  if (Math.abs(minX) <= 90 && Math.abs(maxX) <= 90) {
    [minX, minY] = [minY, minX];
    [maxX, maxY] = [maxY, maxX]
  }

  return [minX, minY, maxX, maxY]
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

  source.value = map.value.getSource(SOURCE_ID)

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
  <div :id="`map-${id}`" v-intersection-observer="onIntersectionObserver" class="v-map" />
</template>

<style lang="css" scoped>
.v-map {
  height: 280px;
  width: 100%;
}
</style>
