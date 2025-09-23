<script setup lang="ts">
import type { Action } from '@/composables/useApi'
import { loChaColors } from '@/composables/useLoCha'

defineProps<{
  diff: Action[]
  type: 'tags' | 'geom'
}>()
</script>

<template>
  <div v-if="diff.length === 0" class="tag attribute-changed">
    ?
  </div>
  <template
    v-for="(action, actionIndex) in diff"
    v-else
    :key="actionIndex"
  >
    <div
      class="tag"
      :class="{
        'attribute-removed': action[1] === 'reject',
        'no_changes': action[1] !== 'reject',
      }"
    >
      {{ type }}: {{ action[0] }}
    </div>
  </template>
</template>

<style lang="css" scoped>
.tag {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid;
  padding: 0 6px;
  border-color: v-bind('loChaColors.delete');
  position: relative;
  border-radius: 10px;
  font-size: 0.75rem;
  white-space: nowrap;
  font-weight: bold;
  width: fit-content;
}

.no_changes {
  background-color: #f4f4f5;
}

.attribute-changed {
  border-color: v-bind('loChaColors.updateAfter');
  background: color-mix(in srgb, v-bind('loChaColors.updateAfter') 20%, #ffffff 80%);
}

.attribute-removed {
  background: color-mix(in srgb, v-bind('loChaColors.delete') 20%, #ffffff 80%);
  border-color: v-bind('loChaColors.delete');
}
</style>
