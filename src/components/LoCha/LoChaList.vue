<script setup lang="ts">
import LoChaObject from '@/components/LoCha/LoChaObject.vue'

defineProps<{
  features: GeoJSON.Feature[]
  title: string
}>()
</script>

<template>
  <div>
    <h2>{{ title }}</h2>
    <ul class="locha-list">
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
