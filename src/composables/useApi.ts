interface ApiComposable {
  buildApiUrl: (params?: URLSearchParams) => string
}

type ApiLinks = Array<{ before?: string, after?: string }>

export interface ApiResponse extends GeoJSON.FeatureCollection {
  metadata: {
    links: ApiLinks
  }
}

export function useApiConfig(): ApiComposable {
  const API_BASE_URL_DEV = 'http://localhost:5173'
  const API_BASE_URL_PROD = 'https://osm-logical-history-dev.teritorio.xyz'
  const apiBaseUrl = getApiBaseUrl()

  function getApiBaseUrl(): string {
    return import.meta.env.MODE === 'development'
      ? API_BASE_URL_DEV
      : API_BASE_URL_PROD
  }

  function buildApiUrl(params?: URLSearchParams): string {
    let apiUrl = `${apiBaseUrl}/api/0.1/overpass_logical_history`

    if (params)
      apiUrl += `?${params.toString()}`

    return apiUrl
  }

  return {
    buildApiUrl,
  }
}
