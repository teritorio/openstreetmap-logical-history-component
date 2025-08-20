<script setup lang="ts">
import type { IFeature } from '@/composables/useApi'
// import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import { useLoCha } from '@/composables/useLoCha'

const { groups, selectedGroupId } = useLoCha()

function getBeforeFeatures(features: IFeature[]) {
  return features.filter(feature => feature.properties.is_deleted || feature.properties.is_before)
}

function getAfterFeatures(features: IFeature[]) {
  return features.filter(feature => feature.properties.is_created || feature.properties.is_after)
}
</script>

<template>
  <div class="locha-list">
    <header>
      <h2>Before</h2>
      <h2>After</h2>
    </header>
    <ul>
      <li v-for="(group, index) in groups" :key="index" :class="{ selected: selectedGroupId === index }">
        <div class="before-list">
          <ul>
            <li
              v-for="feature in getBeforeFeatures(group)"
              :key="feature.id"
            >
              <LoChaObject :feature="feature" :is-selected="selectedGroupId === index " />
            </li>
          </ul>
        </div>
        <div class="after-list">
          <ul>
            <li
              v-for="feature in getAfterFeatures(group)"
              :key="feature.id"
            >
              <LoChaObject :feature="feature" :is-selected="selectedGroupId === index " />
            </li>
          </ul>
        </div>
        <!-- <LoChaDiff /> -->
      </li>
    </ul>
    <iframe name="hidden_josm_target" style="display: none" />
  </div>
</template>

<style lang="css" scoped>
.locha-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.locha-list > ul {
  overflow-y: scroll;
}

.locha-list > ul > li {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  border: 2px solid #cecece;
  padding: 8px;
  background-color: #ffffff;
  opacity: 0.5;
}

.locha-list > ul > li.selected {
  opacity: 1;
}

.locha-list > ul > li > div {
  place-content: center;
}

.locha-list header {
  display: flex;
}

.locha-list header h2 {
  flex: 50%;
  text-align: center;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
