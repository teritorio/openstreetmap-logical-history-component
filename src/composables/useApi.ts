import type { Error } from '@/types'
import type { Reactive, Ref } from 'vue'
import { area } from '@turf/area'
import { reactive, ref } from 'vue'

/**
 * Interface representing the reactive state and methods for handling API interactions.
 * Provides error handling, data fetching, and loading state management.
 */
interface ApiComposable {
  /**
   * A reactive error object that holds the current error state.
   * When an error occurs during the API interaction, this object is updated.
   * @example { message: 'Error message', type: 'error' }
   */
  error: Reactive<Error>

  /**
   * Fetches data from the API. This function can accept query parameters via the `params` argument.
   * @param params - Optional URLSearchParams object that can be used to append query parameters to the API request.
   * @returns A Promise resolving to an `ApiResponse` or `undefined` if there was an issue.
   */
  fetchData: (params?: URLSearchParams) => Promise<ApiResponse | undefined>

  /**
   * A reactive reference indicating whether the API request is currently loading.
   * This state is useful for showing loading indicators while the request is in progress.
   * @example `true` if loading, `false` if finished.
   */
  loading: Ref<boolean>

  /**
   * Sets the error state.
   * This function updates the `error` reactive state with the given error object.
   * @param err - The error object to be set.
   */
  setError: (err: Error) => void
}

type ObjectType = 'node' | 'way' | 'relation'

export type ActionType = 'accept' | 'reject'

export type Action = ['diff' | ActionType | string | null]

type Actions = Record<string, Action[]>

interface Changeset {
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

/**
 * Interface representing a link in the API metadata.
 * A link typically points to a feature.
 */
export interface ApiLink {
  action: ActionType
  before?: number
  after?: number
  diff_attribs?: Actions
  diff_tags?: Actions
}

export interface IFeature extends GeoJSON.Feature {
  id: number
  properties: {
    objtype: ObjectType
    id: number
    geom_distance: number
    deleted: boolean
    version: number
    username: string
    created: string
    tags: Record<string, string>
    is_before?: boolean
    is_after?: boolean
    is_created?: boolean
    is_deleted?: boolean
  }
}

/**
 * Interface representing the API response.
 * Extends `GeoJSON.FeatureCollection` to represent geographic data and includes additional metadata.
 */
export interface ApiResponse extends GeoJSON.FeatureCollection {
  features: IFeature[]
  metadata: {
    links: ApiLink[]
    changesets: Changeset[]
  }
}

/**
 * Constants for API base URLs, dependent on the environment.
 *
 * @constant {string} API_BASE_URL_DEV - The base URL for the development environment.
 * @constant {string} API_BASE_URL_PROD - The base URL for the production environment.
 */
const API_BASE_URL_DEV = 'http://localhost:5173'
const API_BASE_URL_PROD = 'https://osm-logical-history-dev.teritorio.xyz'

/**
 * Provides a composable for API configuration and interaction.
 *
 * @returns The API composable object with error state and fetch functionality.
 */
export function useApiConfig(): ApiComposable {
  const apiBaseUrl = import.meta.env.MODE === 'development'
    ? API_BASE_URL_DEV
    : API_BASE_URL_PROD

  const errorInitialState = {
    message: undefined,
    type: 'info',
  } satisfies Error

  const error = reactive<Error>(errorInitialState)
  const loading = ref(false)

  /**
   * Constructs the full API URL with optional query parameters.
   *
   * @param params - Optional query parameters to append to the API endpoint.
   * @returns The constructed API URL.
   */
  function buildApiUrl(params?: URLSearchParams): string {
    const endpoint = '/api/0.1/overpass_logical_history'
    return params ? `${apiBaseUrl}${endpoint}?${params.toString()}` : `${apiBaseUrl}${endpoint}`
  }

  /**
   * Fetches data from the API and processes the response.
   *
   * @param params - Optional query parameters to include in the API request.
   * @returns The API response with transformed features, or undefined if an error occurred.
   */
  async function fetchData(params?: URLSearchParams): Promise<ApiResponse | undefined> {
    resetError()
    loading.value = true

    return await fetch(
      buildApiUrl(params),
      { method: 'GET' },
    )
      .then(async (res) => {
        if (!res.ok)
          throw new Error('API request failed')

        return await res.json() as ApiResponse
      })
      .then(data => ({
        ...data,
        features: transformFeatures(data),
      }))
      .catch((err) => {
        setError({
          message: err.message,
          type: 'error',
        })

        return undefined
      })
      .finally(() => loading.value = false)
  }

  /**
   * Transforms the features of the API response to include additional metadata.
   *
   * @param data - The API response containing features and metadata.
   * @returns The transformed features with additional properties.
   * @throws If a feature is missing a link in the metadata.
   */
  function transformFeatures(data: ApiResponse): ApiResponse['features'] {
    return data.features.map((feature) => {
      // TODO: As of today it find only the first occurence of the feature ID
      // Need to find them all because we have a many-to-many relation with links
      const link = data.metadata.links.find(({ before, after }) => before === feature.id || after === feature.id)

      if (!link)
        throw new Error(`Feature ${feature.id} has no link.`)

      if (link.before !== undefined && link.after === undefined) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_deleted: true,
          },
        }
      }

      if (link.before === undefined && link.after !== undefined) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_created: true,
          },
        }
      }
      else {
        if (feature.id === link.before) {
          feature = {
            ...feature,
            properties: {
              ...feature.properties,
              is_before: true,
            },
          }
        }

        if (feature.id === link.after) {
          feature = {
            ...feature,
            properties: {
              ...feature.properties,
              is_after: true,
            },
          }
        }
      }

      return feature
    })
      .sort((a, b) => area(b) - area(a)) // Sort by area surface in order to have bigger geometries before smaller ones.
  }

  function setError(err: Error): void {
    Object.assign(error, err)

    setTimeout(() => {
      resetError()
    }, 3000)
  }

  function resetError(): void {
    Object.assign(error, { message: undefined, type: 'info' })
  }

  return {
    error,
    fetchData,
    loading,
    setError,
  }
}
