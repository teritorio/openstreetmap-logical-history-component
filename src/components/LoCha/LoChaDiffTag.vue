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
      <span
        v-if="(action && action[2] && Object.keys(action[2]).length)
          || undefined" class="badge"
      >
        {{ (action && action[2] && Object.keys(action[2]).length)
          || undefined }}
      </span>
      {{ type }}: {{ action[0] }}
      <template v-if="action && action[2]">
        ⮟
      </template>
      <!-- <template v-if="action && action[2]" #dropdown>
        <el-dropdown-menu v-for="(option, i) in action[2]" :key="i">
          <el-dropdown-item class="clearfix">
            {{ i }}
            <template v-if="Array.isArray(option)">
              <ul>
                <li v-for="op in option" :key="op">
                  {{ op }}
                </li>
              </ul>
            </template>
            <template v-else>
              {{ option }}
            </template>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template> -->
    </div>
  </template>
</template>

<style lang="css" scoped>
.tag,
.badge {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid;
  padding: 0 6px;
  border-color: v-bind('loChaColors.delete');
}

.tag {
  position: relative;
  border-radius: 10px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.badge {
  position: absolute;
  top: 0;
  right: calc(1px + 18px / 2);
  border-radius: 10px;
  transform: translateY(-50%) translateX(100%);
  height: 18px;
  width: fit-content;
  color: #ffffff;
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
