import type { BBox } from 'geojson'
import { describe, expect, it } from 'vitest'
import { clipAndEnvelope, isBboxDegenerate, normalizeBboxForClipping } from '@/utils/geom'

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

  it('returns envelope with correct bounds for point inside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 5] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
    const coords = result!.geometry.coordinates[0]
    const xs = coords.map(c => c[0])
    const ys = coords.map(c => c[1])
    expect(Math.min(...xs)).toBe(5)
    expect(Math.max(...xs)).toBe(5)
    expect(Math.min(...ys)).toBe(5)
    expect(Math.max(...ys)).toBe(5)
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

  it('returns envelope with correct bounds for LineString inside bbox', () => {
    const features: GeoJSON.Feature[] = [
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [5, 5]] }, properties: {} },
    ]
    const result = clipAndEnvelope(features, bbox)
    expect(result).not.toBeNull()
    expect(result!.geometry.type).toBe('Polygon')
    const coords = result!.geometry.coordinates[0]
    const xs = coords.map(c => c[0])
    const ys = coords.map(c => c[1])
    expect(Math.min(...xs)).toBe(1)
    expect(Math.max(...xs)).toBe(5)
    expect(Math.min(...ys)).toBe(1)
    expect(Math.max(...ys)).toBe(5)
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

describe('normalizeBboxForClipping', () => {
  it('adds ~100m padding to non-degenerate bbox', () => {
    const bbox = [-122.5, 37.7, -122.4, 37.8] as [number, number, number, number]
    const result = normalizeBboxForClipping(bbox)
    expect(result[0]).toBeLessThan(-122.5)
    expect(result[1]).toBeLessThan(37.7)
    expect(result[2]).toBeGreaterThan(-122.4)
    expect(result[3]).toBeGreaterThan(37.8)
  })

  it('pads fully degenerate bbox (single point)', () => {
    const bbox = [-1.572, 43.457, -1.572, 43.457] as [number, number, number, number]
    const result = normalizeBboxForClipping(bbox)
    expect(result[0]).toBeLessThan(-1.572)
    expect(result[2]).toBeGreaterThan(-1.572)
    expect(result[1]).toBeLessThan(43.457)
    expect(result[3]).toBeGreaterThan(43.457)
  })

  it('applies exact clipping padding of 0.001', () => {
    const bbox = [0, 0, 10, 10] as [number, number, number, number]
    expect(normalizeBboxForClipping(bbox)).toEqual([-0.001, -0.001, 10.001, 10.001])
  })
})

describe('isBboxDegenerate', () => {
  it('returns false for non-degenerate bbox', () => {
    expect(isBboxDegenerate([0, 0, 10, 10])).toBe(false)
  })

  it('returns true for fully degenerate bbox (single point)', () => {
    expect(isBboxDegenerate([-1.572, 43.457, -1.572, 43.457])).toBe(true)
  })

  it('returns true for degenerate bbox with zero width (vertical line)', () => {
    expect(isBboxDegenerate([2.0, 48.0, 2.0, 48.5])).toBe(true)
  })

  it('returns true for degenerate bbox with zero height (horizontal line)', () => {
    expect(isBboxDegenerate([0, 5, 10, 5])).toBe(true)
  })
})
