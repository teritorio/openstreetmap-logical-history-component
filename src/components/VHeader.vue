<script setup lang="ts">
import { Dialog } from '@ark-ui/vue'
import { onMounted, shallowRef } from 'vue'
import VDialog from './VDialog.vue'

const showDialog = shallowRef(true)

onMounted(() => {
  if (localStorage.getItem('seenDialog')) {
    showDialog.value = false
  }
  else {
    localStorage.setItem('seenDialog', 'true')
  }
})
</script>

<template>
  <Dialog.Root v-model:open="showDialog">
    <header>
      <img src="/teritorio.png" alt="Logo Teritorio">
      <h1>OpenStreetMap Logical History</h1>
      <Dialog.Trigger class="info-button">
        &#x1f6c8; How it works?
      </Dialog.Trigger>
    </header>
    <VDialog v-if="showDialog" />
  </Dialog.Root>
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
  font-size: var(--text-xl);
  background: none;
  border: none;
  color: var(--color-primary-fg);
  padding: var(--space-2);
  cursor: pointer;
  line-height: 1;
}
</style>
