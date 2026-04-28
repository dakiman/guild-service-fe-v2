<template>
  <div class="ma-card p-12 flex flex-col items-center text-center gap-3">
    <component v-if="icon" :is="icon" class="w-8 h-8 text-ma-muted/50" />
    <h3 class="ma-text-heading text-lg">{{ title }}</h3>
    <p v-if="resolvedMessage" class="text-ma-muted/70 text-sm max-w-md">
      <span
        v-if="freshness === 'stale' || freshness === 'never_synced'"
        class="loading loading-spinner loading-xs mr-2 align-middle"
      />
      {{ resolvedMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { FreshnessState } from '@/types/character'

type SliceKey =
  | 'profile'
  | 'mythic_plus'
  | 'pvp'
  | 'professions'
  | 'raids'
  | 'titles'
  | 'collections'
  | 'reputations'
  | 'achievements'

const props = defineProps<{
  slice: SliceKey
  freshness?: FreshnessState
  title: string
  message?: string
  icon?: Component
}>()

const resolvedMessage = computed(() => {
  if (props.message) return props.message
  if (props.freshness === 'never_synced') {
    return 'Not yet synced — data will appear here once the next sync completes.'
  }
  if (props.freshness === 'stale') {
    return 'Refreshing — newer data is on the way.'
  }
  return undefined
})
</script>
