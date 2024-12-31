<script setup lang="ts">
import type { FormData } from 'src/types'
import { reactive, ref, watch } from 'vue'

const props = defineProps<{
  bbox: string
}>()

const emit = defineEmits<{
  (e: 'submit', payload: FormData): void
}>()

const initialFormValues = {
  dateStart: '',
  dateEnd: '',
  bbox: '',
} satisfies FormData

const formRef = ref<InstanceType<typeof HTMLFormElement>>()
const errorMessage = ref<string>()
const formValues = reactive<FormData>(initialFormValues)

watch(() => props.bbox, (newValue) => {
  formValues.bbox = newValue
})

function resetForm() {
  Object.assign(formValues, initialFormValues)
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
    errorMessage.value = 'The date range must not exceed 1 month.'
    resetForm()

    return false
  }

  errorMessage.value = undefined

  return true
}
</script>

<template>
  <aside>
    <p v-if="errorMessage">
      {{ errorMessage }}
    </p>
    <form ref="formRef" @submit.prevent="handleSubmit">
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
  </aside>
</template>

<style lang="css" scoped>
aside {
  width: 300px;
  background-color: #fefefe;
  border-right: 1px solid #ddd;
  padding: 16px;
  box-sizing: border-box;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
}

aside form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

aside form div {
  display: flex;
  flex-direction: column;
}

aside label {
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

aside input,
aside [type="submit"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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

p {
  color: red;
  display: none;
}

@media (max-width: 768px) {
  aside {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
}
</style>
