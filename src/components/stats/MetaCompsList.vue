<script setup lang="ts">
import SpecIcon from '@/components/wow/SpecIcon.vue'
import { SPEC_TO_CLASS } from '@/utils/wowConstants'
import type { CompEntry, PairingEntry } from '@/types/meta'

defineProps<{ comps: CompEntry[]; pairings: PairingEntry[] }>()

function compSpecs(comp: CompEntry): number[] {
  return [comp.tank_spec_id, comp.healer_spec_id, ...comp.dps_spec_ids]
}
</script>

<template>
  <div v-if="comps.length === 0" class="text-xs text-wsa-disabled italic py-4 text-center">
    No comp data yet (below minimum sample)
  </div>
  <div v-else class="flex flex-col gap-4">
    <ul class="flex flex-col gap-1.5">
      <li v-for="comp in comps" :key="comp.signature" class="flex items-center gap-3 text-xs">
        <span
          class="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full border border-wsa-border/30 bg-wsa-card/40"
        >
          <SpecIcon
            v-for="(specId, i) in compSpecs(comp)"
            :key="`${comp.signature}-${i}`"
            :spec-id="specId"
            :fallback-class-id="SPEC_TO_CLASS[specId] ?? null"
            :size="18"
          />
        </span>
        <span class="stats-value w-16 text-right">{{ comp.count.toLocaleString() }}</span>
        <span class="text-wsa-muted">{{ Math.round(comp.timed_rate * 100) }}% timed</span>
      </li>
    </ul>

    <div v-if="pairings.length">
      <h4 class="wsa-text-heading text-[13px] mb-2">Tank–Healer Pairings</h4>
      <ul class="flex flex-col gap-1">
        <li
          v-for="pair in pairings"
          :key="`${pair.tank_spec_id}-${pair.healer_spec_id}`"
          class="flex items-center gap-3 text-xs"
        >
          <span class="inline-flex items-center gap-0.5">
            <SpecIcon
              :spec-id="pair.tank_spec_id"
              :fallback-class-id="SPEC_TO_CLASS[pair.tank_spec_id] ?? null"
              :size="18"
            />
            <SpecIcon
              :spec-id="pair.healer_spec_id"
              :fallback-class-id="SPEC_TO_CLASS[pair.healer_spec_id] ?? null"
              :size="18"
            />
          </span>
          <span class="stats-value w-16 text-right">{{ pair.count.toLocaleString() }}</span>
          <span class="text-wsa-muted">{{ Math.round(pair.timed_rate * 100) }}% timed</span>
        </li>
      </ul>
    </div>
  </div>
</template>
