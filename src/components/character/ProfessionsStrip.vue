<template>
  <div v-if="entries && entries.length > 0" class="flex flex-wrap gap-2">
    <span
      v-for="entry in sortedEntries"
      :key="`${entry.profession_id}-${entry.tier_name}`"
      class="ma-stat-pill"
    >
      <Hammer v-if="entry.is_primary" class="w-3.5 h-3.5 text-ma-gold" />
      <Wrench v-else class="w-3.5 h-3.5 text-ma-muted/70" />
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">
        {{ entry.tier_name || entry.profession_name }}
      </span>
      <span class="font-bold text-ma-gold tabular-nums">
        {{ entry.skill_points }}/{{ entry.max_skill_points }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Profession } from '@/types/character'
import { Hammer, Wrench } from 'lucide-vue-next'

const props = defineProps<{
  entries: Profession[] | null
}>()

const sortedEntries = computed(() =>
  [...(props.entries ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    const byName = a.profession_name.localeCompare(b.profession_name)
    if (byName !== 0) return byName
    return (a.tier_name ?? '').localeCompare(b.tier_name ?? '')
  })
)
</script>
