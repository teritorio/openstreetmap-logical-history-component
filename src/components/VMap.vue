<script setup lang="ts">
import type { MapEmits } from '@/composables/useMap'
import { useLoCha } from '@/composables/useLoCha'
import { useMap } from '@/composables/useMap'
import { onMounted, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const emit = defineEmits<MapEmits>()

const { loCha } = useLoCha()
const { init, handleMapDataUpdate } = useMap()

onMounted(() => init(emit))

// TODO: Move to useMap composable
watch(loCha, (newValue) => {
  if (newValue) {
    handleMapDataUpdate(newValue)
  }
}, { deep: true })
</script>

<template>
  <div id="map" />
</template>
