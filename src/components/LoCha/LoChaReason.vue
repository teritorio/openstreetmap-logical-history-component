<script setup lang="ts">
import type { Reason } from '@/composables/useApi'
import { computed } from 'vue'

const props = defineProps<{
  reason: Reason
}>()

const nonEmptyEntries = computed(() => Object.entries(props.reason).filter(([_key, values]) => !!values))

function isObject(entry?: any): boolean {
  return entry && typeof entry === 'object' && !Array.isArray(entry)
}
</script>

<template>
  <div class="locha-reason">
    <span v-for="[key, values] in nonEmptyEntries" :key="key">
      <b>{{ key }}</b>
      <hr>
      <p v-if="!isObject(values)">{{ values }}</p>
      <p v-for="[key2, value] in Object.entries(values)" v-else :key="key2">
        <b>{{ key2 }}</b>: {{ value }}
      </p>
    </span>
  </div>
</template>

<style lang="css" scoped>
.locha-reason {
  display: flex;
  gap: 0.25rem;
}

span {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  font-size: 0.75rem;
  border: 1px solid #000000;
  padding: 0.25rem;
}

.locha-reason span > b {
  align-self: center;
  text-transform: capitalize;
}
</style>
