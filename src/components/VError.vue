<script setup lang="ts">
import type { ErrorType } from '@/types'

defineProps<{
  message: string
  type: ErrorType
}>()

defineEmits<{
  (e: 'close'): void
}>()

const colors = {
  error: '#ff4d4f',
  warning: '#faad14',
  info: '#1890ff',
  success: '#52c41a',
}
</script>

<template>
  <div class="alert" :style="{ backgroundColor: colors[type] }">
    {{ message }}
    <button @click="$emit('close')">
      &#10006;
    </button>
  </div>
</template>

<style lang="css" scoped>
.alert {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 20;
  opacity: 0;
  animation: slideIn 0.5s ease-out forwards;
}

button {
  background-color: transparent;
  border: none;
  box-shadow: unset;
  line-height: 1;
  display: flex;
  align-items: center;
  font-size: 1rem;
  cursor: pointer;
}

.alert::before {
  content: '⚠️';
  font-size: 18px;
}

@keyframes slideIn {
  from {
    transform: translateX(-50%) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}
</style>
