<script setup lang="ts">
import type { IFeature } from '@/composables/useApi'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import VMap from '@/components/VMap.vue'
import { useLoCha } from '@/composables/useLoCha'
import LoChaDiff from './LoChaDiff.vue'

const { groups, selectedGroupId, loCha } = useLoCha()

if (!loCha.value)
  throw new Error('LoCha is empty.')

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
      <li v-for="(group, index) in groups" :key="index">
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
        <LoChaDiff :links="loCha!.metadata.links[index]" />
        <!-- <div class="locha-diff">
          <slot name="locha-diff" />
        </div> -->
        <VMap :id="index" :features="group" :bbox="loCha?.bbox" />
      </li>
    </ul>
    <iframe name="hidden_josm_target" style="display: none" />
  </div>
</template>

<style lang="css" scoped>
.locha-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr;
  gap: 1rem;
  padding: 1rem;
}

.locha-list header {
  grid-row: 1;
  grid-column: 1 / 3;
  display: flex;
  gap: 1rem;
}

.locha-list > ul {
  grid-row: 2;
  grid-column: 1 / 4;
  overflow-y: auto;
  margin-right: -12px;
}

.locha-list > ul::-webkit-scrollbar {
  width: 12px;
  background: transparent;
}

.locha-list > ul::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.locha-list > ul > li {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 1rem;
  border: 2px solid #cecece;
  background-color: #ffffff;
}

.locha-list > ul > li > div {
  padding: 8px;
}

.before-list {
  grid-column: 1;
  grid-row: 1;
}

.after-list {
  grid-column: 2;
  grid-row: 1;
}

.v-map {
  grid-column: 3;
  grid-row: 1 / 3;
  place-self: center;
}

.locha-diff {
  grid-column: 1 / 3;
  grid-row: 2;
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
