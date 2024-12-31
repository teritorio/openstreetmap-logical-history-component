<script setup lang="ts">
import type { ApiResponse } from './composables/useApi'
import type { Error, FormData } from './types'
import { onMounted, reactive, ref } from 'vue'
import LoCha from './components/LoCha.vue'
import MapFilters from './components/MapFilters.vue'
import VError from './components/VError.vue'
import VHeader from './components/VHeader.vue'
import VMap from './components/VMap.vue'
import { useApiConfig } from './composables/useApi'

const geojson = ref<ApiResponse>()
const loading = ref(true)
const bbox = ref('')
let error = reactive<Error>({
  message: undefined,
  type: 'info',
})

onMounted(async () => {
  geojson.value = await fetchData()
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

  geojson.value = await fetchData(params)
  loading.value = false
}

// Fetch data from API
const { buildApiUrl } = useApiConfig()
async function fetchData(params?: URLSearchParams): Promise<ApiResponse | undefined> {
  return await fetch(buildApiUrl(params), { method: 'GET' })
    .then(async (res) => {
      if (!res.ok)
        throw new Error('API request failed')

      return await res.json() as ApiResponse
    })
    .then(data => transformData(data))
    .catch((err) => {
      error = {
        message: err.message,
        type: 'error',
      }
      return undefined
    })
}

function transformData(data: ApiResponse) {
  return {
    ...data,
    features: data.features.map((feature) => {
      if (!feature.id)
        return feature

      const link = data.metadata.links.find(({ before, after }) => before === feature.id!.toString() || after === feature.id!.toString())

      if (!link)
        throw new Error(`Feature ${feature.id} has no link.`)

      if (link.before && !link.after) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_removed: true,
          },
        }
      }

      if (!link.before && link.after) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            is_created: true,
          },
        }
      }

      return feature
    }),
  }
}

function handleBboxUpdate(value: string) {
  bbox.value = value
}

function handleError(err: Error) {
  error = err
}
</script>

<template>
  <VHeader />
  <main>
    <VError v-if="error.message" :message="error.message" :type="error.type" />
    <MapFilters :bbox="bbox" @submit="handleSubmit" />
    <section>
      <LoCha />
      <VMap
        :loading="loading"
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
