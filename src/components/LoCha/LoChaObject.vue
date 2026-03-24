<script setup lang="ts">
import type { IFeature } from '@/types'
import { computed } from 'vue'
import { loChaColors, useLoCha } from '@/composables/useLoCha'
import { getDeepHistoryUrl, getJosmUrl, getOsmHistoryUrl, getOsmHistoryViewerUrl, getOsmUserUrl } from '@/utils/osm-links'

const props = defineProps<{
  feature: IFeature
}>()

defineSlots<{ 'tags-diff': () => void }>()

const { getStatus } = useLoCha()

const status = computed(() => getStatus(props.feature))

const statusContent = computed(() => {
  switch (status.value) {
    case 'new':
      return 'new'
    case 'delete':
      return 'deleted'
    default:
      return ''
  }
})

const color = computed(() => loChaColors[status.value])
</script>

<template>
  <article class="locha-object">
    <header>
      <div class="wrap">
        <a
          :href="getOsmHistoryUrl(feature.properties.objtype, feature.properties.id)"
          title="OSM History"
          target="_blank"
          @click.stop
        >
          {{ `${feature.properties.objtype[0]}${feature.properties.id}-v${feature.properties.version}` }}
        </a>
        <div
          v-if="status === 'new' || status === 'delete'"
          class="status-content"
          :class="{
            'object-new': status === 'new',
            'object-deleted': status === 'delete',
          }"
        >
          {{ statusContent }}
        </div>
      </div>
      <h3>{{ props.feature.properties.tags.name }}</h3>
      <p class="date">
        📅 {{ props.feature.properties.created }}
      </p>
      <a
        :href="getOsmUserUrl(feature.properties.username)"
        :title="`View ${feature.properties.username} OSM profile`"
        target="_blank"
        @click.stop
      >
        👤{{ feature.properties.username }}
      </a>
    </header>
    <slot name="tags-diff" />
    <div class="actions">
      <a
        :href="getOsmHistoryUrl(feature.properties.objtype, feature.properties.id)"
        type="button"
        title="Edit in OSM iD"
        target="_blank"
        @click.stop
      >
        OSM iD
      </a>
      <a
        :href="getJosmUrl(feature.properties.objtype, feature.properties.id)"
        type="button"
        title="Edit in JOSM"
        target="hidden_josm_target"
        @click.stop
      >
        JOSM
      </a>
      <a
        :href="getDeepHistoryUrl(feature.properties.objtype, feature.properties.id)"
        type="button"
        title="OSM Deep History"
        target="_blank"
        @click.stop
      >
        Deep H
      </a>
      <a
        :href="getOsmHistoryViewerUrl(feature.properties.objtype, feature.properties.id)"
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

header > a {
  font-size: 0.75em;
  color: #333333;
}

.wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actions {
  display: flex;
}

:deep(.date),
:deep(.title) {
  font-size: 12px;
  color: grey;
}

:deep(.infos) {
  display: flex;
  gap: 0.5rem;
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

.status-content {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-style: solid;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.object-deleted {
  background: color-mix(in srgb, v-bind('loChaColors.delete') 20%, #ffffff 80%);
  border-color: v-bind('loChaColors.delete');
}

.object-new {
  background: color-mix(in srgb, v-bind('loChaColors.new') 20%, #ffffff 80%);
  border-color: v-bind('loChaColors.new');
}
</style>
