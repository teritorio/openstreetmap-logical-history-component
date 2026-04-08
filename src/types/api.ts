export type ObjectType = 'n' | 'w' | 'r'

export type ActionType = 'accept' | 'reject'

export type ActionTypeOptions = Record<string, string | string[] | object>

export type Action = [string, ActionType | null, ActionTypeOptions | null]

export type Actions = Record<string, Action[]>

export interface ReasonGeom {
  max_distance?: number
  min_distance?: number
  score: number
  reason: string
}

export interface ReasonTags {
  score: number
  reason: string
}

export interface Reason {
  geom?: ReasonGeom
  tags?: ReasonTags
  conflate: string
}

export interface Changeset {
  id: number
  created_at: string
  closed_at: string
  open: boolean
  user: string
  uid: number
  minlat: number
  minlon: number
  maxlat: number
  maxlon: number
  comments_count: number
  changes_count: number
  tags: Record<string, string>
}

export type ApiLinkGroups = ApiLink[][]

/**
 * Interface representing a link in the API metadata.
 * A link typically points to a feature.
 */
export interface ApiLink {
  action: ActionType
  before?: string
  after?: string
  diff_attribs?: Actions
  diff_tags?: Actions
  conflation_reason: Reason
}

export interface IFeature extends GeoJSON.Feature {
  id: string
  properties: {
    objtype: ObjectType
    id: number
    geom_distance: number | null
    geom: boolean
    deleted: boolean
    links: number
    members?: null
    version: number
    username: string
    created: string
    tags: Record<string, string>
    is_before?: boolean
    is_after?: boolean
    is_new?: boolean
  }
}

/**
 * Interface representing the API response.
 * Extends `GeoJSON.FeatureCollection` to represent geographic data and includes additional metadata.
 */
export interface ApiResponse extends GeoJSON.FeatureCollection {
  features: IFeature[]
  metadata: {
    links: ApiLinkGroups
    changesets: Changeset[]
  }
}
