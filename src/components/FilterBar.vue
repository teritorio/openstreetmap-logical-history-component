<script setup lang="ts">
import type { FormData } from '@/types'
import { Checkbox, Field } from '@ark-ui/vue'
import { ref, watch, watchEffect } from 'vue'
import { MIN_ZOOM } from '@/constants/map'
import { presets } from '@/data/presets'

const props = withDefaults(
  defineProps<{
    bbox?: string
    needZoom?: boolean
    includeRelationTypeRoute?: boolean
    dateStart?: string
    dateEnd?: string
  }>(),
  {
    bbox: '',
    needZoom: false,
    includeRelationTypeRoute: false,
    dateStart: '',
    dateEnd: '',
  },
)

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'preset', data: FormData): void
  (e: 'updateBbox', bbox: string): void
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
        <Field.Root class="form-field" required>
          <Field.Label>Start date <Field.RequiredIndicator /></Field.Label>
          <Field.Input
            type="date"
            :value="props.dateStart"
            @change="emit('update:dateStart', ($event.target as HTMLInputElement).value)"
          />
        </Field.Root>
        <Field.Root class="form-field">
          <Field.Label>End date</Field.Label>
          <Field.Input
            type="date"
            :value="props.dateEnd"
            @change="emit('update:dateEnd', ($event.target as HTMLInputElement).value)"
          />
        </Field.Root>
      </div>

      <Field.Root class="form-field" required>
        <Field.Label>Bounding Box <Field.RequiredIndicator /></Field.Label>
        <Field.Input
          v-model="localBbox"
          type="text"
          placeholder="west, south, east, north"
          pattern="^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$"
        />
      </Field.Root>

      <Checkbox.Root
        class="route-label"
        :checked="props.includeRelationTypeRoute"
        @update:checked="emit('update:includeRelationTypeRoute', $event === true)"
      >
        <Checkbox.Control class="route-checkbox-control">
          <Checkbox.Indicator class="route-checkbox-indicator">
            ✓
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label>Include route relations</Checkbox.Label>
        <Checkbox.HiddenInput />
      </Checkbox.Root>

      <div class="form-actions">
        <p v-if="needZoom" class="zoom-warning" role="alert">
          Zoom in more to query (min. zoom {{ MIN_ZOOM }})
        </p>
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
  background: var(--color-bg-white);
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

:deep([data-scope='field'][data-part='label']),
:deep([data-scope='checkbox'][data-part='label']) {
  font-size: var(--text-sm);
  color: var(--color-text);
  font-weight: 500;
}

:deep([data-scope='field'][data-part='required-indicator']) {
  color: var(--color-error);
}

:deep([data-scope='field'][data-part='input']) {
  padding: var(--space-2);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg-white);
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

:deep([data-scope='field'][data-part='input']:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 46, 78, 0.12);
  outline: none;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.zoom-warning {
  flex: 1;
  color: var(--color-warning);
  font-size: var(--text-sm);
  margin: 0;
}

.btn-run {
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: var(--color-primary-fg);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 0.15s,
    opacity 0.15s;
}

.btn-run:is(:disabled) {
  opacity: 0.5;
  cursor: initial;
}

.btn-run:not(:disabled):hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.route-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.route-checkbox-control {
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xs, 2px);
  background: var(--color-bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:deep([data-scope='checkbox'][data-part='control'][data-state='checked']) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.route-checkbox-indicator {
  font-size: 11px;
  color: var(--color-primary-fg);
  line-height: 1;
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
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.presets li button:hover {
  background: var(--color-bg-hover);
  border-left-color: var(--color-primary);
}
</style>
