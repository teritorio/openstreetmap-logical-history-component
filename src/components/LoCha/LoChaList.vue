<script setup lang="ts">
import type { IFeature } from '@/composables/useApi'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { ref } from 'vue'

defineProps<{
  features: IFeature[]
  title: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const lochaListRef = ref<HTMLUListElement | null>(null)
function scrollToTop() {
  if (lochaListRef.value) {
    lochaListRef.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

defineExpose({ scrollToTop })
</script>

<template>
  <div class="locha-list">
    <h2>{{ title }}</h2>
    <ul ref="lochaListRef" class="locha-list">
      <li
        v-for="feature in features"
        :key="feature.id"
      >
        <LoChaObject :feature="feature" @click="emit('click')" />
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
