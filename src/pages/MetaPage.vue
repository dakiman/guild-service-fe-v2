<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import CurrentAffixStrip from '@/components/stats/CurrentAffixStrip.vue'
import MetaSpecCard from '@/components/stats/MetaSpecCard.vue'
import MetaDungeonCard from '@/components/stats/MetaDungeonCard.vue'
import MetaCompsCard from '@/components/stats/MetaCompsCard.vue'
import { useMetaPeriods } from '@/composables/useMetaStats'
import { useQueryParam, intParam } from '@/composables/useQueryParam'
import { periodLabel } from '@/utils/periodLabel'
import type { MetaPeriodParam, MetaRegion } from '@/types/meta'

const period = useQueryParam<MetaPeriodParam>('week', {
  default: 'current',
  parse: (raw) => (raw === 'current' ? 'current' : (intParam(raw) as MetaPeriodParam | null)),
})
const region = useQueryParam<MetaRegion>('region', {
  default: 'all',
  parse: (raw) => (['all', 'eu', 'us'].includes(raw) ? (raw as MetaRegion) : null),
})
/** Spec used to narrow Top Comps; set from the comps select or by clicking a Spec Meta row. */
const specFilter = useQueryParam<number | null>('spec', { default: null, parse: intParam })

const { data: periods } = useMetaPeriods()

const selectedIndex = computed(() => {
  if (period.value === 'current') return 0
  return periods.value?.findIndex((p) => p.period_id === period.value) ?? -1
})
const prevPeriodId = computed(() => {
  const list = periods.value ?? []
  const idx = selectedIndex.value
  return idx >= 0 && idx + 1 < list.length ? list[idx + 1].period_id : null
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHeader icon="/brand/icon-mythicplus.jpg" title="M+ Meta">
      <template #right>
        <div class="flex items-center gap-2">
          <select
            v-model="period"
            class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
            aria-label="Week"
          >
            <option value="current">This week</option>
            <option
              v-for="p in (periods ?? []).filter((p) => !p.is_current)"
              :key="p.period_id"
              :value="p.period_id"
            >
              {{ periodLabel(p.start_at, p.is_current) }}
            </option>
          </select>
          <select
            v-model="region"
            class="text-xs bg-transparent border border-wsa-border rounded px-2 py-1 text-wsa-muted"
            aria-label="Region"
          >
            <option value="all">All regions</option>
            <option value="eu">EU</option>
            <option value="us">US</option>
          </select>
        </div>
      </template>
    </PageHeader>

    <CurrentAffixStrip :region="region" :period="period" />

    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_350px]">
      <div class="flex flex-col gap-4">
        <MetaDungeonCard :period="period" :region="region" />
        <MetaCompsCard v-model:spec-filter="specFilter" :period="period" :region="region" />
      </div>
      <MetaSpecCard
        v-model:spec-filter="specFilter"
        :period="period"
        :region="region"
        :prev-period-id="prevPeriodId"
      />
    </div>
  </div>
</template>
