<script setup lang="ts">
import { loChaColors, loChaStatus } from '@/composables/useLoCha'
import { computed } from 'vue'

const props = defineProps<{
  feature: GeoJSON.Feature
}>()

if (!props.feature.properties)
  throw new Error(`Feature ${props.feature.id} has no properties.`)

const status = computed(() => {
  if (props.feature.properties!.is_created) {
    return loChaStatus.create
  }

  if (props.feature.properties!.is_deleted) {
    return loChaStatus.delete
  }

  return loChaStatus.update
})

const title = computed(() => {
  const content = `${props.feature.properties!.objtype}-${props.feature.properties!.id}-v${props.feature.properties!.version}`

  switch (status.value) {
    case 'create':
      return `\u2795 ${content}`
    case 'delete':
      return `\u2716 ${content}`
    case 'update':
    default:
      return `\u{1F503} ${content}`
  }
})

const color = computed(() => loChaColors[status.value])
</script>

<template>
  <article>
    <h3>{{ title }}</h3>
  </article>
</template>

<style lang="css" scoped>
h3 {
  border: 2px solid v-bind(color);
  background-color: color-mix(in srgb, v-bind(color) 20%, white 80%);
}
</style>
