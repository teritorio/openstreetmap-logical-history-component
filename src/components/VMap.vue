<script setup lang="ts">
import type { MapEmits } from '@/composables/useMap'
import { onMounted } from 'vue'
import { useMap } from '@/composables/useMap'
import 'maplibre-gl/dist/maplibre-gl.css'

const emit = defineEmits<MapEmits>()

const { init } = useMap()

onMounted(() => init(emit))
</script>

<template>
  <div id="map" />
</template>
