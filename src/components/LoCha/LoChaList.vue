<script setup lang="ts">
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { useLoCha } from '@/composables/useLoCha'
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{
  features: GeoJSON.Feature[]
  title: string
}>()

const lochaListRef = ref<HTMLUListElement | null>(null)
const { selectedFeatures } = useLoCha()

// TODO: Remove once n+n compatibility is handled
watch(selectedFeatures, (newValue) => {
  if (newValue)
    nextTick(() => scrollToFeature())
})

// TODO: Remove this feature
// We better reorganize list items for a better n+n compatibility
function scrollToFeature() {
  selectedFeatures.value?.forEach((selectedF) => {
    const index = props.features.findIndex(f => f.id === selectedF.id)

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
    <iframe name="hidden_josm_target" style="display: none" />
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
