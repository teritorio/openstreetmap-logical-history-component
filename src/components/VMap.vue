<script setup lang="ts">
import type { AddLayerObject, GeoJSONSource, LngLatLike, MapMouseEvent } from 'maplibre-gl'
import type { IFeature } from '@/composables/useApi'
import type { LoChaGroup } from '@/composables/useLoCha'
import turfBbox from '@turf/bbox'
import turfBboxPolygon from '@turf/bbox-polygon'
import turfBuffer from '@turf/buffer'
import turfConcave from '@turf/concave'
import turfConvex from '@turf/convex'
import { featureCollection as turfFeatureCollection, lineString as turfLineString, point as turfPoint } from '@turf/helpers'
import turfIntersect from '@turf/intersect'
import turfUnion from '@turf/union'
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
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/positron/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'
const LAYERS = {
  Bbox: {
    id: 'bbox-layer',
    type: 'line',
    source: BBOX_SOURCE_ID,
    paint: {
      'line-color': '#000000',
      'line-width': 1,
    },
  },
  PolygonBorder: {
    id: 'feature-polygons-border',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 2,
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
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
        ['==', ['get', 'deleted'], true],
        loChaColors.delete,
        ['==', ['get', 'is_before'], true],
        loChaColors.updateBefore,
        loChaColors.updateAfter,
      ],
    },
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
  },
  LineStringBorder: {
    id: 'feature-lines-border',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 1,
      'line-color': '#000000',
      'line-offset': [
        'case',
        ['get', 'is_before'],
        -3,
        3,
      ],
    },
    layout: {
      'line-cap': 'round',
    },
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
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
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
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
        ['get', 'is_before'],
        -3,
        3,
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
      'circle-stroke-width': 2,
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
        ['==', ['get', 'is_created'], true],
        loChaColors.create,
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
  top: 20,
  left: 20,
  right: 20,
  bottom: 60,
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
    map.value = new maplibre.Map({
      hash: false,
      container: `map-${props.id}`,
      bounds: props.bbox && [
        props.bbox[0],
        props.bbox[1],
        props.bbox[2],
        props.bbox[3],
      ],
      fitBoundsOptions: {
        padding: paddingOptions,
        animate: false,
      },
      style: MAP_STYLE_URL,
    })

    map.value.addControl(new maplibre.NavigationControl())

    map.value.on('load', handleMapOnLoad)
  }
}

function displayBbox(): void {
  if (!map.value)
    throw new Error('Call initMap() function first.')

  if (!props.bbox)
    return

  map.value.addSource(BBOX_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [props.bbox[1], props.bbox[0]],
          [props.bbox[3], props.bbox[0]],
          [props.bbox[3], props.bbox[2]],
          [props.bbox[1], props.bbox[2]],
          [props.bbox[1], props.bbox[0]],
        ]],
      },
      properties: {},
    },
  })

  map.value.addLayer(LAYERS.Bbox)
}

function createConcavePolygon(features: IFeature[]): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null {
  const polygons: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[] = []
  const points: GeoJSON.Feature<GeoJSON.Point>[] = []

  for (const f of features) {
    if (!f.geometry)
      continue

    switch (f.geometry.type) {
      case 'Point':
        points.push(turfPoint(f.geometry.coordinates))
        break
      case 'LineString':
        for (const coord of f.geometry.coordinates) {
          points.push(turfPoint(coord))
        }
        break
      case 'Polygon':
      case 'MultiPolygon':
        polygons.push(f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)
        break
    }
  }

  let hullPolygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = null

  if (points.length >= 3) {
    const fc = turfFeatureCollection(points)
    hullPolygon = turfConcave(fc, { maxEdge: 1.5 }) ?? turfConvex(fc)
  }
  else if (points.length === 2) {
    const line = turfLineString(points.map(p => p.geometry.coordinates))
    hullPolygon = turfBuffer(line, 0.001, { units: 'kilometers' }) || null
  }
  else if (points.length === 1) {
    hullPolygon = turfBuffer(points[0], 0.001, { units: 'kilometers' }) || null
  }

  if (polygons.length === 0)
    return hullPolygon

  // Merge all existing polygons
  let merged = polygons[0]

  for (let i = 1; i < polygons.length; i++) {
    const unionResult = turfUnion(turfFeatureCollection([merged, polygons[i]]))
    if (unionResult)
      merged = unionResult
  }

  if (hullPolygon) {
    // Merge hull with existing polygons
    const unionResult = turfUnion(turfFeatureCollection([merged, hullPolygon]))
    if (unionResult)
      merged = unionResult
  }

  return merged
}

function intersectWithBbox(
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
  bbox: GeoJSON.BBox,
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null {
  const bboxPoly = turfBboxPolygon(bbox)

  return turfIntersect(turfFeatureCollection([polygon, bboxPoly]))
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

  displayBbox()

  const featuresPolygon = createConcavePolygon(props.features)

  if (featuresPolygon && props.bbox) {
    const clipped = intersectWithBbox(featuresPolygon, normalizeBbox(props.bbox))

    if (clipped) {
      const boundsArray = turfBbox(clipped)

      const bounds: [[number, number], [number, number]] = [
        [boundsArray[0], boundsArray[1]],
        [boundsArray[2], boundsArray[3]],
      ]

      map.value.fitBounds(bounds, {
        padding: paddingOptions,
        animate: false,
        maxZoom: 17,
      })
    }
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
