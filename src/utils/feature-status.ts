import type { Actions, ApiLink, IFeature, Status } from '@/types'

function isEmptyActions(actions?: Actions): boolean {
  return !actions || Object.keys(actions).length === 0
}

export function isMinorChange(feature: IFeature, links: ApiLink[], threshold = 2): boolean {
  if (feature.properties.is_new || feature.properties.deleted)
    return false
  const featureLinks = links.filter(l => l.before === feature.id || l.after === feature.id)
  if (!featureLinks.length)
    return false
  return featureLinks.every((l) => {
    if (!isEmptyActions(l.diff_tags))
      return false
    const maxDist = l.conflation_reason?.geom?.max_distance
    if (!feature.properties.geom)
      return maxDist === undefined || maxDist === 0
    return maxDist !== undefined && maxDist > 0 && maxDist <= threshold
  })
}

export function getFeatureStatus(feature: IFeature): Status {
  if (feature.properties.is_new)
    return 'new'
  if (feature.properties.deleted)
    return 'delete'
  if (feature.properties.is_deleted)
    return 'delete'
  if (feature.properties.is_before)
    return 'updateBefore'
  return 'updateAfter'
}
