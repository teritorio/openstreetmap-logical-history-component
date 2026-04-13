<script setup lang="ts">
import type { LinkMetadataSlotProps, LoChaData, TagsDiffSlotProps } from '@/types'
import { provide, useId, watch } from 'vue'
import LoChaGroupList from '@/components/LoCha/LoChaGroupList.vue'
import { useLoCha } from '@/composables/useLoCha'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY, REASON_COLLAPSED_KEY } from '@/constants/injectionKeys'

const props = withDefaults(defineProps<{
  data?: LoChaData
  reasonCollapsed?: boolean
  hash?: string
}>(), {
  reasonCollapsed: true,
})

defineSlots<{
  'tags-diff': (props: TagsDiffSlotProps) => void
  'link-metadata': (props: LinkMetadataSlotProps) => void
}>()

const instanceId = useId()

provide(REASON_COLLAPSED_KEY, props.reasonCollapsed)
provide(LOCHA_INSTANCE_ID_KEY, instanceId)

const loChaInstance = useLoCha()
provide(LOCHA_KEY, loChaInstance)

const {
  featureCount,
  setLoCha,
} = loChaInstance

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
    <LoChaGroupList v-else :hash="hash">
      <template #tags-diff="slotProps">
        <slot name="tags-diff" v-bind="slotProps" />
      </template>
      <template #link-metadata="slotProps">
        <slot name="link-metadata" v-bind="slotProps" />
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
