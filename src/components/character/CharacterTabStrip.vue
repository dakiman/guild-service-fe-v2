<template>
  <nav
    ref="navEl"
    aria-label="Character sections"
    class="flex flex-nowrap sm:flex-wrap gap-1 overflow-x-auto sm:overflow-visible snap-x -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
  >
    <router-link v-for="tab in tabs" :key="tab.label" v-slot="{ isActive, navigate, href }" :to="tab.to" custom>
      <a
        :href="href"
        :aria-current="isTabActive(tab, isActive) ? 'page' : undefined"
        class="wsa-tab shrink-0 snap-start whitespace-nowrap"
        :class="{ 'wsa-tab--active': isTabActive(tab, isActive) }"
        @click="navigate"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
      </a>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { onMounted, ref } from 'vue'
import { useRoute, type RouteLocationRaw } from 'vue-router'

export interface TabDescriptor {
  label: string
  to: RouteLocationRaw
  icon: Component
  activeMatchNames?: string[]
}

defineProps<{ tabs: TabDescriptor[] }>()

const route = useRoute()
const navEl = ref<HTMLElement | null>(null)

function isTabActive(tab: TabDescriptor, isExact: boolean): boolean {
  if (isExact) return true
  if (!tab.activeMatchNames || !route.name) return false
  return tab.activeMatchNames.includes(String(route.name))
}

onMounted(() => {
  navEl.value?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })
})
</script>
