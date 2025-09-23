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
  return features.filter(feature => feature.properties.is_before)
}

function getAfterFeatures(features: IFeature[]) {
  return features.filter(feature => feature.properties.is_after)
}

function getDiffs(
  feature: IFeature,
  index: number,
): ApiLink[] | undefined {
  if (feature.properties.is_before)
    return undefined

  return loCha.value!.metadata.links[index].filter(link => link.before === feature.id || link.after === feature.id)
}

function getBeforeProperties(link: ApiLink): IFeature['properties'] | undefined {
  return loCha.value!.features.find(feature => feature.id === link!.before)?.properties
}

function getTagsTitle(link: ApiLink): string {
  let title = ''

  const beforeFeature = loCha.value!.features.find(feature => feature.id === link!.before)

  if (beforeFeature)
    title = `${beforeFeature.properties.objtype[0]}${beforeFeature.properties.id}-v${beforeFeature.properties.version}`

  return title
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
              <slot
                v-for="(link, i) in getDiffs(feature, index)"
                :key="i"
                name="tags-diff"
                :date="feature.properties.created"
                :diff="link.diff_tags"
                :src="feature.properties"
              />
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
              <slot
                v-for="(link, i) in getDiffs(feature, index)"
                :key="i"
                name="tags-diff"
                :date="feature.properties.created"
                :title="getTagsTitle(link)"
                :diff="link.diff_tags"
                :attribs="link.diff_attribs"
                :dst="feature.properties"
                :src="getBeforeProperties(link)"
              />
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
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
