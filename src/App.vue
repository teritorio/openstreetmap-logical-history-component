<script setup lang="ts">
import type { ApiLink, FormData, IFeature, LoChaData } from '@/types'
import { Drawer, Splitter } from '@ark-ui/vue'
import { computed, onMounted, onUnmounted, reactive, ref, shallowRef, toRef, useTemplateRef, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DateRangeSlider from '@/components/DateRangeSlider.vue'
import FilterBar from '@/components/FilterBar.vue'
import LoCha from '@/components/LoCha/LoCha.vue'
import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import LoChaReason from '@/components/LoCha/LoChaReason.vue'
import MapBbox from '@/components/MapBbox.vue'
import VError from '@/components/VError.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'
import { useKarmaData } from '@/composables/useKarmaData'
import { MIN_ZOOM } from '@/constants/map'
import { formatDateOnly, fromDateOnly, nMonthsBeforeDate, oneYearAgoDate, toDateOnly, todayDate } from '@/utils/date-format'

const $api = useApiConfig()
const { error, loading, resetError } = $api
const geojson = ref<LoChaData>()
const lastQuery = ref<Record<string, string | undefined>>({})
const view = ref<'search' | 'results'>('search')

const route = useRoute()
const router = useRouter()

const formValues = reactive<FormData>({
  dateStart: '',
  dateEnd: '',
  bbox: '',
  includeRelationTypeRoute: false,
})

let skipRouteSync = false

const viewportBbox = shallowRef('')
const karmaDateStart = toRef(formValues, 'dateStart')
const karmaDateEnd = toRef(formValues, 'dateEnd')
const karmaBbox = toRef(formValues, 'bbox')

const { histogramData, heatmapData, dateRange } = useKarmaData({
  viewportBbox,
  bbox: karmaBbox,
  dateStart: karmaDateStart,
  dateEnd: karmaDateEnd,
})

// Map state
const mapBboxRef = useTemplateRef<InstanceType<typeof MapBbox>>('mapBboxRef')
const currentZoom = ref(0)
const needZoom = computed(() => currentZoom.value < MIN_ZOOM)

// Responsive layout
const isMobile = ref(false)
function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

// Splitter panel config
const splitterPanels = [
  { id: 'sidebar', minSize: 15 },
  { id: 'map', minSize: 30 },
]

watchEffect(() => {
  if (skipRouteSync) {
    skipRouteSync = false
    return
  }
  formValues.dateStart = route.query.date_start ? toDateOnly(String(route.query.date_start)) : oneYearAgoDate()
  formValues.dateEnd = route.query.date_end ? toDateOnly(String(route.query.date_end)) : todayDate()
  formValues.bbox = route.query.bbox ? String(route.query.bbox) : ''
  formValues.includeRelationTypeRoute = route.query.include_relation_type_route === 'true'
})

watch(dateRange, (range) => {
  if (!range)
    return
  if (!route.query.date_start)
    formValues.dateStart = nMonthsBeforeDate(range.max_date.slice(0, 10), 4)
  if (!route.query.date_end)
    formValues.dateEnd = range.max_date.slice(0, 10)
}, { once: true })

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

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

async function fetchData(query: Record<string, string | undefined>) {
  lastQuery.value = query
  geojson.value = await $api.fetchData(query)
  if (geojson.value)
    view.value = 'results'
}

function handleRetry() {
  if (Object.keys(lastQuery.value).length > 0)
    fetchData(lastQuery.value)
}

function handleViewportChange(bbox: string): void {
  viewportBbox.value = bbox
  if (mapBboxRef.value)
    currentZoom.value = mapBboxRef.value.getZoom()
}

function handleMapBboxChange(bbox: string): void {
  formValues.bbox = bbox
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

const resultsLabel = computed(() => {
  if (!formValues.dateStart)
    return ''
  const from = formatDateOnly(formValues.dateStart)
  const to = formValues.dateEnd ? formatDateOnly(formValues.dateEnd) : '—'
  return `${from} → ${to}`
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

function handleFilterSubmit() {
  doSubmit()
}

function handlePreset(data: FormData) {
  Object.assign(formValues, data)
}

function goBack() {
  view.value = 'search'
  skipRouteSync = true
  router.replace({ path: route.path })
}

const grayOutThreshold = ref(2)
</script>

<template>
  <div class="app">
    <!-- Mobile layout: Drawer-based sidebar -->
    <template v-if="isMobile">
      <Drawer.Root swipe-direction="start">
        <VHeader>
          <template #leading>
            <Drawer.Trigger class="menu-btn" aria-label="Open filters">
              ☰
            </Drawer.Trigger>
          </template>
        </VHeader>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <div class="drawer-header">
              <span class="drawer-title">Filters</span>
              <Drawer.CloseTrigger class="drawer-close" aria-label="Close filters">
                ✕
              </Drawer.CloseTrigger>
            </div>
            <FilterBar
              v-if="view === 'search'"
              :bbox="formValues.bbox"
              :need-zoom="needZoom"
              :include-relation-type-route="formValues.includeRelationTypeRoute"
              :date-start="formValues.dateStart"
              :date-end="formValues.dateEnd"
              @update-bbox="(v: string) => formValues.bbox = v"
              @submit="handleFilterSubmit"
              @preset="handlePreset"
              @update:include-relation-type-route="(v: boolean) => formValues.includeRelationTypeRoute = v"
              @update:date-start="(v: string) => formValues.dateStart = v"
              @update:date-end="(v: string) => formValues.dateEnd = v"
            />
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      <VLoading v-if="loading" />
      <VError
        v-if="error.message"
        :message="error.message"
        :type="error.type"
        @close="resetError"
        @retry="handleRetry"
      />

      <div v-if="view === 'search'" class="screen">
        <section class="histogram">
          <DateRangeSlider
            v-model:start="formValues.dateStart"
            v-model:end="formValues.dateEnd"
            :histogram-data="histogramData"
            :date-range="dateRange"
          />
        </section>
        <main class="map-mobile">
          <MapBbox
            ref="mapBboxRef"
            :bbox="formValues.bbox"
            :heatmap-data="heatmapData"
            @update-bbox="handleMapBboxChange"
            @viewport-change="handleViewportChange"
          />
        </main>
      </div>

      <div v-else class="screen results-screen">
        <div class="results-toolbar">
          <div class="toolbar-left">
            <button class="btn-back" type="button" @click="goBack">
              ← Back
            </button>
            <span v-if="resultsLabel" class="results-label">{{ resultsLabel }}</span>
          </div>
          <div class="toolbar-sep" aria-hidden="true" />
          <div class="toolbar-right">
            <label class="results-route">
              <input type="checkbox" :checked="formValues.includeRelationTypeRoute" disabled>
              Routes
            </label>
            <label class="results-grayout">
              Threshold (m)
              <input v-model.number="grayOutThreshold" type="number" min="0" max="100" step="1">
            </label>
          </div>
        </div>
        <LoCha id="demo" :data="geojson" :reason-collapsed="false" :gray-out-threshold="grayOutThreshold">
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
      </div>
    </template>

    <!-- Desktop layout: Splitter-based sidebar -->
    <template v-else>
      <VHeader />

      <VLoading v-if="loading" />
      <VError
        v-if="error.message"
        :message="error.message"
        :type="error.type"
        @close="resetError"
        @retry="handleRetry"
      />

      <div v-if="view === 'search'" class="screen">
        <section class="histogram">
          <DateRangeSlider
            v-model:start="formValues.dateStart"
            v-model:end="formValues.dateEnd"
            :histogram-data="histogramData"
            :date-range="dateRange"
          />
        </section>
        <Splitter.Root class="main-split" :panels="splitterPanels" :default-size="[25, 75]">
          <Splitter.Panel id="sidebar">
            <aside class="sidebar">
              <FilterBar
                :bbox="formValues.bbox"
                :need-zoom="needZoom"
                :include-relation-type-route="formValues.includeRelationTypeRoute"
                :date-start="formValues.dateStart"
                :date-end="formValues.dateEnd"
                @update-bbox="(v: string) => formValues.bbox = v"
                @submit="handleFilterSubmit"
                @preset="handlePreset"
                @update:include-relation-type-route="(v: boolean) => formValues.includeRelationTypeRoute = v"
                @update:date-start="(v: string) => formValues.dateStart = v"
                @update:date-end="(v: string) => formValues.dateEnd = v"
              />
            </aside>
          </Splitter.Panel>
          <Splitter.ResizeTrigger id="sidebar:map" aria-label="Resize sidebar" />
          <Splitter.Panel id="map">
            <MapBbox
              ref="mapBboxRef"
              :bbox="formValues.bbox"
              :heatmap-data="heatmapData"
              @update-bbox="handleMapBboxChange"
              @viewport-change="handleViewportChange"
            />
          </Splitter.Panel>
        </Splitter.Root>
      </div>

      <div v-else class="screen results-screen">
        <div class="results-toolbar">
          <div class="toolbar-left">
            <button class="btn-back" type="button" @click="goBack">
              ← Back
            </button>
            <span v-if="resultsLabel" class="results-label">{{ resultsLabel }}</span>
          </div>
          <div class="toolbar-sep" aria-hidden="true" />
          <div class="toolbar-right">
            <label class="results-route">
              <input type="checkbox" :checked="formValues.includeRelationTypeRoute" disabled>
              Routes
            </label>
            <label class="results-grayout">
              Threshold (m)
              <input v-model.number="grayOutThreshold" type="number" min="0" max="100" step="1">
            </label>
          </div>
        </div>
        <LoCha id="demo" :data="geojson" :reason-collapsed="false" :gray-out-threshold="grayOutThreshold">
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
      </div>
    </template>
  </div>
</template>

<style lang="css" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.histogram {
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* Desktop Splitter */
.main-split {
  flex: 1;
  min-height: 0;
  display: flex;
}

.sidebar {
  height: 100%;
  overflow: hidden;
}

/* Mobile map */
.map-mobile {
  flex: 1;
  min-height: 300px;
}

/* Drawer header */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-primary);
  color: var(--color-primary-fg);
  flex-shrink: 0;
}

.drawer-title {
  font-size: var(--text-sm);
  font-weight: 600;
}

.drawer-close {
  background: none;
  border: none;
  color: var(--color-primary-fg);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--space-1);
  line-height: 1;
}

/* Mobile menu trigger */
.menu-btn {
  background: none;
  border: none;
  color: var(--color-primary-fg);
  font-size: var(--text-xl);
  cursor: pointer;
  padding: var(--space-2);
  line-height: 1;
}

/* Results screen */
.results-screen {
  display: flex;
  flex-direction: column;
}

.results-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.toolbar-sep {
  width: 1px;
  height: 1.25rem;
  background: var(--color-border);
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.btn-back {
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-family: inherit;
  cursor: pointer;
}

.btn-back:hover {
  background: var(--color-primary-hover);
}

.results-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.results-route {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: default;
}

.results-grayout {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.results-grayout input[type='number'] {
  width: 4rem;
  font-size: var(--text-sm);
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.before-link {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
