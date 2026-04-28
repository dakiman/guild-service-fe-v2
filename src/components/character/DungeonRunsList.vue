<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Mythic+ Runs</h2>
      <p v-if="!runs.length" class="text-base-content/60">No mythic+ runs recorded.</p>
      <div v-else class="flex flex-col gap-3">
        <div v-for="run in runs" :key="run.id" class="rounded bg-base-100 p-4">
          <div class="flex flex-wrap items-center gap-3 mb-3">
            <h3 class="font-semibold flex-1">{{ run.dungeon_name }}</h3>
            <span class="badge badge-primary text-base font-bold">+{{ run.keystone_level }}</span>
            <span
              class="badge"
              :class="run.is_completed_on_time ? 'badge-success' : 'badge-error'"
            >
              {{ run.is_completed_on_time ? 'On time' : 'Over time' }}
            </span>
            <span class="text-sm text-base-content/70">
              {{ formatDuration(run.duration) }}
            </span>
          </div>

          <div v-if="run.affixes.length" class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="affix in run.affixes"
              :key="affix.id"
              class="badge badge-outline badge-sm"
            >
              {{ affix.name }}
            </span>
          </div>

          <div v-if="run.members.length" class="overflow-x-auto">
            <table class="table table-xs">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Spec</th>
                  <th class="text-right">iLvl</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in run.members" :key="member.character_id">
                  <td>{{ member.character_name }}</td>
                  <td class="text-base-content/70">{{ member.spec_name }}</td>
                  <td class="text-right font-mono">{{ member.equipped_item_level }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DungeonRun } from '@/types/character'

defineProps<{ runs: DungeonRun[] }>()

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>
