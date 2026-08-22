<script setup lang="ts">
import { computed } from 'vue'
import AffixIcon from '@/components/character/pve/AffixIcon.vue'
import { useMetaPeriods } from '@/composables/useMetaStats'
import { useMythicDungeons } from '@/composables/usePveGameData'
import { useWowheadRefresh } from '@/composables/useWowhead'
import { periodLabel } from '@/utils/periodLabel'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

const props = withDefaults(defineProps<{ region?: MetaRegion; period?: MetaPeriodParam }>(), {
  region: 'all',
  period: 'current',
})

const { data: periods } = useMetaPeriods()
const { data: dungeonData } = useMythicDungeons()

const current = computed(() => {
  const list = periods.value ?? []
  if (props.period === 'current') return list.find((p) => p.is_current) ?? null
  return list.find((p) => p.period_id === props.period) ?? null
})

// Label for the single/agreed row — follows whichever week `current` resolved
// to (the page's week picker), not always "This week".
const weekLabel = computed(() =>
  periodLabel(current.value?.start_at ?? null, current.value?.is_current ?? false),
)

interface AffixRow {
  /** '' = single agreed row (rendered with weekLabel); otherwise 'EU' / 'US'. */
  label: string
  ids: number[]
}

const rows = computed<AffixRow[]>(() => {
  const entries = Object.entries(current.value?.affixes ?? {}).filter(([, ids]) => ids.length > 0)
  if (entries.length === 0) return []

  if (props.region !== 'all') {
    const own = entries.find(([r]) => r === props.region)
    return own ? [{ label: '', ids: own[1] }] : []
  }

  // "All regions": one row while EU/US agree, per-region rows during the
  // ~13h reset-offset window when they don't (or while only one region has
  // crawled affixes yet — that's not "agreement", it's missing data).
  const signatures = new Set(entries.map(([, ids]) => [...ids].sort((a, b) => a - b).join(',')))
  if (entries.length > 1 && signatures.size === 1) return [{ label: '', ids: entries[0][1] }]
  return entries.map(([r, ids]) => ({ label: r.toUpperCase(), ids }))
})

function affixName(id: number): string {
  return dungeonData.value?.affixes?.[id]?.name ?? `Affix ${id}`
}

useWowheadRefresh(rows)
</script>

<template>
  <div v-if="rows.length" class="flex flex-col gap-1">
    <div
      v-for="row in rows"
      :key="row.label"
      class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-wsa-muted"
    >
      <span class="text-[10px] uppercase tracking-wide text-wsa-disabled">{{ row.label || weekLabel }}</span> <span
        v-for="id in row.ids"
        :key="id"
        class="inline-flex items-center gap-1"
      >
        <AffixIcon :affix-id="id" />
        <span>{{ affixName(id) }}</span>
      </span>
    </div>
  </div>
</template>
