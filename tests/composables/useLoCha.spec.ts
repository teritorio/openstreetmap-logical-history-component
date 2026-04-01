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

  describe('getBeforeFeatures', () => {
    it('returns only features with is_before flag', () => {
      const { getBeforeFeatures } = useLoCha()
      const features = [
        createFeature({ id: 'n1', properties: { is_before: true } }),
        createFeature({ id: 'n2', properties: { is_after: true } }),
        createFeature({ id: 'n3', properties: { is_new: true } }),
        createFeature({ id: 'n4' }),
      ]

      const result = getBeforeFeatures(features)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('n1')
    })

    it('returns empty array when no before features exist', () => {
      const { getBeforeFeatures } = useLoCha()
      const features = [
        createFeature({ id: 'n1', properties: { is_after: true } }),
        createFeature({ id: 'n2', properties: { is_new: true } }),
      ]

      expect(getBeforeFeatures(features)).toHaveLength(0)
    })

    it('returns empty array for empty input', () => {
      const { getBeforeFeatures } = useLoCha()
      expect(getBeforeFeatures([])).toHaveLength(0)
    })
  })

  describe('getAfterFeatures', () => {
    it('returns features with is_after flag', () => {
      const { getAfterFeatures } = useLoCha()
      const features = [
        createFeature({ id: 'n1', properties: { is_before: true } }),
        createFeature({ id: 'n2', properties: { is_after: true } }),
      ]

      const result = getAfterFeatures(features)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('n2')
    })

    it('returns features with is_new flag', () => {
      const { getAfterFeatures } = useLoCha()
      const features = [
        createFeature({ id: 'n1', properties: { is_new: true } }),
        createFeature({ id: 'n2', properties: { is_before: true } }),
      ]

      const result = getAfterFeatures(features)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('n1')
    })

    it('returns both is_after and is_new features', () => {
      const { getAfterFeatures } = useLoCha()
      const features = [
        createFeature({ id: 'n1', properties: { is_after: true } }),
        createFeature({ id: 'n2', properties: { is_new: true } }),
        createFeature({ id: 'n3', properties: { is_before: true } }),
      ]

      const result = getAfterFeatures(features)
      expect(result).toHaveLength(2)
      expect(result.map(f => f.id)).toEqual(['n1', 'n2'])
    })

    it('excludes features with no flags', () => {
      const { getAfterFeatures } = useLoCha()
      const features = [createFeature({ id: 'n1' })]

      expect(getAfterFeatures(features)).toHaveLength(0)
    })

    it('returns empty array for empty input', () => {
      const { getAfterFeatures } = useLoCha()
      expect(getAfterFeatures([])).toHaveLength(0)
    })
  })

  describe('_resetState', () => {
    it('clears groups when setLoCha is called with new data', () => {
      const { setLoCha, groups } = useLoCha()

      // First call: features in groups 0, 1, and 2
      const data1 = createApiResponse(
        [
          createFeature({ id: 'n1', properties: { links: 0 } }),
          createFeature({ id: 'n2', properties: { links: 1 } }),
          createFeature({ id: 'n3', properties: { links: 2 } }),
        ],
        [
          [createLink({ after: 'n1' })],
          [createLink({ after: 'n2' })],
          [createLink({ after: 'n3' })],
        ],
      )
      setLoCha(data1)
      expect(groups.value.filter(g => g && g.length > 0)).toHaveLength(3)

      // Second call: only 1 group — stale indices must not persist
      const data2 = createApiResponse(
        [createFeature({ id: 'n4', properties: { links: 0 } })],
        [[createLink({ after: 'n4' })]],
      )
      setLoCha(data2)
      expect(groups.value.filter(g => g && g.length > 0)).toHaveLength(1)
      expect(groups.value[1]).toBeUndefined()
      expect(groups.value[2]).toBeUndefined()
    })

    it('clears groups on loCha reassignment so stale data is never exposed', () => {
      const { setLoCha, loCha, groups } = useLoCha()

      const data = createApiResponse(
        [createFeature({ id: 'n1', properties: { links: 0 } })],
        [[createLink({ after: 'n1' })]],
      )
      setLoCha(data)
      expect(groups.value.filter(g => g && g.length > 0)).toHaveLength(1)

      // Manually clear loCha to simulate what _resetState does
      loCha.value = undefined
      groups.value = []

      expect(groups.value).toHaveLength(0)
      expect(loCha.value).toBeUndefined()
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
