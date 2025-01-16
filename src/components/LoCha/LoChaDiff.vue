<script setup lang="ts">
import { loChaColors, loChaStatus, useLoCha } from '@/composables/useLoCha'
import { computed } from 'vue'

const { selectedFeatures } = useLoCha()

const diffTags = computed(() => {
  if (!selectedFeatures.value || !selectedFeatures.value.length)
    return

  let before, after
  if (selectedFeatures.value[0].properties?.is_created) {
    after = selectedFeatures.value[0]
  }
  else if (selectedFeatures.value[0].properties?.is_deleted) {
    before = selectedFeatures.value[0]
  }
  else {
    before = selectedFeatures.value[0]
    after = selectedFeatures.value[1]
  }

  const diff = []
  const allKeys = new Set([...Object.keys(before?.properties?.tags || {}), ...Object.keys(after?.properties?.tags || {})])

  for (const key of allKeys) {
    const beforeValue = before?.properties?.tags[key] || null
    const afterValue = after?.properties?.tags[key] || null

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
      <thead>
        <tr>
          <th>Tag</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in diffTags" :key="row.tag" :class="{
            created: row.status === loChaStatus.create,
            deleted: row.status === loChaStatus.delete,
            updated: row.status === 'updated',
          }"
        >
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
      </tbody>
    </table>
    <p v-else>
      No tags diff
    </p>
  </div>
</template>

<style lang="css" scoped>
table {
  border-collapse: collapse;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

th,
td {
  text-align: left;
  padding: 10px 15px;
}

th {
  background-color: #082e4e;
  color: #ffffff;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.03em;
}

tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

tbody tr:nth-child(odd) {
  background-color: #ffffff;
}

tbody tr:hover {
  background-color: #f1f1f1;
  cursor: default;
}

td {
  border-bottom: 1px solid #ddd;
}

tr:last-child td {
  border-bottom: none;
}

.created {
  --color: v-bind('loChaColors.create');
}

.deleted {
  --color: v-bind('loChaColors.delete');
}

.updated span:first-of-type {
  --color: v-bind('loChaColors.updateBefore');
}

.updated span:last-of-type {
  --color: v-bind('loChaColors.updateAfter');
}

tbody td :is(span:first-of-type, span:last-of-type) {
  display: inline-block;
  border: 1px solid var(--color);
  border-radius: 16px;
  background-color: color-mix(in srgb, var(--color) 20%, white 80%);
  padding: 4px 8px;
  font-size: 0.85em;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
