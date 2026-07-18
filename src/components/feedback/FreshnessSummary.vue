<template>
  <div class="relative">
    <button
      type="button"
      class="wsa-stat-pill !py-1 !px-2.5 !gap-1.5 text-xs cursor-pointer hover:border-wsa-border/60"
      :aria-expanded="open"
      @click="open = !open"
    >
      <component :is="aggregate.icon" class="w-3 h-3" :class="aggregate.iconClass" />
      {{ aggregate.label }}
      <ChevronDown class="w-3 h-3 text-wsa-muted transition-transform" :class="{ 'rotate-180': open }" />
    </button>
    <div
      v-if="open"
      data-testid="freshness-panel"
      class="absolute z-20 mt-2 wsa-card !p-3 min-w-[280px]"
    >
      <FreshnessChips :freshness="visibleFreshness" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, CircleCheck, CircleAlert, RefreshCw } from 'lucide-vue-next'
import FreshnessChips from '@/components/feedback/FreshnessChips.vue'
import type { MetaBlock } from '@/types/character'

const props = defineProps<{
  freshness: MetaBlock['freshness']
  hiddenKeys?: string[]
}>()

const open = ref(false)

const visibleFreshness = computed(() => {
  const hidden = new Set(props.hiddenKeys ?? [])
  return Object.fromEntries(
    Object.entries(props.freshness).filter(([key]) => !hidden.has(key)),
  ) as MetaBlock['freshness']
})

const aggregate = computed(() => {
  const states = Object.values(visibleFreshness.value)
  const syncing = states.filter((s) => s === 'never_synced').length
  const stale = states.filter((s) => s === 'stale').length
  if (syncing > 0) {
    return {
      icon: RefreshCw,
      iconClass: 'text-sky-400 animate-spin',
      label: `Updating ${syncing} section${syncing === 1 ? '' : 's'}…`,
    }
  }
  if (stale > 0) {
    return {
      icon: CircleAlert,
      iconClass: 'text-amber-400',
      label: `${stale} section${stale === 1 ? '' : 's'} refreshing soon`,
    }
  }
  return { icon: CircleCheck, iconClass: 'text-emerald-400', label: 'Data up to date' }
})
</script>
