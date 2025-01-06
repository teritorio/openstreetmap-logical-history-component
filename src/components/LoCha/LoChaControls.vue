<script setup lang="ts">
import { useLoCha } from '@/composables/useLoCha'

const { counter, linkCount, updateCounter } = useLoCha()
</script>

<template>
  <aside v-if="linkCount" class="locha-controls">
    <button
      :disabled="counter === 0"
      @click="updateCounter(false)"
    >
      &#9664; Prev
    </button>
    |
    <button
      :disabled="counter === linkCount - 1"
      @click="updateCounter(true)"
    >
      Next &#9654;
    </button>
  </aside>
</template>

<style lang="css" scoped>
aside {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: flex-end;
  padding: 4px;
}
</style>
