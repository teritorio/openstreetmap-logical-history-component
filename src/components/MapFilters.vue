<script setup lang="ts">
import type { FormData, Preset } from '@/types'
import { reactive, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import MapBbox from '@/components/MapBbox.vue'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    initialValues?: FormData
  }>(),
  {
    isOpen: true,
    initialValues: () => ({ dateStart: '', dateEnd: '', bbox: '' }),
  },
)

const emit = defineEmits<{
  (e: 'submit', payload: FormData): void
}>()

// TODO: move presets to another file.
const presets = [{
  title: 'Parking - (Points / Lines)',
  dateStart: new Date('2023-08-01').toISOString().slice(0, 16),
  dateEnd: new Date('2023-09-30').toISOString().slice(0, 16),
  bbox: '-1.4865185506147705,43.57582751611194,-1.4857594854635559,43.57668833005737',

}, {
  title: 'Bridgehead - (Lines)',
  dateStart: new Date('2024-07-01').toISOString().slice(0, 16),
  dateEnd: new Date('2024-08-01').toISOString().slice(0, 16),
  bbox: '-0.5420824675324966,44.82039347351967,-0.5393090634110976,44.82208861548204',
}, {
  title: 'Buildings - (Surfaces)',
  dateStart: new Date('2024-12-10').toISOString().slice(0, 16),
  dateEnd: new Date('2024-12-15').toISOString().slice(0, 16),
  bbox: '-1.6537454710167148,42.685107065011486,-1.6509720668953156,42.68686379572838',
}, {
  title: 'n+n relation',
  dateStart: new Date('2025-09-05').toISOString().slice(0, 16),
  bbox: '1.7526036474026228,49.12499299921325,1.7531567019438796,49.12533170522417',
}] satisfies Preset[]

const formRef = ref<InstanceType<typeof HTMLFormElement>>()
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

function setPreset(index: number) {
  const { title, ...preset } = presets[index]
  Object.assign(formValues, preset)
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

  emit('submit', formValues)
}
</script>

<template>
  <aside :class="{ minimized: !isOpen }">
    <form ref="formRef" @submit.prevent="handleSubmit">
      <h2>Filter by:</h2>
      <div>
        <label for="date_start">From <span class="required">*</span></label>
        <input
          id="date_start"
          v-model="formValues.dateStart"
          type="datetime-local"
          required
        >
      </div>
      <div>
        <label for="date_end">To</label>
        <input
          id="date_end"
          v-model="formValues.dateEnd"
          type="datetime-local"
        >
      </div>
      <div>
        <label for="bbox">Bounding Box <span class="required">*</span></label>
        <input
          id="bbox"
          v-model="formValues.bbox"
          type="text"
          placeholder="lat1, lon1, lat2, lon2"
          pattern="^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$"
          required
        >
        <MapBbox
          ref="mapBboxRef"
          :bbox="formValues.bbox"
          @update-bbox="handleBboxChange"
        />
        <pre v-if="needZoom">Need smaller bbox, zoom more !</pre>
      </div>
      <pre>* required fields</pre>
      <button type="submit" :disabled="needZoom">
        Run
      </button>
    </form>

    <h2>Examples</h2>
    <ul>
      <li
        v-for="(preset, index) in presets"
        :key="preset.title"
        @click="setPreset(index)"
      >
        <button>{{ preset.title }}</button>
      </li>
    </ul>
  </aside>
</template>

<style lang="css" scoped>
aside {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  border-right: 1px solid #ddd;
  position: relative;
  height: inherit;
  padding: 1rem;
}

.minimized {
  padding-left: 0;
  padding-right: 0;
}

.minimized .toggle-button {
  transform: translateX(calc(100% + 1em));
}

.minimized *:not(.toggle-button) {
  display: none;
}

ul {
  list-style: none;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

form > div {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #333;
}

pre {
  text-align: right;
}

.required,
pre {
  color: red;
}

input,
[type='submit'] {
  padding: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
}

input {
  background: #fff;
}

[type='submit'] {
  font-family: inherit;
  border: none;
  background: #082e4e;
  color: #fff;
  cursor: pointer;
}

[type='submit']:is(:disabled) {
  opacity: 0.5;
  cursor: initial;
}

@media (max-width: 768px) {
  aside {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
}
</style>
