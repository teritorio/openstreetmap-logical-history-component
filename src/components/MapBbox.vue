<script setup lang="ts">
import maplibre from 'maplibre-gl'
import { onMounted, shallowRef } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

defineProps<{
  bbox?: string
}>()

const emit = defineEmits<{
  (e: 'updateBbox', bbox: string): void
}>()

const map = shallowRef<maplibre.Map>()
const MAP_STYLE_URL = 'https://vecto.teritorio.xyz/styles/positron/style.json?key=teritorio-demo-1-eTuhasohVahquais0giuth7i'

onMounted(() => {
  map.value = new maplibre.Map({
    container: 'bbox-selector',
    style: MAP_STYLE_URL,
  })

  map.value.addControl(new maplibre.NavigationControl())

  emitBbox()

  map.value.on('load', () => {
    map.value!.on('moveend', emitBbox)
  })
})

function emitBbox(): void {
  const bbox = getBbox()

  emit('updateBbox', bbox)
}

function getBbox(): string {
  const bounds = map.value!.getBounds()
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ].join(',')
}
</script>

<template>
  <div id="bbox-selector" class="map-bbox" />
</template>

<style lang="css" scoped>
.map-bbox {
  height: 280px;
  width: 100%;
}
</style>
