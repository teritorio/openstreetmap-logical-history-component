<script setup lang="ts">
import type { FormData } from '@/types'
import { Collapsible } from '@ark-ui/vue'
import { computed, reactive, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MapBbox from '@/components/MapBbox.vue'
import { presets } from '@/data/presets'
import { formatDate, fromDatetimeLocal, toDatetimeLocal } from '@/utils/date-format'

const props = withDefaults(
  defineProps<{
    initialValues?: FormData
  }>(),
  {
    initialValues: () => ({ dateStart: '', dateEnd: '', bbox: '' }),
  },
)

const emit = defineEmits<{
  (e: 'submit', payload: FormData): void
}>()

const isEditing = ref(false)
const formValues = reactive<FormData>({
  dateStart: '',
  dateEnd: '',
  bbox: '',
})
const mapBboxRef = useTemplateRef('mapBboxRef')
const needZoom = shallowRef(false)

watchEffect(() => {
  if (props.initialValues) {
    Object.assign(formValues, props.initialValues)
  }
})

const router = useRouter()
const route = useRoute()

const readSummary = computed<string>(() => {
  if (!formValues.dateStart)
    return 'No filter applied'

  const from = formatDate(fromDatetimeLocal(formValues.dateStart))
  const to = formValues.dateEnd ? formatDate(fromDatetimeLocal(formValues.dateEnd)) : '—'
  const bboxPart = formValues.bbox ? ' — bounding box defined' : ''

  return `From ${from} → To ${to}${bboxPart}`
})

function setPreset(index: number) {
  const { title, ...preset } = presets[index]
  const mapped: FormData = {
    dateStart: preset.dateStart ? toDatetimeLocal(new Date(preset.dateStart).toISOString()) : '',
    dateEnd: preset.dateEnd ? toDatetimeLocal(new Date(preset.dateEnd).toISOString()) : '',
    bbox: preset.bbox,
  }
  Object.assign(formValues, mapped)
  router.replace({ path: route.path, hash: '' })
  isEditing.value = false
  emit('submit', formValues)
}

function handleBboxChange(bbox: string) {
  if (!mapBboxRef.value)
    return

  needZoom.value = mapBboxRef.value.getZoom() < 14
  formValues.bbox = bbox
}

function handleSubmit(): void {
  if (!mapBboxRef.value)
    return

  needZoom.value = false

  if (mapBboxRef.value.getZoom() < 14) {
    needZoom.value = true
    return
  }

  isEditing.value = false
  emit('submit', formValues)
}

function handleCancel(): void {
  if (props.initialValues) {
    Object.assign(formValues, props.initialValues)
  }
  needZoom.value = false
  isEditing.value = false
}
</script>

<template>
  <Collapsible.Root v-model:open="isEditing" class="filter-bar">
    <div class="filter-bar-read">
      <span class="filter-summary">{{ readSummary }}</span>
      <Collapsible.Trigger as-child>
        <button class="edit-button">
          Edit
        </button>
      </Collapsible.Trigger>
    </div>

    <Collapsible.Content class="filter-bar-edit">
      <div class="filter-bar-map">
        <MapBbox
          ref="mapBboxRef"
          :bbox="formValues.bbox"
          @update-bbox="handleBboxChange"
        />
      </div>

      <div class="filter-bar-controls">
        <form @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-field">
              <label for="fb_date_start">From <span class="required">*</span></label>
              <input
                id="fb_date_start"
                v-model="formValues.dateStart"
                type="datetime-local"
                required
              >
            </div>
            <div class="form-field">
              <label for="fb_date_end">To</label>
              <input
                id="fb_date_end"
                v-model="formValues.dateEnd"
                type="datetime-local"
              >
            </div>
          </div>

          <div class="form-field">
            <label for="fb_bbox">Bounding Box <span class="required">*</span></label>
            <input
              id="fb_bbox"
              v-model="formValues.bbox"
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
            <button type="button" class="btn-cancel" @click="handleCancel">
              Cancel
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
    </Collapsible.Content>
  </Collapsible.Root>
</template>

<style lang="css" scoped>
.filter-bar {
  border-bottom: 1px solid #d0d0d2;
  background: linear-gradient(to bottom, #e8e8ea, #f0f0f2);
}

.filter-bar-read {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  gap: 1rem;
}

.filter-summary {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.edit-button {
  padding: 6px 16px;
  background: #082e4e;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}

.edit-button:hover {
  background: #0d4a7a;
}

.filter-bar-edit {
  border-top: 1px solid #d0d0d2;
  padding: 1rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  min-height: 350px;
}

.filter-bar-map {
  height: 100%;
  min-height: 350px;
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

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
  min-width: 160px;
}

@media (max-width: 768px) {
  .filter-bar-edit {
    grid-template-columns: 1fr;
  }

  .filter-bar-map {
    min-height: 250px;
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

input[type='datetime-local'],
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

.btn-cancel {
  padding: 8px 16px;
  background: transparent;
  color: #555;
  border: 1px solid #ccc;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f5f5f5;
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
