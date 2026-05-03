<template>
  <div>
    <div class="flex h-3 rounded-full overflow-hidden bg-base-300">
      <div
        v-if="total > 0"
        :style="{ width: `${alliancePct}%`, backgroundColor: FACTION_COLORS.Alliance }"
      />
      <div
        v-if="total > 0"
        :style="{ width: `${hordePct}%`, backgroundColor: FACTION_COLORS.Horde }"
      />
    </div>
    <div class="flex items-center justify-between text-sm mt-2">
      <span class="flex items-center gap-2">
        <FactionBadge faction="Alliance" />
        {{ alliance.toLocaleString() }} ({{ alliancePct.toFixed(1) }}%)
      </span>
      <span class="flex items-center gap-2">
        <FactionBadge faction="Horde" />
        {{ horde.toLocaleString() }} ({{ hordePct.toFixed(1) }}%)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { FACTION_COLORS } from '@/utils/wowConstants'

const props = defineProps<{
  alliance: number
  horde: number
}>()

const total = computed(() => props.alliance + props.horde)
const alliancePct = computed(() =>
  total.value === 0 ? 0 : (props.alliance / total.value) * 100,
)
const hordePct = computed(() =>
  total.value === 0 ? 0 : (props.horde / total.value) * 100,
)
</script>
