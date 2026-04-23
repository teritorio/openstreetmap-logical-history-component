<script setup lang="ts">
import type { GroupSlotProps, LoChaGroup, ObjectDetailSlotProps } from '@/types'
import { computed, inject, useSlots } from 'vue'
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
  'object-detail'?: (props: ObjectDetailSlotProps) => void
  'header-center'?: (props: GroupSlotProps) => void
  'header-end'?: (props: GroupSlotProps) => void
  'content-start'?: (props: GroupSlotProps) => void
}>()

const runtimeSlots = useSlots()
const gridColumns = computed(() => runtimeSlots['content-start'] ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)')

const instanceId = inject(LOCHA_INSTANCE_ID_KEY)!

const { loCha, getBeforeFeatures, getAfterFeatures } = inject(LOCHA_KEY)!

if (!loCha.value)
  throw new Error('LoCha is empty.')

const groupName = computed(() => {
  const beforeNames = [...new Set(getBeforeFeatures(props.features).map(f => f.properties.tags?.name).filter(Boolean))]
  const afterNames = [...new Set(getAfterFeatures(props.features).map(f => f.properties.tags?.name).filter(Boolean))]

  const beforeLabel = beforeNames.length > 0 ? beforeNames.join(', ') : '(unnamed)'
  const afterLabel = afterNames.length > 0 ? afterNames.join(', ') : '(unnamed)'

  if (beforeLabel === afterLabel)
    return beforeLabel

  return `${beforeLabel} → ${afterLabel}`
})
</script>

<template>
  <div :id="id" class="locha-group">
    <div class="group-header">
      <a class="anchor-button" :href="`#${id}`" @click.prevent="$emit('navigate', `#${id}`)">🔗</a>
      <h3 class="group-name">
        {{ groupName }}
      </h3>
      <div class="header-center">
        <slot name="header-center" :index="index" />
      </div>
      <div v-if="$slots['header-end']" class="header-end">
        <slot name="header-end" :index="index" />
      </div>
    </div>
    <div class="group-content">
      <div v-if="$slots['content-start']" class="content-start">
        <slot name="content-start" :index="index" />
      </div>
      <div class="before-list">
        <ul>
          <li
            v-for="feature in getBeforeFeatures(features)"
            :key="feature.id"
          >
            <LoChaObject :feature="feature" :josm-target="josmTarget">
              <template v-if="$slots['object-detail']" #object-detail>
                <slot name="object-detail" :feature="feature" :index="index" />
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
              <template v-if="$slots['object-detail']" #object-detail>
                <slot name="object-detail" :feature="feature" :index="index" />
              </template>
            </LoChaObject>
          </li>
        </ul>
      </div>
      <VMap :id="`${instanceId}-${props.index}`" :features="features" :bbox="loCha?.bbox" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.locha-group {
  border: 2px solid #cecece;
  background-color: #ffffff;
}

.group-content {
  display: grid;
  grid-template-columns: v-bind(gridColumns);
  gap: 1rem;
  padding: 0.5rem;
}

.group-header {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  background-color: #f0f0f2;
  padding: 0.5rem;
  border-bottom: 1px solid #cecece;
}

.group-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.anchor-button {
  border: 2px solid #cecece;
  background-color: #ffffff;
  text-decoration: none;
  padding: 0.25rem;
}

.header-center {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  place-content: center;
  gap: 0.3em;
}

.v-map {
  border: 1px solid #000000;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 0;
}
</style>
