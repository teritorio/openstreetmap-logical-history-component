import type { ActionType, ApiLink, ApiLinkGroups, ApiResponse, IFeature } from '@/composables/useApi'

export function createFeature(overrides: Partial<IFeature> & { id: number }): IFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [2.35, 48.85],
    },
    id: overrides.id,
    properties: {
      objtype: 'node',
      id: overrides.id,
      geom_distance: null,
      geom: false,
      deleted: false,
      links: 1,
      members: null,
      version: 1,
      username: 'testuser',
      created: '2024-01-01T00:00:00Z',
      tags: { name: 'Test' },
      ...overrides.properties,
    },
    ...overrides,
    // Ensure properties spread doesn't override the merged properties
  } as IFeature
}

export function createLink(overrides: Partial<ApiLink> = {}): ApiLink {
  return {
    action: 'accept' as ActionType,
    before: undefined,
    after: undefined,
    diff_attribs: undefined,
    diff_tags: undefined,
    conflation_reason: {
      geom: { score: 0.9, reason: 'test' },
      tags: { score: 0.8, reason: 'test' },
      conflate: 'test',
    },
    ...overrides,
  }
}

export function createApiResponse(
  features: IFeature[],
  links: ApiLinkGroups = {},
): ApiResponse {
  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      links,
      changesets: [],
    },
  }
}
