<script setup lang="ts">
import type { ApiResponse } from '@/composables/useApi'
import LoChaList from '@/components/LoCha/LoChaList.vue'
import { useLoCha } from '@/composables/useLoCha'
import { watchEffect } from 'vue'

const props = defineProps<{
  data?: ApiResponse
}>()

const {
  afterFeatures,
  beforeFeatures,
  featureCount,
  linkCount,
  setLoCha,
} = useLoCha()

watchEffect(() => {
  if (props.data) {
    setLoCha(props.data)
  }
})
</script>

<template>
  <section class="locha">
    <p v-if="!featureCount || !linkCount" class="user-feedback">
      ⚠️ No data
    </p>
    <div v-else class="locha-content">
      <LoChaList :features="beforeFeatures" title="Before" />
      <LoChaList :features="afterFeatures" title="After" />
    </div>
  </section>
</template>

<style lang="css" scoped>
.locha {
  display: flex;
  flex-direction: column;
  background-color: #f4f4f4;
  padding: 2em;
  height: inherit;
}

.locha-content {
  display: flex;
  gap: 1em;
  overflow: hidden;
}

.locha-content > div {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.locha-content > div:deep(ul) {
  overflow-y: auto;
}

.user-feedback {
  display: grid;
  place-content: center;
  height: 100%;
}
</style>
