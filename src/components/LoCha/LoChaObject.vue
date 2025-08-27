<script setup lang="ts">
import type { ApiLink, IFeature } from '@/composables/useApi'
import { computed } from 'vue'
import LoChaDiff from '@/components/LoCha/LoChaDiff.vue'
import { loChaColors, useLoCha } from '@/composables/useLoCha'

const props = defineProps<{
  feature: IFeature
  link?: ApiLink
}>()

const { getStatus } = useLoCha()

const status = computed(() => getStatus(props.feature))

const name = computed(() => {
  const content = props.feature.properties.tags.name || '-'

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
</script>

<template>
  <article class="locha-object">
    <header>
      <h3>
        <a
          :href="`https://www.openstreetmap.org/${feature.properties.objtype}/${feature.properties.id}/history`"
          title="OSM History"
          target="_blank"
          @click.stop
        >
          {{ `${feature.properties.objtype[0]}${feature.properties.id}` }}
        </a>
        {{ name }}
      </h3>
      <a
        :href="`https://www.openstreetmap.org/user/${feature.properties.username}`"
        :title="`View ${feature.properties.username} OSM profile`"
        target="_blank"
        @click.stop
      >
        👤{{ feature.properties.username }}
      </a>
    </header>
    <LoChaDiff v-if="link" :link="link" />
    <div class="actions">
      <a
        :href="`https://www.openstreetmap.org/${feature.properties.objtype}/${feature.properties.id}/history`"
        type="button"
        title="Edit in OSM iD"
        target="_blank"
        @click.stop
      >
        OSM iD
      </a>
      <a
        :href="`http://127.0.0.1:8111/load_object?objects=${feature.properties.objtype[0]}${feature.properties.id}`"
        type="button"
        title="Edit in JOSM"
        target="hidden_josm_target"
        @click.stop
      >
        JOSM
      </a>
      <a
        :href="`https://osmlab.github.io/osm-deep-history/#/${feature.properties.objtype}/${feature.properties.id}`"
        type="button"
        title="OSM Deep History"
        target="_blank"
        @click.stop
      >
        Deep H
      </a>
      <a
        :href="`https://pewu.github.io/osm-history/#/${feature.properties.objtype}/${feature.properties.id}`"
        type="button"
        title="OSM History Viewer"
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
  padding: 0.25rem;
}

h3 {
  font-weight: 400;
}

h3 + a {
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
