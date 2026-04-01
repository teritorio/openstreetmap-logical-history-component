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

// ~100m padding in degrees, used to expand degenerate (zero-area) bboxes
const BBOX_PADDING = 0.001

export function normalizeBbox(
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

  if (minX === maxX) {
    minX -= BBOX_PADDING
    maxX += BBOX_PADDING
  }
  if (minY === maxY) {
    minY -= BBOX_PADDING
    maxY += BBOX_PADDING
  }

  return [minX, minY, maxX, maxY]
}
