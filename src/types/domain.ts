import type { ComputedRef, Ref } from 'vue'
import type { Actions, ApiLink, Changeset, IFeature, LoChaData, Reason } from './api'

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
 * Props passed through the `tags-diff` slot across the LoCha component hierarchy.
 */
export interface TagsDiffSlotProps {
  date: string
  diff: Actions | undefined
  src?: IFeature['properties']
  dst?: IFeature['properties']
  reason: Reason
  title?: string
}

/**
 * Props passed through the `link-metadata` slot across the LoCha component hierarchy.
 */
export interface LinkMetadataSlotProps {
  links: ApiLink[]
  index: number
}

/**
 * Props passed through the `changesets` slot across the LoCha component hierarchy.
 */
export interface ChangesetsSlotProps {
  changesets: Changeset[]
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
