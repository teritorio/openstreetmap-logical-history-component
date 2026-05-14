import type { BBox } from 'geojson'
import turfBboxClip from '@turf/bbox-clip'
import turfBboxPolygon from '@turf/bbox-polygon'
import turfBooleanContains from '@turf/boolean-contains'
import turfEnvelope from '@turf/envelope'
import { featureCollection as turfFeatureCollection } from '@turf/helpers'

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

export function clipAndEnvelope(
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

// ~100m padding in degrees, ensures features on bbox edges are not excluded during clipping
const CLIPPING_PADDING = 0.001

// Minimal expansion for degenerate bboxes (point/line), visual padding comes from fitBounds padding
const DEGENERATE_BBOX_PADDING = 0.00001

function padBbox(bbox: GeoJSON.BBox, padding: number): [number, number, number, number] {
  return [
    bbox[0] - padding,
    bbox[1] - padding,
    bbox[2] + padding,
    bbox[3] + padding,
  ]
}

export function normalizeBboxForClipping(bbox: GeoJSON.BBox): [number, number, number, number] {
  return padBbox(bbox, CLIPPING_PADDING)
}

export function normalizeBboxForBboxLayer(bbox: GeoJSON.BBox): [number, number, number, number] {
  const isDegenerate = bbox[0] === bbox[2] || bbox[1] === bbox[3]
  return isDegenerate ? padBbox(bbox, DEGENERATE_BBOX_PADDING) : (bbox as [number, number, number, number])
}
