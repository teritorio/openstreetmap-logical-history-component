<script setup lang="ts">
import type { ApiResponse, TagsDiffSlotProps } from '@/types'
import { provide, watch } from 'vue'
import LoChaGroupList from '@/components/LoCha/LoChaGroupList.vue'
import { useLoCha } from '@/composables/useLoCha'
import { REASON_COLLAPSED_KEY } from '@/constants/injectionKeys'

const props = withDefaults(defineProps<{
  data?: ApiResponse
  reasonCollapsed?: boolean
  hash?: string
  dateStart?: string
  dateEnd?: string
}>(), {
  reasonCollapsed: true,
})

defineSlots<{ 'tags-diff': (props: TagsDiffSlotProps) => void }>()

provide(REASON_COLLAPSED_KEY, props.reasonCollapsed)

const {
  featureCount,
  setLoCha,
} = useLoCha()

watch(() => props.data, (newValue) => {
  if (newValue) {
    setLoCha(newValue)
  }
}, { immediate: true })
</script>

<template>
  <section class="locha">
    <p v-if="!featureCount" class="user-feedback">
      ⚠️ No data
    </p>
    <LoChaGroupList v-else :hash="hash" :date-start="dateStart" :date-end="dateEnd">
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
