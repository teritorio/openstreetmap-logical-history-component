<script setup lang="ts">
import type { ApiLink, IFeature, LinkMetadataSlotProps, LoChaGroup, TagsDiffSlotProps } from '@/types'
import { inject } from 'vue'
import LoChaObject from '@/components/LoCha/LoChaObject.vue'
import VMap from '@/components/VMap.vue'
import { LOCHA_INSTANCE_ID_KEY, LOCHA_KEY } from '@/constants/injectionKeys'

const props = defineProps<{
  id: string
  index: number
  features: LoChaGroup
  josmTarget?: string
}>()

defineEmits<{
  navigate: [hash: string]
}>()

defineSlots<{
  'tags-diff': (props: TagsDiffSlotProps) => void
  'link-metadata': (props: LinkMetadataSlotProps) => void
  'group-actions': (props: LinkMetadataSlotProps) => void
}>()

const instanceId = inject(LOCHA_INSTANCE_ID_KEY)!

const { loCha, getBeforeFeatures, getAfterFeatures } = inject(LOCHA_KEY)!

if (!loCha.value)
  throw new Error('LoCha is empty.')

function getDiffs(
  feature: IFeature,
  index: number,
): ApiLink[] | undefined {
  if (feature.properties.is_before) {
    const link = loCha.value!.metadata.links[index].find(link => link.before === feature.id || link.after === feature.id)
    return link && [link]
  }

  return loCha.value!.metadata.links[index].filter(link => link.before === feature.id || link.after === feature.id)
}

function getBeforeProperties(link: ApiLink): IFeature['properties'] | undefined {
  return loCha.value!.features.find(feature => feature.id === link!.before)?.properties
}

function getTagsTitle(link: ApiLink): string {
  let title = ''

  const beforeFeature = loCha.value!.features.find(feature => feature.id === link!.before)

  if (beforeFeature)
    title = `${beforeFeature.properties.objtype}${beforeFeature.properties.id}-v${beforeFeature.properties.version}`

  return title
}
</script>

<template>
  <div :id="id" class="locha-group">
    <div class="group-header">
      <a class="anchor-button" :href="`#${id}`" @click.prevent="$emit('navigate', `#${id}`)">🔗</a>
      <div class="link-metadata">
        <slot name="link-metadata" :links="loCha!.metadata.links[index]" :index="index" />
      </div>
      <div v-if="$slots['group-actions']" class="group-actions">
        <slot name="group-actions" :links="loCha!.metadata.links[index]" :index="index" />
      </div>
    </div>
    <div class="before-list">
      <ul>
        <li
          v-for="feature in getBeforeFeatures(features)"
          :key="feature.id"
        >
          <LoChaObject :feature="feature" :josm-target="josmTarget">
            <template #tags-diff>
              <template v-for="(link, i) in getDiffs(feature, index)" :key="i">
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
          <LoChaObject :feature="feature" :josm-target="josmTarget">
            <template #tags-diff>
              <template v-for="(link, i) in getDiffs(feature, index)" :key="i">
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
    <VMap :id="`${instanceId}-${props.index}`" :features="features" :bbox="loCha?.bbox" />
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

.group-header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.anchor-button {
  border: 2px solid #cecece;
  background-color: #ffffff;
  text-decoration: none;
  padding: 0.25rem;
}

.link-metadata {
  flex: 1;
  min-width: 0;
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
