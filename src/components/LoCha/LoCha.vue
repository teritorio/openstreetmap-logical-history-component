<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import { watch } from 'vue'
import LoChaList from '@/components/LoCha/LoChaList.vue'
import VMap from '@/components/VMap.vue'
import { useLoCha } from '@/composables/useLoCha'

const props = defineProps<{
  data?: ApiResponse
}>()

const emit = defineEmits<{
  (e: 'error', payload: Error): void
  (e: 'updateBbox', bbox: string): void
}>()

const {
  featureCount,
  setLoCha,
} = useLoCha()

watch(() => props.data, (newValue) => {
  if (newValue) {
    setLoCha(newValue)
  }
})
</script>

<template>
  <section class="locha">
    <p v-if="!featureCount" class="user-feedback">
      ⚠️ No data
    </p>
    <LoChaList v-else />
    <VMap
      @error="emit('error', $event)"
      @update-bbox="emit('updateBbox', $event)"
    />
  </section>
</template>

<style lang="css" scoped>
.locha {
  display: flex;
  flex-direction: column;
  background-color: #f4f4f4;
  height: inherit;
}

.locha-list {
  flex: 70%;
  overflow-y: hidden;
}

#map {
  flex: 30%;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
}

.user-feedback {
  display: grid;
  place-content: center;
  flex: 70%;
}
</style>
