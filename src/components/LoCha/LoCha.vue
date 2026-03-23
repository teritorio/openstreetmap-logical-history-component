<script setup lang="ts">
import type { ApiResponse } from '@/types'
import { provide, watch } from 'vue'
import LoChaGroupList from '@/components/LoCha/LoChaGroupList.vue'
import { useLoCha } from '@/composables/useLoCha'
import { REASON_COLLAPSED_KEY } from '@/constants/injectionKeys'

const props = withDefaults(defineProps<{
  data?: ApiResponse
  reasonCollapsed?: boolean
}>(), {
  reasonCollapsed: true,
})

provide(REASON_COLLAPSED_KEY, props.reasonCollapsed)

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
    <LoChaGroupList v-else>
      <template #tags-diff="slotProps">
        <slot name="tags-diff" v-bind="slotProps" />
      </template>
    </LoChaGroupList>
  </section>
</template>

<style lang="css" scoped>
.locha {
  display: flex;
  flex-direction: column;
  background-color: #f4f4f4;
  height: inherit;
}

.locha-group-list {
  overflow-y: hidden;
}

.user-feedback {
  display: grid;
  place-content: center;
  flex: 70%;
}
</style>
