<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error, FormData } from '@/types'
import LoCha from '@/components/LoCha/LoCha.vue'
import MapFilters from '@/components/MapFilters.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'
import { ref } from 'vue'

const $api = useApiConfig()
const { error, loading, setError } = $api
const geojson = ref<ApiResponse>()
const bbox = ref('')
const mapFiltersRef = ref<InstanceType<typeof MapFilters>>()
const mapFiltersIsOpen = ref(true)

async function handleSubmit(formData: FormData) {
  let params: URLSearchParams | undefined

  if (formData.dateStart && formData.dateEnd && formData.bbox) {
    params = new URLSearchParams({
      date_start: new Date(formData.dateStart).toISOString(),
      date_end: new Date(formData.dateEnd).toISOString(),
      bbox: formData.bbox,
    })
  }

  geojson.value = await $api.fetchData(params)
}

function handleBboxUpdate(value: string) {
  bbox.value = value
}

function handleError(err: Error): void {
  setError(err)

  if (mapFiltersRef.value)
    mapFiltersRef.value.resetForm()
}
</script>

<template>
  <VHeader />
  <VLoading v-if="loading" />
  <VError v-if="error.message" :message="error.message" :type="error.type" />
  <main
    :style="{
      gridTemplateColumns: mapFiltersIsOpen ? '300px 1fr' : '0px 1fr',
    }"
  >
    <MapFilters
      ref="mapFiltersRef"
      :is-open="mapFiltersIsOpen"
      :bbox="bbox"
      @submit="handleSubmit"
      @error="handleError"
      @toggle-menu="mapFiltersIsOpen = !mapFiltersIsOpen"
    />
    <LoCha
      :data="geojson"
      @error="handleError"
      @update-bbox="handleBboxUpdate"
    />
  </main>
</template>

<style lang="css" scoped>
main {
  display: grid;
  grid-template-rows: 1fr;
  height: calc(100vh - 56px);
  transition: grid-template-columns 0.3s ease;
}
</style>
