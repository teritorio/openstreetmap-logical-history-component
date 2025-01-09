<script setup lang="ts">
import type { Error, FormData, Preset } from '@/types'
import { reactive, ref, watchEffect } from 'vue'

const props = withDefaults(defineProps<{
  isOpen?: boolean
  bbox: string
}>(), {
  isOpen: true,
})

const emit = defineEmits<{
  (e: 'submit', payload: FormData): void
  (e: 'error', payload: Error): void
  (e: 'toggleMenu'): void
}>()

defineExpose({ resetForm })

const initialFormValues = {
  dateStart: '',
  dateEnd: '',
  bbox: '',
} satisfies FormData

const presets = [{
  title: '01/01/2023 - 09/01/2024 (Ondres)',
  dateStart: new Date('2023-01-01').toISOString().split('T')[0],
  dateEnd: new Date('2024-09-01').toISOString().split('T')[0],
  bbox: '43.57582751611194,-1.4865185506147705,43.57668833005737,-1.4857594854635559',

}, {
  title: 'Tête de pond - lines',
  dateStart: new Date('2024-07-01').toISOString().split('T')[0],
  dateEnd: new Date('2024-09-01').toISOString().split('T')[0],
  bbox: '44.82039347351967,-0.5420824675324966,44.82208861548204,-0.5393090634110976',
}, {
  title: 'Bâtiments - surfaces',
  dateStart: new Date('2024-12-10').toISOString().split('T')[0],
  dateEnd: new Date('2024-12-15').toISOString().split('T')[0],
  bbox: '42.685107065011486,-1.6537454710167148,42.68686379572838,-1.6509720668953156',
}] satisfies Preset[]

const formRef = ref<InstanceType<typeof HTMLFormElement>>()
const formValues = reactive<FormData>(initialFormValues)

watchEffect(() => {
  if (props.bbox)
    formValues.bbox = props.bbox
})

function resetForm() {
  Object.assign(formValues, { dateStart: '', dateEnd: '', bbox: '' })
}

function handleSubmit() {
  if (!validateDateRange()) {
    return
  }

  emit('submit', formValues)
}

// Validate the date range
function validateDateRange(): boolean {
  const dateStart = new Date(formValues.dateStart)
  const dateEnd = new Date(formValues.dateEnd)

  if (!dateStart || !dateEnd)
    return true

  const maxDateEnd = new Date(dateStart)
  maxDateEnd.setMonth(maxDateEnd.getMonth() + 1)

  if (dateEnd > maxDateEnd) {
    emit('error', { message: 'Date range must not exceed 1 month.', type: 'error' })
    resetForm()

    return false
  }

  return true
}

function setPreset(index: number) {
  const { title, ...preset } = presets[index]

  Object.assign(formValues, preset)

  handleSubmit()
}
</script>

<template>
  <aside :class="{ minimized: !isOpen }">
    <button class="toggle-button" @click="emit('toggleMenu')">
      {{ isOpen ? '⬅️' : '➡️' }}
    </button>
    <form ref="formRef" @submit.prevent="handleSubmit">
      <h2>Data</h2>
      <div>
        <label for="date_start">From:</label>
        <input v-model="formValues.dateStart" type="date" required>
      </div>
      <div>
        <label for="date_end">To:</label>
        <input v-model="formValues.dateEnd" type="date" required>
      </div>
      <div>
        <label for="bbox">Bounding Box:</label>
        <input
          v-model="formValues.bbox" type="text" placeholder="lat1, lon1, lat2, lon2"
          pattern="^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$" required
        >
      </div>
      <button type="submit">
        Search
      </button>
    </form>

    <h2>Presets</h2>
    <ul>
      <li
        v-for="(preset, index) in presets"
        :key="preset.title"
        @click="setPreset(index)"
      >
        <button>{{ preset.title }}</button>
      </li>
      <li>
        ...
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
  padding: 1em;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  height: inherit;
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

.toggle-button {
  background-color: #ffffff;
  color: #fff;
  border-radius: 50%;
  border: none;
  padding: 0.5em;
  cursor: pointer;
  height: 48px;
  width: 48px;
  position: absolute;
  right: 0;
  bottom: 1em;
  transform: translateX(50%);
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
  font-size: 1.2em;
  z-index: 1;
}

.toggle-button:hover {
  background-color: #f4f4f4;
}

ul {
  list-style: none;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1em;
  background-color: #f4f4f4;
  padding: 1em;
}

form div {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5em;
  color: #333;
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

@media (max-width: 768px) {
  aside {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
}
</style>
