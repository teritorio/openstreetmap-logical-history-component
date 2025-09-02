<script setup lang="ts">
import type { ApiLink, IFeature } from '@/composables/useApi'
import type { LoChaGroup } from '@/composables/useLoCha'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import VMap from '@/components/VMap.vue'
import { useLoCha } from '@/composables/useLoCha'

defineProps<{
  index: number
  features: LoChaGroup
}>()

const { loCha } = useLoCha()

if (!loCha.value)
  throw new Error('LoCha is empty.')

function getBeforeFeatures(features: IFeature[]) {
  return features.filter(feature => feature.properties.is_deleted || feature.properties.is_before)
}

function getAfterFeatures(features: IFeature[]) {
  return features.filter(feature => feature.properties.is_created || feature.properties.is_after)
}

function getLink(feature: IFeature, index: number, position: 'before' | 'after'): ApiLink | undefined {
  if (feature.properties.is_before)
    return undefined

  return loCha.value!.metadata.links[index].find(link => link[position] === feature.id)
}

function getBeforeFeature(id: number, index: number): IFeature | undefined {
  const link = loCha.value!.metadata.links[index].find(link => link.after === id)

  if (!link)
    throw new Error(`Link index ${index} for feature ${id} not found.`)

  return loCha.value!.features.find(feature => feature.id === link!.before)
}
</script>

<template>
  <div class="locha-group">
    <div class="before-list">
      <ul>
        <li
          v-for="feature in getBeforeFeatures(features)"
          :key="feature.id"
        >
          <LoChaObject :feature="feature">
            <template #tags-diff>
              <slot name="tags-diff" :link="getLink(feature, index, 'before')" />
            </template>
          </LoChaObject>
        </li>
      </ul>
    </div>
    <div class="after-list">
      <ul>
        <li
          v-for="feature in getAfterFeatures(features)"
          :key="feature.id"
        >
          <LoChaObject :feature="feature">
            <template #tags-diff>
              <slot name="tags-diff" :link="getLink(feature, index, 'after')" :before-feature="getBeforeFeature(feature.id, index)" />
            </template>
          </LoChaObject>
        </li>
      </ul>
    </div>
    <VMap :id="index" :features="features" :bbox="loCha?.bbox" />
  </div>
</template>

<style lang="css" scoped>
.locha-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  border: 2px solid #cecece;
  background-color: #ffffff;
  padding: 8px;
}

.before-list {
  grid-column: 1;
}

.after-list {
  grid-column: 2;
}

.v-map {
  grid-column: 3;
  place-self: center;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
