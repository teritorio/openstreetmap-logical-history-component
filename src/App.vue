<script setup lang="ts">
import type { CreateToasterReturn } from '@ark-ui/vue'
import type { ApiLink, FormData, IFeature, LoChaData } from '@/types'
import { Checkbox, NumberInput, Splitter, Toast, Toaster, Tooltip } from '@ark-ui/vue'
import { computed, inject, reactive, ref, shallowRef, toRef, useTemplateRef, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DateRangeSlider from '@/components/DateRangeSlider.vue'
import FilterBar from '@/components/FilterBar.vue'
import LoCha from '@/components/LoCha/LoCha.vue'
import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import LoChaReason from '@/components/LoCha/LoChaReason.vue'
import MapBbox from '@/components/MapBbox.vue'
import VFooter from '@/components/VFooter.vue'
import VHeader from '@/components/VHeader.vue'
import VLoading from '@/components/VLoading.vue'
import { useApiConfig } from '@/composables/useApi'
import { useKarmaData } from '@/composables/useKarmaData'
import { MIN_ZOOM } from '@/constants/map'
import { formatDateOnly, fromDateOnly, nMonthsBeforeDate, oneYearAgoDate, toDateOnly, todayDate } from '@/utils/date-format'

const toaster = inject<CreateToasterReturn>('toaster')!
const $api = useApiConfig()
const { loading } = $api
const geojson = ref<LoChaData>()
const view = ref<'search' | 'results'>('search')

const route = useRoute()
const router = useRouter()

const formValues = reactive<FormData>({
  dateStart: '',
  dateEnd: '',
  bbox: '',
  includeRelationTypeRoute: false,
})

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

const mapBboxRef = useTemplateRef<InstanceType<typeof MapBbox>>('mapBboxRef')
const currentZoom = ref(0)
const needZoom = computed(() => currentZoom.value < MIN_ZOOM)

const splitterPanels = [
  { id: 'sidebar', minSize: 15 },
  { id: 'map', minSize: 30 },
]

watchEffect(() => {
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

let skipNextFetch = false

watch(
  () => JSON.stringify(route.query),
  async () => {
    if (skipNextFetch) {
      skipNextFetch = false
      return
    }
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
  geojson.value = await $api.fetchData(query)
  if (geojson.value)
    view.value = 'results'
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
  skipNextFetch = true
  router.push({
    path: route.path,
    query: {
      date_start: fromDateOnly(formValues.dateStart),
      date_end: formValues.dateEnd ? fromDateOnly(formValues.dateEnd) : undefined,
      bbox: formValues.bbox ?? '',
      include_relation_type_route: formValues.includeRelationTypeRoute ? 'true' : undefined,
    },
  })
}

function goBack() {
  view.value = 'search'
}

watch(
  () => route.query.date_start,
  (dateStart) => {
    if (!dateStart)
      view.value = 'search'
  },
)

const grayOutThreshold = ref(2)
</script>

<template>
  <div class="app">
    <VHeader />
    <VLoading v-if="loading" />
    <Toaster :toaster="toaster">
      <template #default="toast">
        <Toast.Root class="toast-root" :class="`toast-${toast.type}`">
          <div class="toast-header">
            <Toast.Title class="toast-title">
              {{ toast.title }}
            </Toast.Title>
            <Toast.CloseTrigger class="toast-close">
              ✕
            </Toast.CloseTrigger>
          </div>
          <Toast.Description v-if="toast.description" class="toast-description">
            {{ toast.description }}
          </Toast.Description>
          <div v-if="toast.action" class="toast-footer">
            <Toast.ActionTrigger class="toast-action">
              {{ toast.action.label }}
            </Toast.ActionTrigger>
          </div>
        </Toast.Root>
      </template>
    </Toaster>

    <main>
      <div v-if="view === 'search'" class="screen">
        <section class="histogram">
          <DateRangeSlider
            v-model:start="formValues.dateStart"
            v-model:end="formValues.dateEnd"
            :histogram-data="histogramData"
            :date-range="dateRange"
            :need-zoom="needZoom"
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
            <span v-if="resultsLabel" class="results-label">{{ resultsLabel }}</span>
          </div>
          <div class="toolbar-sep" aria-hidden="true" />
          <div class="toolbar-right">
            <Tooltip.Root :open-delay="300" :close-delay="100">
              <Tooltip.Trigger as-child>
                <Checkbox.Root class="results-route" :checked="formValues.includeRelationTypeRoute" disabled>
                  <Checkbox.Control class="checkbox-control">
                    <Checkbox.Indicator class="checkbox-indicator">
                      ✓
                    </Checkbox.Indicator>
                  </Checkbox.Control>
                  <Checkbox.Label>Include route relations</Checkbox.Label>
                  <Checkbox.HiddenInput />
                </Checkbox.Root>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content class="toolbar-tooltip-content">
                  This option was set when the query was run. To change it, go back and run a new search.
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
            <Tooltip.Root :open-delay="300" :close-delay="100">
              <Tooltip.Trigger as-child>
                <NumberInput.Root
                  class="results-grayout"
                  :model-value="String(grayOutThreshold)"
                  :min="0"
                  :max="100"
                  @update:model-value="grayOutThreshold = Number($event)"
                >
                  <NumberInput.Label>Dim minor changes below (m)</NumberInput.Label>
                  <NumberInput.Control class="number-input-control">
                    <NumberInput.DecrementTrigger class="number-input-trigger">
                      −
                    </NumberInput.DecrementTrigger>
                    <NumberInput.Input class="number-input-field" />
                    <NumberInput.IncrementTrigger class="number-input-trigger">
                      +
                    </NumberInput.IncrementTrigger>
                  </NumberInput.Control>
                </NumberInput.Root>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content class="toolbar-tooltip-content">
                  Groups with no tag changes are dimmed if their geometry shift is at most this distance (in metres). At 0, only groups with neither tag nor geometry changes are dimmed.
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
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
    </main>
    <VFooter />
  </div>
</template>

<style lang="css" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.histogram {
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.main-split {
  flex: 1;
  min-height: 0;
  display: flex;
}

.sidebar {
  height: 100%;
  overflow: hidden;
}

.results-screen {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
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
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-family: inherit;
  cursor: pointer;
  line-height: 1;
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

.checkbox-control {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs, 2px);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:deep([data-scope='checkbox'][data-part='control'][data-state='checked']) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-indicator {
  font-size: 10px;
  color: var(--color-primary-fg);
  line-height: 1;
}

.results-grayout {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.number-input-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.number-input-field {
  width: 3rem;
  text-align: center;
  font-size: var(--text-sm);
  padding: var(--space-1);
  border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  background: var(--color-bg);
  font-family: inherit;
}

.number-input-trigger {
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-surface);
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  line-height: 1;
  color: var(--color-text);
  font-family: inherit;
}

.number-input-trigger:hover {
  background: var(--color-bg-hover);
}

.toast-root {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md, var(--radius-sm));
  box-shadow: var(--shadow-md);
  color: var(--color-fg-on-color);
  min-width: 280px;
  max-width: 420px;
  margin-bottom: var(--space-2);
}

.toast-error {
  background: var(--color-error);
}

.toast-info {
  background: var(--color-info);
}

.toast-success {
  background: var(--color-success);
}

.toast-warning {
  background: var(--color-warning);
}

.toast-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.toast-title {
  font-weight: 600;
  font-size: var(--text-sm);
}

.toast-description {
  font-size: var(--text-sm);
  opacity: 0.9;
}

.toast-action {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-error);
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.toast-action:hover {
  background: #fff;
}

.toast-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-1);
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-fg-on-color);
  font-size: var(--text-sm);
  cursor: pointer;
  line-height: 1;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  opacity: 0.7;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.before-link {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (max-width: 767px) {
  .main-split {
    flex-direction: column !important;
  }

  .toolbar-sep {
    display: none;
  }
}

.toolbar-tooltip-content {
  background: var(--color-text);
  color: var(--color-bg-white);
  font-size: var(--text-xs, 0.75rem);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  max-width: 260px;
  line-height: 1.4;
  box-shadow: var(--shadow-md);
}
</style>
