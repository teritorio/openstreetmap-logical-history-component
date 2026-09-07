export type ObjectType = 'n' | 'w' | 'r'

export type ActionType = 'accept' | 'reject'

export type ActionTypeOptions = Record<string, string | string[] | object>

export interface Action {
  validator_id: string
  action: ActionType | null
  force: boolean
  options: ActionTypeOptions | null
}

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
 * Interface representing the LoCha data structure.
 * Extends `GeoJSON.FeatureCollection` to represent geographic data and includes additional metadata.
 */
export interface LoChaData extends GeoJSON.FeatureCollection {
  features: IFeature[]
  metadata: {
    links: ApiLinkGroups
    /**
     * When true, forces multi-column layout (before panel visible on the left)
     * even for groups with a single before/after pair. Useful when the caller
     * splits a N:1 merge group into separate LoCha instances per pair and wants
     * to preserve the multi-column appearance.
     *
     * Note: this flag applies to **all groups** in the LoCha instance. For
     * per-group control, split each group into a separate LoCha instance.
     *
     * Has no effect when the after feature is deleted — `isSingleDeletedUpdate`
     * takes precedence in that case.
     */
    forceMultiColumn?: boolean
  }
}
