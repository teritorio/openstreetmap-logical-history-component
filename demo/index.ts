import { bbox as turfBbox } from '@turf/bbox'
import { GeoJSONSource, LngLatBounds, Map, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

let apiBaseUrl: string

if (import.meta.env.MODE === 'development') {
  apiBaseUrl = 'http://localhost:5173'
}
else {
  apiBaseUrl = 'https://osm-logical-history-dev.teritorio.xyz'
}

const sourceID = 'lochas'
const loadingElement = document.getElementById('loading') as HTMLDivElement
const errorMessage = document.getElementById('error-message') as HTMLDivElement

const map = new Map({
  hash: true,
  container: 'map',
  center: [0, 0],
  style: 'https://vecto.teritorio.xyz/styles/teritorio-tourism-latest/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i',
})

map.addControl(new NavigationControl())

map.on('load', async () => {
  await fetchData()
    .then((data) => {
      map.addSource(sourceID, {
        type: 'geojson',
        data,
      })

      map.addLayer({
        id: 'points',
        type: 'circle',
        source: sourceID,
        paint: {
          'circle-radius': 5,
          'circle-color': '#FF5722',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FFFFFF',
        },
        filter: ['==', '$type', 'Point'],
      })

      map.addLayer({
        id: 'lines',
        type: 'line',
        source: sourceID,
        paint: {
          'line-width': 3,
          'line-color': '#0074D9',
        },
        filter: ['==', '$type', 'LineString'],
      })

      map.fitBounds(getBoundingBox(data), { padding: 20 })
    })
    .catch(error => loadingElement.innerHTML = error)
})

const form = document.getElementById('searchForm') as HTMLFormElement
const date_start = document.getElementById('date_start') as HTMLInputElement
const date_end = document.getElementById('date_end') as HTMLInputElement
const bbox = document.getElementById('bbox') as HTMLInputElement

// Add event listener to validate date range on input change
date_start.addEventListener('input', validateDateRange)
date_end.addEventListener('input', validateDateRange)

form.addEventListener('submit', async (event) => {
  event.preventDefault() // Prevent form from reloading the page

  if (!validateDateRange) {
    return
  }

  // Construct the query parameters
  let params: URLSearchParams | undefined

  if (date_start.value || date_end.value || bbox.value) {
    params = new URLSearchParams({
      date_start: new Date(date_start.value).toISOString(),
      date_end: new Date(date_end.value).toISOString(),
      bbox: bbox.value,
    })
  }

  await fetchData(params)
    .then(data => getSource().setData(data))
    .catch(error => loadingElement.innerHTML = error)
})

function getBoundingBox(data: GeoJSON.FeatureCollection): LngLatBounds {
  const bbox = turfBbox(data)

  return new LngLatBounds(
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  )
}

function validateDateRange(): boolean {
  const dateStart = new Date(date_start.value)
  const dateEnd = new Date(date_end.value)

  // Check if both dates are selected
  if (!dateStart || !dateEnd) {
    return true
  }

  // Calculate the difference in months
  const maxDateEnd = new Date(dateStart)
  maxDateEnd.setMonth(maxDateEnd.getMonth() + 1)

  // Validate the date range
  if (dateEnd > maxDateEnd) {
    errorMessage.textContent = 'The date range must not exceed 1 month.'
    errorMessage.style.display = 'block'
    form.reset()
    return false
  }

  errorMessage.style.display = 'none'
  return true
}

function getSource(): GeoJSONSource {
  const source = map.getSource(sourceID)

  if (!source) {
    throw new Error(`Source ${sourceID} is not found.`)
  }

  if (!(source instanceof GeoJSONSource)) {
    throw new TypeError(`Source ${sourceID} is not a GeoJSONSource.`)
  }

  return source
}

async function fetchData(params?: URLSearchParams): Promise<GeoJSON.FeatureCollection> {
  try {
    // Show loading spinner
    loadingElement.style.display = 'flex'

    // Construct the full API URL with query parameters
    let apiUrl = `${apiBaseUrl}/api/0.1/overpass_logical_history`

    if (params) {
      apiUrl += `?${params.toString()}`
    }

    // Send a POST request to the API endpoint
    const response = await fetch(apiUrl, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()

    // Hide the loading spinner once the data is loaded and displayed
    loadingElement.style.display = 'none'

    return data

    // For example, you can update the map with the new data
    // (this part depends on what the API returns)
  }
  catch (error) {
    console.error('Error:', error)
    throw new Error(error)
  }
}
