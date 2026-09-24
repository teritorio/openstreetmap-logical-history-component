<script setup lang="ts">
import type { ApiLink, FormData, IFeature, LoChaData } from '@/types'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FilterBar from '@/components/FilterBar.vue'
import LoCha from '@/components/LoCha/LoCha.vue'
import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import LoChaReason from '@/components/LoCha/LoChaReason.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'
import { fromDateOnly, toDateOnly } from '@/utils/date-format'

const $api = useApiConfig()
const { error, loading, resetError } = $api
const geojson = ref<LoChaData>()
const lastQuery = ref<Record<string, string | undefined>>({})

const route = useRoute()
const router = useRouter()

const initialFormValues = computed<FormData>(() => ({
  dateStart: route.query.date_start ? toDateOnly(String(route.query.date_start)) : '',
  dateEnd: route.query.date_end ? toDateOnly(String(route.query.date_end)) : '',
  bbox: route.query.bbox ? String(route.query.bbox) : '',
  includeRelationTypeRoute: route.query.include_relation_type_route === 'true',
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

function handleSubmit(data: FormData) {
  if (!data.dateStart)
    throw new Error('Missing start date.')

  const query: Record<string, string | undefined> = {
    date_start: fromDateOnly(data.dateStart),
    date_end: data.dateEnd ? fromDateOnly(data.dateEnd) : undefined,
    bbox: data.bbox ?? '',
    include_relation_type_route: data.includeRelationTypeRoute ? 'true' : undefined,
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
</script>

<template>
  <VHeader />
  <VLoading v-if="loading" />
  <VError
    v-if="error.message"
    :message="error.message"
    :type="error.type"
    @close="resetError"
    @retry="handleRetry"
  />
  <main>
    <FilterBar :initial-values="initialFormValues" @submit="handleSubmit" />
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
</template>

<style lang="css" scoped>
main {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
}

.before-link {
  font-size: 0.75em;
  color: #888;
}
</style>
