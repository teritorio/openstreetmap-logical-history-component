import type { Reactive, Ref } from 'vue'
import type { ApiResponse, Error } from '@/types'
import { reactive, ref } from 'vue'
import { transformFeatures } from '@/utils/feature-transform'

export type { Action, Actions, ActionType, ActionTypeOptions, ApiLink, ApiLinkGroups, ApiResponse, IFeature, Reason, ReasonGeom, ReasonTags } from '@/types'

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
  fetchData: (params: Record<string, string | undefined>) => Promise<ApiResponse | undefined>

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

  /**
   * Resets the error state
   */
  resetError: () => void
}

/**
 * Constants for API base URLs, dependent on the environment.
 *
 * @constant {string} API_BASE_URL_DEV - The base URL for the development environment.
 * @constant {string} API_BASE_URL_PROD - The base URL for the production environment.
 */

/**
 * Provides a composable for API configuration and interaction.
 *
 * @returns The API composable object with error state and fetch functionality.
 */
export function useApiConfig(): ApiComposable {
  const apiBaseUrl = import.meta.env.MODE === 'development'
    ? import.meta.env.VITE_APP_HOST
    : import.meta.env.VITE_API_ENDPOINT

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
  function buildApiUrl(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '')
        searchParams.set(key, value)
    })

    const endpoint = '/api/0.1/overpass_logical_history'
    return params ? `${apiBaseUrl}${endpoint}?${searchParams}` : `${apiBaseUrl}${endpoint}`
  }

  /**
   * Fetches data from the API and processes the response.
   *
   * @param params - Optional query parameters to include in the API request.
   * @returns The API response with transformed features, or undefined if an error occurred.
   */
  async function fetchData(params: Record<string, string | undefined>): Promise<ApiResponse | undefined> {
    resetError()
    loading.value = true

    return await fetch(
      buildApiUrl(params),
      { method: 'GET' },
    )
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text()
          throw new Error(message || res.statusText)
        }

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

  function setError(err: Error): void {
    Object.assign(error, err)
  }

  function resetError(): void {
    Object.assign(error, { message: undefined, type: 'info' })
  }

  return {
    error,
    fetchData,
    loading,
    setError,
    resetError,
  }
}
