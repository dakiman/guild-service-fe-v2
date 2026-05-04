<template>
  <div class="flex flex-col gap-1.5 py-2.5 px-3" :class="compact ? '' : 'ma-card-inner'">
    <div class="flex items-center gap-2">
      <span
        class="inline-block size-2.5 rounded-full shrink-0"
        :class="`bg-${color}`"
      />
      <span :class="compact ? 'text-xs' : 'text-sm font-medium'" class="truncate flex-1">
        {{ rep.faction_name }}
      </span>
      <span
        class="text-[10px] uppercase tracking-wider shrink-0"
        :class="`text-${color}`"
      >
        {{ label }}
      </span>
    </div>
    <div class="flex items-center gap-2">
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation } from '@/types/character'
import { standingColor, standingLabel } from '@/utils/reputationStanding'

const props = withDefaults(defineProps<{
  rep: Reputation
  compact?: boolean
}>(), { compact: false })

const color = computed(() => standingColor(props.rep.standing))
const label = computed(() => standingLabel(props.rep.standing))
const barWidth = computed(() => {
  if (props.rep.max <= 0) return '100%'
  const pct = Math.min((props.rep.value / props.rep.max) * 100, 100)
  return `${pct}%`
})
</script>
