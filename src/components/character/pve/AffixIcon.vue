<template>
  <span class="inline-flex items-center" :title="resolved?.name ?? `Affix ${affixId}`">
    <img
      v-if="resolved?.icon_url"
      :src="resolved.icon_url"
      :alt="resolved.name"
      class="w-6 h-6 rounded"
      loading="lazy"
    />
    <span
      v-else
      class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-ma-border/40 text-ma-muted/80"
    >
      {{ resolved?.name ?? `#${affixId}` }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KeystoneAffixGameData } from '@/types/gameData'

const props = defineProps<{
  affixId: number
  affixes: Record<number, KeystoneAffixGameData> | undefined | null
}>()

const resolved = computed<KeystoneAffixGameData | null>(() => {
  if (!props.affixes) return null
  return props.affixes[props.affixId] ?? null
})
</script>
