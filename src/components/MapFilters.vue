<script setup lang="ts">
import type { FormData, Preset } from '@/types'
import { onMounted, reactive, ref } from 'vue'
import MapBbox from '@/components/MapBbox.vue'

withDefaults(defineProps<{
  isOpen?: boolean
}>(), {
  isOpen: true,
})

const emit = defineEmits<{
  (e: 'submit', payload: FormData): void
  (e: 'toggleMenu'): void
}>()

const initialFormValues = {
  dateStart: '',
  bbox: '',
} satisfies FormData

// TODO: move presets to another file.
const presets = [{
  title: 'Parking - (Points / Lines)',
  dateStart: new Date('2023-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2023-12-01').toISOString().slice(0, 16),
  bbox: '43.57582751611194,-1.4865185506147705,43.57668833005737,-1.4857594854635559',

}, {
  title: 'Bridgehead - (Lines)',
  dateStart: new Date('2024-07-01').toISOString().slice(0, 16),
  dateEnd: new Date('2024-08-01').toISOString().slice(0, 16),
  bbox: '44.82039347351967,-0.5420824675324966,44.82208861548204,-0.5393090634110976',
}, {
  title: 'Buildings - (Surfaces)',
  dateStart: new Date('2024-12-10').toISOString().slice(0, 16),
  dateEnd: new Date('2024-12-15').toISOString().slice(0, 16),
  bbox: '42.685107065011486,-1.6537454710167148,42.68686379572838,-1.6509720668953156',
}, {
  title: 'n+n relation',
  dateStart: new Date('2023-01-01').toISOString().slice(0, 16),
  dateEnd: new Date('2023-12-01').toISOString().slice(0, 16),
  bbox: '43.55969828696391,-1.4598269945865354,43.565655969760684,-1.4323757210520682',
}] satisfies Preset[]

const formRef = ref<InstanceType<typeof HTMLFormElement>>()
const formValues = reactive<FormData>(initialFormValues)

onMounted(() => {
  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('date_start') && searchParams.has('date_end') && searchParams.has('bbox')) {
    Object.assign(formValues, {
      dateStart: searchParams.get('date_start'),
      dateEnd: searchParams.get('date_end'),
      bbox: searchParams.get('bbox'),
    })

    emit('submit', formValues)
  }
})

function setPreset(index: number) {
  const { title, ...preset } = presets[index]

  Object.assign(formValues, preset)

  emit('submit', formValues)
}

function handleBboxChange(bbox: string) {
  formValues.bbox = bbox
}
</script>

<template>
  <aside :class="{ minimized: !isOpen }">
    <button class="toggle-button" @click="emit('toggleMenu')">
      {{ isOpen ? '⬅️' : '➡️' }}
    </button>
    <form ref="formRef" @submit.prevent="emit('submit', formValues)">
      <h2>Filter by:</h2>
      <hr>
      <div>
        <label for="date_start">From:</label>
        <input
          id="date_start"
          v-model="formValues.dateStart"
          type="datetime-local"
          required
        >
      </div>
      <hr>
      <div>
        <label for="date_end">To:</label>
        <input
          id="date_end"
          v-model="formValues.dateEnd"
          type="datetime-local"
        >
      </div>
      <hr>
      <div>
        <label for="bbox">Bounding Box:</label>
        <input
          id="bbox"
          v-model="formValues.bbox"
          type="text"
          placeholder="lat1, lon1, lat2, lon2"
          pattern="^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$"
          required
        >
        <MapBbox :bbox="formValues.bbox" @update-bbox="handleBboxChange" />
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
  gap: 0.5rem;
}

label {
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
