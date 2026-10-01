<script setup lang="ts">
import type { FormData } from '@/types'
import { reactive, shallowRef, useTemplateRef, watchEffect } from 'vue'
import MapBbox from '@/components/MapBbox.vue'
import { presets } from '@/data/presets'

const props = withDefaults(
  defineProps<{
    bbox?: string
  }>(),
  {
    bbox: '',
  },
)

const emit = defineEmits<{
  (e: 'submit', bbox: string): void
  (e: 'preset', data: FormData): void
}>()

const localBbox = reactive({ bbox: '' })
const mapBboxRef = useTemplateRef('mapBboxRef')
const needZoom = shallowRef(false)

watchEffect(() => {
  localBbox.bbox = props.bbox ?? ''
})

const EXTRA_PARAM_DEFAULTS: Partial<FormData> = {
  includeRelationTypeRoute: false,
}

function setPreset(index: number) {
  const { title, ...preset } = presets[index]
  const data: FormData = {
    ...EXTRA_PARAM_DEFAULTS,
    dateStart: preset.dateStart ? preset.dateStart.slice(0, 10) : '',
    dateEnd: preset.dateEnd ? preset.dateEnd.slice(0, 10) : '',
    bbox: preset.bbox,
  }
  emit('preset', data)
}

function handleBboxChange(bbox: string) {
  if (!mapBboxRef.value)
    return

  needZoom.value = mapBboxRef.value.getZoom() < 14
  localBbox.bbox = bbox
}

function handleSubmit(): void {
  if (!mapBboxRef.value)
    return

  needZoom.value = false

  if (mapBboxRef.value.getZoom() < 14) {
    needZoom.value = true
    return
  }

  emit('submit', localBbox.bbox)
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar-content">
      <div class="filter-bar-map">
        <MapBbox
          ref="mapBboxRef"
          :bbox="localBbox.bbox"
          @update-bbox="handleBboxChange"
        />
      </div>

      <div class="filter-bar-controls">
        <form @submit.prevent="handleSubmit">
          <div class="form-field">
            <label for="fb_bbox">Bounding Box <span class="required">*</span></label>
            <input
              id="fb_bbox"
              v-model="localBbox.bbox"
              type="text"
              placeholder="west, south, east, north"
              pattern="^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$"
              required
            >
            <pre v-if="needZoom" class="zoom-warning">Need smaller bbox, zoom more !</pre>
          </div>

          <pre class="required-note">* required fields</pre>

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
  background: linear-gradient(to bottom, #e8e8ea, #f0f0f2);
}

.filter-bar-content {
  flex: 1;
  min-height: 0;
  padding: 1rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr;
  gap: 1rem;
}

.filter-bar-map {
  min-height: 0;
}

.filter-bar-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
  min-width: 160px;
}

@media (max-width: 768px) {
  .filter-bar-content {
    grid-template-columns: 1fr;
  }
}

label {
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
}

.required {
  color: red;
}

.required-note {
  color: red;
  font-size: 0.75rem;
  text-align: right;
  margin: 0;
}

.zoom-warning {
  color: red;
  font-size: 0.8rem;
  margin: 0;
}

input[type='text'] {
  padding: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
  background: #fff;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-run {
  padding: 8px 20px;
  background: #082e4e;
  color: #fff;
  border: none;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}

.btn-run:is(:disabled) {
  opacity: 0.5;
  cursor: initial;
}

.btn-run:not(:disabled):hover {
  background: #0d4a7a;
}

.presets {
  min-width: 220px;
}

.presets h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.presets ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.presets li button {
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #ddd;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
}

.presets li button:hover {
  background: #f0f4f8;
  border-color: #082e4e;
}
</style>
