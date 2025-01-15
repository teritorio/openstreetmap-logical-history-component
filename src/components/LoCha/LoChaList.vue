<script setup lang="ts">
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { useLoCha } from '@/composables/useLoCha'
import { ref, watch } from 'vue'

const props = defineProps<{
  features: GeoJSON.Feature[]
  title: string
}>()

const lochaListRef = ref<HTMLUListElement | null>(null)
const { selectedFeatures } = useLoCha()

watch(selectedFeatures, (newValue) => {
  if (newValue)
    scrollToFeature()
})

function scrollToFeature() {
  selectedFeatures.value?.forEach((selectedF) => {
    const index = props.features.findIndex(f => f.id?.toString() === selectedF.id?.toString())

    if (index > -1 && lochaListRef.value) {
      const targetItem = lochaListRef.value.children[index]
      if (targetItem) {
        targetItem.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }
  })
}
</script>

<template>
  <div class="locha-list">
    <h2>{{ title }}</h2>
    <ul ref="lochaListRef" class="locha-list">
      <li
        v-for="feature in features"
        :key="feature.id"
      >
        <LoChaObject :feature="feature" />
      </li>
    </ul>
  </div>
</template>

<style lang="css" scoped>
ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
