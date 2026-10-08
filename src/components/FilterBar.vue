<script setup lang="ts">
import type * as GeoJSON from 'geojson'
import type { FormData } from '@/types'
import { ref, useTemplateRef, watchEffect } from 'vue'
import MapBbox from '@/components/MapBbox.vue'
import { MIN_ZOOM } from '@/constants/map'
import { presets } from '@/data/presets'

const props = withDefaults(
  defineProps<{
    bbox?: string
    heatmapData?: GeoJSON.FeatureCollection | null
    includeRelationTypeRoute?: boolean
    dateStart?: string
    dateEnd?: string
  }>(),
  {
    bbox: '',
    heatmapData: null,
    includeRelationTypeRoute: false,
    dateStart: '',
    dateEnd: '',
  },
)

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'preset', data: FormData): void
  (e: 'updateBbox', bbox: string): void
  (e: 'viewportChange', bbox: string): void
  (e: 'update:includeRelationTypeRoute', value: boolean): void
  (e: 'update:dateStart', value: string): void
  (e: 'update:dateEnd', value: string): void
}>()

const localBbox = ref('')
const mapBboxRef = useTemplateRef('mapBboxRef')
const needZoom = ref(false)
const currentZoom = ref(0)

watchEffect(() => {
  localBbox.value = props.bbox ?? ''
})

function refreshZoom(): void {
  currentZoom.value = mapBboxRef.value?.getZoom() ?? 0
  needZoom.value = currentZoom.value < MIN_ZOOM
}

function setPreset(index: number): void {
  const preset = presets[index]
  emit('preset', {
    dateStart: preset.dateStart?.slice(0, 10) ?? '',
    dateEnd: preset.dateEnd?.slice(0, 10) ?? '',
    bbox: preset.bbox,
    includeRelationTypeRoute: false,
  })
}

function handleBboxChange(bbox: string): void {
  refreshZoom()
  localBbox.value = bbox
  emit('updateBbox', bbox)
}

function handleViewportChange(bbox: string): void {
  refreshZoom()
  emit('viewportChange', bbox)
}

function handleSubmit(): void {
  refreshZoom()
  if (!needZoom.value)
    emit('submit')
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar-content">
      <div class="filter-bar-map">
        <MapBbox
          ref="mapBboxRef"
          :bbox="localBbox"
          :heatmap-data="heatmapData"
          @update-bbox="handleBboxChange"
          @viewport-change="handleViewportChange"
        />
      </div>

      <div class="filter-bar-controls">
        <form @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-field">
              <label for="fb_date_start">Start date <span class="required">*</span></label>
              <input
                id="fb_date_start"
                type="date"
                :value="props.dateStart"
                required
                @change="emit('update:dateStart', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-field">
              <label for="fb_date_end">End date</label>
              <input
                id="fb_date_end"
                type="date"
                :value="props.dateEnd"
                @change="emit('update:dateEnd', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <div class="form-field">
            <label for="fb_bbox">Bounding Box <span class="required">*</span></label>
            <input
              id="fb_bbox"
              v-model="localBbox"
              type="text"
              placeholder="west, south, east, north"
              pattern="^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$"
              required
            >
            <pre v-if="needZoom" class="zoom-warning">Zoom in more to query (current zoom {{ currentZoom.toFixed(1) }}, need at least {{ MIN_ZOOM }})</pre>
          </div>

          <label class="route-label">
            <input
              type="checkbox"
              class="route-checkbox"
              :checked="props.includeRelationTypeRoute"
              @change="emit('update:includeRelationTypeRoute', ($event.target as HTMLInputElement).checked)"
            >
            Include route relations
          </label>

          <div class="form-actions">
            <button type="submit" class="btn-run" :disabled="needZoom">
              Run
            </button>
          </div>
        </form>

        <div class="presets">
          <h3>Examples</h3>
          <ul>
            <li
              v-for="(preset, index) in presets"
              :key="preset.title"
              @click="setPreset(index)"
            >
              <button type="button">
                {{ preset.title }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.filter-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-bg-surface);
}

.filter-bar-content {
  flex: 1;
  min-height: 0;
  padding: var(--space-4);
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr;
  gap: var(--space-4);
}

.filter-bar-map {
  min-height: 0;
}

.filter-bar-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: flex;
  gap: var(--space-2);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 120px;
}

@media (max-width: 768px) {
  .filter-bar-content {
    grid-template-columns: 1fr;
  }
}

label {
  font-size: var(--text-sm);
  color: var(--color-text);
  font-weight: 500;
}

.required {
  color: var(--color-error);
}

.zoom-warning {
  color: var(--color-warning);
  font-size: var(--text-sm);
  margin: 0;
}

input[type='text'] {
  padding: var(--space-2);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg);
}

.form-actions {
  display: flex;
  gap: var(--space-2);
}

.btn-run {
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-family: inherit;
  cursor: pointer;
}

.btn-run:is(:disabled) {
  opacity: 0.5;
  cursor: initial;
}

.btn-run:not(:disabled):hover {
  background: var(--color-primary-hover);
}

.route-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.route-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.presets {
  min-width: 220px;
}

.presets h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-2) 0;
}

.presets ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.presets li button {
  width: 100%;
  text-align: left;
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  font-family: inherit;
}

.presets li button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}
</style>
