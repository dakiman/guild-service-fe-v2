<template>
  <div class="flex flex-col gap-4">
    <div v-if="!entries || entries.length === 0" class="text-ma-muted/70 text-sm">
      No raid encounter kills recorded.
    </div>

    <div v-else v-for="group in groupedByInstance" :key="group.instance_id" class="card bg-base-200">
      <div class="card-body p-4">
        <h3 class="card-title text-base">
          {{ group.instance_name }}
          <span class="text-xs text-ma-muted/70 font-normal">{{ group.expansion }}</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="kill in group.kills"
            :key="`${kill.encounter_id}-${kill.difficulty}`"
            class="flex items-center justify-between text-sm border-l-2 pl-2"
            :class="difficultyBorderClass(kill.difficulty)"
          >
            <div class="flex flex-col">
              <span>{{ kill.encounter_name }}</span>
              <span class="text-xs text-ma-muted/70">{{ kill.difficulty }} · {{ kill.completed_count }}x</span>
            </div>
            <span class="text-xs text-ma-muted/60 tabular-nums">{{ formatTimestamp(kill.last_kill_timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  entries: RaidEncounterProgress[] | null
}>()

interface InstanceGroup {
  instance_id: number
  instance_name: string
  expansion: string
  kills: RaidEncounterProgress[]
}

const groupedByInstance = computed<InstanceGroup[]>(() => {
  if (!props.entries) return []
  const map = new Map<number, InstanceGroup>()
  for (const entry of props.entries) {
    const existing = map.get(entry.instance_id)
    if (existing) {
      existing.kills.push(entry)
    } else {
      map.set(entry.instance_id, {
        instance_id: entry.instance_id,
        instance_name: entry.instance_name,
        expansion: entry.expansion,
        kills: [entry],
      })
    }
  }
  return Array.from(map.values())
})

function difficultyBorderClass(difficulty: string): string {
  const lower = difficulty.toLowerCase()
  if (lower.includes('mythic')) return 'border-orange-500'
  if (lower.includes('heroic')) return 'border-purple-500'
  if (lower.includes('normal')) return 'border-blue-500'
  return 'border-gray-500'
}

function formatTimestamp(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
