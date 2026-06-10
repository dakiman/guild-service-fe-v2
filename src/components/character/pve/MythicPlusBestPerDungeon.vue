<template>
  <div class="wsa-card overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-wsa-border/30 text-[10px] uppercase tracking-wider text-wsa-muted/70">
          <th class="text-left px-3 py-2 font-medium">Dungeon</th>
          <th class="text-right px-3 py-2 font-medium">Level</th>
          <th class="text-right px-3 py-2 font-medium hidden sm:table-cell">Time</th>
          <th class="text-left px-3 py-2 font-medium hidden md:table-cell">Affixes</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.dungeon.id"
          class="border-b border-wsa-border/15 last:border-0"
        >
          <td class="px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <img
                v-if="row.dungeon.media_url"
                :src="row.dungeon.media_url"
                :alt="row.dungeon.name"
                class="w-7 h-7 rounded shrink-0"
                loading="lazy"
              />
              <div v-else class="w-7 h-7 rounded bg-base-300 shrink-0" />
              <span class="truncate text-wsa-text">{{ row.dungeon.name }}</span>
            </div>
          </td>
          <td class="px-3 py-2 text-right tabular-nums">
            <span v-if="row.bestRun" class="font-bold" :class="row.bestRun.is_completed_on_time ? 'text-wsa-gold' : 'text-wsa-muted/70'">
              +{{ row.bestRun.keystone_level }}
            </span>
            <span v-else class="text-wsa-muted/40">—</span>
          </td>
          <td class="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
            <span v-if="row.bestRun" :class="row.bestRun.is_completed_on_time ? 'text-wsa-text' : 'text-red-300/80'">
              {{ formatDuration(row.bestRun.duration) }}
            </span>
            <span v-else class="text-wsa-muted/40">—</span>
          </td>
          <td class="px-3 py-2 hidden md:table-cell">
            <div v-if="row.bestRun" class="flex gap-1 flex-wrap">
              <AffixIcon
                v-for="affix in row.bestRun.affixes"
                :key="affix.id"
                :affix-id="affix.id"
              />
            </div>
            <span v-else class="text-wsa-muted/40">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AffixIcon from './AffixIcon.vue'
import type { DungeonRun } from '@/types/character'
import type { MythicKeystoneDungeonGameData } from '@/types/gameData'
import { useWowheadRefresh } from '@/composables/useWowhead'

const props = defineProps<{
  runs: DungeonRun[]
  dungeons: MythicKeystoneDungeonGameData[]
  currentSeason: number | null
}>()

interface BestRow {
  dungeon: MythicKeystoneDungeonGameData
  bestRun: DungeonRun | null
}

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

useWowheadRefresh(seasonRuns)

const rows = computed<BestRow[]>(() => {
  const sorted = [...props.dungeons].sort((a, b) => a.name.localeCompare(b.name))
  // Hide dungeons with no runs this season — empty rows add visual noise
  // without information. The character still has the option to switch to
  // "All Runs" if they want the full historical view.
  return sorted
    .map((dungeon) => ({
      dungeon,
      bestRun: bestRunFor(dungeon.id),
    }))
    .filter((row) => row.bestRun !== null)
})

function bestRunFor(dungeonId: number): DungeonRun | null {
  const candidates = seasonRuns.value.filter((run) => run.dungeon_id === dungeonId)
  if (candidates.length === 0) return null
  return candidates.reduce((best, run) => {
    if (run.keystone_level > best.keystone_level) return run
    if (run.keystone_level === best.keystone_level && run.duration < best.duration) return run
    return best
  })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>
