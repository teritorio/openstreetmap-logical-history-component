import type { ApiResponse, IFeature } from '@/composables/useApi'
import type { Error } from '@/types'
import type { AddLayerObject, GeoJSONSource, LngLatLike, MapGeoJSONFeature, MapMouseEvent } from 'maplibre-gl'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import maplibre from 'maplibre-gl'
import { ref, shallowRef, watch } from 'vue'

/**
 * Interface defining the map functionality.
 */
export interface IMap {
  /**
   * Initializes the map and sets up necessary controls and layers.
   * @param emits - The emits object for emitting events.
   */
  init: (emits: MapEmits) => void
}

/**
 * Type definition for the map event emitters.
 * This is used to emit various map-related events.
 */
export interface MapEmits {
  (e: 'error', payload: Error): void
  (e: 'update-bbox', bbox: string): void
}

/**
 * The ID used for the map data source.
 * @constant {string} SOURCE_ID
 */
const SOURCE_ID = 'lochas'

/**
 * The URL of the map style used by MapLibre.
 * @constant {string} MAP_STYLE_URL
 */
const MAP_STYLE_URL = 'https://vecto-dev.teritorio.xyz/styles/positron/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'

/**
 * An object defining the layer types used in the map. Each layer corresponds to a specific feature type
 * in the map's configuration (e.g., polygons, lines, or points).
 * @constant {object} LAYERS
 * @property {string} Polygon - The layer ID for rendering polygons.
 * @property {string} Line - The layer ID for rendering lines.
 * @property {string} Point - The layer ID for rendering points.
 */
type LayerKey = 'Polygon' | 'Point' | 'LineString'
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

/**
 * A variable that holds the `MapEmits` function, which is used to emit custom events in the map component.
 * This is typically used to communicate state changes or errors back to the parent component.
 * @type {MapEmits}
 */
let emit: MapEmits

/**
 * A reactive reference to the `Map` object. This holds the MapLibre map instance that is used to interact
 * with the map, add layers, and listen for map events.
 * @constant {ShallowRef<Map>} map
 */
const map = shallowRef<maplibre.Map>()

/**
 * A reactive reference to the map data source of type `GeoJSONSource`. This holds the map's data source,
 * which contains the geoJSON data that is visualized on the map.
 * @constant {Ref<GeoJSONSource>}
 */
const source = ref<GeoJSONSource>()

const hoveredStateId = ref<number>()
const popup = ref<maplibre.Popup>()
const highlightedFeatures = ref<Set<number>>(new Set())

/**
 * Provides methods to initialize and manage the map.
 * @returns The map-related functions such as `init`.
 */
