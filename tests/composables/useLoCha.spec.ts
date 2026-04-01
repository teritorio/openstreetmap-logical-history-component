import { beforeEach, describe, expect, it } from 'vitest'
import { useLoCha } from '@/composables/useLoCha'
import { createApiResponse, createFeature, createLink } from '../factories'

describe('useLoCha', () => {
  beforeEach(() => {
    // Reset shared module-level state before each test
    const { loCha, groups } = useLoCha()
    loCha.value = undefined
    groups.value = []
  })

  describe('getStatus', () => {
    it('returns "new" for features with is_new flag', () => {
      const { getStatus } = useLoCha()
      const feature = createFeature({
        id: 'n1',
        properties: { is_new: true },
      })
      expect(getStatus(feature)).toBe('new')
    })

    it('returns "delete" for deleted features', () => {
      const { getStatus } = useLoCha()
      const feature = createFeature({
        id: 'n1',
        properties: { deleted: true },
      })
      expect(getStatus(feature)).toBe('delete')
    })

    it('returns "updateBefore" for is_before features', () => {
      const { getStatus } = useLoCha()
      const feature = createFeature({
        id: 'n1',
        properties: { is_before: true },
      })
      expect(getStatus(feature)).toBe('updateBefore')
    })

    it('returns "updateAfter" as the default status', () => {
      const { getStatus } = useLoCha()
      const feature = createFeature({ id: 'n1' })
      expect(getStatus(feature)).toBe('updateAfter')
    })

    it('prioritizes is_new over other flags', () => {
      const { getStatus } = useLoCha()
      const feature = createFeature({
        id: 'n1',
        properties: { is_new: true, is_before: true },
      })
      expect(getStatus(feature)).toBe('new')
    })

    it('prioritizes deleted over is_before', () => {
      const { getStatus } = useLoCha()
      const feature = createFeature({
        id: 'n1',
        properties: { deleted: true, is_before: true },
      })
      expect(getStatus(feature)).toBe('delete')
    })
  })

  describe('setLoCha', () => {
    it('sets loCha data and populates groups', () => {
      const { setLoCha, loCha, groups } = useLoCha()

      const feature1 = createFeature({ id: 'n1', properties: { links: 0 } })
      const feature2 = createFeature({ id: 'n2', properties: { links: 0 } })
      const data = createApiResponse(
        [feature1, feature2],
        [[createLink({ before: 'n1', after: 'n2' })]],
      )

      setLoCha(data)

      expect(loCha.value).toBeDefined()
      expect(loCha.value?.features).toHaveLength(2)
      expect(groups.value.length).toBeGreaterThan(0)
    })

    it('groups features by link ID', () => {
      const { setLoCha, groups } = useLoCha()

      const feature1 = createFeature({ id: 'n1', properties: { links: 0 } })
      const feature2 = createFeature({ id: 'n2', properties: { links: 0 } })
      const feature3 = createFeature({ id: 'n3', properties: { links: 1 } })
      const data = createApiResponse(
        [feature1, feature2, feature3],
        [
          [createLink({ before: 'n1', after: 'n2' })],
          [createLink({ after: 'n3' })],
        ],
      )

      setLoCha(data)

      // Group at index 1 should have 2 features (links=1), group at index 2 should have 1 (links=2)
      const nonEmptyGroups = groups.value.filter(g => g && g.length > 0)
      expect(nonEmptyGroups).toHaveLength(2)
    })

    it('resets state before setting new data', () => {
      const { setLoCha, loCha } = useLoCha()

      const feature1 = createFeature({ id: 'n1', properties: { links: 0 } })
      const data1 = createApiResponse(
        [feature1],
        [[createLink({ after: 'n1' })]],
      )
      setLoCha(data1)
      expect(loCha.value?.features).toHaveLength(1)

      const feature2 = createFeature({ id: 'n2', properties: { links: 0 } })
      const feature3 = createFeature({ id: 'n3', properties: { links: 0 } })
      const data2 = createApiResponse(
        [feature2, feature3],
        [[createLink({ before: 'n2', after: 'n3' })]],
      )
      setLoCha(data2)
      expect(loCha.value?.features).toHaveLength(2)
    })
  })

  describe('featureCount', () => {
    it('returns undefined when no data is set', () => {
      const { featureCount } = useLoCha()
      expect(featureCount.value).toBeUndefined()
    })

    it('returns the feature count when data is set', () => {
      const { featureCount, setLoCha } = useLoCha()

      const features = [
        createFeature({ id: 'n1', properties: { links: 0 } }),
        createFeature({ id: 'n2', properties: { links: 0 } }),
        createFeature({ id: 'n3', properties: { links: 1 } }),
      ]
      const data = createApiResponse(features, [
        [createLink({ before: 'n1', after: 'n2' })],
        [createLink({ after: 'n3' })],
      ])

      setLoCha(data)
      expect(featureCount.value).toBe(3)
    })
  })
})
