import type { AddLayerObject } from 'maplibre-gl'
import { loChaColors } from '@/composables/useLoCha'
import { NO_GEOM_COLOR } from '@/constants/map'

export const BBOX_SOURCE_ID = 'bbox'
export const SOURCE_ID = 'lochas'

type LayerKey = 'Polygon' | 'PolygonBorder' | 'Point' | 'LineString' | 'LineStringBorder' | 'Bbox'

export const LAYERS = {
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
        NO_GEOM_COLOR,
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
        NO_GEOM_COLOR,
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
        NO_GEOM_COLOR,
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
