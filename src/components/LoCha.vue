<script setup lang="ts">
// QUESTION: Should we follow a type convention instead of internal type ?
import type { ApiResponse } from 'src/composables/useApi'
import { computed, ref } from 'vue'
import { actionColors } from '../types'

const props = defineProps<{
  data?: ApiResponse
}>()

const current = ref(0)

const actionStatus = computed(() => {
  if (!props.data?.metadata.links[current.value].before && props.data?.metadata.links[current.value].after)
    return 'create'
  if (props.data?.metadata.links[current.value].before && !props.data?.metadata.links[current.value].after)
    return 'delete'
  return 'update'
})

const currentLink = computed(() => props.data?.metadata.links[current.value])

const currentId = computed(() => {
  switch (actionStatus.value) {
    case 'create':
      return currentLink.value?.after
    case 'delete':
      return currentLink.value?.before
    default:
      return currentLink.value?.before
  }
})

const currentFeature = computed(() => {
  return props.data?.features.find((feature) => {
    return feature.id?.toString() === currentId.value
  })
})

const actionColor = computed(() => actionColors[actionStatus.value])

defineExpose({ currentFeature })
</script>

<template>
  <p v-if="!data">
    ⚠️ No data
  </p>
  <div v-else class="wrapper">
    <aside>
      <button :disabled="current === 0" @click="current--">
        &#9664; Prev Locha
      </button>
      |
      <button :disabled="current === data.metadata.links.length" @click="current++">
        Next Locha &#9654;
      </button>
    </aside>
    <div clas="locha">
      <header>
        <h2>
          <span v-show="actionStatus === 'delete'">
            &#x2716; {{ data.metadata.links[current].before }}
          </span>
          <span v-show="actionStatus === 'update'">
            &#x1F503; {{ data.metadata.links[current].before }} > {{ data.metadata.links[current].after }}</span>
          <span v-show="actionStatus === 'create'">
            &#x2795; {{ data.metadata.links[current].after }}
          </span>
        </h2>
      </header>
      <div>
        <!-- TODO: display before/after values -->
        <h3>Tags</h3>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="([key, value]) in Object.entries(currentFeature?.properties?.tags)" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.wrapper,
p {
  flex: 1;
}

.wrapper {
  display: flex;
  flex-direction: column;
  background-color: #fefefe;
}

p {
  display: grid;
  place-items: center;
}

aside {
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

h2 {
  border: 4px solid v-bind(actionColor);
  background-color: color-mix(in srgb, v-bind(actionColor) 20%, white 80%);
  font-size: 18px;
  margin: 0;
  padding: 8px;
}

table {
  width: 50%;
  border-collapse: collapse;
  background-color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

thead {
  background-color: #007BFF;
  color: #ffffff;
}

th,
td {
  padding: 12px 15px;
  text-align: left;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tbody tr:hover {
  background-color: #f1f1f1;
}

th {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
