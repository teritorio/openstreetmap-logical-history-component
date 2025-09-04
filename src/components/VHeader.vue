<script setup lang="ts">
const emit = defineEmits<{
  (e: 'toggleMenu'): void
}>()
</script>

<template>
  <header>
    <button class="toggle-button" @click="emit('toggleMenu')">
      ☰
    </button>
    <img src="/teritorio.png" alt="Logo Teritorio">
    <h1>OSM LoCha UI Component</h1>
  </header>
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

.toggle-button {
  background: none;
  border: none;
  color: #fff;
  padding: 0.5em;
  cursor: pointer;
  height: 48px;
  width: 48px;
  font-size: 1.5em;
}
</style>
