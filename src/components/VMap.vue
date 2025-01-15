<script setup lang="ts">
import type { MapEmits } from '@/composables/useMap'
import { useLoCha } from '@/composables/useLoCha'
import { useMap } from '@/composables/useMap'
import { onMounted, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const emit = defineEmits<MapEmits>()

const { loCha, selectedFeatures } = useLoCha()
const { init, handleMapDataUpdate, setFeatureHighlight } = useMap()

onMounted(() => init(emit))

function updateFeatureHighlight(features: GeoJSON.Feature[] | undefined, state: boolean) {
  if (!features)
    return

  features.forEach((f) => {
    if (!f.id || !f.properties)
      return

    // TODO: use f.id once API returns a numeric int
    setFeatureHighlight(f.properties.id.toString(), state)
  })
}

watch(selectedFeatures, (newValue, oldValue) => {
  updateFeatureHighlight(newValue, true)
  updateFeatureHighlight(oldValue, false)
})

watch(loCha, (newValue) => {
  if (newValue) {
    handleMapDataUpdate(newValue)
  }
}, { deep: true })
</script>

<template>
  <div id="map" />
</template>
