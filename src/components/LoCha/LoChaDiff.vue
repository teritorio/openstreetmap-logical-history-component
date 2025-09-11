<script setup lang="ts">
import type { Change } from 'diff'
import type { Action, ActionType, ApiLink, IFeature } from '@/composables/useApi'
import { diffChars } from 'diff'
import { groupBy, sortBy, uniq } from 'underscore'
import { computed } from 'vue'
import LoChaDiffTag from '@/components/LoCha/LoChaDiffTag.vue'
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
  const keys: string[] = sortBy(
    uniq([
      ...Object.keys(props.src?.tags || {}),
      ...Object.keys(props.dst?.tags || {}),
    ]),
    (key: string) =>
      props.diff?.[key]
        ? -maxActionPriority(props.diff[key])
        : 0,
  )

  return Object.values(
    groupBy(
      keys,
      key => props.diff?.[key]?.map(diff => `${diff}`).join('||') || '',
    ),
  )
})

function maxActionPriority(actions: Action[]): number {
  return Math.max(...actions.map(action => action2priority(action[1])))
}

function action2priority(logAction: ActionType | null): number {
  return logAction ? { reject: 2, accept: 0 }[logAction] : 1
}

function actionIcon(key: string): string | undefined {
  return (
    props.diff?.[key]
    && (
      !props.src?.tags || !(key in props.src.tags)
        ? '➕'
        : !(key in (props.dst?.tags || {}))
            ? '✖'
            : '~')
  )
}

function backgroundClass(key: string): string | undefined {
  return (
    props.diff?.[key]
    && (!props.src?.tags || !(key in props.src.tags)
      ? 'attribute-added'
      : !(key in (props.dst?.tags || {}))
          ? 'attribute-removed'
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
    <table v-if="groupedTagKeys.length">
      <template
        v-for="(groupedKey, groupIndex) in groupedTagKeys"
        :key="groupIndex"
      >
        <thead>
          <tr>
            <th colspan="3">
              <div>
                <LoChaDiffTag
                  v-if="diff?.[groupedKey[0]] !== undefined"
                  :diff="diff?.[groupedKey[0]]"
                  type="tags"
                />
                <template v-else-if="groupIndex !== 0">
                  &nbsp;
                </template>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="key in groupedKey" :key="key">
            <tr
              v-if="!exclude.includes(key)"
              :class="
                (diff?.[groupedKey[0]] === undefined
                  || diff[groupedKey[0]][0] === undefined
                  || diff[groupedKey[0]][0][1]) !== 'reject' && 'no_changes'
              "
            >
              <td class="key" :class="[backgroundClass(key)]">
                {{ actionIcon(key) }}
              </td>
              <td
                :class="
                  (diff?.[groupedKey[0]] === undefined
                    || diff[groupedKey[0]][0] === undefined
                    || diff[groupedKey[0]][0][1]) !== 'reject' || [
                    backgroundClass(key),
                    'key',
                  ]
                "
              >
                {{ key }}
              </td>
              <td
                :class="
                  (diff?.[groupedKey[0]] === undefined
                    || diff[groupedKey[0]][0] === undefined
                    || diff[groupedKey[0]][0][1]) !== 'reject' || [
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
                    class="attribut-changed"
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
                <template v-else>
                  {{ dst?.tags?.[key] }}
                </template>
              </td>
            </tr>
          </template>
        </tbody>
      </template>
    </table>
    <p v-else>
      0 tags changes
    </p>
  </div>
</template>

<style lang="css" scoped>
.locha-diff {
  display: flex;
  gap: 1rem;
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
  padding: 8px;
}

.item {
  margin-top: 0.7em;
  margin-right: 1.3em;
}

.diff-text-removed {
  color: v-bind('loChaColors.delete');
}

.diff-text-added {
  color: v-bind('loChaColors.create');
}

.diff-text-same {
  text-decoration: underline;
}

.attribute-removed {
  background: color-mix(in srgb, v-bind('loChaColors.delete') 20%, #ffffff 80%);
}

.attribute-added {
  background: color-mix(in srgb, v-bind('loChaColors.create'), 20%, #ffffff 80%);
}

.attribute-changed {
  background: color-mix(in srgb, v-bind('loChaColors.updateAfter') 20%, #ffffff 80%);
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
