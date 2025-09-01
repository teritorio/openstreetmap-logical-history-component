<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { FormData } from '@/types'
import { ref } from 'vue'
import LoCha from '@/components/LoCha/LoCha.vue'
import MapFilters from '@/components/MapFilters.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'

const $api = useApiConfig()
const { error, loading } = $api
const geojson = ref<ApiResponse>()
const mapFiltersRef = ref<InstanceType<typeof MapFilters>>()
const mapFiltersIsOpen = ref(true)

async function handleSubmit(formData: FormData) {
  let params: URLSearchParams | undefined

  if (formData.dateStart && formData.bbox) {
    params = new URLSearchParams({
      date_start: new Date(formData.dateStart).toISOString(),
      date_end: !formData.dateEnd ? new Date().toISOString() : new Date(formData.dateEnd).toISOString(),
      bbox: formData.bbox,
    })

    window.history.pushState({}, '', `${window.location.pathname}?${params}`)
  }

  geojson.value = await $api.fetchData(params)
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
      @submit="handleSubmit"
      @toggle-menu="mapFiltersIsOpen = !mapFiltersIsOpen"
    />
    <LoCha :data="geojson">
      <!-- <template #locha-diff>
        <div>
          <h2>Diff tags</h2>
          <table v-for="(group, index) in groups" :key="index">
            <thead>
              <tr>{{ index }}</tr>
            </thead>
            <tbody>
              <tr>{{ group }}</tr>
            </tbody>
          </table>
        </div>
      </template> -->
    </LoCha>
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
