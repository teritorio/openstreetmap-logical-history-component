<script setup lang="ts">
import { loChaColors, loChaStatus, useLoCha } from '@/composables/useLoCha'
import { computed } from 'vue'

const { selectedFeatures } = useLoCha()

const diffTags = computed(() => {
  if (!selectedFeatures.value || !selectedFeatures.value.length)
    return

  let before, after
  if (selectedFeatures.value[0].properties.is_created) {
    after = selectedFeatures.value[0]
  }
  else if (selectedFeatures.value[0].properties.is_deleted) {
    before = selectedFeatures.value[0]
  }
  else {
    before = selectedFeatures.value[0]
    after = selectedFeatures.value[1]
  }

  const diff = []
  const allKeys = new Set([...Object.keys(before?.properties.tags || {}), ...Object.keys(after?.properties.tags || {})])

  for (const key of allKeys) {
    const beforeValue = before?.properties.tags[key] || null
    const afterValue = after?.properties.tags[key] || null

    let status = ''
    if (beforeValue === afterValue) {
      status = 'unchanged'
    }
    else if (!beforeValue) {
      status = loChaStatus.create
    }
    else if (!afterValue) {
      status = loChaStatus.delete
    }
    else {
      status = 'updated'
    }

    if (status !== 'unchanged') {
      diff.push({
        tag: key,
        beforeValue,
        afterValue,
        status,
      })
    }
  }

  return diff
})
</script>

<template>
  <div class="locha-diff">
    <h2>Diff</h2>
    <table v-if="diffTags?.length">
      <tr
        v-for="row in diffTags" :key="row.tag" :class="{
          created: row.status === loChaStatus.create,
          deleted: row.status === loChaStatus.delete,
          updated: row.status === 'updated',
        }"
      >
        <td />
        <td>{{ row.tag }}</td>
        <td>
          <span v-if="row.beforeValue">
            {{ row.beforeValue }}
          </span>
          <span v-if="![loChaStatus.create.toString(), loChaStatus.delete.toString()].includes(row.status)"> / </span>
          <span v-if="row.afterValue">
            {{ row.afterValue }}
          </span>
        </td>
      </tr>
    </table>
    <p v-else>
      No tags diff
    </p>
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
