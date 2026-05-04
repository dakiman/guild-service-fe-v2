<template>
  <div class="flex items-center gap-3 py-2.5 px-3" :class="compact ? '' : 'ma-card-inner'">
    <img
      v-if="avatarSrc"
      :src="avatarSrc"
      :alt="rep.faction_name"
      class="size-10 rounded-full object-cover ring-2 shrink-0"
      :class="`ring-${color}`"
    />
    <span
      v-else
      class="inline-block size-2.5 rounded-full shrink-0"
      :class="`bg-${color}`"
    />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2">
        <span :class="compact ? 'text-xs' : 'text-sm font-medium'" class="truncate">
          {{ rep.faction_name }}
        </span>
        <span
          class="text-[10px] uppercase tracking-wider shrink-0 font-semibold"
          :class="`text-${color}`"
        >
          {{ metricLabel }}
        </span>
      </div>
      <div class="flex items-center gap-2 mt-1">
        <div class="flex-1 rounded-full overflow-hidden" :class="compact ? 'h-1' : 'h-1.5'" style="background: rgba(var(--ma-border), 0.15)">
          <div
            class="h-full rounded-full transition-all"
            :class="`bg-${color}`"
            :style="{ width: barWidth }"
          />
        </div>
        <span class="text-[10px] tabular-nums text-ma-muted/60 shrink-0">
          {{ rep.value.toLocaleString() }} / {{ rep.max.toLocaleString() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation } from '@/types/character'
import { standingColor, standingLabel, parseRenown, parseLevel } from '@/utils/reputationStanding'

const AVATARS: Record<number, string> = {
  2744: new URL('@/assets/wow/npcs/valeera-sanguinar.jpg', import.meta.url).href,
}

const props = withDefaults(defineProps<{
  rep: Reputation
  compact?: boolean
}>(), { compact: false })

const color = computed(() => standingColor(props.rep.standing))
const avatarSrc = computed(() => AVATARS[props.rep.faction_id] ?? null)

const metricLabel = computed(() => {
  const renown = parseRenown(props.rep.standing)
  if (renown !== null) return `Renown ${renown}`
  const level = parseLevel(props.rep.standing)
  if (level !== null) return `Level ${level}`
  return standingLabel(props.rep.standing)
})

const barWidth = computed(() => {
  if (props.rep.max <= 0) return '100%'
  const pct = Math.min((props.rep.value / props.rep.max) * 100, 100)
  return `${pct}%`
})
</script>
