<script setup lang="ts">
import type { ErrorType } from '@/types'

defineProps<{
  message: string
  type: ErrorType
}>()

const colors = {
  error: '#ff4d4f',
  warning: '#faad14',
  info: '#1890ff',
  success: '#52c41a',
}
</script>

<template>
  <span class="alert" :style="{ backgroundColor: colors[type] }">
    {{ message }}
  </span>
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
  animation: slideIn 0.5s ease-out forwards, fadeOut 0.5s 3s ease-out forwards;
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

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}
</style>
