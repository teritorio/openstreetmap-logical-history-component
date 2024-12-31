import type { Ref } from 'vue'
import type { Error } from '../types'
import { ref } from 'vue'

interface ApiComposable {
  error: Ref<Error>
  fetchData: (params?: URLSearchParams) => Promise<ApiResponse | undefined>
}

interface ApiLink {
  id: string
  before?: string
  after?: string
}

export interface ApiResponse extends GeoJSON.FeatureCollection {
  metadata: {
    links: ApiLink[]
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
 * @returns {ApiComposable} The API composable object with error state and fetch functionality.
 */
export function useApiConfig(): ApiComposable {
  const apiBaseUrl = import.meta.env.MODE === 'development'
    ? API_BASE_URL_DEV
    : API_BASE_URL_PROD

  const error = ref<Error>({
    message: undefined,
    type: 'info',
  })

  /**
   * Constructs the full API URL with optional query parameters.
   *
   * @param {URLSearchParams} [params] - Optional query parameters to append to the API endpoint.
   * @returns {string} The constructed API URL.
   */
  function buildApiUrl(params?: URLSearchParams): string {
    const endpoint = '/api/0.1/overpass_logical_history'
    return params ? `${apiBaseUrl}${endpoint}?${params.toString()}` : `${apiBaseUrl}${endpoint}`
  }

  /**
   * Fetches data from the API and processes the response.
   *
   * @param {URLSearchParams} [params] - Optional query parameters to include in the API request.
   * @returns {Promise<ApiResponse | undefined>} The API response with transformed features, or undefined if an error occurred.
   */
  async function fetchData(params?: URLSearchParams): Promise<ApiResponse | undefined> {
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
        metadata: transformMetadata(data.metadata),
      }))
      .catch((err) => {
        error.value = {
          message: err.message,
          type: 'error',
        }

        return undefined
      })
  }

  /**
   * Transforms the metadata of an API response by adding a unique `id` field to each link.
   *
   * @param {ApiResponse['metadata']} metadata - The metadata object containing links to be transformed.
   * @returns {ApiResponse['metadata']} The transformed metadata with an `id` field added to each link.
   */
  function transformMetadata(metadata: ApiResponse['metadata']): ApiResponse['metadata'] {
    return {
      links: metadata.links.map(link => ({
        ...link,
        id: `${link.before ?? ''}${link.after ?? ''}`,
      })),
    }
  }

  /**
   * Transforms the features of the API response to include additional metadata.
   *
   * @param {ApiResponse} data - The API response containing features and metadata.
   * @returns {Array<GeoJSON.Feature>} The transformed features with additional properties.
   * @throws {Error} If a feature is missing a link in the metadata.
   */
  function transformFeatures(data: ApiResponse): Array<GeoJSON.Feature> {
    return data.features.map((feature) => {
      if (!feature.id)
        return feature

      const link = data.metadata.links.find(({ before, after }) => before === feature.id!.toString() || after === feature.id!.toString())

      if (!link)
        throw new Error(`Feature ${feature.id} has no link.`)

      if (link.before && !link.after) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_deleted: true,
          },
        }
      }

      if (!link.before && link.after) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_created: true,
          },
        }
      }

      return feature
    })
  }

  return {
    fetchData,
    error,
  }
}
