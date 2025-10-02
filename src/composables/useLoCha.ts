import type { ComputedRef, Ref } from 'vue'
import type { ApiResponse, IFeature } from '@/composables/useApi'
import { computed, ref } from 'vue'

/**
 * The possible statuses for features in the system.
 * - 'new': New features.
 * - 'delete': Deleted features.
 * - 'update': Updated features.
 */
export type Status = 'new' | 'delete' | 'updateBefore' | 'updateAfter'

/**
 * The Color type defines colors based on feature status.
 * - 'new' maps to '#52c41a'
 * - 'delete' maps to '#FF0000'
 * - 'updateBefore' maps to '#FFA479'
 * - 'updateAfter' maps to '#F2BE00'
 */
export type Color = {
  [key in Status]: key extends 'new'
    ? '#52c41a'
    : key extends 'delete'
      ? '#FF0000'
      : key extends 'updateBefore'
        ? '#FFA479'
        : '#F2BE00'
}

export type LoChaGroup = IFeature[]

/**
 * A predefined object that maps status types to corresponding color codes.
 */
export const loChaColors = {
  new: '#52c41a',
  delete: '#FF0000',
  updateBefore: '#FFA479',
  updateAfter: '#F2BE00',
} satisfies Color

/**
 * Creates a mapping of status keys to themselves (i.e., 'new' -> 'new', 'delete' -> 'delete', etc.).
 * This is useful for status-based filtering or logic.
 */
export const loChaStatus = Object.fromEntries(
  ['new', 'delete', 'updateAfter', 'updateBefore'].map(key => [key, key]),
) as Record<Status, Status>

/**
 * The LoCha interface defines the structure of the LoCha state,
 * which includes various references and computed values to track the features and metadata.
 */
export interface LoCha {
  featureCount: ComputedRef<number | undefined>
  groups: Ref<LoChaGroup[]>
  loCha: Ref<ApiResponse | undefined>
  setLoCha: (loCha: ApiResponse) => void
  getStatus: (feature: IFeature) => Status
}

// Internal state variables
const loCha = ref<ApiResponse>()
const selectedFeatureId = ref<number>()
const groups = ref<LoChaGroup[]>([])

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

  function groupFeaturesByLinks(features: IFeature[]): LoChaGroup[] {
    return features.reduce((groups, feature) => {
      const linkId = feature.properties.links
      if (!groups[linkId]) {
        groups[linkId] = []
      }
      groups[linkId].push(feature)
      return groups
    }, [] as LoChaGroup[])
  }

  /**
   * Sets the LoCha data and populates the before and after features.
   * @param data - The LoCha API response data to set.
   */
  function setLoCha(data: ApiResponse): void {
    _resetState()

    loCha.value = data
    groups.value = groupFeaturesByLinks(data.features)
  }

  function getStatus(feature: IFeature): Status {
    if (feature.properties.is_new) {
      return loChaStatus.new
    }

    if (feature.properties.deleted) {
      return loChaStatus.delete
    }

    if (feature.properties.is_before) {
      return loChaStatus.updateBefore
    }

    return loChaStatus.updateAfter
  }

  /**
   * Resets the LoCha state by clearing the LoCha data and resetting the feature arrays.
   */
  function _resetState(): void {
    loCha.value = undefined
    _resetGroup()
  }

  function _resetGroup(): void {
    selectedFeatureId.value = undefined
  }

  return {
    featureCount,
    loCha,
    groups,
    setLoCha,
    getStatus,
  }
}
