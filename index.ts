import maplibregl, { GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const sourceID = 'lochas'

const map = new maplibregl.Map({
  hash: true,
  container: 'map',
  style: 'https://api.maptiler.com/maps/openstreetmap/style.json?key=IJyLukjfd91xJcN3933f',
})

map.on('load', async () => {
  const data = await fetchData()

  map.addSource(sourceID, {
    type: 'geojson',
    data,
    cluster: true,
    clusterRadius: 50,
    clusterMaxZoom: 14,
    maxzoom: 24,
  })
})

// Add event listener for form submission
const form = document.getElementById('searchForm') as HTMLFormElement

form.addEventListener('submit', async (event) => {
  event.preventDefault() // Prevent form from reloading the page

  // Get input values
  const date_start = (document.getElementById('date_start') as HTMLInputElement).value
  const date_end = (document.getElementById('date_end') as HTMLInputElement).value
  const bbox = (document.getElementById('bbox') as HTMLInputElement).value

  // Construct the query parameters
  let params: URLSearchParams | undefined

  if (date_start || date_end || bbox) {
    params = new URLSearchParams({
      date_start,
      date_end,
      bbox,
    })
  }

  const data = await fetchData(params)
  const source = map.getSource(sourceID)

  if (!source) {
    throw new Error(`Source ${sourceID} is not found.`)
  }

  if (!(source instanceof GeoJSONSource)) {
    throw new TypeError(`Source ${sourceID} is not a GeoJSONSource.`)
  }

  source.setData(data)
})

async function fetchData(params?: URLSearchParams): Promise<GeoJSON.FeatureCollection> {
  try {
    // Construct the full API URL with query parameters
    let apiUrl = '/api/0.1/overpass_logical_history'

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

    return data

    // For example, you can update the map with the new data
    // (this part depends on what the API returns)
  }
  catch (error) {
    console.error('Error:', error)
    throw new Error(error)
  }
}
