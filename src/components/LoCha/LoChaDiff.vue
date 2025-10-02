<script setup lang="ts">
import type { Change } from 'diff'
import type { ApiLink, IFeature } from '@/composables/useApi'
import { diffChars } from 'diff'
import { groupBy, sortBy, uniq } from 'underscore'
import { computed } from 'vue'
import { loChaColors } from '@/composables/useLoCha'

const props = withDefaults(
  defineProps<{
    clear?: string[]
    diff: ApiLink['diff_tags']
    dst?: IFeature['properties']
    exclude?: string[]
    src?: IFeature['properties']
  }>(),
  {
    clear: () => [],
    exclude: () => [],
  },
)

const groupedTagKeys = computed((): string[][] => {
  if (props.src && !props.dst)
    return [Object.keys(props.src.tags)]

  const keys: string[] = sortBy(
    uniq([
      ...Object.keys(props.src?.tags || {}),
      ...Object.keys(props.dst?.tags || {}),
    ]),
    (key: string) => {
      return props.diff?.[key]
        && (
          !props.src?.tags || !(key in props.src.tags)
            ? 0
            : props.dst && !props.dst.tags[key]
              ? 2
              : 1)
    },
  )

  return Object.values(
    groupBy(
      keys,
      key => props.diff?.[key]?.map(diff => `${diff}`).join('||') || '',
    ),
  )
})

function actionIcon(key: string): string | undefined {
  if (props.src && !props.dst)
    return undefined

  return (
    props.diff?.[key]
    && (
      !props.src?.tags || !(key in props.src.tags)
        ? '➕'
        : props.dst && !props.dst.tags[key]
          ? '✖'
          : '~')
  )
}

function backgroundClass(key: string): string | undefined {
  if (props.src && !props.dst) {
    return undefined
  }

  return (
    props.diff?.[key]
    && (!props.src?.tags || !(key in props.src.tags)
      ? 'attribute-new'
      : props.dst && !props.dst.tags[key]
        ? 'attribute-deleted'
        : 'attribute-changed')
  )
}

function showTextDiff(before: string, after: string): boolean {
  const d = diffText(before, after)
  return d.length <= 2
}

function diffText(before: string, after: string): Change[] {
  return diffChars(before, after)
}
</script>

<template>
  <div class="locha-diff">
    <template
      v-for="(groupedKey, groupIndex) in groupedTagKeys"
      :key="groupIndex"
    >
      <table v-if="groupedTagKeys.length">
        <tbody>
          <template v-for="key in groupedKey" :key="key">
            <tr
              v-if="!exclude.includes(key)"
              :class="
                (src && !dst && 'no_changes')
                  || (diff?.[key] === undefined
                    || diff[key][0] === undefined
                    || diff[key][0][0]) !== 'reject' && 'no_changes'
              "
            >
              <td class="key" :class="[backgroundClass(key)]">
                {{ actionIcon(key) }}
              </td>
              <td
                :class="
                  (diff?.[key] === undefined
                    || diff[key][0] === undefined
                    || diff[key][0][0]) !== 'reject' || [
                    backgroundClass(key),
                    'key',
                  ]
                "
              >
                {{ key }}
              </td>
              <td
                :class="
                  (diff?.[key] === undefined
                    || diff[key][0] === undefined
                    || diff[key][0][0]) !== 'reject' || [
                    backgroundClass(key),
                    'value',
                  ]
                "
              >
                <template v-if="clear.includes(key)">
                  [...]
                </template>
                <template v-else-if="diff?.[key]">
                  <span v-if="!src?.tags || !(key in src.tags)">{{ dst?.tags?.[key] }} </span>
                  <span v-else-if="!(key in (dst?.tags || {}))">{{ src.tags[key] }} </span>
                  <span
                    v-else-if="typeof src.tags[key] === 'string'
                      && showTextDiff(src.tags[key], dst?.tags?.[key] || '')
                    "
                    class="attribute-changed"
                  >
                    <span
                      v-for="(part, i) in diffText(src.tags[key], dst?.tags?.[key] || '')"
                      :key="i"
                    >
                      <span
                        :class="
                          part.removed
                            ? 'diff-text-removed'
                            : part.added
                              ? 'diff-text-added'
                              : 'diff-text-same'
                        "
                      >{{ part.value }}</span>
                    </span>
                  </span>
                  <span v-else>
                    <span class="diff-text-removed">{{ src.tags[key] }}</span>
                    <br>
                    <span class="diff-text-added">{{ dst?.tags?.[key] }}</span>
                  </span>
                </template>
                <template v-else-if="!dst && src">
                  {{ src.tags?.[key] }}
                </template>
                <template v-else>
                  {{ dst?.tags?.[key] }}
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style lang="css" scoped>
.locha-diff {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: fit-content;
}

table {
  table-layout: fixed;
}

thead th {
  font-size: 0.75rem;
}

table,
th,
td {
  border: 1px solid #000000;
  border-collapse: collapse;
  padding: 0.15rem;
}

.item {
  margin-top: 0.7em;
  margin-right: 1.3em;
}

.diff-text-removed {
  color: v-bind('loChaColors.delete');
}

.diff-text-added {
  color: v-bind('loChaColors.new');
}

.diff-text-same {
  text-decoration: underline;
}

.attribute-deleted {
  background-color: color-mix(in srgb, v-bind('loChaColors.delete') 20%, #ffffff 80%);
}

.attribute-new {
  background-color: color-mix(in srgb, v-bind('loChaColors.new') 20%, #ffffff 80%);
}

.attribute-changed {
  background-color: color-mix(in srgb, v-bind('loChaColors.updateAfter') 20%, #ffffff 80%);
}

.no_changes {
  background-color: #f4f4f5;
}

thead th > div {
  display: flex;
  gap: 1rem;
}

td {
  vertical-align: top;
}

td.key {
  white-space: nowrap;
}

tr.no_changes {
  font-size: 70%;
}
</style>
