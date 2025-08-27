<script setup lang="ts">
import { useLoCha } from '@/composables/useLoCha'
import LoChaGroup from './LoChaGroup.vue'

const { groups } = useLoCha()
</script>

<template>
  <div class="locha-group-list">
    <header>
      <h2>Before</h2>
      <h2>After</h2>
    </header>
    <ul>
      <li v-for="(group, index) in groups" :key="index">
        <LoChaGroup :features="group" :index="index" />
      </li>
    </ul>
    <iframe name="hidden_josm_target" style="display: none" />
  </div>
</template>

<style lang="css" scoped>
.locha-group-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr;
  gap: 1rem;
  padding: 1rem;
}

.locha-group-list header {
  grid-row: 1;
  grid-column: 1 / 3;
  display: flex;
  gap: 1rem;
}

.locha-group-list header h2 {
  flex: 50%;
  text-align: center;
}

.locha-group-list > ul {
  grid-row: 2;
  grid-column: 1 / 4;
  overflow-y: auto;
  margin-right: -12px;
}

.locha-group-list > ul::-webkit-scrollbar {
  width: 12px;
  background: transparent;
}

.locha-group-list > ul::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
