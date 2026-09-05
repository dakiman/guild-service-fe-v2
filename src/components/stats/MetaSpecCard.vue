<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import MetaSpecList from '@/components/stats/MetaSpecList.vue'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'
import { isNotWarmedError, useMetaSpecs } from '@/composables/useMetaStats'
import { bracketLabel } from '@/utils/wowConstants'
import type { MetaPeriodParam, MetaRegion, SpecMetaEntry } from '@/types/meta'

const props = withDefaults(defineProps<{
  period: MetaPeriodParam
  region: MetaRegion
  prevPeriodId?: number | null
  /** Active Top Comps spec filter (v-model:spec-filter from MetaPage). */
  specFilter?: number | null
}>(), {
  prevPeriodId: null,
  specFilter: null,
})

const emit = defineEmits<{ 'update:specFilter': [specId: number | null] }>()

function onSelectSpec(specId: number): void {
  emit('update:specFilter', props.specFilter === specId ? null : specId)
}

const role = ref<'tank' | 'healer' | 'dps'>('dps')
const bracket = ref('7')

const { data, isLoading, isError, error } = useMetaSpecs(toRef(props, 'period'), toRef(props, 'region'))
const prevPeriod = computed<MetaPeriodParam>(() => props.prevPeriodId ?? 'current')
const { data: prevData } = useMetaSpecs(
  prevPeriod,
  toRef(props, 'region'),
  computed(() => props.prevPeriodId !== null),
)

const notWarmed = computed(() => isNotWarmedError(error.value))

// JS orders integer-like object keys first, so Object.keys() would already be
// numeric-ascending — but make it explicit, and demote "All keys" to the end:
// a blend across key levels is the least meaningful view of a censored sample.
const bracketKeys = computed(() => {
  const keys = Object.keys(data.value?.brackets ?? {})
  const numeric = keys.filter((k) => k !== 'all').sort((a, b) => Number(a) - Number(b))
  return keys.includes('all') ? [...numeric, 'all'] : numeric
})

// Old snapshots / custom BLIZZARD_LADDER_BRACKETS may lack '7' — fall back to
// the first pill so the card never shows an empty bracket.
watchEffect(() => {
  const keys = bracketKeys.value
  if (keys.length && !keys.includes(bracket.value)) bracket.value = keys[0]
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
          type="button"
          class="text-[10px] px-2 py-1 min-h-6 rounded border capitalize"
          :class="role === r ? 'border-wsa-muted text-wsa-gold bg-wsa-muted/15' : 'border-wsa-border text-wsa-disabled'"
          @click="role = r"
        >
          {{ r }}
        </button>
      </div>
    </div>
    <div class="flex flex-wrap gap-1 mb-3">
      <button
        v-for="key in bracketKeys"
        :key="key"
        type="button"
        class="text-[10px] px-2 py-1 min-h-6 rounded border whitespace-nowrap"
        :class="bracket === key ? 'border-wsa-muted text-wsa-gold bg-wsa-muted/15' : 'border-wsa-border text-wsa-disabled'"
        @click="bracket = key"
      >
        {{ bracketLabel(key) }}
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
      <MetaSpecList
        :entries="entries"
        :prev-shares="prevShares"
        :active-spec-id="specFilter"
        @select-spec="onSelectSpec"
      />
      <p class="mt-3 text-[10px] text-wsa-disabled">{{ totalRuns.toLocaleString() }} runs in bracket</p>
      <CoverageStamp class="mt-1" variant="official" :timestamp="data?.computed_at" />
    </template>
  </div>
</template>
