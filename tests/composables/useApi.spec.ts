import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiResponse, createFeature, createLink } from '../factories'

// Mock turf modules
vi.mock('@turf/boolean-equal', () => ({
  default: vi.fn((a: any, b: any) => {
    return JSON.stringify(a) === JSON.stringify(b)
  }),
}))

vi.mock('@turf/area', () => ({
  area: vi.fn((feature: any) => {
    if (feature.geometry?.type === 'Polygon') {
      // Return a mock area based on coordinates length
      return feature.geometry.coordinates[0]?.length * 100 || 0
    }
    return 0
  }),
}))

describe('useApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('useApiConfig', () => {
    it('returns error, fetchData, loading, setError, resetError', async () => {
      const { useApiConfig } = await import('@/composables/useApi')
      const api = useApiConfig()

      expect(api.error).toBeDefined()
      expect(api.fetchData).toBeTypeOf('function')
      expect(api.loading).toBeDefined()
      expect(api.setError).toBeTypeOf('function')
      expect(api.resetError).toBeTypeOf('function')
    })
  })

  describe('setError / resetError', () => {
    it('sets the error state', async () => {
      const { useApiConfig } = await import('@/composables/useApi')
      const { error, setError } = useApiConfig()

      setError({ message: 'Something failed', type: 'error' })
      expect(error.message).toBe('Something failed')
      expect(error.type).toBe('error')
    })

    it('resets the error state', async () => {
      const { useApiConfig } = await import('@/composables/useApi')
      const { error, setError, resetError } = useApiConfig()

      setError({ message: 'Error', type: 'error' })
      resetError()
      expect(error.message).toBeUndefined()
      expect(error.type).toBe('info')
    })
  })

  describe('fetchData', () => {
    it('sets loading to true during fetch and false after', async () => {
      const mockResponse = createApiResponse([], {})

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, loading } = useApiConfig()

      expect(loading.value).toBe(false)
      const promise = fetchData({ date_start: '2024-01-01' })
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })

    it('returns undefined and sets error on fetch failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
      expect(error.message).toBe('Network error')
      expect(error.type).toBe('error')
    })

    it('returns undefined and sets error on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error message'),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
      expect(error.message).toBe('Server error message')
      expect(error.type).toBe('error')
    })

    it('resets error before each fetch', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createApiResponse([], {})),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error, setError } = useApiConfig()

      setError({ message: 'Previous error', type: 'error' })
      expect(error.message).toBe('Previous error')

      await fetchData({ date_start: '2024-01-01' })
      expect(error.message).toBeUndefined()
    })

    it('unwraps array response and uses the first entry', async () => {
      const feature = createFeature({ id: 10, properties: { links: 1 } as any })
      const first = createApiResponse([feature], { 1: [createLink({ after: 10 })] })
      const second = createApiResponse([], {})

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([first, second]),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeDefined()
      expect(result?.features).toHaveLength(1)
      expect(result?.features[0].id).toBe(10)
    })

    it('returns undefined and sets error on empty array response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
      expect(error.message).toBe('Empty response from API')
      expect(error.type).toBe('error')
    })

    it('filters out undefined and empty params from the URL', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createApiResponse([], {})),
      })
      vi.stubGlobal('fetch', fetchSpy)

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      await fetchData({
        date_start: '2024-01-01',
        date_end: undefined,
        bbox: '',
      })

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('date_start=2024-01-01')
      expect(calledUrl).not.toContain('date_end')
      expect(calledUrl).not.toContain('bbox')
    })
  })

  describe('transformFeatures', () => {
    it('sets is_before flag when feature ID matches link.before', async () => {
      const feature1 = createFeature({ id: 10, properties: { links: 1 } as any })
      const feature2 = createFeature({ id: 20, properties: { links: 1 } as any })
      const links = { 1: [createLink({ before: 10, after: 20 })] }
      const mockData = createApiResponse([feature1, feature2], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const beforeFeature = result?.features.find(f => f.id === 10)
      expect(beforeFeature?.properties.is_before).toBe(true)
    })

    it('sets is_after flag when feature ID matches link.after with before present', async () => {
      const feature1 = createFeature({ id: 10, properties: { links: 1 } as any })
      const feature2 = createFeature({ id: 20, properties: { links: 1 } as any })
      const links = { 1: [createLink({ before: 10, after: 20 })] }
      const mockData = createApiResponse([feature1, feature2], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const afterFeature = result?.features.find(f => f.id === 20)
      expect(afterFeature?.properties.is_after).toBe(true)
    })

    it('sets is_after flag when link.before is undefined but link.after is defined', async () => {
      const feature = createFeature({ id: 10, properties: { links: 1 } as any })
      // Link has 'before' key but set to undefined, and 'after' set to feature id
      const links = { 1: [createLink({ before: undefined, after: 10 })] }
      const mockData = createApiResponse([feature], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const afterFeature = result?.features.find(f => f.id === 10)
      expect(afterFeature?.properties.is_after).toBe(true)
    })

    it('sets is_new flag when link has no before key', async () => {
      const feature = createFeature({ id: 10, properties: { links: 1 } as any })
      // The 'before' key must not exist at all (not just undefined) for is_new to trigger
      const link = { action: 'accept' as const, after: 10, diff_attribs: undefined, diff_tags: undefined, conflation_reason: { geom: { score: 0.9, reason: 'test' }, tags: { score: 0.8, reason: 'test' }, conflate: 'test' } }
      const links = { 1: [link] }
      const mockData = createApiResponse([feature], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const newFeature = result?.features.find(f => f.id === 10)
      expect(newFeature?.properties.is_new).toBe(true)
    })

    it('sets geom to true when linked features have different geometries', async () => {
      const feature1 = createFeature({
        id: 10,
        geometry: { type: 'Point', coordinates: [2.35, 48.85] },
        properties: { links: 1 } as any,
      })
      const feature2 = createFeature({
        id: 20,
        geometry: { type: 'Point', coordinates: [3.00, 49.00] },
        properties: { links: 1 } as any,
      })
      const links = { 1: [createLink({ before: 10, after: 20 })] }
      const mockData = createApiResponse([feature1, feature2], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const beforeFeature = result?.features.find(f => f.id === 10)
      expect(beforeFeature?.properties.geom).toBe(true)
    })

    it('sets geom to false when linked features have identical geometries', async () => {
      const sharedGeometry = { type: 'Point' as const, coordinates: [2.35, 48.85] }
      const feature1 = createFeature({
        id: 10,
        geometry: sharedGeometry,
        properties: { links: 1 } as any,
      })
      const feature2 = createFeature({
        id: 20,
        geometry: sharedGeometry,
        properties: { links: 1 } as any,
      })
      const links = { 1: [createLink({ before: 10, after: 20 })] }
      const mockData = createApiResponse([feature1, feature2], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const beforeFeature = result?.features.find(f => f.id === 10)
      expect(beforeFeature?.properties.geom).toBe(false)
    })

    it('throws error when feature has no matching group', async () => {
      const feature = createFeature({ id: 10, properties: { links: 999 } as any })
      const links = { 1: [createLink({ before: 10 })] }
      const mockData = createApiResponse([feature], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
      expect(error.message).toContain('has no group')
    })

    it('throws error when feature has no matching link', async () => {
      const feature = createFeature({ id: 10, properties: { links: 1 } as any })
      const links = { 1: [createLink({ before: 999, after: 888 })] }
      const mockData = createApiResponse([feature], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
      expect(error.message).toContain('has no link')
    })

    it('sorts features by area in descending order', async () => {
      const smallPolygon = createFeature({
        id: 10,
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
        },
        properties: { links: 1 } as any,
      })
      const largePolygon = createFeature({
        id: 20,
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
        properties: { links: 2 } as any,
      })
      const links = {
        1: [createLink({ after: 10 })],
        2: [createLink({ after: 20 })],
      }
      const mockData = createApiResponse([smallPolygon, largePolygon], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      // Large polygon (5 coords = area 500) should come before small (4 coords = area 400)
      expect(result?.features[0].id).toBe(20)
      expect(result?.features[1].id).toBe(10)
    })
  })
})
