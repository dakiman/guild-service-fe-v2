<script setup lang="ts">
import { computed, ref } from 'vue'
import { CLASSES, CLASS_COLORS, SPEC_ROLES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import type { ClassDistribution } from '@/types/stats'

const props = defineProps<{
  classes: ClassDistribution[]
}>()

const activeRole = ref<'all' | 'tank' | 'healer' | 'dps'>('all')

const classesWithRole = computed(() => {
  if (activeRole.value === 'all') return Object.keys(CLASSES).map(Number)
  const specIds = Object.entries(SPEC_ROLES)
    .filter(([, role]) => role === activeRole.value)
    .map(([id]) => Number(id))
  return [...new Set(specIds.map((id) => SPEC_TO_CLASS[id]).filter(Boolean))]
})

const filteredClasses = computed(() =>
  props.classes
    .filter((c) => classesWithRole.value.includes(c.class_id))
    .sort((a, b) => b.avg_mythic_plus_rating - a.avg_mythic_plus_rating),
)

const maxRating = computed(() =>
  filteredClasses.value.length > 0 ? filteredClasses.value[0].avg_mythic_plus_rating : 1,
)

function innerGlowStyle(classId: number, widthPct: number) {
  const color = CLASS_COLORS[classId] ?? '#666'
  return {
    width: `${widthPct}%`,
    background: `linear-gradient(180deg, ${color}dd, ${color}, ${color}dd)`,
    boxShadow: `0 0 8px ${color}4d`,
    borderRadius: '3px',
    height: '8px',
  }
}

const roles = ['all', 'tank', 'healer', 'dps'] as const

function roleLabel(role: string): string {
  return role === 'all' ? 'Overall' : role.charAt(0).toUpperCase() + role.slice(1)
}
</script>

<template>
  <div class="stats-card">
    <div class="flex items-center justify-between mb-3">
      <h2 class="stats-card-title">Performance by Class</h2>
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

    <div class="flex flex-col gap-0.5">
      <div
        v-for="(entry, index) in filteredClasses"
        :key="entry.class_id"
        class="flex items-center gap-2.5 py-1.5"
      >
        <!-- Rank -->
        <span
          class="w-6 text-right text-xs font-bold tabular-nums"
          :class="index < 3 ? 'text-[#aa8855]' : 'text-[#665533]'"
        >
          {{ index < 3 ? '#' : '' }}{{ index + 1 }}
        </span>

        <!-- Class Icon -->
        <ClassIcon :class-id="entry.class_id" :size="28" />

        <!-- Class Name -->
        <span
          class="w-24 text-xs font-medium truncate"
          :style="{ color: CLASS_COLORS[entry.class_id] }"
        >
          {{ CLASSES[entry.class_id] }}
        </span>

        <!-- Bar -->
        <div
          class="flex-1 h-[10px] rounded bg-[rgba(0,0,0,0.3)] border border-[rgba(92,74,50,0.3)] overflow-hidden flex items-center"
        >
          <div
            :style="innerGlowStyle(entry.class_id, (entry.avg_mythic_plus_rating / maxRating) * 100)"
          />
        </div>

        <!-- M+ Rating -->
        <span class="w-10 text-right text-xs font-semibold tabular-nums text-[#ff8844]">
          {{ entry.avg_mythic_plus_rating.toFixed(0) }}
        </span>

        <!-- iLvl -->
        <span class="w-10 text-right text-xs tabular-nums text-[#88ccff]">
          {{ entry.avg_ilvl.toFixed(1) }}
        </span>
      </div>
    </div>
  </div>
</template>
