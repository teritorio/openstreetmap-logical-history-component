import type { BBox } from 'geojson'
import { describe, expect, it } from 'vitest'
import { clipAndEnvelope, normalizeBbox } from '@/utils/geom'

describe('clipAndEnvelope', () => {
  const bbox: BBox = [-1, -1, 10, 10]

  it('returns null for empty feature array', () => {
    expect(clipAndEnvelope([], bbox)).toBeNull()
  })

  it('returns null when all features have null geometry', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: null as any, properties: {} },
      { type: 'Feature', geometry: null as any, properties: {} },
    ]
    expect(clipAndEnvelope(features, bbox)).toBeNull()
  })

  it('returns envelope for point inside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 5] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
  })

  it('returns null for point outside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [20, 20] }, properties: {} },
    ]
    expect(clipAndEnvelope(features, bbox)).toBeNull()
  })

  it('handles mixed points with some inside and some outside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 5] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [20, 20] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
  })

  it('returns envelope for LineString inside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [5, 5]] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
  })

  it('returns envelope for Polygon inside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[1, 1], [5, 1], [5, 5], [1, 5], [1, 1]]] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
  })

  it('returns envelope for mixed feature types', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [2, 2] }, properties: {} },
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [[3, 3], [7, 7]] }, properties: {} },
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[1, 1], [4, 1], [4, 4], [1, 4], [1, 1]]] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
  })

  it('filters out null-geometry features and processes the rest', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: null as any, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 5] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
  })
})

describe('normalizeBbox', () => {
  it('returns bbox unchanged when non-degenerate and no swap needed', () => {
    // minX and maxX outside [-90, 90] → no swap
    const bbox = [-122.5, 37.7, -122.4, 37.8] as [number, number, number, number]
    expect(normalizeBbox(bbox)).toEqual([-122.5, 37.7, -122.4, 37.8])
  })

  it('swaps lat/lng when values suggest reversed order', () => {
    // Both minX and maxX within [-90, 90] triggers the swap
    // Input: [lat_min, lng_min, lat_max, lng_max] → Output: [lng_min, lat_min, lng_max, lat_max]
    const bbox = [43.4, -1.6, 43.5, -1.5] as [number, number, number, number]
    expect(normalizeBbox(bbox)).toEqual([-1.6, 43.4, -1.5, 43.5])
  })

  it('pads degenerate bbox where minX === maxX', () => {
    const bbox = [-122.5, 37.7, -122.5, 37.8] as [number, number, number, number]
    const result = normalizeBbox(bbox)
    expect(result[0]).toBeLessThan(-122.5)
    expect(result[2]).toBeGreaterThan(-122.5)
    expect(result[1]).toBe(37.7)
    expect(result[3]).toBe(37.8)
  })

  it('pads degenerate bbox where minY === maxY', () => {
    const bbox = [-122.5, 37.7, -122.4, 37.7] as [number, number, number, number]
    const result = normalizeBbox(bbox)
    expect(result[1]).toBeLessThan(37.7)
    expect(result[3]).toBeGreaterThan(37.7)
    expect(result[0]).toBe(-122.5)
    expect(result[2]).toBe(-122.4)
  })

  it('pads fully degenerate bbox (single point) after swap', () => {
    // API returns [lat, lng, lat, lng] → swap → [lng, lat, lng, lat] → pad both axes
    const bbox = [43.457, -1.572, 43.457, -1.572] as [number, number, number, number]
    const result = normalizeBbox(bbox)
    // After swap: [-1.572, 43.457, -1.572, 43.457] → both axes padded
    expect(result[0]).toBeLessThan(-1.572)
    expect(result[2]).toBeGreaterThan(-1.572)
    expect(result[1]).toBeLessThan(43.457)
    expect(result[3]).toBeGreaterThan(43.457)
  })
})
