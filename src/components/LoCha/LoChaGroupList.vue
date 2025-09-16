<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LoChaGroup from '@/components/LoCha/LoChaGroup.vue'
import { useLoCha } from '@/composables/useLoCha'

const { groups } = useLoCha()
const currentHash = ref<string>()

onMounted(() => {
  currentHash.value = window.location.hash
  if (currentHash.value)
    scrollToSection(currentHash.value)

  window.addEventListener('hashchange', () => {
    currentHash.value = window.location.hash
    if (currentHash.value)
      scrollToSection(currentHash.value)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', () => {
    currentHash.value = undefined
  })
})

function scrollToSection(sectionId: string, options: ScrollIntoViewOptions = {}): boolean {
  const element = document.getElementById(sectionId.split('#')[1])

  if (!element) {
    console.warn(`Element with ID "${sectionId}" not found`)
    return false
  }

  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
  } = options

  element.scrollIntoView({
    behavior,
    block,
    inline,
  })

  return true
}
</script>

<template>
  <div class="locha-group-list">
    <header>
      <h2>Before</h2>
      <h2>After</h2>
    </header>
    <ul>
      <li v-for="(group, index) in groups" :key="index" :class="{ selected: currentHash === `#group-${index}` }">
        <a class="anchor-button" :href="`#group-${index}`">🔗</a>
        <LoChaGroup :id="`group-${index}`" :features="group" :index="index">
          <template #tags-diff="slotProps">
            <slot name="tags-diff" v-bind="slotProps" />
          </template>
        </LoChaGroup>
      </li>
    </ul>
    <iframe name="hidden_josm_target" style="display: none" />
  </div>
</template>

<style lang="css" scoped>
.locha-group-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr;
  gap: 1rem;
  padding: 1rem;
}

.locha-group-list header {
  grid-row: 1;
  grid-column: 1 / 3;
  display: flex;
  gap: 1rem;
}

.locha-group-list header h2 {
  flex: 50%;
  text-align: center;
}

.locha-group-list > ul {
  grid-row: 2;
  grid-column: 1 / 4;
  overflow-y: auto;
  margin-right: -12px;
}

.locha-group-list > ul::-webkit-scrollbar {
  width: 12px;
  background: transparent;
}

.locha-group-list > ul::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.locha-group-list > ul > li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.locha-group-list > ul > li.selected .locha-group {
  border-color: red;
}

.locha-group {
  width: 100%;
}

.anchor-button {
  border: 2px solid #cecece;
  background-color: #ffffff;
  text-decoration: none;
  padding: 0.25rem;
}

ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
</style>
