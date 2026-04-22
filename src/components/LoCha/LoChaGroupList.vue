<script setup lang="ts">
import type { LinkMetadataSlotProps, TagsDiffSlotProps } from '@/types'
import { inject, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import LoChaGroup from '@/components/LoCha/LoChaGroup.vue'
import { loChaColors } from '@/composables/useLoCha'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY } from '@/constants/injectionKeys'
import { scrollToSection } from '@/utils/scrollToSection'

const props = defineProps<{
  hash?: string
}>()

defineSlots<{
  'tags-diff': (props: TagsDiffSlotProps) => void
  'link-metadata': (props: LinkMetadataSlotProps) => void
  'group-actions': (props: LinkMetadataSlotProps) => void
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

function navigateToHash(hash: string) {
  currentHash.value = hash
  history.replaceState(null, '', hash)
  nextTick(() => scrollToSection(hash, { container: listRef.value ?? undefined }))
}

function onAnchorClick(event: Event, index: number) {
  event.preventDefault()
  navigateToHash(`#${groupId(index)}`)
}

watch(() => props.hash, (newValue) => {
  currentHash.value = newValue
  if (newValue) {
    nextTick(() => scrollToSection(newValue, { container: listRef.value ?? undefined }))
  }
}, {
  immediate: true,
})

onMounted(() => {
  const hash = window.location.hash
  if (hash && !props.hash) {
    navigateToHash(hash)
  }
})
</script>

<template>
  <div ref="listRef" class="locha-group-list">
    <ul>
      <li v-for="(group, index) in groups" :key="index" :class="{ selected: currentHash === `#${groupId(index)}` }">
        <a class="anchor-button" :href="`#${groupId(index)}`" @click="onAnchorClick($event, index)">🔗</a>
        <LoChaGroup :id="groupId(index)" :features="group" :index="index" :josm-target="josmTargetName()">
          <template #tags-diff="slotProps">
            <slot name="tags-diff" v-bind="slotProps" />
          </template>
          <template #link-metadata="slotProps">
            <slot name="link-metadata" v-bind="slotProps" />
          </template>
          <template #group-actions="slotProps">
            <slot name="group-actions" v-bind="slotProps" />
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
  padding: 1rem;
}

.locha-group-list > ul {
  overflow-y: auto;
  margin-right: -12px;
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

.locha-group-list > ul > li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.locha-group-list > ul > li.selected .locha-group {
  border-color: v-bind(highlightBorderColor);
}

.locha-group-list > ul > li > div {
  flex: 1;
  min-width: 0;
}

.anchor-button {
  border: 2px solid #cecece;
  background-color: #ffffff;
  text-decoration: none;
  padding: 0.25rem;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
