import type { Feature, Geometry } from 'geojson'
import { vi } from 'vitest'

vi.mock('@turf/boolean-equal', () => ({
  default: vi.fn((a: Geometry, b: Geometry) => {
    return JSON.stringify(a) === JSON.stringify(b)
  }),
}))

vi.mock('@turf/area', () => ({
  area: vi.fn((feature: Feature) => {
    if (feature.geometry?.type === 'Polygon') {
      return feature.geometry.coordinates[0]?.length * 100 || 0
    }
    return 0
  }),
}))
