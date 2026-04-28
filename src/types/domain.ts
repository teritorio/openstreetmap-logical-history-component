import type { ComputedRef, Ref } from 'vue'
import type { IFeature, LoChaData } from './api'

/**
 * The possible statuses for features in the system.
 * - 'new': New features.
 * - 'delete': Deleted features.
 * - 'update': Updated features.
 */
export type Status = 'new' | 'delete' | 'updateBefore' | 'updateAfter'

/**
 * The Color type defines colors based on feature status.
 * - 'new' maps to '#1a7f37'
 * - 'delete' maps to '#cf222e'
 * - 'updateBefore' maps to '#953800'
 * - 'updateAfter' maps to '#0969da'
 */
export type Color = {
  [key in Status]: key extends 'new'
    ? '#1a7f37'
    : key extends 'delete'
      ? '#cf222e'
      : key extends 'updateBefore'
        ? '#953800'
        : '#0969da'
}

export type LoChaGroup = IFeature[]

/**
 * Props passed through the `object-detail` slot (rendered once per feature inside each object card).
 */
export interface ObjectDetailSlotProps {
  feature: IFeature
  index: number
}

/**
 * Props passed through group-level slots (`header-center`, `header-end`, `content-start`).
 */
export interface GroupSlotProps {
  index: number
}

/**
 * The LoCha interface defines the structure of the LoCha state,
 * which includes various references and computed values to track the features and metadata.
 */
export interface LoCha {
  featureCount: ComputedRef<number | undefined>
  groups: Ref<LoChaGroup[]>
  loCha: Ref<LoChaData | undefined>
  setLoCha: (loCha: LoChaData) => void
  getStatus: (feature: IFeature) => Status
  getBeforeFeatures: (features: IFeature[]) => IFeature[]
  getAfterFeatures: (features: IFeature[]) => IFeature[]
}
