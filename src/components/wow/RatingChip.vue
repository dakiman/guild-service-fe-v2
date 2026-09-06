<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    rating: { rating: number; color: string | null } | null
    regionRank?: number | null
    /** False when the rating is from an earlier season (BE `is_current`): grey, no rank. */
    isCurrent?: boolean
    seasonName?: string | null
  }>(),
  { regionRank: null, isCurrent: true, seasonName: null },
)
const n = (v: number) => v.toLocaleString('en-US')

const title = computed(() => {
  if (!props.isCurrent) return `M+ rating from ${props.seasonName ?? 'an earlier season'} — not yet rated this season`
  return props.regionRank != null ? `M+ rating · #${n(props.regionRank)} in region` : 'M+ rating'
})
const showRank = computed(() => props.isCurrent && props.regionRank != null)
</script>

<template>
  <span
    v-if="rating"
    class="inline-flex items-center gap-1 rounded-full border border-wsa-border/40 bg-black/30 px-1.5 py-px text-[11px] font-semibold tabular-nums leading-tight shrink-0"
    :title="title"
  >
    <span
      :class="isCurrent ? '' : 'text-wsa-disabled'"
      :style="isCurrent ? { color: rating.color ?? 'rgb(var(--wsa-text))' } : undefined"
      data-testid="rating-chip-value"
    >{{ n(rating.rating) }}</span>
    <span
      v-if="showRank"
      class="sr-only sm:not-sr-only sm:inline text-wsa-muted font-normal"
      :aria-label="`rank #${n(regionRank!)}`"
      :title="`rank #${n(regionRank!)}`"
    >#{{ n(regionRank!) }}</span>
  </span>
</template>
