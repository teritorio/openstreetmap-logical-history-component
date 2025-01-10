<script setup lang="ts">
import type { MapEmits } from '@/composables/useMap'
import { useLoCha } from '@/composables/useLoCha'
import { useMap } from '@/composables/useMap'
import { onMounted, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'

const emit = defineEmits<MapEmits>()

const { loCha, selectedLink } = useLoCha()
const { init, handleMapDataUpdate, applyFilter } = useMap()

onMounted(() => init(emit))

watch(loCha, (newValue) => {
  if (newValue) {
    handleMapDataUpdate(newValue)
  }
}, { deep: true })

watch(selectedLink, (newValue) => {
  if (newValue)
    applyFilter(newValue)
})
</script>

<template>
  <div id="map" />
</template>
