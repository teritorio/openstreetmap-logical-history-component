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
const hasContentStart = computed(() => !!runtimeSlots['content-start'])
const gridColumns = computed(() => hasContentStart.value ? 'repeat(4, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))')
const newColumnStart = computed(() => hasContentStart.value ? 3 : 2)
const vmapColumnStart = computed(() => hasContentStart.value ? 4 : 3)

const instanceId = inject(LOCHA_INSTANCE_ID_KEY)!

const { loCha, getBeforeFeatures, getAfterFeatures } = inject(LOCHA_KEY)!

if (!loCha.value)
  throw new Error('LoCha is empty.')

const beforeFeatures = computed(() => getBeforeFeatures(props.features))
const afterFeatures = computed(() => getAfterFeatures(props.features))
const isSingleDelete = computed(() => beforeFeatures.value.length > 0 && afterFeatures.value.length === 0)
const isSingleNew = computed(() => beforeFeatures.value.length === 0 && afterFeatures.value.length > 0)
const isSingleDeletedUpdate = computed(() => beforeFeatures.value.length === 1 && afterFeatures.value.length === 1 && !!afterFeatures.value[0]?.properties.deleted)
const isSingleUpdate = computed(() => beforeFeatures.value.length === 1 && afterFeatures.value.length === 1 && !afterFeatures.value[0]?.properties.deleted)

function getBeforeFeaturesForAfter(afterFeature: IFeature): IFeature[] {
  const links = loCha.value?.metadata.links[props.index] ?? []
  const beforeIds = links
    .filter(link => link.after === afterFeature.id)
    .map(link => link.before)
    .filter(Boolean)
  return props.features.filter(f => beforeIds.includes(f.id as string))
}

const groupNameParts = computed(() => {
  const beforeNames = [...new Set(beforeFeatures.value.map(f => f.properties.tags?.name).filter(Boolean))]
  const afterNames = [...new Set(afterFeatures.value.map(f => f.properties.tags?.name).filter(Boolean))]

  const before = beforeNames.length > 0 ? beforeNames.join(', ') : null
  const after = afterNames.length > 0 ? afterNames.join(', ') : null

  if (before === after)
    return { before: null, after }

  return { before, after }
})

const groupNameTitle = computed(() => {
  const { before, after } = groupNameParts.value
  if (before && after)
    return `${before} → ${after}`
  return before ?? after ?? undefined
})
</script>

<template>
  <div :id="id" class="locha-group">
    <div class="group-header">
      <div class="header-start">
        <a class="anchor-button" :href="`#${id}`" @click.prevent="$emit('navigate', `#${id}`)">🔗</a>
        <h3 class="group-name" :title="groupNameTitle">
          <span v-if="groupNameParts.before" class="name-before">{{ groupNameParts.before }}</span>
          <span v-if="groupNameParts.before" class="name-separator"> → </span>
          <span v-if="groupNameParts.after" class="name-after">{{ groupNameParts.after }}</span>
        </h3>
      </div>
      <div class="header-center">
        <slot name="header-center" :index="index" />
      </div>
      <div class="header-end">
        <slot name="header-end" :index="index" />
      </div>
    </div>
    <div class="group-content">
      <div v-if="$slots['content-start']" class="content-start">
        <slot name="content-start" :index="index" />
      </div>
      <div v-if="!isSingleUpdate && !isSingleNew && !isSingleDeletedUpdate" class="before-list" :style="isSingleDelete ? { gridColumnStart: 2 } : {}">
        <ul>
          <li
            v-for="feature in beforeFeatures"
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
      <div v-if="!isSingleDelete" class="after-list" :class="{ 'list--wide': isSingleUpdate }" :style="isSingleNew ? { gridColumnStart: newColumnStart } : isSingleDeletedUpdate ? { gridColumnStart: 2 } : {}">
        <ul>
          <template v-if="isSingleDeletedUpdate">
            <li>
              <LoChaObject :feature="afterFeatures[0]!" :josm-target="josmTarget">
                <template #object-detail>
                  <slot name="object-detail" :feature="beforeFeatures[0]!" :index="index" />
                </template>
              </LoChaObject>
            </li>
          </template>
          <template v-else-if="isSingleUpdate">
            <li>
              <LoChaObject :feature="afterFeatures[0]!" :josm-target="josmTarget">
                <template #before>
                  <LoChaObject :feature="beforeFeatures[0]!" :compact="true" />
                </template>
                <template #object-detail>
                  <slot name="object-detail" :feature="afterFeatures[0]!" :index="index" />
                </template>
              </LoChaObject>
            </li>
          </template>
          <template v-else>
            <li
              v-for="feature in afterFeatures"
              :key="feature.id"
            >
              <LoChaObject :feature="feature" :josm-target="josmTarget">
                <template v-if="getBeforeFeaturesForAfter(feature).length" #before>
                  <LoChaObject
                    v-for="beforeFeature in getBeforeFeaturesForAfter(feature)"
                    :key="beforeFeature.id"
                    :feature="beforeFeature"
                    :compact="true"
                  />
                </template>
                <template v-if="$slots['object-detail']" #object-detail>
                  <slot name="object-detail" :feature="feature" :index="index" />
                </template>
              </LoChaObject>
            </li>
          </template>
        </ul>
      </div>
      <VMap :id="`${instanceId}-${props.index}`" :features="features" :bbox="loCha?.bbox" :style="{ gridColumnStart: vmapColumnStart }" />
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #cecece;
}

.header-start {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.group-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  min-width: 0;
  overflow-wrap: break-word;
}

.name-separator {
  white-space: nowrap;
}

.anchor-button {
  flex-shrink: 0;
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

.header-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3em;
}

.list--wide {
  grid-column: span 2;
}

.v-map {
  border: 1px solid lightgrey;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  padding: 0;
}
</style>
