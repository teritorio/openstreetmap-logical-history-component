import { bbox as turfBbox } from '@turf/bbox'
import { LngLatBounds, Map, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Constants
const API_BASE_URL_DEV = 'http://localhost:5173'
const API_BASE_URL_PROD = 'https://osm-logical-history-dev.teritorio.xyz'
const SOURCE_ID = 'lochas'
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/teritorio-tourism-latest/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'

// DOM Elements
const loadingElement = document.getElementById('loading') as HTMLDivElement
const errorMessage = document.getElementById('error-message') as HTMLDivElement
const form = document.getElementById('searchForm') as HTMLFormElement
const dateStartInput = document.getElementById('date_start') as HTMLInputElement
const dateEndInput = document.getElementById('date_end') as HTMLInputElement
const bboxInput = document.getElementById('bbox') as HTMLInputElement

let apiBaseUrl: string

// Set the API base URL based on the environment
if (import.meta.env.MODE === 'development') {
  apiBaseUrl = API_BASE_URL_DEV
}
else {
  apiBaseUrl = API_BASE_URL_PROD
}

// Initialize Map
const map = new Map({
  hash: true,
  container: 'map',
  center: [0, 0],
  style: MAP_STYLE_URL,
})

map.addControl(new NavigationControl())

// Map load event
map.on('load', async () => {
  try {
    const data = await fetchData()
    setupMapLayers(data)
    map.fitBounds(getBoundingBox(data), { padding: 20 })
  }
  catch (error) {
    handleError(error)
  }
})

map.on('moveend', setBBox)

// Event listeners for form validation and submission
dateStartInput.addEventListener('input', validateDateRange)
dateEndInput.addEventListener('input', validateDateRange)

form.addEventListener('submit', async (event) => {
  event.preventDefault() // Prevent form reload

  if (!validateDateRange())
    return

  try {
    const data = await fetchData()

    setupMapLayers(data)

    if (data.features.length) {
      map.fitBounds(getBoundingBox(data), { padding: 20 })
    }
    else {
      map.setCenter([0, 0])
      map.setZoom(0)
    }
  }
  catch (error) {
    handleError(error)
  }
  finally {
    form.reset()
  }
})

// Fetch data from API
async function fetchData(): Promise<GeoJSON.FeatureCollection> {
  try {
    loadingElement.style.display = 'flex'
    const params = createQueryParams()
    const apiUrl = buildApiUrl(params)
    const response = await fetch(apiUrl, { method: 'GET' })

    if (!response.ok)
      throw new Error('API request failed')

    const data = await response.json()
    loadingElement.style.display = 'none'
    return data
  }
  catch (error) {
    loadingElement.style.display = 'none'
    throw error
  }
}

// Build API URL with query parameters
function buildApiUrl(params?: URLSearchParams): string {
  let apiUrl = `${apiBaseUrl}/api/0.1/overpass_logical_history`

  if (params)
    apiUrl += `?${params.toString()}`

  return apiUrl
}

// Handle errors and display the message
function handleError(error: any): void {
  console.error('Error:', error)
  loadingElement.innerHTML = `Error: ${error.message}`
}

// Set up map source and layers
function setupMapLayers(data: GeoJSON.FeatureCollection): void {
  resetMapLayers()

  map.addSource(SOURCE_ID, { type: 'geojson', data })

  // Add points layer
  map.addLayer({
    id: 'points',
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-radius': 5,
      'circle-color': '#FF5722',
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF',
    },
    filter: ['==', '$type', 'Point'],
  })

  // Add lines layer
  map.addLayer({
    id: 'lines',
    type: 'line',
    source: SOURCE_ID,
    paint: {
      'line-width': 3,
      'line-color': '#0074D9',
    },
    filter: ['==', '$type', 'LineString'],
  })
}

// Reset map source and layers
function resetMapLayers(): void {
  // Remove existing layers if they exist
  if (map.getLayer('points')) {
    map.removeLayer('points')
  }

  if (map.getLayer('lines')) {
    map.removeLayer('lines')
  }

  // Remove the source if it exists
  if (map.getSource(SOURCE_ID)) {
    map.removeSource(SOURCE_ID)
  }
}

// Get bounding box from data
function getBoundingBox(data: GeoJSON.FeatureCollection): LngLatBounds {
  const bbox = turfBbox(data)

  return new LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]])
}

// Validate the date range
function validateDateRange(): boolean {
  const dateStart = new Date(dateStartInput.value)
  const dateEnd = new Date(dateEndInput.value)

  if (!dateStart || !dateEnd)
    return true

  const maxDateEnd = new Date(dateStart)
  maxDateEnd.setMonth(maxDateEnd.getMonth() + 1)

  if (dateEnd > maxDateEnd) {
    errorMessage.textContent = 'The date range must not exceed 1 month.'
    errorMessage.style.display = 'block'
    form.reset()

    return false
  }

  errorMessage.style.display = 'none'

  return true
}

// Create query parameters for the API
function createQueryParams(): URLSearchParams | undefined {
  if (dateStartInput.value || dateEndInput.value || bboxInput.value) {
    return new URLSearchParams({
      date_start: new Date(dateStartInput.value).toISOString(),
      date_end: new Date(dateEndInput.value).toISOString(),
      bbox: bboxInput.value,
    })
  }

  return undefined
}

// Update bbox input value based on current map position
function setBBox(): void {
  const bounds = map.getBounds()
  const bbox = [
    bounds.getSouthWest().lng,
    bounds.getSouthWest().lat,
    bounds.getNorthEast().lng,
    bounds.getNorthEast().lat,
  ].join(',')

  bboxInput.value = bbox
}
