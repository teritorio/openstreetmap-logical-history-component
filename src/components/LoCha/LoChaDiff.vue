<script setup lang="ts">
import { loChaColors, useLoCha } from '@/composables/useLoCha'

const { selectedLinks } = useLoCha()

function actionIcon(key: string, linkIndex: number): string {
  const link = selectedLinks.value[linkIndex]

  return (
    link.diff_tags![key] && link.before === undefined
      ? '➕'
      : link.after === undefined
        ? '✖'
        : '~')
}

// TODO: groupBy selectedLinks.value[link].diff_tags[key][index][0] (ex: 'tags_changes_significant', 'tags_changes_non_significant')
// const groupedKeys = computed((): string[][] {
//   const keys: string[] = _.sortBy(
//     _.uniq([...Object.keys(this.src || {}), ...Object.keys(this.dst)]),
//     (key) => (this.diff[key] ? -maxActionPriority(this.diff[key]) : 0),
//   )

//   return Object.values(
//     _.groupBy(keys, (key) =>
//       this.diff[key]?.map((diff) => `${diff}`)?.join('||')),
//   )
// })

// const beforeFeatures = createFeatureComputed(f => !!(f.properties.is_before || f.properties.is_deleted))

// const afterFeatures = createFeatureComputed(f => !!(f.properties.is_after || f.properties.is_created))

// function createFeatureComputed(predicate: (f: IFeature) => boolean) {
//   return computed(() => new Set([...selectedFeatures.value].filter(predicate)))
// }
</script>

<template>
  <div class="locha-diff">
    <h2>Diff</h2>
    <table v-for="(link, index) in selectedLinks" :key="`${link.before?.toString() || '-'}_${link.after?.toString() || '-'}`">
      <thead>
        <tr>{{ `${link.before?.toString() || '-'}_${link.after?.toString() || '-'}` }}</tr>
      </thead>
      <tbody v-if="link.diff_tags">
        <template v-for="([tag, action]) in Object.entries(link.diff_tags)" :key="tag">
          <tr
            :class="{
              created: action[0].includes('accept'),
              deleted: action[0].includes('reject'),
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
.created {
  background-color: v-bind('loChaColors.create');
}

.deleted {
  background-color: v-bind('loChaColors.delete');
}

.updated {
  background-color: color-mix(in srgb, v-bind('loChaColors.updateAfter') 20%, white 80%);
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
