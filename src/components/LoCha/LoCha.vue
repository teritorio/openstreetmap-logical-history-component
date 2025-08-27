<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import type { Error } from '@/types'
import { watch } from 'vue'
import LoChaList from '@/components/LoCha/LoChaList.vue'
import { useLoCha } from '@/composables/useLoCha'

const props = defineProps<{
  data?: ApiResponse
}>()

defineEmits<{
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
    <LoChaList v-else>
      <!-- <template #locha-diff>
        <slot name="locha-diff" />
      </template> -->
    </LoChaList>
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
  overflow-y: hidden;
}

.user-feedback {
  display: grid;
  place-content: center;
  flex: 70%;
}
</style>
