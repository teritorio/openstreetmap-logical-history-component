import type { LoChaData } from '@/types'
import { area } from '@turf/area'
import booleanEqual from '@turf/boolean-equal'

/**
 * Transforms the features of the API response to include additional metadata.
 *
 * Enriches each feature with `is_before`, `is_after`, `is_new` flags based on
 * its link metadata, compares geometry between linked features, and sorts
 * results by area (largest first).
 *
 * @param data - The API response containing features and metadata.
 * @returns The transformed features with additional properties.
 * @throws If a feature is missing a link in the metadata.
 */
export function transformFeatures(data: LoChaData): LoChaData['features'] {
  return data.features.map((feature) => {
    if (feature.id == null) {
      console.warn('Skipping feature with null id')
      return undefined
    }

    const group = data.metadata.links[feature.properties.links]

    if (!group) {
      console.warn(`Feature ${feature.id} has no group, skipping.`)
      return undefined
    }

    const link = group.find(link => link.before === feature.id || link.after === feature.id)

    if (!link) {
      console.warn(`Feature ${feature.id} has no link, skipping.`)
      return undefined
    }

    const linkedFeature = data.features.find(f => (f.properties.links === feature.properties.links) && (f.id !== feature.id))

    if (linkedFeature?.geometry && feature.geometry) {
      feature.properties.geom = !booleanEqual(feature.geometry, linkedFeature.geometry)
    }

    if (feature.id === link.before) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          is_before: true,
        },
      }
    }

    if (feature.id === link.after) {
      const hasBefore = group.filter(link => 'before' in link)

      if (!hasBefore.length) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_new: true,
          },
        }
      }
    }

    if (
      (feature.id === link.after)
      || (link.before === undefined && link.after !== undefined)
    ) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          is_after: true,
        },
      }
    }

    return feature
  })
    .filter(f => f !== undefined)
    .sort((a, b) => {
      const aGeom = a.geometry
      const bGeom = b.geometry

      if (!aGeom && !bGeom)
        return 0

      if (!aGeom)
        return 1

      if (!bGeom)
        return -1

      return area(b) - area(a)
    }) // Sort by area surface in order to have bigger geometries before smaller ones.
}
