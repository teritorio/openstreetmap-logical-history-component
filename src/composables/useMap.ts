import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import { LngLatBounds, Map, NavigationControl, Popup } from 'maplibre-gl'
import { ref, shallowRef } from 'vue'

export interface IMap {
  init: (emits: MapEmits) => void
  handleMapDataUpdate: (data: ApiResponse) => void
}

export interface MapEmits {
  (e: 'error', payload: Error): void
  (e: 'update-bbox', bbox: string): void
}

const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/teritorio-tourism-latest/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'
const LAYERS = {
  LineString: 'feature-lines',
  LineStringAfter: 'feature-lines-after',
  LineStringBefore: 'feature-lines-before',
  Point: 'feature-points',
  PointBefore: 'feature-points-before',
  PointAfter: 'feature-points-after',
}

const lineBasePaint = {
  'line-width': 2,
}
const lineUpdatePaint = {
  ...lineBasePaint,
  'line-color': loChaColors.update,
  'line-dasharray': [4, 2],
}
const pointBasePaint = {
  'circle-radius': 12,
  'circle-stroke-color': '#000000',
  'circle-stroke-width': 4,
}
const pointUpdatePaint = {
  ...pointBasePaint,
  'circle-color': loChaColors.update,
}

let emit: MapEmits
const map = shallowRef<Map>()
const source = ref<GeoJSONSource>()

export function useMap(): IMap {
  const { featureCount, loCha } = useLoCha()

  function init(emits: MapEmits): void {
    emit = emits

    map.value = new Map({
      hash: true,
      container: 'map',
      center: [0, 0],
      style: MAP_STYLE_URL,
    })

    map.value.addControl(new NavigationControl())

    map.value.on('load', () => {
      map.value?.on('click', _openPopup)

      map.value?.on('moveend', _updateBoundingBox)

      map.value?.addSource(SOURCE_ID, {
        type: 'geojson',
        data: loCha.value || {
          type: 'FeatureCollection',
          features: [],
        },
      })

      source.value = map.value?.getSource(SOURCE_ID)

      _setupMapLayers()
    })
  }

  function _openPopup(e: MapMouseEvent): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    const features = map.value.queryRenderedFeatures(e.point, {
      layers: [LAYERS.Point, LAYERS.PointAfter, LAYERS.PointBefore],
    })

    if (!features.length || features[0].geometry.type !== 'Point')
      return

    new Popup()
      .setLngLat(features[0].geometry.coordinates as [number, number])
      .setHTML(features[0].properties.id.toString())
      .addTo(map.value)
  }

  function _setupMapLayers(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    // LineString type
    map.value.addLayer({
      id: LAYERS.LineString,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        ...lineBasePaint,
        'line-color': [
          'case',
          ['==', ['get', 'is_created'], true],
          loChaColors.create,
          ['==', ['get', 'is_deleted'], true],
          loChaColors.delete,
          '#000000',
        ],
      },
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['!=', ['get', 'is_after'], true],
        ['!=', ['get', 'is_before'], true],
      ],
    })

    map.value.addLayer({
      id: LAYERS.LineStringBefore,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        ...lineUpdatePaint,
        'line-opacity': 0.5,
        'line-offset': 8,
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
      paint: lineUpdatePaint,
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['==', ['get', 'is_after'], true],
      ],
    })

    // Point type
    map.value.addLayer({
      id: LAYERS.Point,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        ...pointBasePaint,
        'circle-color': [
          'case',
          ['==', ['get', 'is_created'], true],
          loChaColors.create,
          ['==', ['get', 'is_deleted'], true],
          loChaColors.delete,
          '#000000',
        ],
      },
      filter: [
        'all',
        ['==', ['geometry-type'], 'Point'],
        ['!=', ['get', 'is_after'], true],
        ['!=', ['get', 'is_before'], true],
      ],
    })

    map.value.addLayer({
      id: LAYERS.PointBefore,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        ...pointUpdatePaint,
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
      paint: pointBasePaint,
      filter: [
        'all',
        ['==', ['geometry-type'], 'Point'],
        ['==', ['get', 'is_after'], true],
      ],
    })
  }

  function handleMapDataUpdate(data: ApiResponse): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    if (!source.value)
      throw new Error('Map data source is missing.')

    source.value.setData(data)

    if (featureCount.value && data.bbox) {
      map.value.fitBounds(new LngLatBounds(data.bbox as [number, number, number, number]), { padding: 20 })
    }
    else {
      map.value.setCenter([0, 0])
      map.value.setZoom(0)
      emit('error', { message: '0 changes have been found!', type: 'warning' })
    }
  }

  function _updateBoundingBox(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    const bounds = map.value.getBounds()
    const { lat: neLat, lng: neLng } = bounds.getNorthEast()
    const { lat: swLat, lng: swLng } = bounds.getSouthWest()
    emit('update-bbox', [[swLat, swLng], [neLat, neLng]].toString())
  }

  return {
    init,
    handleMapDataUpdate,
  }
}
