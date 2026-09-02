<script setup lang="ts">
defineProps<{
  rating: { rating: number; color: string | null } | null
  regionRank?: number | null
}>()
const n = (v: number) => v.toLocaleString('en-US')
</script>

<template>
  <span
    v-if="rating"
    class="inline-flex items-center gap-1 rounded-full border border-wsa-border/40 bg-black/30 px-1.5 py-px text-[11px] font-semibold tabular-nums leading-tight shrink-0"
    :title="regionRank != null ? `M+ rating · #${n(regionRank)} in region` : 'M+ rating'"
  >
    <span :style="{ color: rating.color ?? 'rgb(var(--wsa-text))' }" data-testid="rating-chip-value">{{ n(rating.rating) }}</span>
    <span v-if="regionRank != null" class="text-wsa-muted font-normal">#{{ n(regionRank) }}</span>
  </span>
</template>
