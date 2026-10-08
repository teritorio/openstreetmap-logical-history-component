<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import VDialog from './VDialog.vue'

const showDialog = shallowRef(true)

onMounted(() => {
  const hasSeenDialog = localStorage.getItem('seenDialog')

  if (!hasSeenDialog) {
    localStorage.setItem('seenDialog', 'true')
  }
  else {
    showDialog.value = false
  }
})
</script>

<template>
  <header>
    <img src="/teritorio.png" alt="Logo Teritorio">
    <h1>OpenStreetMap Logical History</h1>
    <button class="info-button" @click="showDialog = true">
      &#x1f6c8; How it works ?
    </button>
  </header>
  <VDialog v-if="showDialog" @close="showDialog = false" />
</template>

<style lang="css" scoped>
header {
  background-color: var(--color-primary);
  color: var(--color-primary-fg);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  box-shadow: var(--shadow-sm);
  width: 100%;
}

img {
  height: 40px;
  width: 40px;
}

.info-button {
  margin-left: auto;
  font-size: var(--text-lg);
  background: none;
  border: none;
  color: var(--color-primary-fg);
  padding: var(--space-2);
  cursor: pointer;
  line-height: 1;
}
</style>
