import { describe, expect, it, vi } from 'vitest'
import { createApiResponse, createFeature, createLink } from '../factories'

vi.mock('@turf/boolean-equal', () => ({
  default: vi.fn((a: any, b: any) => {
    return JSON.stringify(a) === JSON.stringify(b)
  }),
}))

vi.mock('@turf/area', () => ({
  area: vi.fn((feature: any) => {
    if (feature.geometry?.type === 'Polygon') {
      return feature.geometry.coordinates[0]?.length * 100 || 0
    }
    return 0
  }),
}))

describe('transformFeatures', () => {
  async function importTransform() {
    const { transformFeatures } = await import('@/utils/feature-transform')
    return transformFeatures
  }

  it('sets is_before flag for before features', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 0 } })
    const f2 = createFeature({ id: 'n2', properties: { links: 0 } })
    const data = createApiResponse([f1, f2], [[createLink({ before: 'n1', after: 'n2' })]])

    const result = transformFeatures(data)
    const before = result.find(f => f.id === 'n1')
    expect(before?.properties.is_before).toBe(true)
  })

  it('sets is_after flag for after features with before present', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 0 } })
    const f2 = createFeature({ id: 'n2', properties: { links: 0 } })
    const data = createApiResponse([f1, f2], [[createLink({ before: 'n1', after: 'n2' })]])

    const result = transformFeatures(data)
    const after = result.find(f => f.id === 'n2')
    expect(after?.properties.is_after).toBe(true)
  })

  it('sets is_new flag when link has no before key', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 0 } })
    const link = {
      action: 'accept' as const,
      after: 'n1',
      diff_attribs: undefined,
      diff_tags: undefined,
      conflation_reason: { geom: { score: 0.9, reason: 'test' }, tags: { score: 0.8, reason: 'test' }, conflate: 'test' },
    }
    const data = createApiResponse([f1], [[link]])

    const result = transformFeatures(data)
    expect(result[0].properties.is_new).toBe(true)
  })

  it('sets is_after when link.before is undefined but link.after is defined', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 0 } })
    const data = createApiResponse([f1], [[createLink({ before: undefined, after: 'n1' })]])

    const result = transformFeatures(data)
    expect(result[0].properties.is_after).toBe(true)
  })

  it('does not set geom property when single feature in group (no linkedFeature)', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 0 } })
    const data = createApiResponse([f1], [[createLink({ after: 'n1' })]])

    const result = transformFeatures(data)
    expect(result[0].properties.geom).toBe(false)
  })

  it('sets geom to true when linked features have different geometries', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', geometry: { type: 'Point', coordinates: [1, 2] }, properties: { links: 0 } })
    const f2 = createFeature({ id: 'n2', geometry: { type: 'Point', coordinates: [3, 4] }, properties: { links: 0 } })
    const data = createApiResponse([f1, f2], [[createLink({ before: 'n1', after: 'n2' })]])

    const result = transformFeatures(data)
    const before = result.find(f => f.id === 'n1')
    expect(before?.properties.geom).toBe(true)
  })

  it('sets geom to false when linked features have identical geometries', async () => {
    const transformFeatures = await importTransform()
    const geom = { type: 'Point' as const, coordinates: [1, 2] }
    const f1 = createFeature({ id: 'n1', geometry: geom, properties: { links: 0 } })
    const f2 = createFeature({ id: 'n2', geometry: geom, properties: { links: 0 } })
    const data = createApiResponse([f1, f2], [[createLink({ before: 'n1', after: 'n2' })]])

    const result = transformFeatures(data)
    const before = result.find(f => f.id === 'n1')
    expect(before?.properties.geom).toBe(false)
  })

  it('throws when feature has no matching group', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 999 } })
    const data = createApiResponse([f1], [[createLink({ before: 'n1' })]])

    expect(() => transformFeatures(data)).toThrow('has no group')
  })

  it('throws when feature has no matching link', async () => {
    const transformFeatures = await importTransform()
    const f1 = createFeature({ id: 'n1', properties: { links: 0 } })
    const data = createApiResponse([f1], [[createLink({ before: 'n999', after: 'n888' })]])

    expect(() => transformFeatures(data)).toThrow('has no link')
  })

  describe('sorting', () => {
    function createFeatureWithoutGeometry(id: string, links: number) {
      const f = createFeature({ id, properties: { links } })
      ;(f as any).geometry = null
      return f
    }

    it('sorts features with null geometry after features with geometry', async () => {
      const transformFeatures = await importTransform()
      const f1 = createFeatureWithoutGeometry('n1', 0)
      const f2 = createFeature({ id: 'n2', geometry: { type: 'Point', coordinates: [1, 2] }, properties: { links: 1 } })
      const data = createApiResponse(
        [f1, f2],
        [
          [createLink({ after: 'n1' })],
          [createLink({ after: 'n2' })],
        ],
      )

      const result = transformFeatures(data)
      expect(result[0].id).toBe('n2')
      expect(result[1].id).toBe('n1')
    })

    it('keeps order for features both without geometry', async () => {
      const transformFeatures = await importTransform()
      const f1 = createFeatureWithoutGeometry('n1', 0)
      const f2 = createFeatureWithoutGeometry('n2', 1)
      const data = createApiResponse(
        [f1, f2],
        [
          [createLink({ after: 'n1' })],
          [createLink({ after: 'n2' })],
        ],
      )

      const result = transformFeatures(data)
      expect(result).toHaveLength(2)
    })

    it('sorts by area descending for polygon features', async () => {
      const transformFeatures = await importTransform()
      const small = createFeature({
        id: 'n1',
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
        properties: { links: 0 },
      })
      const large = createFeature({
        id: 'n2',
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
        properties: { links: 1 },
      })
      const data = createApiResponse(
        [small, large],
        [
          [createLink({ after: 'n1' })],
          [createLink({ after: 'n2' })],
        ],
      )

      const result = transformFeatures(data)
      expect(result[0].id).toBe('n2')
      expect(result[1].id).toBe('n1')
    })

    it('sorts feature with geometry before feature without geometry', async () => {
      const transformFeatures = await importTransform()
      const withGeom = createFeature({ id: 'n1', geometry: { type: 'Point', coordinates: [1, 2] }, properties: { links: 1 } })
      const noGeom = createFeatureWithoutGeometry('n2', 0)
      const data = createApiResponse(
        [noGeom, withGeom],
        [
          [createLink({ after: 'n2' })],
          [createLink({ after: 'n1' })],
        ],
      )

      const result = transformFeatures(data)
      expect(result[0].id).toBe('n1')
      expect(result[1].id).toBe('n2')
    })
  })
})
