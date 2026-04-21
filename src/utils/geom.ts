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

// ~100m epsilon padding in degrees, ensures features on bbox edges are not excluded
const BBOX_PADDING = 0.001

export function normalizeBbox(
  bbox: GeoJSON.BBox,
): [number, number, number, number] {
  return [
    bbox[0] - BBOX_PADDING,
    bbox[1] - BBOX_PADDING,
    bbox[2] + BBOX_PADDING,
    bbox[3] + BBOX_PADDING,
  ]
}
