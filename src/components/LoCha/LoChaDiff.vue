<script setup lang="ts">
import type { ApiLink } from '@/composables/useApi'
import { loChaColors } from '@/composables/useLoCha'

const props = defineProps<{
  links: ApiLink[]
}>()

function actionIcon(key: string, linkIndex: number): string {
  const link = props.links[linkIndex]

  return (
    link.diff_tags![key] && link.before === undefined
      ? '➕'
      : link.after === undefined
        ? '✖'
        : '~')
}
</script>

<template>
  <div class="locha-diff">
    <table v-for="(link, index) in links" :key="`${link.before?.toString() || '-'}_${link.after?.toString() || '-'}`">
      <thead>
        <tr
          :class="{
            created: link.action === 'accept',
            deleted: link.action === 'reject',
          }"
        >
          {{ link.action }}
        </tr>
      </thead>
      <tbody v-if="link.diff_tags">
        <template v-for="([tag, action]) in Object.entries(link.diff_tags)" :key="tag">
          <tr
            :class="{
              created: action[0].includes('accept'),
              deleted: action[0].includes('reject'),
              updated: action[0].includes('diff'),
            }"
          >
            <td>
              {{ actionIcon(tag, index) }}
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
}

.created {
  background-color: color-mix(in srgb, v-bind('loChaColors.create'), 20%, #ffffff 80%);
}

.deleted {
  background-color: color-mix(in srgb, v-bind('loChaColors.delete') 20%, #ffffff 80%);
}

.updated {
  background-color: color-mix(in srgb, v-bind('loChaColors.updateAfter') 20%, #ffffff 80%);
}

.updated span:first-of-type {
  --color: v-bind('loChaColors.delete');
}

.updated span:last-of-type {
  --color: v-bind('loChaColors.create');
}

td :is(span:first-of-type, span:last-of-type) {
  color: var(--color);
}
</style>
