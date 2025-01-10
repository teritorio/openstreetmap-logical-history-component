import type { ApiLink, ApiResponse } from '@/composables/useApi'
import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'

/**
 * The possible statuses for features in the system.
 * - 'create': New features.
 * - 'delete': Deleted features.
 * - 'update': Updated features.
 */
export type Status = 'create' | 'delete' | 'updateBefore' | 'updateAfter'

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
      : key extends 'updateBefore'
        ? '#FFA479'
        : '#F2BE00'
}

/**
 * A predefined object that maps status types to corresponding color codes.
 */
export const loChaColors = {
  create: '#52c41a',
  delete: '#FF0000',
  updateBefore: '#FFA479',
  updateAfter: '#F2BE00',
} satisfies Color

/**
 * Creates a mapping of status keys to themselves (i.e., 'create' -> 'create', 'delete' -> 'delete', etc.).
 * This is useful for status-based filtering or logic.
 */
export const loChaStatus = Object.fromEntries(
  ['create', 'delete', 'updateAfter', 'updateBefore'].map(key => [key, key]),
) as Record<Status, Status>

/**
 * The LoCha interface defines the structure of the LoCha state,
 * which includes various references and computed values to track the features and metadata.
 */
export interface LoCha {
  afterFeatures: Ref<GeoJSON.Feature[]>
  afterFeaturesFilter: Ref<GeoJSON.Feature[] | undefined>
  beforeFeatures: Ref<GeoJSON.Feature[]>
  beforeFeaturesFilter: Ref<GeoJSON.Feature[] | undefined>
  featureCount: ComputedRef<number | undefined>
  showLink: (id: string, status: Status) => void
  linkCount: ComputedRef<number | undefined>
  loCha: Ref<ApiResponse | undefined>
  resetFilters: () => void
  selectedLink: Ref<ApiLink | undefined>
  selectedLinkFeatures: ComputedRef<GeoJSON.Feature[] | undefined>
  setLoCha: (loCha: ApiResponse) => void
}

// Internal state variables
const loCha = ref<ApiResponse>()
const afterFeatures = ref<GeoJSON.Feature[]>([])
const afterFeaturesFilter = ref<GeoJSON.Feature[]>()
const beforeFeatures = ref<GeoJSON.Feature[]>([])
const beforeFeaturesFilter = ref<GeoJSON.Feature[]>()
const selectedLink = ref<ApiLink>()

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

  const selectedLinkFeatures = computed(() => {
    if (!selectedLink.value)
      return

    let after: GeoJSON.Feature | undefined
    let before: GeoJSON.Feature | undefined

    if (selectedLink.value.after)
      after = _getFeature(selectedLink.value.after)

    if (selectedLink.value.before)
      before = _getFeature(selectedLink.value.before)

    return [after, before].filter(t => t !== undefined)
  })

  /**
   * Sets the LoCha data and populates the before and after features.
   * @param data - The LoCha API response data to set.
   */
  function setLoCha(data: ApiResponse): void {
    _resetLoCha()
    loCha.value = data
    _populateBeforeAfterFeatures()
  }

  function showLink(id: string, status: Status): void {
    const link = _getLink(id, status)

    if (!link)
      throw new Error(`Link for ${id} and ${status} status not found.`)

    selectedLink.value = link

    switch (status) {
      case 'create':
        afterFeaturesFilter.value = afterFeatures.value.filter(feature => feature.id?.toString() === link.after)
        beforeFeaturesFilter.value = []
        break
      case 'delete':
        afterFeaturesFilter.value = []
        beforeFeaturesFilter.value = beforeFeatures.value.filter(feature => feature.id?.toString() === link.before)
        break
      case 'updateAfter':
      case 'updateBefore':
        afterFeaturesFilter.value = afterFeatures.value.filter(feature => feature.id?.toString() === link.after)
        beforeFeaturesFilter.value = beforeFeatures.value.filter(feature => feature.id?.toString() === link.before)
        break
      default:
        throw new Error('Status not found.')
    }
  }

  function resetFilters(): void {
    afterFeaturesFilter.value = undefined
    beforeFeaturesFilter.value = undefined
    selectedLink.value = undefined
  }

  function _getFeature(id: string): GeoJSON.Feature | undefined {
    return loCha.value?.features.find(feature => feature.id?.toString() === id)
  }

  /**
   * Populates the `beforeFeatures` and `afterFeatures` arrays based on the properties of the features.
   * - Features marked as 'is_before' are added to `beforeFeatures`.
   * - Features marked as 'is_deleted' are also added to `beforeFeatures`.
   * - Features marked as 'is_after' are added to `afterFeatures`.
   * - Features marked as 'is_created' are added to `afterFeatures`.
   */
  function _populateBeforeAfterFeatures(): void {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    if (!featureCount.value)
      return

    loCha.value.features.forEach((feature) => {
      if (!feature.properties)
        return

      if (feature.properties.is_before)
        beforeFeatures.value.push(feature)

      if (feature.properties.is_deleted)
        beforeFeatures.value.push(feature)

      if (feature.properties.is_after)
        afterFeatures.value.push(feature)

      if (feature.properties.is_created)
        afterFeatures.value.push(feature)
    })
  }

  function _getLink(id: string, status: Status): ApiLink | undefined {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    if (!linkCount.value)
      return

    switch (status) {
      case 'create':
      case 'updateAfter':
        return loCha.value.metadata.links.find(link => link.after === id)
      case 'updateBefore':
      case 'delete':
        return loCha.value.metadata.links.find(link => link.before === id)
      default:
        return undefined
    }
  }

  /**
   * Resets the LoCha state by clearing the LoCha data and resetting the feature arrays.
   */
  function _resetLoCha(): void {
    loCha.value = undefined
    afterFeatures.value = []
    beforeFeatures.value = []
    resetFilters()
  }

  return {
    afterFeatures,
    afterFeaturesFilter,
    beforeFeatures,
    beforeFeaturesFilter,
    featureCount,
    showLink,
    linkCount,
    loCha,
    resetFilters,
    selectedLink,
    selectedLinkFeatures,
    setLoCha,
  }
}
