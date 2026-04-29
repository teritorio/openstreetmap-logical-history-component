<script setup lang="ts">
import type { GroupSlotProps, ObjectDetailSlotProps } from '@/types'
import { inject, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import LoChaGroup from '@/components/LoCha/LoChaGroup.vue'
import { loChaColors } from '@/composables/useLoCha'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY } from '@/constants/injectionKeys'
import { scrollToSection } from '@/utils/scrollToSection'

const props = defineProps<{
  hash?: string
}>()

defineSlots<{
  'object-detail'?: (props: ObjectDetailSlotProps) => void
  'header-center'?: (props: GroupSlotProps) => void
  'header-end'?: (props: GroupSlotProps) => void
  'content-start'?: (props: GroupSlotProps) => void
}>()

const { groups } = inject(LOCHA_KEY)!
const instanceId = inject(LOCHA_INSTANCE_ID_KEY)!
const highlightBorderColor = loChaColors.delete
const currentHash = ref<string>()
const listRef = useTemplateRef<HTMLElement>('listRef')

function groupId(index: number): string {
  return `locha-${instanceId}-group-${index}`
}

function josmTargetName(): string {
  return `hidden_josm_target_${instanceId}`
}

let internalNavigation = false

function navigateToHash(hash: string) {
  if (currentHash.value === hash) {
    internalNavigation = true
    currentHash.value = undefined
    history.replaceState(null, '', `${location.pathname}${location.search}`)
    window.dispatchEvent(new CustomEvent('locha-navigate', { detail: { hash: undefined, instanceId } }))
    nextTick(() => {
      internalNavigation = false
    })
    return
  }
  internalNavigation = true
  currentHash.value = hash
  history.replaceState(null, '', hash)
  window.dispatchEvent(new CustomEvent('locha-navigate', { detail: { hash, instanceId } }))
  nextTick(() => {
    internalNavigation = false
    scrollToSection(hash, { container: listRef.value ?? undefined })
  })
}

function handleExternalNavigate(e: Event) {
  const { instanceId: sourceId } = (e as CustomEvent<{ hash: string | undefined, instanceId: string }>).detail
  if (sourceId !== instanceId) {
    currentHash.value = undefined
  }
}

watch(() => props.hash, (newValue) => {
  if (internalNavigation)
    return
  currentHash.value = newValue
  if (newValue) {
    nextTick(() => scrollToSection(newValue, { container: listRef.value ?? undefined }))
  }
}, {
  immediate: true,
})

onMounted(() => {
  window.addEventListener('locha-navigate', handleExternalNavigate)
  const hash = window.location.hash
  if (hash && !props.hash) {
    navigateToHash(hash)
  }
})

onUnmounted(() => {
  window.removeEventListener('locha-navigate', handleExternalNavigate)
})
</script>

<template>
  <div ref="listRef" class="locha-group-list">
    <ul>
      <li v-for="(group, index) in groups" :key="index" :class="{ selected: currentHash === `#${groupId(index)}` }">
        <LoChaGroup :id="groupId(index)" :features="group" :index="index" :josm-target="josmTargetName()" @navigate="navigateToHash">
          <template v-if="$slots['object-detail']" #object-detail="slotProps">
            <slot name="object-detail" v-bind="slotProps" />
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
        </LoChaGroup>
      </li>
    </ul>
    <iframe :name="josmTargetName()" style="display: none" />
  </div>
</template>

<style lang="css" scoped>
.locha-group-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.locha-group-list > ul {
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

.locha-group-list > ul::-webkit-scrollbar {
  width: 12px;
  background: transparent;
}

.locha-group-list > ul::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.locha-group-list > ul > li.selected .locha-group {
  border-color: v-bind(highlightBorderColor);
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
