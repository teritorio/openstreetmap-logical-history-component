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
  afterFeatures: Ref<IFeature[]>
  beforeFeatures: Ref<IFeature[]>
  errorFeatures: Ref<IFeature[]>
  featureCount: ComputedRef<number | undefined>
  linkCount: ComputedRef<number | undefined>
  loCha: Ref<ApiResponse | undefined>
  selectedLinks: Ref<ApiLink[]>
  selectedFeatures: ComputedRef<Set<IFeature>>
  showLink: (id: number) => void
  setLoCha: (loCha: ApiResponse) => void
  getStatus: (feature: IFeature) => Status
  isSelectedLink: (id: number) => boolean
}

// Internal state variables
const adjacency = ref<Map<number, number[]>>(new Map())
const loCha = ref<ApiResponse>()
const selectedLinks = ref<ApiLink[]>([])
const beforeFeatures = ref<IFeature[]>([])
const afterFeatures = ref<IFeature[]>([])
const errorFeatures = ref<IFeature[]>([])
const clickedId = ref<number>()

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

  /**
   * Sets the LoCha data and populates the before and after features.
   * @param data - The LoCha API response data to set.
   */
  function setLoCha(data: ApiResponse): void {
    _resetState()
    loCha.value = data

    if (!loCha.value)
      return

    loCha.value.features
      .sort((a, b) => _sortByObjType(a) - _sortByObjType(b))
      .sort((a, b) => _sortByActionType(a) - _sortByActionType(b))

    errorFeatures.value = loCha.value.features.filter(feature => feature.properties.is_after && feature.properties.is_before)

    // Map all features by their ID for quick access
    const idToFeature = new Map<number, IFeature>()
    for (const feature of loCha.value.features) {
      idToFeature.set(feature.id, feature)
    }

    for (const link of loCha.value.metadata.links) {
      if (link.before !== undefined && link.after !== undefined) {
        // Skip erroneous links
        if (link.before === link.after)
          continue

        if (!adjacency.value.has(link.before)) {
          adjacency.value.set(link.before, [])
        }
        adjacency.value.get(link.before)!.push(link.after)

        if (!adjacency.value.has(link.after)) {
          adjacency.value.set(link.after, [])
        }
        adjacency.value.get(link.after)!.push(link.before)
      }
      else {
        if (link.before !== undefined)
          adjacency.value.set(link.before, [])

        if (link.after !== undefined)
          adjacency.value.set(link.after, [])
      }
    }

    for (const feature of loCha.value.features) {
      const startId = feature.id
      const visited = new Set<number>()
      const stack: number[] = [startId]
      visited.add(startId)

      while (stack.length > 0) {
        const currentId = stack.pop()!
        const neighbors = adjacency.value.get(currentId) || []

        if (!neighbors.length) {
          if (feature.properties.is_deleted)
            beforeFeatures.value.push(feature)

          if (feature.properties.is_created)
            afterFeatures.value.push(feature)
        }
        else {
          for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
              visited.add(neighborId)
              stack.push(neighborId)

              const neighborFeature = idToFeature.get(neighborId)
              if (neighborFeature) {
                if (neighborFeature.properties.is_before && !beforeFeatures.value.find(f => f.id === neighborFeature.id))
                  beforeFeatures.value.push(neighborFeature)

                if (neighborFeature.properties.is_after && !afterFeatures.value.find(f => f.id === neighborFeature.id))
                  afterFeatures.value.push(neighborFeature)
              }
            }
          }
        }
      }
    }
  }

  function showLink(id: number): void {
    if (!loCha.value || !adjacency.value)
      throw new Error('LoCha not initialized, call setLoCha() first.')

    if (!adjacency.value.get(id))
      throw new Error(`Clicked ${id} not found.`)

    const neighborsIds = Object.values(adjacency.value.get(id)!)
    const isSameLink = selectedLinks.value.find(link => [link.before, link.after].includes(id))

    _resetLink()

    if (isSameLink || clickedId.value === id) {
      clickedId.value = undefined
      return
    }

    selectedLinks.value = loCha.value.metadata.links.filter((link) => {
      return (link.before !== undefined && (neighborsIds.includes(link.before) || link.before === id))
        || (link.after !== undefined && (neighborsIds.includes(link.after) || link.after === id))
    })

    clickedId.value = id
  }

  function isSelectedLink(id: number): boolean {
    return !!selectedLinks.value.find(link => [link.before, link.after].includes(id))
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

  /**
   * Resets the LoCha state by clearing the LoCha data and resetting the feature arrays.
   */
  function _resetState(): void {
    adjacency.value = new Map() satisfies Map<number, number[]>
    loCha.value = undefined
    beforeFeatures.value = [] satisfies IFeature[]
    afterFeatures.value = [] satisfies IFeature[]
    errorFeatures.value = [] satisfies IFeature[]
    clickedId.value = undefined
    _resetLink()
  }

  function _resetLink(): void {
    selectedLinks.value = [] satisfies ApiLink[]
  }

  return {
    afterFeatures,
    beforeFeatures,
    errorFeatures,
    featureCount,
    showLink,
    linkCount,
    loCha,
    selectedLinks,
    selectedFeatures,
    setLoCha,
    getStatus,
    isSelectedLink,
  }
}
