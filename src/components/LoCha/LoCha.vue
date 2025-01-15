<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import LoChaList from '@/components/LoCha/LoChaList.vue'
import VMap from '@/components/VMap.vue'
import { useLoCha } from '@/composables/useLoCha'
import { watchEffect } from 'vue'

const props = defineProps<{
  data?: ApiResponse
}>()

const emit = defineEmits<{
  (e: 'error', payload: Error): void
  (e: 'updateBbox', bbox: string): void
}>()

const {
  afterFeatures,
  beforeFeatures,
  featureCount,
  linkCount,
  selectedLink,
  setLoCha,
} = useLoCha()

watchEffect(() => {
  if (props.data) {
    setLoCha(props.data)
  }
})

function handleMapClick(feature: MapGeoJSONFeature) {
  if (!feature.id)
    throw new Error('Feature ID not found.')

  // TODO...
}
</script>

<template>
  <section class="locha">
    <p v-if="!featureCount || !linkCount" class="user-feedback">
      ⚠️ No data
    </p>
    <div v-else class="locha-content">
      <LoChaList :features="beforeFeatures" title="Before" />
      <div v-show="selectedLink">
        Diff
      </div>
      <LoChaList :features="afterFeatures" title="After" />
    </div>
    <VMap
      @click="handleMapClick"
      @error="emit('error', $event)"
      @update-bbox="emit('updateBbox', $event)"
    />
  </section>
</template>

<style lang="css" scoped>
.locha {
  display: flex;
  flex-direction: column;
  gap: 1em;
  background-color: #f4f4f4;
  height: inherit;
}

.locha-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr;
  flex: 70%;
  gap: 1em;
  overflow: hidden;
  padding: 1em;
}

#map {
  flex: 50%;
}

.locha-content > div {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.locha-content > div:first-of-type {
  grid-column-start: 1;
}

.locha-content > div:nth-of-type(2) {
  grid-column-start: 2;
}

.locha-content > div:last-of-type {
  grid-column-start: 3;
}

.locha-content > div:deep(ul) {
  overflow-y: auto;
}

.user-feedback {
  display: grid;
  place-content: center;
  height: 100%;
}
</style>
