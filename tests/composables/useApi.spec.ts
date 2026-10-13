import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiResponse, createFeature, createLink } from '../factories'
import '../mocks/turf'

describe('useApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('useApiConfig', () => {
    it('returns fetchData and loading', async () => {
      const { useApiConfig } = await import('@/composables/useApi')
      const api = useApiConfig()

      expect(api.fetchData).toBeTypeOf('function')
      expect(api.loading).toBeDefined()
    })
  })

  describe('fetchData', () => {
    it('sets loading to true during fetch and false after', async () => {
      const mockResponse = createApiResponse([], [])

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

    it('returns undefined on fetch failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
    })

    it('returns undefined on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error message'),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      expect(result).toBeUndefined()
    })

    it('filters out undefined and empty params from the URL', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createApiResponse([], [])),
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

    it('returns features processed by transformFeatures', async () => {
      const feature1 = createFeature({ id: 'bw10', properties: { links: 0 } })
      const feature2 = createFeature({ id: 'aw20', properties: { links: 0 } })
      const links = [[createLink({ before: 'bw10', after: 'aw20' })]]
      const mockData = createApiResponse([feature1, feature2], links)

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData } = useApiConfig()

      const result = await fetchData({ date_start: '2024-01-01' })
      const beforeFeature = result?.features.find(f => f.id === 'bw10')
      const afterFeature = result?.features.find(f => f.id === 'aw20')
      expect(beforeFeature?.properties.is_before).toBe(true)
      expect(afterFeature?.properties.is_after).toBe(true)
    })
  })
})
