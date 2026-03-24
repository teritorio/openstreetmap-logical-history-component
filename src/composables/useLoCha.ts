import type { ApiResponse, Color, IFeature, LoChaGroup, LoCha as LoChaInterface, Status } from '@/types'
import { computed, ref } from 'vue'

export type { Color, LoCha, LoChaGroup, Status } from '@/types'

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

// Internal state variables
const loCha = ref<ApiResponse>()
const groups = ref<LoChaGroup[]>([])

/**
 * The `useLoCha` composable provides reactive state and functions for managing and manipulating LoCha data.
 * This includes tracking features, metadata, and updating state based on new data.
 * @returns An object containing reactive references and functions for working with LoCha data.
 */
export function useLoCha(): LoChaInterface {
  /**
   * A computed reference to count the number of features in the LoCha response.
   * @returns The number of features in the LoCha response, or undefined if no data is available.
   */
  const featureCount = computed(() => loCha.value?.features.length)

  function groupFeaturesByLinks(features: IFeature[]): LoChaGroup[] {
    const map = new Map<number, IFeature[]>()
    for (const feature of features) {
      const linkId = feature.properties.links
      let group = map.get(linkId)
      if (!group) {
        group = []
        map.set(linkId, group)
      }
      group.push(feature)
    }
    return Array.from(map, ([linkId, features]) => ({ linkId, features }))
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

  function getBeforeFeatures(features: IFeature[]): IFeature[] {
    return features.filter(feature => feature.properties.is_before)
  }

  function getAfterFeatures(features: IFeature[]): IFeature[] {
    return features.filter(feature => feature.properties.is_after || feature.properties.is_new)
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
  }

  return {
    featureCount,
    loCha,
    groups,
    setLoCha,
    getStatus,
    getBeforeFeatures,
    getAfterFeatures,
  }
}
