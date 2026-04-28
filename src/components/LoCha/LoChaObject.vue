<script setup lang="ts">
import type { IFeature } from '@/types'
import { computed, inject } from 'vue'
import { loChaColors } from '@/composables/useLoCha'
import { LOCHA_KEY } from '@/constants/injectionKeys'
import { getDeepHistoryUrl, getJosmUrl, getOsmHistoryUrl, getOsmHistoryViewerUrl, getOsmUserUrl } from '@/utils/osm-links'

const props = defineProps<{
  feature: IFeature
  josmTarget?: string
}>()

defineSlots<{ 'object-detail'?: () => void }>()

const { getStatus } = inject(LOCHA_KEY)!

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
          {{ `${feature.properties.objtype}${feature.properties.id}-v${feature.properties.version}` }}
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
        <div class="fab">
          <button class="fab-toggle" type="button" title="Tools">
            🔧 Tools
          </button>
          <div class="fab-menu">
            <a
              :href="getOsmHistoryUrl(feature.properties.objtype, feature.properties.id)"
              class="action-btn"
              title="Edit in OSM iD"
              target="_blank"
              @click.stop
            >
              OSM iD
            </a>
            <a
              :href="getJosmUrl(feature.properties.objtype, feature.properties.id)"
              class="action-btn"
              title="Edit in JOSM"
              :target="josmTarget || 'hidden_josm_target'"
              @click.stop
            >
              JOSM
            </a>
            <a
              :href="getDeepHistoryUrl(feature.properties.objtype, feature.properties.id)"
              class="action-btn"
              title="OSM Deep History"
              target="_blank"
              @click.stop
            >
              Deep H
            </a>
            <a
              :href="getOsmHistoryViewerUrl(feature.properties.objtype, feature.properties.id)"
              class="action-btn"
              title="OSM History Viewer"
              target="_blank"
              @click.stop
            >
              OSM H
            </a>
          </div>
        </div>
      </div>
      <p class="date">
        📅 {{ props.feature.properties.created }}
      </p>
      <a
        v-if="feature.properties.username"
        :href="getOsmUserUrl(feature.properties.username)"
        :title="`View ${feature.properties.username} OSM profile`"
        target="_blank"
        @click.stop
      >
        👤{{ feature.properties.username }}
      </a>
    </header>
    <slot name="object-detail" />
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

header > a {
  font-size: 0.75em;
  color: #333333;
}

.wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.fab {
  position: relative;
  margin-left: auto;
  flex-shrink: 0;
}

.fab-toggle {
  background-color: #d0d0d4;
  border: 1px solid #a8a8ac;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.3em 0.5em;
  color: #333333;
}

.fab-menu {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 5;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #cecece;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: max-content;
}

.fab:hover .fab-menu,
.fab:focus-within .fab-menu {
  display: flex;
}

.action-btn {
  color: #3d3d3d;
  padding: 0.4em 0.75em;
  font-size: 0.75em;
  text-decoration: none;
  white-space: nowrap;
}

.action-btn:hover {
  background-color: #eaeaee;
}

:deep(.date),
:deep(.title) {
  font-size: 12px;
  color: #666666;
}

:deep(.infos) {
  display: flex;
  gap: 0.5rem;
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
