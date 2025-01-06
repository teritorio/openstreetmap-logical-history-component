import type { ApiLink, ApiResponse } from '@/composables/useApi'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

export type Status = 'create' | 'delete' | 'update'

export type Color = {
  [key in Status]: key extends 'create'
    ? '#52c41a'
    : key extends 'delete'
      ? '#FF0000'
      : '#F0F0F0';
}

export const loChaColors = {
  create: '#52c41a',
  delete: '#FF0000',
  update: '#F0F0F0',
} satisfies Color

export const loChaStatus = Object.fromEntries(
  ['create', 'delete', 'update'].map(key => [key, key]),
) as Record<Status, Status>

export interface LoCha {
  color: ComputedRef<Color[Status]>
  counter: Ref<number>
  featureAfter: ComputedRef<GeoJSON.Feature | undefined>
  featureBefore: ComputedRef<GeoJSON.Feature | undefined>
  featureCount: ComputedRef<number | undefined>
  link: ComputedRef<ApiLink | undefined>
  linkCount: ComputedRef<number | undefined>
  status: ComputedRef<Status>
  setLoCha: (loCha: ApiResponse) => void
  updateCounter: (direction: boolean) => void
}

const counter = ref<number>(0)
const loCha = ref<ApiResponse>()

export function useLoCha(): LoCha {
  const link = computed(() => loCha.value?.metadata.links[counter.value])

  const status = computed(() => {
    if (!link.value?.before && link.value?.after)
      return loChaStatus.create

    if (link.value?.before && !link.value.after)
      return loChaStatus.delete

    return loChaStatus.update
  })

  const color = computed(() => loChaColors[status.value])

  const featureAfter = computed(() => loCha.value?.features.find(feature => feature.id?.toString() === link.value?.after))

  const featureBefore = computed(() => loCha.value?.features.find(feature => feature.id?.toString() === link.value?.before))

  const featureCount = computed(() => loCha.value?.features.length)

  const linkCount = computed(() => loCha.value?.metadata.links.length)

  function updateCounter(direction: boolean): void {
    counter.value = direction ? counter.value + 1 : counter.value - 1
  }

  function setLoCha(data: ApiResponse): void {
    loCha.value = data
  }

  return {
    color,
    counter,
    featureAfter,
    featureBefore,
    featureCount,
    link,
    linkCount,
    status,
    setLoCha,
    updateCounter,
  }
}
