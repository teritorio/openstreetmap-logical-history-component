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
