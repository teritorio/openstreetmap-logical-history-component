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

const featureBefore = computed(() => {
  return props.data?.features.find((feature) => {
    return feature.id?.toString() === currentLink.value?.before
  })
})

const featureAfter = computed(() => {
  return props.data?.features.find((feature) => {
    return feature.id?.toString() === currentLink.value?.after
  })
})

const actionColor = computed(() => actionColors[actionStatus.value])
</script>

<template>
  <p v-if="!data" class="user-feedback">
    ⚠️ No data
  </p>
  <div v-else class="wrapper">
    <aside>
      <button :disabled="current === 0" @click="current--">
        &#9664; Prev
      </button>
      |
      <button :disabled="current === data.metadata.links.length" @click="current++">
        Next &#9654;
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
        <span>v{{ featureBefore?.properties?.version }} > v{{ featureAfter?.properties?.version }}</span>
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
            <tr v-for="([key, value]) in Object.entries(featureBefore?.properties?.tags)" :key="key">
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
.user-feedback {
  flex: 1;
}

.wrapper {
  display: flex;
  flex-direction: column;
  background-color: #fefefe;
}

.user-feedback {
  display: grid;
  place-items: center;
}

header {
  display: flex;
  align-items: center;
  border: 4px solid v-bind(actionColor);
  background-color: color-mix(in srgb, v-bind(actionColor) 20%, white 80%);
}

header h2 {
  flex: 1;
}

header > span {
  border-radius: 16px;
  border: 2px solid #000000;
  padding: 4px 8px;
}

aside {
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

h2 {
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
  background-color: #cecece;
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
