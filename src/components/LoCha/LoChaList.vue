<script setup lang="ts">
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { useLoCha } from '@/composables/useLoCha'

const emit = defineEmits<{
  (e: 'click'): void
}>()

const { beforeFeatures, afterFeatures, errorFeatures } = useLoCha()
</script>

<template>
  <div class="locha-list">
    <div class="before-list">
      <h2>Before</h2>
      <ul>
        <li
          v-for="feature in beforeFeatures"
          :key="feature.id"
        >
          <LoChaObject :feature="feature" @click="emit('click')" />
        </li>
      </ul>
    </div>
    <div class="after-list">
      <h2>After</h2>
      <ul>
        <li
          v-for="feature in afterFeatures"
          :key="feature.id"
        >
          <LoChaObject :feature="feature" @click="emit('click')" />
        </li>
      </ul>
    </div>
    <div class="error-list">
      <h2>Errors</h2>
      <ul>
        <li
          v-for="feature in errorFeatures"
          :key="feature.id"
        >
          <LoChaObject :feature="feature" />
        </li>
      </ul>
    </div>
    <iframe name="hidden_josm_target" style="display: none" />
  </div>
</template>

<style lang="css" scoped>
.locha-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.before-list {
  grid-column-start: 1;
}

.after-list {
  grid-column-start: 2;
}

.error-list {
  border-top: 2px solid #000000;
  grid-column: 1 / -1;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
