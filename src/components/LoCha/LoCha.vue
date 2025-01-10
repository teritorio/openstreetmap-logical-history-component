<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
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
  afterFeaturesFilter,
  beforeFeatures,
  beforeFeaturesFilter,
  featureCount,
  linkCount,
  resetFilters,
  setLoCha,
} = useLoCha()

watchEffect(() => {
  if (props.data) {
    setLoCha(props.data)
  }
})
</script>

<template>
  <section class="locha">
    <p v-if="!featureCount || !linkCount" class="user-feedback">
      ⚠️ No data
    </p>
    <div v-else class="locha-content">
      <button v-show="afterFeaturesFilter || beforeFeaturesFilter" id="filter-reset" @click="resetFilters">
        🔄 Reset selection
      </button>
      <LoChaList :features=" beforeFeaturesFilter || beforeFeatures" title="Before" />
      <LoChaList :features="afterFeaturesFilter || afterFeatures" title="After" />
    </div>
    <VMap
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
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: auto 1fr;
  flex: 70%;
  gap: 1em;
  overflow: hidden;
  padding: 1em;
}

#filter-reset {
  grid-column: 2 span;
  place-self: flex-end;
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

.locha-content > div:deep(ul) {
  overflow-y: auto;
}

.user-feedback {
  display: grid;
  place-content: center;
  height: 100%;
}
</style>
