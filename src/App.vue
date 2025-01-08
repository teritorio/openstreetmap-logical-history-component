<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error, FormData } from '@/types'
import LoCha from '@/components/LoCha/LoCha.vue'
import MapFilters from '@/components/MapFilters.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import VMap from '@/components/VMap.vue'
import { useApiConfig } from '@/composables/useApi'
import { ref } from 'vue'

const $api = useApiConfig()
const { error, loading, setError } = $api
const geojson = ref<ApiResponse>()
const bbox = ref('')
const mapFiltersRef = ref<InstanceType<typeof MapFilters>>()

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
  <main>
    <MapFilters
      ref="mapFiltersRef"
      :bbox="bbox"
      @submit="handleSubmit"
      @error="handleError"
    />
    <section>
      <LoCha :data="geojson" />
      <VMap
        :data="geojson"
        @error="handleError"
        @update-bbox="handleBboxUpdate"
      />
    </section>
  </main>
</template>

<style lang="css" scoped>
main {
  display: flex;
  height: calc(100vh - 64px);
  position: relative;
}

section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  main {
    flex-direction: column;
  }
}
</style>
