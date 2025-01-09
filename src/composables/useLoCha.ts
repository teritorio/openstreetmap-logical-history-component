import type { ApiResponse } from '@/composables/useApi'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

/**
 * The possible statuses for features in the system.
 * - 'create': New features.
 * - 'delete': Deleted features.
 * - 'update': Updated features.
 */
export type Status = 'create' | 'delete' | 'update'

/**
 * The Color type defines colors based on feature status.
 * - 'create' maps to '#52c41a'
 * - 'delete' maps to '#FF0000'
 * - 'update' maps to '#E6A23C'
 */
export type Color = {
  [key in Status]: key extends 'create'
    ? '#52c41a'
    : key extends 'delete'
      ? '#FF0000'
      : '#E6A23C';
}

/**
 * A predefined object that maps status types to corresponding color codes.
 */
export const loChaColors = {
  create: '#52c41a',
  delete: '#FF0000',
  update: '#E6A23C',
} satisfies Color

/**
 * Creates a mapping of status keys to themselves (i.e., 'create' -> 'create', 'delete' -> 'delete', etc.).
 * This is useful for status-based filtering or logic.
 */
export const loChaStatus = Object.fromEntries(
  ['create', 'delete', 'update'].map(key => [key, key]),
) as Record<Status, Status>

/**
 * The LoCha interface defines the structure of the LoCha state,
 * which includes various references and computed values to track the features and metadata.
 */
export interface LoCha {
  afterFeatures: Ref<GeoJSON.Feature[]>
  beforeFeatures: Ref<GeoJSON.Feature[]>
  featureCount: ComputedRef<number | undefined>
  linkCount: ComputedRef<number | undefined>
  loCha: Ref<ApiResponse | undefined>
  setLoCha: (loCha: ApiResponse) => void
}

// Internal state variables
const loCha = ref<ApiResponse>()
const afterFeatures = ref<GeoJSON.Feature[]>([])
const beforeFeatures = ref<GeoJSON.Feature[]>([])

/**
 * The `useLoCha` composable provides reactive state and functions for managing and manipulating LoCha data.
 * This includes tracking features, metadata, and updating state based on new data.
 * @returns An object containing reactive references and functions for working with LoCha data.
 */
export function useLoCha(): LoCha {
  /**
   * A computed reference to count the number of features in the LoCha response.
   * @returns The number of features in the LoCha response, or undefined if no data is available.
   */
  const featureCount = computed(() => loCha.value?.features.length)

  /**
   * A computed reference to count the number of links in the LoCha metadata.
   * @returns The number of links in the metadata, or undefined if no data is available.
   */
  const linkCount = computed(() => loCha.value?.metadata.links.length)

  /**
   * Populates the `beforeFeatures` and `afterFeatures` arrays based on the properties of the features.
   * - Features marked as 'is_before' are added to `beforeFeatures`.
   * - Features marked as 'is_deleted' are also added to `beforeFeatures`.
   * - Features marked as 'is_after' are added to `afterFeatures`.
   * - Features marked as 'is_created' are added to `afterFeatures`.
   */
  function populateBeforeAfterFeatures(): void {
    if (!featureCount.value)
      return

    loCha.value?.features.forEach((feature) => {
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

  /**
   * Sets the LoCha data and populates the before and after features.
   * @param data - The LoCha API response data to set.
   */
  function setLoCha(data: ApiResponse): void {
    resetLoCha()
    loCha.value = data
    populateBeforeAfterFeatures()
  }

  /**
   * Resets the LoCha state by clearing the LoCha data and resetting the feature arrays.
   */
  function resetLoCha(): void {
    loCha.value = undefined
    afterFeatures.value = []
    beforeFeatures.value = []
  }

  return {
    afterFeatures,
    beforeFeatures,
    featureCount,
    linkCount,
    loCha,
    setLoCha,
  }
}
