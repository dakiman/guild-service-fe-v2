<script setup lang="ts">
import { ref, computed } from 'vue'
import { SPEC_ROLES, SPEC_TO_CLASS, CLASS_COLORS, CLASSES } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import type { SpecDistribution } from '@/types/stats'

const props = defineProps<{
  specs: SpecDistribution[]
  total: number
}>()

const activeRole = ref<'all' | 'tank' | 'healer' | 'dps'>('all')

const validSpecs = computed(() =>
  props.specs.filter((s) => SPEC_TO_CLASS[s.spec_id] === s.class_id),
)

const filteredSpecs = computed(() => {
  if (activeRole.value === 'all') return validSpecs.value
  return validSpecs.value.filter((s) => SPEC_ROLES[s.spec_id] === activeRole.value)
})

const filteredTotal = computed(() => filteredSpecs.value.reduce((sum, s) => sum + s.count, 0))

const sortedSpecs = computed(() => [...filteredSpecs.value].sort((a, b) => b.count - a.count))

const maxSpecCount = computed(() => {
  let max = 0
  for (const s of filteredSpecs.value) {
    if (s.count > max) max = s.count
  }
  return max || 1
})

const roles = ['all', 'tank', 'healer', 'dps'] as const

function roleLabel(role: string): string {
  return role === 'all' ? 'Overall' : role.charAt(0).toUpperCase() + role.slice(1)
}

// Vertical bar-chart geometry: tallest bar spans BAR_MAX px, others scale
// linearly; floor keeps near-zero specs visible.
const BAR_MAX = 96

function barHeight(count: number): number {
  return Math.max(2, Math.round((count / maxSpecCount.value) * BAR_MAX))
}

function specPct(count: number): string {
  return filteredTotal.value > 0 ? ((count / filteredTotal.value) * 100).toFixed(1) : '0.0'
}

function specTitle(spec: SpecDistribution): string {
  const name = SPEC_NAMES[spec.spec_id] ?? `Spec ${spec.spec_id}`
  return `${name} ${CLASSES[spec.class_id] ?? ''} — ${spec.count.toLocaleString()} (${specPct(spec.count)}%)`
}
</script>

<template>
  <div class="wsa-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wsa-text-heading text-[15px]">Spec Popularity</h3>
      <div class="flex gap-1">
        <button
          v-for="role in roles"
          :key="role"
          class="text-[10px] px-2 py-0.5 rounded border"
          :class="
            activeRole === role
              ? 'border-wsa-muted text-wsa-gold bg-wsa-muted/15'
              : 'border-wsa-border text-wsa-disabled'
          "
          @click="activeRole = role"
        >
          {{ roleLabel(role) }}
        </button>
      </div>
    </div>

    <!-- Sample count -->
    <div class="text-[10px] text-wsa-disabled mb-3">
      {{ filteredTotal.toLocaleString() }} characters
    </div>

    <!-- Vertical bar chart, one column per spec (raider.io style) -->
    <div v-if="sortedSpecs.length" class="overflow-x-auto">
      <div class="flex items-end gap-[3px]">
        <div
          v-for="spec in sortedSpecs"
          :key="spec.spec_id"
          class="flex-1 min-w-[26px] flex flex-col items-center"
          :title="specTitle(spec)"
        >
          <div class="w-full flex flex-col items-center justify-end gap-1" :style="{ height: `${BAR_MAX + 16}px` }">
            <span class="text-[9px] tabular-nums text-wsa-muted leading-none">
              {{ specPct(spec.count) }}%
            </span>
            <div
              class="w-[70%] rounded-t-sm"
              :style="{
                height: `${barHeight(spec.count)}px`,
                backgroundColor: CLASS_COLORS[spec.class_id],
                opacity: 0.85,
              }"
            />
          </div>
          <div class="mt-1.5 pt-1.5 border-t border-wsa-border/40 w-full flex justify-center">
            <SpecIcon :spec-id="spec.spec_id" :size="18" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="filteredSpecs.length === 0"
      class="text-xs text-wsa-disabled italic py-4 text-center"
    >
      No spec data
    </div>
  </div>
</template>
