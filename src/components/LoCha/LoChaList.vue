<script setup lang="ts">
import type { IFeature } from '@/composables/useApi'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { useLoCha } from '@/composables/useLoCha'
import { ref, watch } from 'vue'

defineProps<{
  features: IFeature[]
  title: string
}>()

const { selectedFeatures } = useLoCha()

watch(selectedFeatures, (newValue) => {
  if (newValue.size)
    scrollToTop()
})

const lochaListRef = ref<HTMLUListElement | null>(null)
function scrollToTop() {
  if (lochaListRef.value) {
    lochaListRef.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
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
