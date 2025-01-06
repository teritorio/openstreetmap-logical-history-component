<script setup lang="ts">
// QUESTION: Should we follow a type convention instead of internal type ?
import type { ApiResponse } from '@/composables/useApi'
import LoChaBody from '@/components/LoCha/LoChaBody.vue'
import LoChaHeader from '@/components/LoCha/LoChaHeader.vue'
import { useLoCha } from '@/composables/useLoCha'
import { onMounted } from 'vue'

const props = defineProps<{
  data: ApiResponse
}>()

const { featureCount, linkCount, setLoCha } = useLoCha()

onMounted(() => setLoCha(props.data))
</script>

<template>
  <p v-if="!featureCount || !linkCount" class="user-feedback">
    ⚠️ No data
  </p>
  <div v-else class="locha">
    <LoChaHeader />
    <LoChaBody />
  </div>
</template>

<style lang="css" scoped>
.locha,
.user-feedback {
  flex: 1;
}

.locha {
  display: flex;
  flex-direction: column;
  background-color: #fefefe;
}

.user-feedback {
  display: grid;
  place-items: center;
}
</style>
