import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiResponse, createFeature, createLink } from '../factories'
import '../mocks/turf'

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
        json: () => Promise.resolve(createApiResponse([], [])),
      }))

      const { useApiConfig } = await import('@/composables/useApi')
      const { fetchData, error, setError } = useApiConfig()

      setError({ message: 'Previous error', type: 'error' })
      expect(error.message).toBe('Previous error')

      await fetchData({ date_start: '2024-01-01' })
      expect(error.message).toBeUndefined()
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
