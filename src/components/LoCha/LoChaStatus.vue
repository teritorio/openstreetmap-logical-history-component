<script setup lang="ts">
import { loChaStatus, useLoCha } from '@/composables/useLoCha'
import { computed } from 'vue'

const { featureAfter, featureBefore, status } = useLoCha()

const titleContent = computed(() => {
  const afterTitle = `${featureAfter.value?.properties?.objtype}-${featureAfter.value?.properties?.id}-v${featureAfter.value?.properties?.version}`
  const beforeTitle = `${featureBefore.value?.properties?.objtype}-${featureBefore.value?.properties?.id}-v${featureBefore.value?.properties?.version}`

  switch (status.value) {
    case loChaStatus.create:
      return `\u2795 ${afterTitle}`
    case loChaStatus.delete:
      return `\u2716 ${beforeTitle}`
    case loChaStatus.update:
    default:
      return `\u{1F503} ${beforeTitle} > ${afterTitle}`
  }
})
</script>

<template>
  <h2 class="locha-status">
    {{ titleContent }}
  </h2>
</template>

<style lang="css" scoped>
h2 {
  font-size: 18px;
  margin: 0;
}
</style>
