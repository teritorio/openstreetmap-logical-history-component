import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import type { GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import { LngLatBounds, Map, NavigationControl, Popup } from 'maplibre-gl'
import { ref, shallowRef } from 'vue'

/**
 * Interface defining the map functionality.
 */
export interface IMap {
  /**
   * Initializes the map and sets up necessary controls and layers.
   * @param emits - The emits object for emitting events.
   */
  init: (emits: MapEmits) => void

  /**
   * Handles the update of map data and adjusts the map view accordingly.
   * @param data - The data to update the map with.
   */
  handleMapDataUpdate: (data: ApiResponse) => void
}

/**
 * Type definition for the map event emitters.
 * This is used to emit various map-related events.
 */
export interface MapEmits {
  (e: 'error', payload: Error): void
  (e: 'update-bbox', bbox: string): void
}

const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://vecto-dev.teritorio.xyz/styles/positron/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'
const LAYERS = {
  Polygon: 'feature-polygons',
  Line: 'feature-lines',
  Point: 'feature-points',
}

let emit: MapEmits
const map = shallowRef<Map>()
const source = ref<GeoJSONSource>()

/**
 * Provides methods to initialize and manage the map.
 * @returns The map-related functions such as `init` and `handleMapDataUpdate`.
 */
export function useMap(): IMap {
  const { featureCount, loCha } = useLoCha()

  /**
   * Initializes the map, sets up the event listeners, and configures layers and sources.
   * @param emits - The emits object used for emitting map events.
   */
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
      _setEventListeners()

      map.value?.addSource(SOURCE_ID, {
        type: 'geojson',
        data: loCha.value || {
          type: 'FeatureCollection',
          features: [],
        },
      })

      if (loCha.value?.bbox) {
        map.value?.fitBounds(new LngLatBounds(loCha.value.bbox as [number, number, number, number]), { padding: 20 })
      }

      source.value = map.value?.getSource(SOURCE_ID)

      _setupMapLayers()
    })
  }

  /**
   * Updates the map data and adjusts the view accordingly.
   * If features are found, the map will zoom to the bounding box of the features.
   * Otherwise, it will reset the map to the initial view.
   * @param data - The map data to be set.
   */
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

  /**
   * Sets up the event listeners for the map.
   * Includes handling for map click, hover, and movement.
   */
  function _setEventListeners(): void {
    map.value?.on('click', _openPopup)

    map.value?.on('mouseenter', LAYERS.Point, () => {
      if (!map.value)
        throw new Error('Call useMap.init() function first.')

      map.value.getCanvas().style.cursor = 'pointer'
    })
    map.value?.on('mouseenter', LAYERS.Line, () => {
      if (!map.value)
        throw new Error('Call useMap.init() function first.')

      map.value.getCanvas().style.cursor = 'pointer'
    })

    map.value?.on('mouseleave', LAYERS.Point, () => {
      if (!map.value)
        throw new Error('Call useMap.init() function first.')

      map.value.getCanvas().style.cursor = ''
    })
    map.value?.on('mouseleave', LAYERS.Line, () => {
      if (!map.value)
        throw new Error('Call useMap.init() function first.')

      map.value.getCanvas().style.cursor = ''
    })

    map.value?.on('moveend', _updateBoundingBox)
  }

  /**
   * Opens a popup when a feature is clicked on the map.
   * It displays the feature's ID at the coordinates of the feature.
   * @param e - The MapMouseEvent triggered by the click.
   */
  function _openPopup(e: MapMouseEvent): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    const features = map.value.queryRenderedFeatures(e.point, {
      layers: Object.values(LAYERS),
    })

    if (!features.length)
      return

    new Popup()
      .setLngLat(e.lngLat)
      .setHTML(`${features[0].properties.objtype}-${features[0].properties.id}-v${features[0].properties.version}`)
      .addTo(map.value)
  }

  function _setupMapLayers(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    // Polygon type
    map.value.addLayer({
      id: LAYERS.Polygon,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-opacity': 0.5,
        'fill-color': [
          'case',
          ['==', ['get', 'is_created'], true],
          loChaColors.create,
          ['==', ['get', 'is_deleted'], true],
          loChaColors.delete,
          ['==', ['get', 'is_before'], true],
          '#ce7e00',
          loChaColors.update,
        ],
      },
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
    })

    // LineString type
    map.value.addLayer({
      id: LAYERS.Line,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-width': 4,
        'line-opacity': [
          'case',
          ['==', ['get', 'is_created'], true],
          1,
          ['==', ['get', 'is_deleted'], true],
          1,
          ['==', ['get', 'is_before'], true],
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
          '#ce7e00',
          loChaColors.update,
        ],
      },
      filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
    })

    // Point type
    map.value.addLayer({
      id: LAYERS.Point,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 12,
        'circle-stroke-color': '#000000',
        'circle-stroke-width': 2,
        'circle-opacity': 0.5,
        'circle-color': [
          'case',
          ['==', ['get', 'is_created'], true],
          loChaColors.create,
          ['==', ['get', 'is_deleted'], true],
          loChaColors.delete,
          ['==', ['get', 'is_before'], true],
          '#ce7e00',
          loChaColors.update,
        ],
      },
      filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
    })
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
