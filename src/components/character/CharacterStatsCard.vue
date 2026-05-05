<template>
  <div class="ma-card p-6">
    <h3 class="ma-text-heading mb-4 text-lg">Detailed stats</h3>

    <div v-if="isSyncingSlice" class="flex items-center gap-2 text-ma-muted/80 text-sm">
      <span class="loading loading-spinner loading-xs" />
      Syncing stats…
    </div>

    <div v-else-if="!stats" class="text-ma-muted/80 text-sm">
      Stats not available yet — refresh shortly.
    </div>

    <div v-else class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <StatRow label="Health" :value="formatInt(stats.health)" />
      <StatRow label="Primary" :value="primaryStatLabel" />
      <StatRow label="Crit" :value="formatPercent(stats.melee_crit?.value)" />
      <StatRow label="Haste" :value="formatPercent(stats.melee_haste?.value)" />
      <StatRow label="Mastery" :value="formatPercent(stats.mastery?.value)" />
      <StatRow label="Versatility" :value="versatilityLabel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { useCharacterContext } from '@/composables/useCharacterContext'
import type { CharacterStats } from '@/types/character'

const props = defineProps<{ stats: CharacterStats | null }>()

const { freshness } = useCharacterContext()
const isSyncingSlice = computed(() => freshness.value.stats === 'never_synced')

const primaryStatLabel = computed(() => {
  if (!props.stats) return '—'
  const candidates: Array<{ label: string; entry?: { effective: number } }> = [
    { label: 'Strength', entry: props.stats.strength },
    { label: 'Agility', entry: props.stats.agility },
    { label: 'Intellect', entry: props.stats.intellect },
  ]
  const best = candidates
    .filter((c): c is { label: string; entry: { effective: number } } => c.entry !== undefined)
    .sort((a, b) => b.entry.effective - a.entry.effective)[0]
  return best ? `${best.label} ${formatInt(best.entry.effective)}` : '—'
})

const versatilityLabel = computed(() => {
  const damage = props.stats?.versatility_damage_done_bonus
  if (typeof damage !== 'number') return '—'
  return `${damage.toFixed(2)}%`
})

function formatInt(value: number | null | undefined): string {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat().format(Math.round(value))
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== 'number') return '—'
  return `${value.toFixed(2)}%`
}

const StatRow = defineComponent({
  name: 'StatRow',
  props: { label: { type: String, required: true }, value: { type: String, required: true } },
  setup(slotProps) {
    return () =>
      h('div', { class: 'flex items-center justify-between' }, [
        h('span', { class: 'text-ma-muted/80' }, slotProps.label),
        h('span', { class: 'ma-text-heading font-medium' }, slotProps.value),
      ])
  },
})
</script>
