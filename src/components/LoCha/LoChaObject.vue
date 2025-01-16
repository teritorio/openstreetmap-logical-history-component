<script setup lang="ts">
import { loChaColors, loChaStatus, useLoCha } from '@/composables/useLoCha'
import { computed } from 'vue'

const props = defineProps<{
  feature: GeoJSON.Feature
}>()

if (!props.feature.id)
  throw new Error(`Feature ID is missing.`)

if (!props.feature.properties)
  throw new Error(`Feature ${props.feature.id} has no properties.`)

const status = computed(() => {
  if (props.feature.properties!.is_created) {
    return loChaStatus.create
  }

  if (props.feature.properties!.is_deleted) {
    return loChaStatus.delete
  }

  if (props.feature.properties!.is_before) {
    return loChaStatus.updateBefore
  }

  return loChaStatus.updateAfter
})

const name = computed(() => {
  const content = props.feature.properties!.tags.name || ''

  switch (status.value) {
    case 'create':
      return `\u2795 ${content}`
    case 'delete':
      return `\u2716 ${content}`
    case 'updateAfter':
    case 'updateBefore':
    default:
      return `\u{1F503} ${content}`
  }
})

const color = computed(() => loChaColors[status.value])

const { selectedLink } = useLoCha()
const style = computed(() => {
  if (!selectedLink.value)
    return

  return {
    opacity: selectedLink.value.id.includes(props.feature.id!.toString()) ? 1 : 0.3,
  }
})

const { showLink, resetLink } = useLoCha()
function handleClick(id?: string) {
  if (!id)
    throw new Error('Object not found')

  selectedLink.value?.id.includes(id)
    ? resetLink()
    : showLink(id, status.value)
}
</script>

<template>
  <article :style="style" class="locha-object" @click="handleClick(feature.id?.toString())">
    <header>
      <h3>{{ name }}</h3>
      <a>{{ feature.id }}</a>
    </header>
  </article>
</template>

<style lang="css" scoped>
header {
  border: 2px solid v-bind(color);
  background-color: color-mix(in srgb, v-bind(color) 20%, white 80%);
}

article:hover {
  cursor: pointer;
}
</style>
