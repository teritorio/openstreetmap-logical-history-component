<script setup lang="ts">
import type { ApiLink, FormData, IFeature, LoChaData } from '@/types'
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DateRangeSlider from '@/components/DateRangeSlider.vue'
import FilterBar from '@/components/FilterBar.vue'
import LoCha from '@/components/LoCha/LoCha.vue'
import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import LoChaReason from '@/components/LoCha/LoChaReason.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'
import { formatDateOnly, fromDateOnly, toDateOnly } from '@/utils/date-format'

const $api = useApiConfig()
const { error, loading, resetError } = $api
const geojson = ref<LoChaData>()
const lastQuery = ref<Record<string, string | undefined>>({})

const route = useRoute()
const router = useRouter()

const formValues = reactive<FormData>({
  dateStart: '',
  dateEnd: '',
  bbox: '',
  includeRelationTypeRoute: false,
})

watchEffect(() => {
  formValues.dateStart = route.query.date_start ? toDateOnly(String(route.query.date_start)) : ''
  formValues.dateEnd = route.query.date_end ? toDateOnly(String(route.query.date_end)) : ''
  formValues.bbox = route.query.bbox ? String(route.query.bbox) : ''
  formValues.includeRelationTypeRoute = route.query.include_relation_type_route === 'true'
})

watch(
  () => JSON.stringify(route.query),
  async () => {
    const query = route.query
    if (query.date_start && query.bbox) {
      await fetchData({
        date_start: String(query.date_start),
        date_end: query.date_end ? String(query.date_end) : undefined,
        bbox: String(query.bbox),
        include_relation_type_route: query.include_relation_type_route ? String(query.include_relation_type_route) : undefined,
      })
    }
  },
  { immediate: true },
)

async function fetchData(query: Record<string, string | undefined>) {
  lastQuery.value = query
  geojson.value = await $api.fetchData(query)
}

function handleRetry() {
  if (Object.keys(lastQuery.value).length > 0)
    fetchData(lastQuery.value)
}

function getLinks(feature: IFeature, index: number): ApiLink[] {
  if (!geojson.value)
    return []

  const links = geojson.value.metadata.links[index]
  if (feature.properties.is_before) {
    const link = links.find(l => l.before === feature.id || l.after === feature.id)
    return link ? [link] : []
  }

  return links.filter(l => l.before === feature.id || l.after === feature.id)
}

function getBeforeFeature(link: ApiLink): IFeature | undefined {
  return geojson.value?.features.find(f => f.id === link.before)
}

const dateLabel = computed(() => {
  if (!formValues.dateStart)
    return 'Select a date range'
  const from = formatDateOnly(formValues.dateStart)
  const to = formValues.dateEnd ? formatDateOnly(formValues.dateEnd) : '—'
  return `From ${from} → To ${to}`
})

function doSubmit() {
  if (!formValues.dateStart)
    throw new Error('Missing start date.')

  const query: Record<string, string | undefined> = {
    date_start: fromDateOnly(formValues.dateStart),
    date_end: formValues.dateEnd ? fromDateOnly(formValues.dateEnd) : undefined,
    bbox: formValues.bbox ?? '',
    include_relation_type_route: formValues.includeRelationTypeRoute ? 'true' : undefined,
  }

  const currentQuery: Record<string, string | undefined> = {
    date_start: route.query.date_start ? String(route.query.date_start) : undefined,
    date_end: route.query.date_end ? String(route.query.date_end) : undefined,
    bbox: route.query.bbox ? String(route.query.bbox) : undefined,
    include_relation_type_route: route.query.include_relation_type_route ? String(route.query.include_relation_type_route) : undefined,
  }

  if (JSON.stringify(query) === JSON.stringify(currentQuery)) {
    fetchData(query)
  }
  else {
    router.push({ path: route.path, query })
  }
}

function handleFilterSubmit(bbox: string) {
  formValues.bbox = bbox
  doSubmit()
}

function handlePreset(data: FormData) {
  Object.assign(formValues, data)
  doSubmit()
}
</script>

<template>
  <div class="app">
    <VHeader />
    <VLoading v-if="loading" />
    <VError
      v-if="error.message"
      :message="error.message"
      :type="error.type"
      @close="resetError"
      @retry="handleRetry"
    />
    <div class="date-bar">
      <DateRangeSlider
        v-model:start="formValues.dateStart"
        v-model:end="formValues.dateEnd"
      />
      <div class="date-meta">
        <span class="date-label">{{ dateLabel }}</span>
        <label class="route-label">
          <input
            v-model="formValues.includeRelationTypeRoute"
            type="checkbox"
            class="route-checkbox"
          >
          Include route relations
        </label>
      </div>
    </div>
    <main>
      <FilterBar
        :bbox="formValues.bbox"
        @submit="handleFilterSubmit"
        @preset="handlePreset"
      />
      <LoCha id="demo" :data="geojson" :reason-collapsed="false">
        <template #object-detail="{ feature, index }">
          <template v-for="(link, i) in getLinks(feature, index)" :key="i">
            <template v-if="feature.properties.is_after">
              <template v-for="(before, _) in [getBeforeFeature(link)]" :key="_">
                <span v-if="before && geojson!.metadata.links[index].length > 1" class="before-link">
                  🔗 {{ `${before.properties.objtype}${before.properties.id}-v${before.properties.version}` }}
                </span>
                <LoChaDiff
                  v-if="!feature.properties.deleted"
                  :diff="link.diff_tags"
                  :dst="feature.properties"
                  :src="before?.properties"
                />
                <LoChaReason :reason="link.conflation_reason" />
              </template>
            </template>
            <template v-else-if="feature.properties.is_new">
              <LoChaDiff
                :diff="link.diff_tags"
                :dst="feature.properties"
              />
            </template>
            <template v-else>
              <LoChaDiff
                :src="feature.properties"
              />
            </template>
          </template>
        </template>
      </LoCha>
    </main>
  </div>
</template>

<style lang="css" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.date-bar {
  background: linear-gradient(to bottom, #e8e8ea, #f0f0f2);
  border-bottom: 1px solid #d0d0d2;
  padding: 0.5rem 1rem 0.75rem;
}

.date-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.date-label {
  font-size: 0.85rem;
  color: #555;
  font-weight: 500;
}

.route-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
}

.route-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.before-link {
  font-size: 0.75em;
  color: #888;
}
</style>
