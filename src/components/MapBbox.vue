<script setup lang="ts">
import maplibre from 'maplibre-gl'
import { onMounted, shallowRef, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  bbox?: string
}>()

const emit = defineEmits<{
  (e: 'updateBbox', bbox: string): void
}>()

const map = shallowRef<maplibre.Map | null>(null)
let ignoreNextPropUpdate = false

const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/positron/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'

function fitMapToBbox(bbox: string): void {
  if (!map.value)
    return

  const [west, south, east, north] = bbox.split(',').map(Number)

  map.value.fitBounds(
    [[west, south], [east, north]],
    { padding: 20, duration: 0 },
  )
}

function emitBbox(): void {
  if (!map.value)
    return

  const bounds = map.value.getBounds()
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',')

  if (bbox !== props.bbox) {
    ignoreNextPropUpdate = true
    emit('updateBbox', bbox)
  }
}

watch(
  () => props.bbox,
  (newBbox) => {
    if (!newBbox || !map.value)
      return

    if (ignoreNextPropUpdate) {
      ignoreNextPropUpdate = false
      return
    }

    fitMapToBbox(newBbox)
  },
  { immediate: true },
)

onMounted(() => {
  map.value = new maplibre.Map({
    container: 'bbox-selector',
    style: MAP_STYLE_URL,
  })

  map.value.addControl(new maplibre.NavigationControl())

  map.value.on('load', () => {
    if (props.bbox)
      fitMapToBbox(props.bbox)

    map.value!.on('moveend', emitBbox)
  })
})
</script>

<template>
  <div id="bbox-selector" class="map-bbox" />
</template>

<style scoped>
.map-bbox {
  border: 1px solid grey;
  height: 250px;
  width: 100%;
}
</style>
