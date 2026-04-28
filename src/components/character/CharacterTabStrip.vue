<template>
  <nav class="flex flex-wrap gap-1" role="tablist">
    <router-link
      v-for="tab in tabs"
      :key="tab.label"
      v-slot="{ isActive, navigate, href }"
      :to="tab.to"
      custom
    >
      <a
        :href="href"
        role="tab"
        :aria-selected="isTabActive(tab, isActive)"
        class="ma-tab"
        :class="{ 'ma-tab--active': isTabActive(tab, isActive) }"
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
import { useRoute, type RouteLocationRaw } from 'vue-router'

export interface TabDescriptor {
  label: string
  to: RouteLocationRaw
  icon: Component
  activeMatchNames?: string[]
}

defineProps<{ tabs: TabDescriptor[] }>()

const route = useRoute()

function isTabActive(tab: TabDescriptor, isExact: boolean): boolean {
  if (isExact) return true
  if (!tab.activeMatchNames || !route.name) return false
  return tab.activeMatchNames.includes(String(route.name))
}
</script>
