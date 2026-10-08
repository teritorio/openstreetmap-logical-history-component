<script setup lang="ts">
import type { FormData } from '@/types'
import { ref, watch, watchEffect } from 'vue'
import { MIN_ZOOM } from '@/constants/map'
import { presets } from '@/data/presets'

const props = withDefaults(
  defineProps<{
    bbox?: string
    needZoom?: boolean
    isDrawing?: boolean
    includeRelationTypeRoute?: boolean
    dateStart?: string
    dateEnd?: string
  }>(),
  {
    bbox: '',
    needZoom: false,
    isDrawing: false,
    includeRelationTypeRoute: false,
    dateStart: '',
    dateEnd: '',
  },
)

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'preset', data: FormData): void
  (e: 'updateBbox', bbox: string): void
  (e: 'toggleDraw'): void
  (e: 'update:includeRelationTypeRoute', value: boolean): void
  (e: 'update:dateStart', value: string): void
  (e: 'update:dateEnd', value: string): void
}>()

const localBbox = ref('')

watchEffect(() => {
  localBbox.value = props.bbox ?? ''
})

watch(localBbox, (val) => {
  if (val !== props.bbox)
    emit('updateBbox', val)
})

function setPreset(index: number): void {
  const preset = presets[index]
  emit('preset', {
    dateStart: preset.dateStart?.slice(0, 10) ?? '',
    dateEnd: preset.dateEnd?.slice(0, 10) ?? '',
    bbox: preset.bbox,
    includeRelationTypeRoute: false,
  })
}

function handleSubmit(): void {
  if (!props.needZoom)
    emit('submit')
}
</script>

<template>
  <div class="filter-bar">
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
        <button
          class="btn-draw"
          :class="{ 'btn-draw--active': isDrawing }"
          type="button"
          @click="emit('toggleDraw')"
        >
          {{ isDrawing ? '✕ Cancel draw' : '✏ Draw on map' }}
        </button>
        <p v-if="needZoom" class="zoom-warning" role="alert">
          Zoom in more to query (min. zoom {{ MIN_ZOOM }})
        </p>
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
</template>

<style lang="css" scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-surface);
  height: 100%;
  overflow-y: auto;
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

label {
  font-size: var(--text-sm);
  color: var(--color-text);
  font-weight: 500;
}

.required {
  color: var(--color-error);
}

input[type='text'],
input[type='date'] {
  padding: var(--space-2);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg);
  font-family: inherit;
}

.btn-draw {
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.btn-draw--active {
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border-color: var(--color-primary);
}

.btn-draw:not(.btn-draw--active):hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.zoom-warning {
  color: var(--color-warning);
  font-size: var(--text-sm);
  margin: 0;
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
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-4);
}

.presets h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
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
