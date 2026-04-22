<template>
  <span class="badge gap-1" :style="{ backgroundColor: color, color: 'white', borderColor: color }">
    {{ faction }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Faction } from '@/types/wow'
import { FACTION_COLORS } from '@/utils/wowConstants'

// Defensive fallback in case the WoW constants table ever drops one of these.
const FALLBACK_FACTION_COLORS: Record<Faction, string> = {
  Alliance: '#0078FF',
  Horde: '#B30000',
}

const props = defineProps<{ faction: Faction }>()
const color = computed(
  () => FACTION_COLORS[props.faction] ?? FALLBACK_FACTION_COLORS[props.faction] ?? '#666',
)
</script>
