import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import type { AddLayerObject, GeoJSONSource, MapMouseEvent } from 'maplibre-gl'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import maplibre from 'maplibre-gl'
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
} satisfies Record<string, AddLayerObject>

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

const hoveredStateId = ref<string>()

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
        promoteId: 'id',
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
  function handleMapDataUpdate(data: ApiResponse): void {
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

  /**
   * Sets up the event listeners for the map.
   * Includes handling for map click, hover, and movement.
   */
  function _setEventListeners(): void {
    if (!map.value)
      throw new Error('Call useMap.init() function first.')

    map.value.on('click', _openPopup)

    map.value.on('moveend', _updateBoundingBox)

    Object.values(LAYERS).forEach((layer) => {
      map.value!.on('mousemove', layer.id, (e) => {
        if (!e.features || e.features.length === 0)
          return

        const featureId = e.features[0].id?.toString()

        if (!featureId)
          throw new Error('Feature ID not found.')

        if (hoveredStateId.value) {
          map.value!.setFeatureState(
            {
              source: SOURCE_ID,
              id: hoveredStateId.value,
            },
            { hover: false },
          )
        }

        hoveredStateId.value = featureId

        map.value!.setFeatureState(
          {
            source: SOURCE_ID,
            id: hoveredStateId.value,
          },
          { hover: true },
        )
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

        if (hoveredStateId.value) {
          map.value!.setFeatureState(
            {
              source: SOURCE_ID,
              id: hoveredStateId.value,
            },
            { hover: false },
          )
          hoveredStateId.value = undefined
        }
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

    new maplibre.Popup()
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
    init,
    handleMapDataUpdate,
  }
}
