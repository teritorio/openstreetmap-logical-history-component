import type { ApiLink, ApiResponse, IFeature } from '@/composables/useApi'
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
  afterFeatures: ComputedRef<IFeature[]>
  beforeFeatures: ComputedRef<IFeature[]>
  featureCount: ComputedRef<number | undefined>
  showLink: (id: number, status: Status) => void
  linkCount: ComputedRef<number | undefined>
  loCha: Ref<ApiResponse | undefined>
  selectedLinks: Ref<ApiLink[]>
  selectedFeatures: ComputedRef<Set<IFeature>>
  setLoCha: (loCha: ApiResponse) => void
  resetLink: () => void
  getStatus: (feature: IFeature) => Status
}

// Internal state variables
const loCha = ref<ApiResponse>()
const selectedLinks = ref<ApiLink[]>([])

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

  const selectedFeatures = computed(() => {
    const features = new Set<IFeature>()

    if (!selectedLinks.value.length)
      return features

    selectedLinks.value.forEach((link) => {
      if (link.before !== undefined)
        features.add(_getFeature(link.before))

      if (link.after !== undefined)
        features.add(_getFeature(link.after))
    })

    return features
  })

  const afterFeatures = computed(() => {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    return loCha.value.features
      .filter(feature => feature.properties.is_after || feature.properties.is_created)
      .sort(_bringSelectedFeaturesOnTop)
  })

  const beforeFeatures = computed(() => {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    return loCha.value.features
      .filter(feature => feature.properties.is_before || feature.properties.is_deleted)
      .sort(_bringSelectedFeaturesOnTop)
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

  function showLink(id: number, status: Status): void {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    // Search direct links containing clicked link id
    selectedLinks.value = loCha.value.metadata.links.filter(link => [link.before, link.after].includes(id))

    // Search indirect links containing clicked link before id
    if (status === 'updateAfter') {
      selectedLinks.value.forEach((link) => {
        if (link.before === undefined)
          return

        const additionalLinks = loCha.value!.metadata.links.filter(l => l.after !== id && [l.before, l.after].includes(link.before))

        selectedLinks.value = [...selectedLinks.value, ...additionalLinks]
      })
    }
  }

  function resetLink(): void {
    selectedLinks.value = [] satisfies ApiLink[]
  }

  function getStatus(feature: IFeature): Status {
    if (feature.properties.is_created) {
      return loChaStatus.create
    }

    if (feature.properties.is_deleted) {
      return loChaStatus.delete
    }

    if (feature.properties.is_before) {
      return loChaStatus.updateBefore
    }

    return loChaStatus.updateAfter
  }

  function _bringSelectedFeaturesOnTop(a: IFeature, b: IFeature): number {
    const aSelected = selectedFeatures.value.has(a)
    const bSelected = selectedFeatures.value.has(b)

    if (aSelected && !bSelected)
      return -1
    if (!aSelected && bSelected)
      return 1
    return 0
  }

  function _getFeature(id: number): IFeature {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    const feature = loCha.value.features.find(feature => feature.id === id)

    if (!feature)
      throw new Error(`Feature with ID ${id} not found.`)

    return feature
  }

  function _sortByObjType(feature: IFeature): number {
    switch (feature.properties.objtype) {
      case 'node': return 1
      case 'way': return 2
      case 'relation': return 3
      default: return 4
    }
  }

  function _sortByActionType(feature: IFeature): number {
    const { is_before, is_after, is_created, is_deleted } = feature.properties
    if (is_before || is_after)
      return 1
    if (is_created)
      return 2
    if (is_deleted)
      return 3
    return 4
  }

  function _populateBeforeAfterFeatures(): void {
    if (!loCha.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    if (!featureCount.value)
      return

    loCha.value.features
      .sort((a, b) => _sortByObjType(a) - _sortByObjType(b))
      .sort((a, b) => _sortByActionType(a) - _sortByActionType(b))
  }

  /**
   * Resets the LoCha state by clearing the LoCha data and resetting the feature arrays.
   */
  function _resetLoCha(): void {
    loCha.value = undefined
    resetLink()
  }

  return {
    afterFeatures,
    beforeFeatures,
    featureCount,
    showLink,
    linkCount,
    loCha,
    selectedLinks,
    selectedFeatures,
    setLoCha,
    resetLink,
    getStatus,
  }
}
