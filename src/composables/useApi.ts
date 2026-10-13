import type { CreateToasterReturn } from '@ark-ui/vue'
import type { Ref } from 'vue'
import type { LoChaData } from '@/types'
import { inject, ref } from 'vue'
import { transformFeatures } from '@/utils/feature-transform'

export type { Action, Actions, ActionType, ActionTypeOptions, ApiLink, ApiLinkGroups, IFeature, LoChaData, Reason, ReasonGeom, ReasonTags } from '@/types'

const HTML_TAGS_RE = /<[^>]+>/g
const WHITESPACE_RE = /\s+/g

interface ApiComposable {
  loading: Ref<boolean>
  fetchData: (params: Record<string, string | undefined>) => Promise<LoChaData | undefined>
}

export function useApiConfig(): ApiComposable {
  const apiBaseUrl = import.meta.env.MODE === 'development'
    ? import.meta.env.VITE_APP_HOST
    : import.meta.env.VITE_API_ENDPOINT

  const toaster = inject<CreateToasterReturn>('toaster')
  const loading = ref(false)
  let lastParams: Record<string, string | undefined> = {}

  function buildApiUrl(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '')
        searchParams.set(key, value)
    })

    const endpoint = '/api/0.1/overpass_logical_history'
    return params ? `${apiBaseUrl}${endpoint}?${searchParams}` : `${apiBaseUrl}${endpoint}`
  }

  async function fetchData(params: Record<string, string | undefined>): Promise<LoChaData | undefined> {
    lastParams = params
    loading.value = true

    return await fetch(
      buildApiUrl(params),
      { method: 'GET', headers: { Accept: 'application/geo+json' } },
    )
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text()
          throw new Error(message || res.statusText)
        }

        return await res.json() as LoChaData
      })
      .then(data => ({
        ...data,
        features: transformFeatures(data),
      }))
      .catch((err) => {
        const raw: string = err.message ?? ''
        const text = raw.replace(HTML_TAGS_RE, ' ').replace(WHITESPACE_RE, ' ').trim()
        const description = text.length > 200 ? `${text.slice(0, 200)}…` : text

        toaster?.create({
          title: 'Request failed',
          description: description || undefined,
          type: 'error',
          action: { label: 'Retry', onClick: () => fetchData(lastParams) },
        })

        return undefined
      })
      .finally(() => loading.value = false)
  }

  return {
    loading,
    fetchData,
  }
}
