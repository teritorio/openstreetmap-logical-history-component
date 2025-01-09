import type { ApiResponse } from '@/composables/useApi'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

export type Status = 'create' | 'delete' | 'update'

export type Color = {
  [key in Status]: key extends 'create'
    ? '#52c41a'
    : key extends 'delete'
      ? '#FF0000'
      : '#E6A23C';
}

export const loChaColors = {
  create: '#52c41a',
  delete: '#FF0000',
  update: '#E6A23C',
} satisfies Color

export const loChaStatus = Object.fromEntries(
  ['create', 'delete', 'update'].map(key => [key, key]),
) as Record<Status, Status>

export interface LoCha {
  afterFeatures: Ref<GeoJSON.Feature[]>
  beforeFeatures: Ref<GeoJSON.Feature[]>
  featureCount: ComputedRef<number | undefined>
  linkCount: ComputedRef<number | undefined>
  setLoCha: (loCha: ApiResponse) => void
}

const loCha = ref<ApiResponse>()
const afterFeatures = ref<GeoJSON.Feature[]>([])
const beforeFeatures = ref<GeoJSON.Feature[]>([])

export function useLoCha(): LoCha {
  const featureCount = computed(() => loCha.value?.features.length)

  const linkCount = computed(() => loCha.value?.metadata.links.length)

  function populateBeforeAfterFeatures(): void {
    if (!loCha.value || !loCha.value.features.length)
      return

    loCha.value.features.forEach((feature) => {
      if (feature.properties?.is_before)
        beforeFeatures.value.push(feature)

      if (feature.properties?.is_deleted)
        beforeFeatures.value.push(feature)

      if (feature.properties?.is_after)
        afterFeatures.value.push(feature)

      if (feature.properties?.is_created)
        afterFeatures.value.push(feature)
    })
  }

  function setLoCha(data: ApiResponse): void {
    loCha.value = data
    populateBeforeAfterFeatures()
  }

  return {
    afterFeatures,
    beforeFeatures,
    featureCount,
    linkCount,
    setLoCha,
  }
}
