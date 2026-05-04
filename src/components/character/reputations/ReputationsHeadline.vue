<template>
  <div class="ma-card p-5 flex flex-col gap-4">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">
        {{ expansionName }} · Reputations
      </span>
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-bold tabular-nums text-ma-gold">
          {{ exaltedCount }} / {{ total }}
        </span>
        <span class="text-sm text-ma-muted/60">exalted</span>
      </div>
    </div>
    <div v-if="standingBars.length" class="flex flex-col gap-1.5">
      <div
        v-for="bar in standingBars"
        :key="bar.standing"
        class="flex items-center gap-2"
      >
        <span class="text-[10px] w-16 text-right text-ma-muted/70">{{ bar.label }}</span>
        <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: rgba(var(--ma-border), 0.15)">
          <div
            class="h-full rounded-full transition-all"
            :class="`bg-${bar.color}`"
            :style="{ width: bar.width }"
          />
        </div>
        <span class="text-[10px] tabular-nums text-ma-muted/60 w-4 text-right">{{ bar.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation, ReputationStanding } from '@/types/character'
import { STANDING_ORDER, standingColor, standingLabel } from '@/utils/reputationStanding'

const props = defineProps<{
  entries: Reputation[]
  expansionName: string
}>()

const total = computed(() => props.entries.length)
const exaltedCount = computed(() => props.entries.filter((r) => r.standing === 'exalted').length)

interface StandingBar {
  standing: ReputationStanding
  label: string
  color: string
  count: number
  width: string
}

const standingBars = computed<StandingBar[]>(() => {
  const counts = new Map<ReputationStanding, number>()
  for (const rep of props.entries) {
    counts.set(rep.standing, (counts.get(rep.standing) ?? 0) + 1)
  }
  const t = props.entries.length || 1
  return Array.from(counts.entries())
    .sort((a, b) => STANDING_ORDER[b[0]] - STANDING_ORDER[a[0]])
    .map(([standing, count]) => ({
      standing,
      label: standingLabel(standing),
      color: standingColor(standing),
      count,
      width: `${(count / t) * 100}%`,
    }))
})
</script>
