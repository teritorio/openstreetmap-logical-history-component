<script setup lang="ts">
import LoChaControls from '@/components/LoCha/LoChaControls.vue'
import LoChaStatus from '@/components/LoCha/LoChaStatus.vue'
import { useLoCha } from '@/composables/useLoCha'

const { color } = useLoCha()
</script>

<template>
  <header class="locha-header">
    <LoChaStatus />
    <LoChaControls />
  </header>
</template>

<style lang="css" scoped>
header {
  display: grid;
  align-items: center;
  gap: 8px;
  grid-template-columns: auto auto 1fr;
  border: 4px solid v-bind(color);
  background-color: color-mix(in srgb, v-bind(color) 20%, white 80%);
  padding: 4px 8px;
}
</style>
