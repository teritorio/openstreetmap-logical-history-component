<script setup lang="ts">
import type { ErrorType } from '@/types'

defineProps<{
  message: string
  type: ErrorType
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
}>()

const colorVars: Record<ErrorType, string> = {
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  success: 'var(--color-success)',
}
</script>

<template>
  <div class="alert" :style="{ backgroundColor: colorVars[type] }">
    {{ message }}
    <button class="btn-retry" @click="$emit('retry')">
      ↻ Retry
    </button>
    <button @click="$emit('close')">
      &#10006;
    </button>
  </div>
</template>

<style lang="css" scoped>
.alert {
  position: absolute;
  top: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  color: var(--color-fg-on-color);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-size: var(--text-base);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: var(--space-2);
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
  font-size: var(--text-base);
  cursor: pointer;
}

.btn-retry {
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-sm);
  color: var(--color-fg-on-color);
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-2);
  font-family: inherit;
}

.alert::before {
  content: '⚠️';
  font-size: var(--text-lg);
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
