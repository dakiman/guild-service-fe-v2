<template>
  <div v-if="compact" class="flex items-center gap-2 py-1.5 px-2">
    <span class="inline-block size-2 rounded-full shrink-0" :class="`bg-${color}`" />
    <span class="text-xs truncate flex-1">{{ rep.faction_name }}</span>
    <span class="text-[10px] uppercase tracking-wider shrink-0" :class="`text-${color}`">
      {{ metricLabel }}
    </span>
  </div>

  <div v-else class="ma-card-inner flex flex-col items-center gap-2 p-3 text-center min-w-0">
    <div class="relative">
      <img
        v-if="iconSrc"
        :src="iconSrc"
        :alt="rep.faction_name"
        class="size-12 rounded-full object-cover ring-2 shrink-0"
        :class="`ring-${color}`"
        @error="iconFailed = true"
      />
      <div
        v-else
        class="size-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ring-2"
        :class="`ring-${color} bg-${color}/20 text-${color}`"
      >
        {{ initial }}
      </div>
    </div>
    <span class="text-xs font-medium truncate w-full">{{ rep.faction_name }}</span>
    <span
      class="text-[11px] uppercase tracking-wider font-semibold"
      :class="`text-${color}`"
    >
      {{ metricLabel }}
    </span>
    <div class="w-full">
      <div class="w-full rounded-full overflow-hidden h-1" style="background: rgba(var(--ma-border), 0.15)">
        <div
          class="h-full rounded-full transition-all"
          :class="`bg-${color}`"
          :style="{ width: barWidth }"
        />
      </div>
      <span class="text-[9px] tabular-nums text-ma-muted/50 mt-0.5 block">
        {{ rep.value.toLocaleString() }} / {{ rep.max.toLocaleString() }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Reputation } from '@/types/character'
import { standingColor, standingLabel, parseRenown, parseLevel } from '@/utils/reputationStanding'
import valeeraImg from '@/assets/wow/npcs/valeera-sanguinar.jpg'

const FACTION_ICONS: Record<number, string> = {
  2744: valeeraImg,
}

const props = withDefaults(defineProps<{
  rep: Reputation
  compact?: boolean
}>(), { compact: false })

const iconFailed = ref(false)

const color = computed(() => standingColor(props.rep.standing))

const iconSrc = computed(() => {
  if (iconFailed.value) return null
  return FACTION_ICONS[props.rep.faction_id] ?? null
})

const initial = computed(() => {
  const words = props.rep.faction_name.split(/[\s']+/)
  if (words.length >= 2 && !words[0].match(/^(The|Of)$/i)) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  if (words.length >= 2) {
    return (words[1][0] + (words[2]?.[0] ?? '')).toUpperCase()
  }
  return props.rep.faction_name.slice(0, 2).toUpperCase()
})

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
