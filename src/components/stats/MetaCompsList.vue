<script setup lang="ts">
import { computed, ref } from 'vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import { SPEC_ROLES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { compTitle, specFullName } from '@/utils/specLabels'
import type { CompEntry, PairingEntry } from '@/types/meta'

const props = withDefaults(
  defineProps<{
    comps: CompEntry[]
    pairings: PairingEntry[]
    /** Spec id to narrow comps (and tank/healer pairings) to; null = show everything. */
    specFilter?: number | null
  }>(),
  { specFilter: null },
)

const COMPS_COLLAPSED = 10
const PAIRINGS_COLLAPSED = 8
const ICON = 22

const expanded = ref(false)

function compHasSpec(comp: CompEntry, specId: number): boolean {
  return (
    comp.tank_spec_id === specId ||
    comp.healer_spec_id === specId ||
    comp.dps_spec_ids.includes(specId)
  )
}

// Rank is the position in the UNFILTERED list so "#12" still means "12th most
// popular comp overall" when a filter is active.
const compRank = computed(() => new Map(props.comps.map((c, i) => [c.signature, i + 1])))
const pairingKey = (p: PairingEntry): string => `${p.tank_spec_id}-${p.healer_spec_id}`
const pairingRank = computed(() => new Map(props.pairings.map((p, i) => [pairingKey(p), i + 1])))

const filteredComps = computed(() => {
  const id = props.specFilter
  return id === null ? props.comps : props.comps.filter((c) => compHasSpec(c, id))
})
// A DPS spec never appears in a pairing — leave pairings untouched for those.
const filteredPairings = computed(() => {
  const id = props.specFilter
  if (id === null || SPEC_ROLES[id] === 'dps') return props.pairings
  return props.pairings.filter((p) => p.tank_spec_id === id || p.healer_spec_id === id)
})

const visibleComps = computed(() =>
  expanded.value ? filteredComps.value : filteredComps.value.slice(0, COMPS_COLLAPSED),
)
const visiblePairings = computed(() =>
  expanded.value ? filteredPairings.value : filteredPairings.value.slice(0, PAIRINGS_COLLAPSED),
)

// Bars scale against the unfiltered maximum so a niche spec's comps read as small.
const topCompCount = computed(() => Math.max(1, ...props.comps.map((c) => c.count)))
const topPairingCount = computed(() => Math.max(1, ...props.pairings.map((p) => p.count)))

const hasMore = computed(
  () =>
    filteredComps.value.length > COMPS_COLLAPSED ||
    filteredPairings.value.length > PAIRINGS_COLLAPSED,
)
const filterName = computed(() =>
  props.specFilter === null ? null : specFullName(props.specFilter),
)

function pct(count: number, max: number): string {
  return `${(count / max) * 100}%`
}
</script>

<template>
  <div v-if="comps.length === 0" class="text-xs text-wsa-disabled italic py-4 text-center">
    No comp data yet (below minimum sample)
  </div>
  <div v-else class="flex flex-col gap-4">
    <p
      v-if="filteredComps.length === 0"
      class="text-xs text-wsa-disabled italic py-4 text-center"
    >
      No top comps include {{ filterName }}
    </p>
    <ol v-else class="flex flex-col gap-1.5">
      <li
        v-for="comp in visibleComps"
        :key="comp.signature"
        data-testid="comp-row"
        class="flex items-center gap-2 text-xs"
        :title="compTitle(comp)"
      >
        <span class="w-6 shrink-0 text-right tabular-nums text-wsa-disabled">
          #{{ compRank.get(comp.signature) }}
        </span>
        <span class="inline-flex shrink-0 items-center gap-0.5">
          <SpecIcon
            :spec-id="comp.tank_spec_id"
            :fallback-class-id="SPEC_TO_CLASS[comp.tank_spec_id] ?? null"
            :size="ICON"
          />
          <SpecIcon
            :spec-id="comp.healer_spec_id"
            :fallback-class-id="SPEC_TO_CLASS[comp.healer_spec_id] ?? null"
            :size="ICON"
          />
        </span>
        <span
          data-testid="role-divider"
          class="h-4 shrink-0 border-l border-wsa-border/40"
          aria-hidden="true"
        />
        <span class="inline-flex shrink-0 items-center gap-0.5">
          <SpecIcon
            v-for="(specId, i) in comp.dps_spec_ids"
            :key="`${comp.signature}-dps-${i}`"
            :spec-id="specId"
            :fallback-class-id="SPEC_TO_CLASS[specId] ?? null"
            :size="ICON"
          />
        </span>
        <span class="flex-1 h-2 min-w-6 rounded-sm bg-wsa-muted/10 overflow-hidden">
          <span
            data-testid="comp-bar"
            class="block h-full rounded-sm bg-wsa-gold/70"
            :style="{ width: pct(comp.count, topCompCount) }"
          />
        </span>
        <span class="stats-value w-14 shrink-0 text-right">{{ comp.count.toLocaleString() }}</span>
        <span class="w-[4.5rem] shrink-0 text-right text-wsa-muted whitespace-nowrap">
          {{ Math.round(comp.timed_rate * 100) }}% timed
        </span>
      </li>
    </ol>

    <div v-if="filteredPairings.length">
      <h4 class="wsa-text-heading text-[13px] mb-2">Tank–Healer Pairings</h4>
      <ol class="flex flex-col gap-1">
        <li
          v-for="pair in visiblePairings"
          :key="pairingKey(pair)"
          data-testid="pairing-row"
          class="flex items-center gap-2 text-xs"
          :title="`${specFullName(pair.tank_spec_id)} · ${specFullName(pair.healer_spec_id)}`"
        >
          <span class="w-6 shrink-0 text-right tabular-nums text-wsa-disabled">
            #{{ pairingRank.get(pairingKey(pair)) }}
          </span>
          <span class="inline-flex shrink-0 items-center gap-0.5">
            <SpecIcon
              :spec-id="pair.tank_spec_id"
              :fallback-class-id="SPEC_TO_CLASS[pair.tank_spec_id] ?? null"
              :size="ICON"
            />
            <SpecIcon
              :spec-id="pair.healer_spec_id"
              :fallback-class-id="SPEC_TO_CLASS[pair.healer_spec_id] ?? null"
              :size="ICON"
            />
          </span>
          <span class="flex-1 h-2 min-w-6 rounded-sm bg-wsa-muted/10 overflow-hidden">
            <span
              data-testid="pairing-bar"
              class="block h-full rounded-sm bg-wsa-gold/70"
              :style="{ width: pct(pair.count, topPairingCount) }"
            />
          </span>
          <span class="stats-value w-14 shrink-0 text-right">{{ pair.count.toLocaleString() }}</span>
          <span class="w-[4.5rem] shrink-0 text-right text-wsa-muted whitespace-nowrap">
            {{ Math.round(pair.timed_rate * 100) }}% timed
          </span>
        </li>
      </ol>
    </div>

    <button
      v-if="hasMore"
      type="button"
      data-testid="comps-toggle"
      class="self-start text-xs text-wsa-gold hover:underline"
      @click="expanded = !expanded"
    >
      {{ expanded ? `Show top ${COMPS_COLLAPSED}` : `Show all ${filteredComps.length}` }}
    </button>
  </div>
</template>
