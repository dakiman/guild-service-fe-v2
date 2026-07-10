<script setup lang="ts">
import { ref, computed } from 'vue'
import { SPEC_ROLES, SPEC_TO_CLASS, CLASS_COLORS, CLASSES } from '@/utils/wowConstants'
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

const groupedByClass = computed(() => {
  const groups = new Map<number, SpecDistribution[]>()
  for (const spec of filteredSpecs.value) {
    const existing = groups.get(spec.class_id) || []
    existing.push(spec)
    groups.set(spec.class_id, existing)
  }
  return [...groups.entries()]
    .map(([classId, specs]) => ({
      classId,
      specs: specs.sort((a, b) => b.count - a.count),
      totalCount: specs.reduce((sum, s) => sum + s.count, 0),
    }))
    .sort((a, b) => b.totalCount - a.totalCount)
})

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
</script>

<template>
  <div class="stats-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="stats-card-title">Spec Popularity</h3>
      <div class="flex gap-1">
        <button
          v-for="role in roles"
          :key="role"
          class="text-[10px] px-2 py-0.5 rounded border"
          :class="
            activeRole === role
              ? 'border-[#aa8855] text-[#ffcc88] bg-[rgba(170,136,85,0.15)]'
              : 'border-[#5c4a32] text-[#665533]'
          "
          @click="activeRole = role"
        >
          {{ roleLabel(role) }}
        </button>
      </div>
    </div>

    <!-- Sample count -->
    <div class="text-[10px] text-[#665533] mb-3">
      {{ filteredTotal.toLocaleString() }} characters
    </div>

    <!-- Class groups -->
    <div class="flex flex-col gap-3">
      <div v-for="group in groupedByClass" :key="group.classId" class="flex flex-col gap-1">
        <!-- Class header -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-semibold" :style="{ color: CLASS_COLORS[group.classId] }">
            {{ CLASSES[group.classId] }}
          </span>
          <span class="text-[10px] text-[#665533]">{{ group.totalCount }}</span>
        </div>

        <!-- Spec bars within class -->
        <div
          v-for="spec in group.specs"
          :key="spec.spec_id"
          class="flex items-center gap-2"
        >
          <SpecIcon :spec-id="spec.spec_id" :size="16" />
          <div class="flex-1 h-[6px] rounded bg-[rgba(0,0,0,0.3)] overflow-hidden">
            <div
              class="h-full rounded"
              :style="{
                width: `${(spec.count / maxSpecCount) * 100}%`,
                backgroundColor: CLASS_COLORS[spec.class_id],
                opacity: 0.8,
              }"
            />
          </div>
          <span class="text-[10px] tabular-nums text-[#e0d0b0] w-8 text-right">
            {{ filteredTotal > 0 ? ((spec.count / filteredTotal) * 100).toFixed(1) : '0.0' }}%
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="filteredSpecs.length === 0"
      class="text-xs text-[#665533] italic py-4 text-center"
    >
      No spec data
    </div>
  </div>
</template>
