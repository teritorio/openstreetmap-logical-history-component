<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import VDialog from './VDialog.vue'

const emit = defineEmits<{
  (e: 'toggleMenu'): void
}>()

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
    <button class="toggle-button" @click="emit('toggleMenu')">
      ☰
    </button>
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
  background-color: #082e4e;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
}

img {
  height: 40px;
  width: 40px;
}

.info-button {
  margin-left: auto;
  font-size: 1.25em;
}

.toggle-button {
  height: 48px;
  width: 48px;
  font-size: 1.5em;
}

.toggle-button,
.info-button {
  background: none;
  border: none;
  color: #fff;
  padding: 0.5em;
  cursor: pointer;
  line-height: 1;
}
</style>
