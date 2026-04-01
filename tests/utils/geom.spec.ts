import { describe, expect, it } from 'vitest'
import { normalizeBbox } from '@/utils/geom'

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
