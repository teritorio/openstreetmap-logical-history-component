<script setup lang="ts">
import type { ApiResponse } from './composables/useApi'
import type { Error, FormData } from './types'
import { onMounted, ref } from 'vue'
import LoCha from './components/LoCha.vue'
import MapFilters from './components/MapFilters.vue'
import VError from './components/VError.vue'
import VHeader from './components/VHeader.vue'
import VLoading from './components/VLoading.vue'
import VMap from './components/VMap.vue'
import { useApiConfig } from './composables/useApi'

const $api = useApiConfig()
const { error } = $api
const geojson = ref<ApiResponse>()
const loading = ref(true)
const bbox = ref('')

onMounted(async () => {
  geojson.value = await $api.fetchData()
  loading.value = false
})

async function handleSubmit(formData: FormData) {
  loading.value = true
  let params: URLSearchParams | undefined

  if (formData.dateStart && formData.dateEnd && formData.bbox) {
    params = new URLSearchParams({
      date_start: new Date(formData.dateStart).toISOString(),
      date_end: new Date(formData.dateEnd).toISOString(),
      bbox: formData.bbox,
    })
  }

  geojson.value = await $api.fetchData(params)
  loading.value = false
}

function handleBboxUpdate(value: string) {
  bbox.value = value
}

function handleError(err: Error) {
  error.value = err
}
</script>

<template>
  <VHeader />
  <VLoading v-if="loading" />
  <main>
    <VError v-if="error.message" :message="error.message" :type="error.type" />
    <MapFilters :bbox="bbox" @submit="handleSubmit" />
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
