<script setup lang="ts">
import { loChaColors, loChaStatus, useLoCha } from '@/composables/useLoCha'
import { computed } from 'vue'

const props = defineProps<{
  feature: GeoJSON.Feature
}>()

if (!props.feature.id)
  throw new Error(`Feature ID is missing.`)

if (!props.feature.properties)
  throw new Error(`Feature ${props.feature.id} has no properties.`)

const status = computed(() => {
  if (props.feature.properties!.is_created) {
    return loChaStatus.create
  }

  if (props.feature.properties!.is_deleted) {
    return loChaStatus.delete
  }

  if (props.feature.properties!.is_before) {
    return loChaStatus.updateBefore
  }

  return loChaStatus.updateAfter
})

const name = computed(() => {
  const content = props.feature.properties!.tags.name || '-'

  switch (status.value) {
    case 'create':
      return `\u2795 ${content}`
    case 'delete':
      return `\u2716 ${content}`
    case 'updateAfter':
    case 'updateBefore':
    default:
      return `\u{1F503} ${content}`
  }
})

const color = computed(() => loChaColors[status.value])

const { selectedLink } = useLoCha()
const style = computed(() => {
  if (!selectedLink.value)
    return

  return {
    opacity: selectedLink.value.id.includes(props.feature.id!.toString()) ? 1 : 0.3,
  }
})

const { showLink, resetLink } = useLoCha()
function handleClick(id?: string) {
  if (!id)
    throw new Error('Object not found')

  selectedLink.value?.id.includes(id)
    ? resetLink()
    : showLink(id, status.value)
}
</script>

<template>
  <article :style="style" class="locha-object" @click="handleClick(feature.id?.toString())">
    <header>
      <h3>{{ name }}</h3>
      <span>👤{{ feature.properties?.username }}</span>
    </header>
    <div v-show="selectedLink && ([selectedLink.before, selectedLink.after].includes(feature.id?.toString()))" class="actions">
      <a
        type="button"
        title="Edit in OSM iD"
        :href="`https://www.openstreetmap.org/${feature.properties?.objtype}/${feature.properties?.id}/history`"
        target="_blank"
        @click.stop
      >
        OSM iD
      </a>
      <a
        type="button"
        title="Edit in JOSM"
        :href="`http://127.0.0.1:8111/load_object?objects=${feature.properties?.objtype[0]}${feature.properties?.id}`"
        target="hidden_josm_target"
        @click.stop
      >
        JOSM
      </a>
      <a
        type="button"
        title="OSM Deep History"
        :href="`https://osmlab.github.io/osm-deep-history/#/${feature.properties?.objtype}/${feature.properties?.id}`"
        target="_blank"
        @click.stop
      >
        Deep H
      </a>
      <a
        type="button"
        title="OSM History Viewer"
        :href="`https://pewu.github.io/osm-history/#/${feature.properties?.objtype}/${feature.properties?.id}`"
        target="_blank"
        @click.stop
      >
        OSM H
      </a>
    </div>
  </article>
</template>

<style lang="css" scoped>
article {
  border: 2px solid v-bind(color);
  background-color: color-mix(in srgb, v-bind(color) 20%, white 80%);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

article:hover {
  cursor: pointer;
}

h3 {
  font-weight: 400;
}

span {
  font-size: 0.75em;
  color: #333333;
}

.actions {
  display: flex;
}

[type='button'] {
  flex-grow: 1;
  color: #000000;
  padding: 0.5em 1em;
  font-size: 0.75em;
  border: 1px solid #dcdfe6;
  background-color: #ffffff;
  text-align: center;
}
</style>
