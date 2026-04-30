<template>
  <div class="flex flex-col gap-4">
    <div v-if="!entries || entries.length === 0" class="text-ma-muted/70 text-sm">
      No reputations recorded.
    </div>

    <div v-else v-for="group in groupedByExpansion" :key="group.label" class="card bg-base-200">
      <div class="card-body p-4">
        <h3 class="card-title text-base">{{ group.label }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="rep in group.entries"
            :key="rep.faction_id"
            class="flex flex-col gap-1 border-l-2 pl-2"
            :class="standingBorderClass(rep.standing)"
          >
            <div class="flex items-center justify-between text-sm">
              <span>{{ rep.faction_name }}</span>
              <span class="badge badge-sm" :class="standingBadgeClass(rep.standing)">
                {{ rep.standing }}
              </span>
            </div>
            <progress
              class="progress h-1.5"
              :class="standingProgressClass(rep.standing)"
              :value="rep.max > 0 ? rep.value % rep.max : 0"
              :max="rep.max || 1"
            />
            <span class="text-[10px] text-ma-muted/60 tabular-nums">
              {{ rep.value.toLocaleString() }} / {{ rep.max.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Reputation, ReputationStanding } from '@/types/character'

const props = defineProps<{
  entries: Reputation[] | null
}>()

interface ExpansionGroup {
  label: string
  order: number
  entries: Reputation[]
}

function bucketOf(rep: Reputation): { label: string; order: number } {
  if (rep.faction?.expansion) {
    return {
      label: rep.faction.expansion.name,
      order: rep.faction.expansion.display_order,
    }
  }

  return { label: 'Legacy', order: 99 }
}

const groupedByExpansion = computed<ExpansionGroup[]>(() => {
  if (!props.entries) return []
  const byLabel = new Map<string, ExpansionGroup>()
  for (const rep of props.entries) {
    const { label, order } = bucketOf(rep)
    let group = byLabel.get(label)
    if (!group) {
      group = { label, order, entries: [] }
      byLabel.set(label, group)
    }
    group.entries.push(rep)
  }
  return Array.from(byLabel.values())
    .sort((a, b) => a.order - b.order)
    .map((g) => ({
      ...g,
      entries: [...g.entries].sort((a, b) => a.faction_name.localeCompare(b.faction_name)),
    }))
})

function standingBorderClass(standing: ReputationStanding): string {
  return {
    hated: 'border-red-700',
    hostile: 'border-red-500',
    unfriendly: 'border-orange-500',
    neutral: 'border-gray-400',
    friendly: 'border-emerald-500',
    honored: 'border-blue-400',
    revered: 'border-purple-400',
    exalted: 'border-amber-400',
  }[standing]
}

function standingBadgeClass(standing: ReputationStanding): string {
  return {
    hated: 'badge-error',
    hostile: 'badge-error',
    unfriendly: 'badge-warning',
    neutral: 'badge-ghost',
    friendly: 'badge-success',
    honored: 'badge-info',
    revered: 'badge-secondary',
    exalted: 'badge-warning text-amber-700',
  }[standing]
}

function standingProgressClass(standing: ReputationStanding): string {
  return {
    hated: 'progress-error',
    hostile: 'progress-error',
    unfriendly: 'progress-warning',
    neutral: 'progress-info',
    friendly: 'progress-success',
    honored: 'progress-info',
    revered: 'progress-secondary',
    exalted: 'progress-warning',
  }[standing]
}
</script>
