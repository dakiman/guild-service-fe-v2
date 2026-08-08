<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import MetaSpecList from '@/components/stats/MetaSpecList.vue'
import { isNotWarmedError, useMetaSpecs } from '@/composables/useMetaStats'
import type { MetaPeriodParam, MetaRegion, SpecMetaEntry } from '@/types/meta'

const props = withDefaults(defineProps<{
  period: MetaPeriodParam
  region: MetaRegion
  prevPeriodId?: number | null
}>(), {
  prevPeriodId: null,
})

const role = ref<'tank' | 'healer' | 'dps'>('dps')
const bracket = ref('all')

const { data, isLoading, isError, error } = useMetaSpecs(toRef(props, 'period'), toRef(props, 'region'))
const prevPeriod = computed<MetaPeriodParam>(() => props.prevPeriodId ?? 'current')
const { data: prevData } = useMetaSpecs(prevPeriod, toRef(props, 'region'))

const notWarmed = computed(() => isNotWarmedError(error.value))

// JS orders integer-like object keys first, so a raw Object.keys() renders
// "+7 / +12 / +17 / All keys" — force "All keys" (the default) to the front.
const bracketKeys = computed(() => {
  const keys = Object.keys(data.value?.brackets ?? {})
  const numeric = keys.filter((k) => k !== 'all').sort((a, b) => Number(a) - Number(b))
  return keys.includes('all') ? ['all', ...numeric] : numeric
})
const entries = computed<SpecMetaEntry[]>(
  () => data.value?.brackets[bracket.value]?.roles[role.value] ?? [],
)
const totalRuns = computed(() => data.value?.brackets[bracket.value]?.total_runs ?? 0)
const prevShares = computed<Record<number, number> | null>(() => {
  if (props.prevPeriodId === null) return null
  const prev = prevData.value?.brackets[bracket.value]?.roles[role.value]
  if (!prev) return null
  return Object.fromEntries(prev.map((e) => [e.spec_id, e.share]))
})

const roles = ['tank', 'healer', 'dps'] as const
</script>

<template>
  <div class="wsa-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wsa-text-heading text-[15px]">Spec Meta</h3>
      <div class="flex gap-1">
        <button
          v-for="r in roles"
          :key="r"
          class="text-[10px] px-2 py-0.5 rounded border capitalize"
          :class="role === r ? 'border-wsa-muted text-wsa-gold bg-wsa-muted/15' : 'border-wsa-border text-wsa-disabled'"
          @click="role = r"
        >
          {{ r }}
        </button>
      </div>
    </div>
    <div class="flex gap-1 mb-3">
      <button
        v-for="key in bracketKeys"
        :key="key"
        class="text-[10px] px-2 py-0.5 rounded border"
        :class="bracket === key ? 'border-wsa-muted text-wsa-gold bg-wsa-muted/15' : 'border-wsa-border text-wsa-disabled'"
        @click="bracket = key"
      >
        {{ key === 'all' ? 'All keys' : `+${key} and up` }}
      </button>
    </div>

    <div v-if="isLoading" class="wsa-skeleton h-64" />
    <div v-else-if="isError && notWarmed" class="text-xs text-wsa-disabled italic py-4 text-center">
      Spec meta isn't warmed yet — check back after the next crawl.
    </div>
    <ErrorState
      v-else-if="isError"
      hide-retry
      title="Failed to load spec meta"
      message="Spec meta couldn't be loaded right now. Try again in a moment."
    />
    <template v-else>
      <MetaSpecList :entries="entries" :prev-shares="prevShares" />
      <p class="mt-3 text-[10px] text-wsa-disabled">{{ totalRuns.toLocaleString() }} runs in bracket</p>
    </template>
  </div>
</template>
