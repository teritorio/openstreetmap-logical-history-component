<script setup lang="ts">
import type { ApiLink, IFeature, TagsDiffSlotProps } from '@/types'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import VMap from '@/components/VMap.vue'
import { useLoCha } from '@/composables/useLoCha'

const props = defineProps<{
  linkId: number
  features: IFeature[]
}>()

defineSlots<{ 'tags-diff': (props: TagsDiffSlotProps) => void }>()

const { loCha, getBeforeFeatures, getAfterFeatures } = useLoCha()

if (!loCha.value)
  throw new Error('LoCha is empty.')

function getDiffs(
  feature: IFeature,
): ApiLink[] | undefined {
  if (feature.properties.is_before) {
    const link = loCha.value!.metadata.links[props.linkId].find(link => link.before === feature.id || link.after === feature.id)
    return link && [link]
  }

  return loCha.value!.metadata.links[props.linkId].filter(link => link.before === feature.id || link.after === feature.id)
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
              <template v-for="(link, i) in getDiffs(feature)" :key="i">
                <slot
                  name="tags-diff"
                  :date="feature.properties.created"
                  :diff="link.diff_tags"
                  :src="feature.properties"
                  :reason="link.conflation_reason"
                />
              </template>
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
              <template v-for="(link, i) in getDiffs(feature)" :key="i">
                <slot
                  name="tags-diff"
                  :date="feature.properties.created"
                  :title="getTagsTitle(link)"
                  :diff="link.diff_tags"
                  :reason="link.conflation_reason"
                  :dst="feature.properties"
                  :src="getBeforeProperties(link)"
                />
              </template>
            </template>
          </LoChaObject>
        </li>
      </ul>
    </div>
    <VMap :id="linkId" :features="features" :bbox="loCha?.bbox" />
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
