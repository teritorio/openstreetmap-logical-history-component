<script setup lang="ts">
import type { Reason } from '@/composables/useApi'
import { computed, inject, ref } from 'vue'

const props = defineProps<{
  reason: Reason
}>()

const nonEmptyEntries = computed(() => Object.entries(props.reason).filter(([_key, values]) => !!values) as Array<[keyof Reason, Reason[keyof Reason]]>)

function isObject(entry?: Reason[keyof Reason]): boolean {
  return !!entry && typeof entry === 'object' && !Array.isArray(entry)
}

function formatNumericValue(key: string, val: number | string): number | string {
  switch (key) {
    case 'score':
      return `${Math.round(((1 - (val as number)) * 100))}%`
    case 'max_distance':
    case 'min_distance':
      return `${Number.parseFloat((val as number).toFixed(2))}m`
    default:
      return val
  }
}

const defaultCollapsedState = inject<boolean>('reasonCollapsed')
const isReasonCollapsed = ref<boolean>(defaultCollapsedState!)

function toggleReason() {
  isReasonCollapsed.value = !isReasonCollapsed.value
}
</script>

<template>
  <div class="locha-reason">
    <button
      class="reason-toggle"
      :aria-expanded="!isReasonCollapsed"
      @click="toggleReason"
    >
      {{ !isReasonCollapsed ? '▼' : '▶' }} Reason
    </button>
    <div v-show="!isReasonCollapsed" class="reason-grid">
      <span v-for="[key, values] in nonEmptyEntries" :key="key">
        <b>{{ key }}</b>
        <hr>
        <p v-if="!isObject(values)">{{ values }}</p>
        <p v-for="[key2, value] in Object.entries(values)" v-else :key="key2">
          <b>{{ key2 }}</b>: {{ formatNumericValue(key2, value) }}
        </p>
      </span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.reason-grid {
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

.reason-grid span > b {
  align-self: center;
  text-transform: capitalize;
}
</style>
