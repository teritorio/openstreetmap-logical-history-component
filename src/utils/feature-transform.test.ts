import type { LoChaData } from '@/types'
import { describe, expect, it } from 'vitest'
import { transformFeatures } from './feature-transform'

function makeFeature(id: string, linksIndex: number, extra: Record<string, unknown> = {}): LoChaData['features'][number] {
  return {
    type: 'Feature',
    id,
    geometry: null,
    properties: {
      objtype: 'n',
      id: Number(id.replace(/\D/g, '')),
      geom_distance: null,
      geom: false,
      deleted: false,
      links: linksIndex,
      version: 1,
      username: 'user',
      created: '2024-01-01',
      tags: {},
      ...extra,
    },
  }
}

describe('transformFeatures', () => {
  describe('is_before', () => {
    it('marks the before feature as is_before', () => {
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [makeFeature('A', 0), makeFeature('B', 0)],
        metadata: {
          links: [[{ before: 'A', after: 'B', action: 'accept', conflation_reason: { conflate: 'manual' } }]],
        },
      }
      const result = transformFeatures(data)
      expect(result.find(f => f.id === 'A')?.properties.is_before).toBe(true)
      expect(result.find(f => f.id === 'A')?.properties.is_after).toBeUndefined()
    })
  })

  describe('is_after', () => {
    it('marks the after feature as is_after when a before exists', () => {
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [makeFeature('A', 0), makeFeature('B', 0)],
        metadata: {
          links: [[{ before: 'A', after: 'B', action: 'accept', conflation_reason: { conflate: 'manual' } }]],
        },
      }
      const result = transformFeatures(data)
      expect(result.find(f => f.id === 'B')?.properties.is_after).toBe(true)
      expect(result.find(f => f.id === 'B')?.properties.is_new).toBeUndefined()
    })
  })

  describe('is_new', () => {
    it('marks the after feature as is_new when the group has no before at all', () => {
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [makeFeature('B', 0)],
        metadata: {
          links: [[{ after: 'B', action: 'accept', conflation_reason: { conflate: 'manual' } }]],
        },
      }
      const result = transformFeatures(data)
      expect(result.find(f => f.id === 'B')?.properties.is_new).toBe(true)
      expect(result.find(f => f.id === 'B')?.properties.is_after).toBeUndefined()
    })

    it('marks after-only features as is_new in a mixed group (some links have before, some do not)', () => {
      // Mixed group: A→B is an update, C is a new creation (no before)
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [makeFeature('A', 0), makeFeature('B', 0), makeFeature('C', 0)],
        metadata: {
          links: [[
            { before: 'A', after: 'B', action: 'accept', conflation_reason: { conflate: 'manual' } },
            { after: 'C', action: 'accept', conflation_reason: { conflate: 'manual' } },
          ]],
        },
      }
      const result = transformFeatures(data)
      expect(result.find(f => f.id === 'A')?.properties.is_before).toBe(true)
      expect(result.find(f => f.id === 'B')?.properties.is_after).toBe(true)
      expect(result.find(f => f.id === 'B')?.properties.is_new).toBeUndefined()
      // C must be is_new, not is_after — this was the bug
      expect(result.find(f => f.id === 'C')?.properties.is_new).toBe(true)
      expect(result.find(f => f.id === 'C')?.properties.is_after).toBeUndefined()
    })
  })

  describe('linkedFeature geometry comparison', () => {
    it('compares each feature against its specific link partner, not an arbitrary sibling', () => {
      // N:1 group: A→C and B→C
      // A should compare geometry against C; B should compare geometry against C
      // With the old code, A and B would find each other as linkedFeature (wrong pair)
      const geomA: GeoJSON.Point = { type: 'Point', coordinates: [1, 0] }
      const geomB: GeoJSON.Point = { type: 'Point', coordinates: [2, 0] }
      const geomC: GeoJSON.Point = { type: 'Point', coordinates: [1, 0] } // same as A

      const featureA = { ...makeFeature('A', 0), geometry: geomA }
      const featureB = { ...makeFeature('B', 0), geometry: geomB }
      const featureC = { ...makeFeature('C', 0), geometry: geomC }

      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [featureA, featureB, featureC],
        metadata: {
          links: [[
            { before: 'A', after: 'C', action: 'accept', conflation_reason: { conflate: 'manual' } },
            { before: 'B', after: 'C', action: 'accept', conflation_reason: { conflate: 'manual' } },
          ]],
        },
      }
      const result = transformFeatures(data)
      // A and C have the same geometry → geom should be false (no change)
      expect(result.find(f => f.id === 'A')?.properties.geom).toBe(false)
      // B and C have different geometry → geom should be true
      expect(result.find(f => f.id === 'B')?.properties.geom).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('skips features with null id', () => {
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [{ ...makeFeature('A', 0), id: null as unknown as string }],
        metadata: { links: [[]] },
      }
      const result = transformFeatures(data)
      expect(result).toHaveLength(0)
    })

    it('skips features with no matching group', () => {
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [makeFeature('A', 99)],
        metadata: { links: [] },
      }
      const result = transformFeatures(data)
      expect(result).toHaveLength(0)
    })

    it('skips features with no matching link', () => {
      const data: LoChaData = {
        type: 'FeatureCollection',
        features: [makeFeature('A', 0)],
        metadata: {
          links: [[{ before: 'X', after: 'Y', action: 'accept', conflation_reason: { conflate: 'manual' } }]],
        },
      }
      const result = transformFeatures(data)
      expect(result).toHaveLength(0)
    })
  })
})
