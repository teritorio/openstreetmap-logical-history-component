<script setup lang="ts">
import type { ApiLink, IFeature } from '@/composables/useApi'
import { loChaColors } from '@/composables/useLoCha'

const props = defineProps<{
  link: ApiLink
  beforeFeature?: IFeature
}>()

function actionIcon(key: string): string {
  return (
    props.link.diff_tags![key] && props.link.before === undefined
      ? '➕'
      : props.link.after === undefined
        ? '✖'
        : '~')
}
</script>

<template>
  <div class="locha-diff">
    <table>
      <thead>
        <tr>
          <td v-if="beforeFeature">
            {{ `🔗 ${beforeFeature.properties.objtype[0]}${beforeFeature.properties.id} - ` }}
          </td>
          <td
            :class="{
              created: link.action === 'accept',
              deleted: link.action === 'reject',
            }"
          >
            {{ link.action }}
          </td>
        </tr>
      </thead>
      <tbody v-if="link.diff_tags">
        <template v-for="([tag, action]) in Object.entries(link.diff_tags)" :key="tag">
          <tr>
            <td>
              {{ actionIcon(tag) }}
            </td>
            <td>{{ tag }}</td>
            <td>
              {{ action[2] }}
            </td>
          </tr>
        </template>
      </tbody>
      <p v-else>
        0 tags changes
      </p>
    </table>
  </div>
</template>

<style lang="css" scoped>
.locha-diff {
  display: flex;
  gap: 1rem;
  border: 2px solid #cecece;
  padding: 0.25rem;
  width: fit-content;
}

.created {
  background-color: color-mix(in srgb, v-bind('loChaColors.create'), 20%, #ffffff 80%);
}

.deleted {
  background-color: color-mix(in srgb, v-bind('loChaColors.delete') 20%, #ffffff 80%);
}

td :is(span:first-of-type, span:last-of-type) {
  color: var(--color);
}
</style>
