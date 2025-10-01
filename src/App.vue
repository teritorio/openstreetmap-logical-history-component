<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { FormData } from '@/types'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoCha from '@/components/LoCha/LoCha.vue'
import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import LoChaDiffTag from '@/components/LoCha/LoChaDiffTag.vue'
import MapFilters from '@/components/MapFilters.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'
import { fromDatetimeLocal, toDatetimeLocal } from '@/utils/date-format'

const $api = useApiConfig()
const { error, loading, resetError } = $api
const geojson = ref<ApiResponse>()
const mapFiltersRef = ref<InstanceType<typeof MapFilters>>()
const mapFiltersIsOpen = ref(true)

const route = useRoute()
const router = useRouter()

const initialFormValues = computed<FormData>(() => ({
  dateStart: route.query.date_start ? toDatetimeLocal(String(route.query.date_start)) : '',
  dateEnd: route.query.date_end ? toDatetimeLocal(String(route.query.date_end)) : '',
  bbox: route.query.bbox ? String(route.query.bbox) : '',
}))

watch(
  () => JSON.stringify(route.query),
  async () => {
    const query = route.query
    if (query.date_start && query.bbox) {
      await fetchData({
        date_start: String(query.date_start),
        date_end: query.date_end ? String(query.date_end) : undefined,
        bbox: String(query.bbox),
      })
    }
  },
  { immediate: true },
)

async function fetchData(query: Record<string, string | undefined>) {
  geojson.value = await $api.fetchData(query)
}

function handleSubmit(data: FormData) {
  if (!data.dateStart)
    throw new Error('Missing start date.')

  const query = {
    date_start: fromDatetimeLocal(data.dateStart),
    date_end: data.dateEnd
      ? fromDatetimeLocal(data.dateEnd)
      : undefined,
    bbox: data.bbox ?? '',
  }

  router.push({
    path: route.path,
    query,
  })
}
</script>

<template>
  <VHeader @toggle-menu="mapFiltersIsOpen = !mapFiltersIsOpen" />
  <VLoading v-if="loading" />
  <VError
    v-if="error.message"
    :message="error.message"
    :type="error.type"
    @close="resetError"
  />
  <main
    :style="{
      gridTemplateColumns: mapFiltersIsOpen ? '300px 1fr' : '0px 1fr',
    }"
  >
    <MapFilters
      ref="mapFiltersRef"
      :initial-values="initialFormValues"
      :is-open="mapFiltersIsOpen"
      @submit="handleSubmit"
    />
    <LoCha :data="geojson">
      <template #tags-diff="{ title, date, diff, attribs, dst, src }">
        <div class="infos">
          <span v-if="title" class="title">🔗 {{ title }}</span>
          <span v-if="dst?.is_after && src" class="date">📅 {{ date }}</span>
        </div>
        <div v-if="attribs?.geom">
          Diff on
          <LoChaDiffTag
            :diff="attribs.geom"
            type="geom"
          />
        </div>
        <LoChaDiff
          v-if="!dst?.deleted"
          :diff="diff"
          :dst="dst"
          :src="src"
        />
      </template>
    </LoCha>
  </main>
</template>

<style lang="css" scoped>
main {
  display: grid;
  grid-template-rows: 1fr;
  height: calc(100vh - 64px);
  transition: grid-template-columns 0.3s ease;
}
</style>
