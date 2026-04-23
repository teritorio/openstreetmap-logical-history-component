<script setup lang="ts">
import type { ChangesetsSlotProps, LinkMetadataSlotProps, LoChaData, TagsDiffSlotProps } from '@/types'
import { provide, watch } from 'vue'
import LoChaGroupList from '@/components/LoCha/LoChaGroupList.vue'
import { useLoCha } from '@/composables/useLoCha'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY, MAP_STYLE_URL_KEY, REASON_COLLAPSED_KEY } from '@/constants/injectionKeys'
import { MAP_STYLE_URL } from '@/constants/map'

const props = withDefaults(defineProps<{
  id: string
  data?: LoChaData
  mapStyleUrl?: string
  reasonCollapsed?: boolean
  hash?: string
}>(), {
  mapStyleUrl: MAP_STYLE_URL,
  reasonCollapsed: true,
})

defineSlots<{
  'tags-diff': (props: TagsDiffSlotProps) => void
  'link-metadata': (props: LinkMetadataSlotProps) => void
  'group-actions': (props: LinkMetadataSlotProps) => void
  'changesets': (props: ChangesetsSlotProps) => void
}>()

provide(REASON_COLLAPSED_KEY, props.reasonCollapsed)
provide(LOCHA_INSTANCE_ID_KEY, props.id)
provide(MAP_STYLE_URL_KEY, props.mapStyleUrl)

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
      <template #group-actions="slotProps">
        <slot name="group-actions" v-bind="slotProps" />
      </template>
      <template v-if="$slots.changesets" #changesets="slotProps">
        <slot name="changesets" v-bind="slotProps" />
      </template>
    </LoChaGroupList>
  </section>
</template>

<style lang="css" scoped>
.locha {
  display: flex;
  flex-direction: column;
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
