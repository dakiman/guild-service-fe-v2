<template>
  <div
    class="flex items-center gap-3 p-2 rounded ma-card-inner"
    :class="{ 'opacity-40': !progress }"
  >
    <div class="shrink-0 w-10 h-10 rounded overflow-hidden bg-base-300 flex items-center justify-center">
      <img
        v-if="encounter.portrait_url"
        :src="encounter.portrait_url"
        :alt="encounter.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <Skull v-else class="w-5 h-5 text-ma-muted/40" />
    </div>

    <div class="flex flex-col flex-1 min-w-0">
      <span class="text-sm text-ma-text truncate">{{ encounter.name }}</span>
      <span v-if="progress" class="text-[11px] text-ma-muted/60 truncate">
        {{ progress.completed_count }} kill{{ progress.completed_count === 1 ? '' : 's' }}
        <template v-if="progress.last_kill_timestamp">
          · {{ formatTimestamp(progress.last_kill_timestamp) }}
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Skull } from 'lucide-vue-next'
import type { RaidEncounterGameData } from '@/types/gameData'
import type { RaidEncounterProgress } from '@/types/character'

defineProps<{
  encounter: RaidEncounterGameData
  progress: RaidEncounterProgress | null
}>()

function formatTimestamp(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