export function useMap(): IMap {
  const {
    featureCount,
    loCha,
    selectedFeatures,
    getStatus,
    showLink,
  } = useLoCha()

  watch(selectedFeatures, (newValue, oldValue) => {
    if (oldValue) {
      oldValue.forEach((feature) => {
        // TODO: once moved to composable, DRY it
        _setFeatureHighlight(feature.id, false, true)
      })
    }

    if (newValue) {
      newValue.forEach((feature) => {
        // TODO: once moved to composable, DRY it
        _setFeatureHighlight(feature.id, true, true)
      })
    }
  })

  watch(loCha, (newValue) => {
    if (newValue) {
      _handleMapDataUpdate(newValue)
    }
  }, { deep: true })

  /**
   * Initializes the map, sets up the event listeners, and configures layers and sources.
   * @param emits - The emits object used for emitting map events.
   */
  function init(emits: MapEmits): void {
    emit = emits

    map.value = new maplibre.Map({
      hash: true,
      container: 'map',
      center: [0, 0],
      style: MAP_STYLE_URL,
    })

    map.value.addControl(new maplibre.NavigationControl())

    map.value.on('load', () => {
      map.value?.addSource(SOURCE_ID, {
        type: 'geojson',
        data: loCha.value || {
          type: 'FeatureCollection',
          features: [],
        },
      })

      if (loCha.value?.bbox) {
        map.value?.fitBounds(new maplibre.LngLatBounds(loCha.value.bbox as [number, number, number, number]), { padding: 20 })
      }

      source.value = map.value?.getSource(SOURCE_ID)

      _setupMapLayers()
      _setEventListeners()
    })
  }

  /**
   * Updates the map data and adjusts the view accordingly.
   * If features are found, the map will zoom to the bounding box of the features.
   * Otherwise, it will reset the map to the initial view.
   * @param data - The map data to be set.
   */
  function _handleMapDataUpdate(data: ApiResponse): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    if (!source.value)
      throw new Error('Map data source is missing.')

    source.value.setData(data)

    if (featureCount.value && data.bbox) {
      map.value.fitBounds(new maplibre.LngLatBounds(data.bbox as [number, number, number, number]), { padding: 20 })
    }
    else {
      map.value.setCenter([0, 0])
      map.value.setZoom(0)
      emit('error', { message: '0 changes have been found!', type: 'warning' })
    }
  }

  function _handleMapClick(feature: MapGeoJSONFeature): void {
    const iFeature = mapToIFeature(feature)
    const status = getStatus(iFeature)

    showLink(iFeature.id, status)
  }

  function mapToIFeature(feature: MapGeoJSONFeature): IFeature {
    if (typeof feature.id !== 'number')
      throw new TypeError(`Feature ${feature.id} ID has wrong type: ${typeof feature.id}. Should be a number.`)

    return {
      ...feature,
      geometry: feature.geometry,
      id: feature.id,
      properties: {
        objtype: feature.properties.objtype,
        id: feature.properties.id,
        geom_distance: feature.properties.geom_distance,
        deleted: feature.properties.deleted,
        version: feature.properties.version,
        username: feature.properties.username,
        created: feature.properties.created,
        tags: feature.properties.tags,
        is_before: feature.properties.is_before,
        is_after: feature.properties.is_after,
        is_created: feature.properties.is_created,
        is_deleted: feature.properties.is_deleted,
      },
    } satisfies IFeature
  }

  function _setFeatureHighlight(id: number, state: boolean, storeState: boolean = false): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    if (storeState)
      highlightedFeatures.value.clear()

    if (!highlightedFeatures.value.has(id)) {
      map.value!.setFeatureState(
        {
          source: SOURCE_ID,
          id,
        },
        { hover: state },
      )
    }

    if (storeState && state)
      highlightedFeatures.value.add(id)
  }

  /**
   * Sets up the event listeners for the map.
   * Includes handling for map click, hover, and movement.
   */
  function _setEventListeners(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    map.value.on('click', (e: MapMouseEvent) => {
      if (!map.value)
        throw new Error('Call useMap.init() function first.')

      const features = map.value.queryRenderedFeatures(e.point, {
        layers: Object.values(LAYERS).map(l => l.id),
      })

      if (!features.length)
        return

      _handleMapClick(features[0])
      _openPopup(e.lngLat, features[0])
    })

    map.value.on('moveend', _updateBoundingBox)

    Object.values(LAYERS).forEach((layer) => {
      map.value!.on('mousemove', layer.id, (e) => {
        if (!e.features || e.features.length === 0)
          return

        const feature = e.features[0]

        if (feature.id === undefined)
          throw new Error('Feature ID not found.')

        if (typeof feature.id !== 'number')
          throw new Error(`Feature ${feature.id} ID has wrong type: ${typeof feature.id}. Should be a number.`)

        if (hoveredStateId.value !== undefined) {
          _removePopup()

          _setFeatureHighlight(hoveredStateId.value, false)
        }

        hoveredStateId.value = feature.id

        _setFeatureHighlight(hoveredStateId.value, true)
        _openPopup(e.lngLat, feature)
      })

      map.value?.on('mouseenter', layer.id, () => {
        if (!map.value)
          throw new Error('Call useMap.init() function first.')

        map.value.getCanvas().style.cursor = 'pointer'
      })

      map.value?.on('mouseleave', layer.id, () => {
        if (!map.value)
          throw new Error('Call useMap.init() function first.')

        map.value.getCanvas().style.cursor = ''

        if (hoveredStateId.value !== undefined) {
          _setFeatureHighlight(hoveredStateId.value, false)
          hoveredStateId.value = undefined
        }

        _removePopup()
      })
    })
  }

  /**
   * Opens a popup when a feature is clicked on the map.
   * It displays the feature's ID at the coordinates of the feature.
   * @param coords - Popup coordinates.
   * @param feature - Selected feature information for Popup display
   */
  function _openPopup(coords: LngLatLike, feature: MapGeoJSONFeature): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    popup.value = new maplibre.Popup()
      .setLngLat(coords)
      .setHTML(`${feature.properties.objtype}-${feature.properties.id}-v${feature.properties.version}`)
      .addTo(map.value)
  }

  function _removePopup(): void {
    popup.value?.remove()
    popup.value = undefined
  }

  /**
   * Configures the map layers for different geometry types (Polygon, LineString, Point).
   * Each layer is styled based on feature properties.
   */
  function _setupMapLayers(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    // Polygon layer configuration
    map.value.addLayer(LAYERS.Polygon)

    // LineString layer configuration
    map.value.addLayer(LAYERS.LineString)

    // Point layer configuration
    map.value.addLayer(LAYERS.Point)
  }

  /**
   * Updates the bounding box based on the map's current view.
   * Emits the updated bounding box coordinates.
   */
  function _updateBoundingBox(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    const bounds = map.value.getBounds()
    const { lat: neLat, lng: neLng } = bounds.getNorthEast()
    const { lat: swLat, lng: swLng } = bounds.getSouthWest()
    emit('update-bbox', [[swLat, swLng], [neLat, neLng]].toString())
  }

  return { init }
}
