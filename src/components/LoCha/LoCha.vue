<script setup lang="ts">
import type { GroupSlotProps, LoChaData, ObjectDetailSlotProps } from '@/types'
import { computed, provide, watch } from 'vue'
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
  'object-detail'?: (props: ObjectDetailSlotProps) => void
  'header-start-end'?: (props: GroupSlotProps) => void
  'header-center'?: (props: GroupSlotProps) => void
  'header-end'?: (props: GroupSlotProps) => void
  'content-start'?: (props: GroupSlotProps) => void
}>()

provide(REASON_COLLAPSED_KEY, props.reasonCollapsed)
provide(LOCHA_INSTANCE_ID_KEY, props.id)
provide(MAP_STYLE_URL_KEY, props.mapStyleUrl)

const loChaInstance = useLoCha()
provide(LOCHA_KEY, loChaInstance)

const {
  featureCount,
  groups,
  setLoCha,
  resetLoCha,
} = loChaInstance

const isSingle = computed(() => groups.value.length === 1)

watch(() => props.data, (newValue) => {
  if (newValue) {
    setLoCha(newValue)
  }
  else {
    resetLoCha()
  }
}, { immediate: true })
</script>

<template>
  <section class="locha" :class="{ 'locha--single': isSingle }">
    <p v-if="!featureCount" class="user-feedback">
      ⚠️ No data
    </p>
    <LoChaGroupList v-else :hash="hash">
      <template v-if="$slots['object-detail']" #object-detail="slotProps">
        <slot name="object-detail" v-bind="slotProps" />
      </template>
      <template v-if="$slots['header-start-end']" #header-start-end="slotProps">
        <slot name="header-start-end" v-bind="slotProps" />
      </template>
      <template v-if="$slots['header-center']" #header-center="slotProps">
        <slot name="header-center" v-bind="slotProps" />
      </template>
      <template v-if="$slots['header-end']" #header-end="slotProps">
        <slot name="header-end" v-bind="slotProps" />
      </template>
      <template v-if="$slots['content-start']" #content-start="slotProps">
        <slot name="content-start" v-bind="slotProps" />
      </template>
    </LoChaGroupList>
  </section>
</template>

<style lang="css" scoped>
.locha {
  display: flex;
  flex-direction: column;
  height: inherit;
  padding: 1rem;
}

.locha--single {
  padding: 0;
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
