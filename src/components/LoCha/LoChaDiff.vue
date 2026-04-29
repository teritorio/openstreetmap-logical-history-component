<script setup lang="ts">
import type { Change } from 'diff'
import type { ApiLink, IFeature } from '@/types'
import { diffChars } from 'diff'
import { groupBy, sortBy, uniq } from 'underscore'
import { computed } from 'vue'
import { loChaColors } from '@/composables/useLoCha'

const props = withDefaults(
  defineProps<{
    clear?: string[]
    diff?: ApiLink['diff_tags']
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

function isRejected(key: string): boolean {
  const actions = props.diff?.[key]
  if (!actions || !actions[0])
    return false
  return actions[0][0] === 'reject'
}

function getRowClass(key: string): string | undefined {
  if (props.src && !props.dst)
    return 'no_changes'
  return isRejected(key) ? undefined : 'no_changes'
}

const tagDiffs = computed(() => {
  const result = new Map<string, { parts: Change[], isInline: boolean }>()
  if (!props.src?.tags || !props.dst?.tags)
    return result

  for (const keys of groupedTagKeys.value) {
    for (const key of keys) {
      if (props.diff?.[key] && typeof props.src.tags[key] === 'string' && key in props.dst.tags) {
        const parts = diffChars(props.src.tags[key], props.dst.tags[key] || '')
        result.set(key, { parts, isInline: parts.length <= 2 })
      }
    }
  }
  return result
})
</script>

<template>
  <div class="locha-diff">
    <template
      v-for="(groupedKey, groupIndex) in groupedTagKeys"
      :key="groupIndex"
    >
      <table>
        <tbody>
          <template v-for="key in groupedKey" :key="key">
            <tr
              v-if="!exclude.includes(key)"
              :class="getRowClass(key)"
            >
              <td class="key" :class="[backgroundClass(key)]">
                {{ actionIcon(key) }}
              </td>
              <td
                :class="isRejected(key) && [backgroundClass(key), 'key']"
              >
                {{ key }}
              </td>
              <td
                :class="isRejected(key) && [backgroundClass(key), 'value']"
              >
                <template v-if="clear.includes(key)">
                  [...]
                </template>
                <template v-else-if="diff?.[key]">
                  <span v-if="!src?.tags || !(key in src.tags)">{{ dst?.tags?.[key] }} </span>
                  <span v-else-if="!(key in (dst?.tags || {}))">{{ src.tags[key] }} </span>
                  <span
                    v-else-if="tagDiffs.get(key)?.isInline"
                  >
                    <span
                      v-for="(part, i) in tagDiffs.get(key)?.parts ?? []"
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
  border: none;
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
