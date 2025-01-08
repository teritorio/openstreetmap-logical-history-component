<script setup lang="ts">
import type { Error, FormData, Preset } from '@/types'
import { reactive, ref, watchEffect } from 'vue'

const props = defineProps<{
  bbox: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: FormData): void
  (e: 'error', payload: Error): void
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
  // if (!validateDateRange()) {
  //   return
  // }

  emit('submit', formValues)
}

// Validate the date range
// function validateDateRange(): boolean {
//   const dateStart = new Date(formValues.dateStart)
//   const dateEnd = new Date(formValues.dateEnd)

//   if (!dateStart || !dateEnd)
//     return true

//   const maxDateEnd = new Date(dateStart)
//   maxDateEnd.setMonth(maxDateEnd.getMonth() + 1)

//   if (dateEnd > maxDateEnd) {
//     emit('error', { message: 'Date range must not exceed 1 month.', type: 'error' })
//     resetForm()

//     return false
//   }

//   return true
// }

function setPreset(index: number) {
  const { title, ...preset } = presets[index]

  Object.assign(formValues, preset)

  handleSubmit()
}
</script>

<template>
  <aside>
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
  gap: 8px;
  width: 300px;
  background-color: #fefefe;
  border-right: 1px solid #ddd;
  padding: 16px;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
}

h2 {
  margin: 0;
}

aside form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f1f1f1;
  padding: 8px;
}

aside form div {
  display: flex;
  flex-direction: column;
}

aside label {
  margin-bottom: 8px;
  color: #333;
}

aside input,
aside [type="submit"] {
  padding: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
}

aside input {
  background: #fff;
}

aside [type="submit"] {
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
