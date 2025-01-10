import type { ApiLink, ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import type { AddLayerObject, ExpressionSpecification, GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import { LngLatBounds, Map, NavigationControl, Popup } from 'maplibre-gl'
import { onMounted, ref, shallowRef, watch } from 'vue'

/**
 * Interface defining the map functionality.
 */
export interface IMap {
  applyFilter: (link: ApiLink) => void

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
const LAYERS = {
  Polygon: {
    id: 'feature-polygons',
    type: 'fill',
    source: SOURCE_ID,
    paint: {
      'fill-opacity': [
        'case',
        ['==', ['get', 'is_created'], true],
        1,
        ['==', ['get', 'is_deleted'], true],
        1,
        ['==', ['get', 'is_before'], true],
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
    },
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
  },
  LineString: {
    id: 'feature-lines',
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
      'circle-radius': 12,
      'circle-stroke-color': '#000000',
      'circle-stroke-width': 2,
      'circle-opacity': [
        'case',
        ['==', ['get', 'is_created'], true],
        1,
        ['==', ['get', 'is_deleted'], true],
        1,
        ['==', ['get', 'is_before'], true],
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
} satisfies Record<string, AddLayerObject>

type LayerKey = keyof typeof LAYERS
// type LayerValue = typeof LAYERS[LayerKey]

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
const map = shallowRef<Map>()

/**
 * A reactive reference to the map data source of type `GeoJSONSource`. This holds the map's data source,
 * which contains the geoJSON data that is visualized on the map.
 * @constant {Ref<GeoJSONSource>}
 */
const source = ref<GeoJSONSource>()

const filteredLayers = new Set<LayerKey>()
const hiddenLayers = new Set<LayerKey>()

/**
 * Provides methods to initialize and manage the map.
 * @returns The map-related functions such as `init` and `handleMapDataUpdate`.
 */
export function useMap(): IMap {
  const { featureCount, loCha, selectedLink, selectedLinkFeatures } = useLoCha()

  onMounted(() => _setHiddenLayers())

  watch(selectedLink, (newValue) => {
    if (!newValue)
      resetFilter()
  })

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

  function applyFilter(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    // const expression: ExpressionSpecification = ['any']

    selectedLinkFeatures.value?.forEach((feature) => {
      if (!feature.properties)
        throw new Error(`Feature ${feature.id} has no properties.`)

      let layer: LayerKey

      const featureExpression = [
        'all',
        ['==', ['get', 'objtype'], feature.properties.objtype],
        ['==', ['get', 'version'], feature.properties.version],
        ['==', ['get', 'id'], feature.properties.id],
      ] as ExpressionSpecification

      switch (feature.geometry.type) {
        case 'LineString':
        case 'MultiLineString':
          layer = 'LineString'
          break
        case 'Point':
        case 'MultiPoint':
          layer = 'Point'
          break
        case 'MultiPolygon':
        case 'Polygon':
          layer = 'Polygon'
          break
        default:
          throw new Error(`Geometry ${feature.geometry.type} not supported.`)
      }

      map.value?.setFilter(LAYERS[layer].id, ['all', LAYERS[layer].filter, featureExpression])
      filteredLayers.add(layer)
    })

    hiddenLayers.difference(filteredLayers).forEach((layer) => {
      if (map.value?.getLayer(LAYERS[layer].id))
        map.value?.setLayoutProperty(LAYERS[layer].id, 'visibility', 'none')
    })
  }

  function resetFilter(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    hiddenLayers.difference(filteredLayers).forEach((layer) => {
      if (map.value?.getLayer(LAYERS[layer].id))
        map.value?.setLayoutProperty(LAYERS[layer].id, 'visibility', 'visible')
    })

    filteredLayers.forEach((layer) => {
      map.value?.setFilter(LAYERS[layer].id, LAYERS[layer].filter)
    })

    _setHiddenLayers()
    filteredLayers.clear()
  }

  function _setHiddenLayers(): void {
    Object.keys(LAYERS).map(l => hiddenLayers.add(l as LayerKey))
  }

  /**
   * Sets up the event listeners for the map.
   * Includes handling for map click, hover, and movement.
   */
  function _setEventListeners(): void {
    map.value?.on('click', _openPopup)

    map.value?.on('moveend', _updateBoundingBox)

    Object.values(LAYERS).forEach((layer) => {
      map.value?.on('mouseenter', layer.id, () => {
        if (!map.value)
          throw new Error('Call useMap.init() function first.')

        map.value.getCanvas().style.cursor = 'pointer'
      })

      map.value?.on('mouseleave', layer.id, () => {
        if (!map.value)
          throw new Error('Call useMap.init() function first.')

        map.value.getCanvas().style.cursor = ''
      })
    })
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
      layers: Object.values(LAYERS).map(l => l.id),
    })

    if (!features.length)
      return

    new Popup()
      .setLngLat(e.lngLat)
      .setHTML(`${features[0].properties.objtype}-${features[0].properties.id}-v${features[0].properties.version}`)
      .addTo(map.value)
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

  return {
    applyFilter,
    init,
    handleMapDataUpdate,
  }
}
