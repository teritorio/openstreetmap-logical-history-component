import type { IFeature, Status } from '@/types'

export function getFeatureStatus(feature: IFeature): Status {
  if (feature.properties.is_new)
    return 'new'
  if (feature.properties.deleted)
    return 'delete'
  if (feature.properties.is_before)
    return 'updateBefore'
  return 'updateAfter'
}
