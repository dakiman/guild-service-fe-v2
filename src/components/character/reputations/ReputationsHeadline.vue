<template>
  <div class="ma-card p-5 flex flex-col gap-4">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">
        {{ expansionName }} · Reputations
      </span>
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-bold tabular-nums text-ma-gold">
          {{ heroValue }}
        </span>
        <span class="text-sm text-ma-muted/60">{{ heroLabel }}</span>
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
import type { Reputation } from '@/types/character'
import { standingColor, standingLabel, standingSortKey, isRenownBased, highestRenown } from '@/utils/reputationStanding'

const props = defineProps<{
  entries: Reputation[]
  expansionName: string
}>()

const total = computed(() => props.entries.length)
const standings = computed(() => props.entries.map((r) => r.standing))
const renownBased = computed(() => isRenownBased(standings.value))

const heroValue = computed(() => {
  if (renownBased.value) {
    return `Renown ${highestRenown(standings.value)}`
  }
  const exalted = props.entries.filter((r) => r.standing === 'exalted').length
  return `${exalted} / ${total.value}`
})

const heroLabel = computed(() => {
  if (renownBased.value) return 'highest'
  return 'exalted'
})

interface StandingBar {
  standing: string
  label: string
  color: string
  count: number
  width: string
}

const standingBars = computed<StandingBar[]>(() => {
  const counts = new Map<string, number>()
  for (const rep of props.entries) {
    counts.set(rep.standing, (counts.get(rep.standing) ?? 0) + 1)
  }
  const t = props.entries.length || 1
  return Array.from(counts.entries())
    .sort((a, b) => standingSortKey(b[0]) - standingSortKey(a[0]))
    .map(([standing, count]) => ({
      standing,
      label: standingLabel(standing),
      color: standingColor(standing),
      count,
      width: `${(count / t) * 100}%`,
    }))
})
</script>
