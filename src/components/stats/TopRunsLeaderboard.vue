<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useTopRuns } from '@/composables/useCharacterStats'
import { getClassColor } from '@/utils/wowConstants'

const page = ref(1)
const { data, isLoading } = useTopRuns(page, 20)

const runs = computed(() => data.value?.data ?? [])
const lastPage = computed(() => data.value?.last_page ?? 1)

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function rankIndex(index: number): number {
  return (page.value - 1) * 20 + index + 1
}
</script>

<template>
  <div class="stats-card">
    <h3 class="stats-card-title mb-4">Top M+ Runs</h3>

    <div v-if="isLoading" class="text-xs text-[#665533] py-4 text-center">Loading...</div>

    <div v-else-if="runs.length">
      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[#aa8855] text-left">
              <th class="py-1.5 w-8">#</th>
              <th class="py-1.5">Dungeon</th>
              <th class="py-1.5 w-12 text-center">Key</th>
              <th class="py-1.5 w-14 text-right">Time</th>
              <th class="py-1.5 pl-3">Team</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(run, index) in runs"
              :key="run.id"
              class="border-b border-[rgba(92,74,50,0.2)]"
            >
              <!-- Rank -->
              <td
                class="py-2 font-bold tabular-nums"
                :class="rankIndex(index) < 3 ? 'text-[#aa8855]' : 'text-[#665533]'"
              >
                {{ rankIndex(index) }}
              </td>
              <!-- Dungeon -->
              <td class="py-2 text-[#e0d0b0] truncate max-w-[140px]">{{ run.dungeon_name }}</td>
              <!-- Key Level -->
              <td class="py-2 text-center font-bold text-[#ffcc88]">+{{ run.keystone_level }}</td>
              <!-- Duration -->
              <td class="py-2 text-right tabular-nums text-[#e0d0b0]">
                {{ formatDuration(run.duration) }}
              </td>
              <!-- Team -->
              <td class="py-2 pl-3">
                <div class="flex flex-wrap gap-x-2 gap-y-0.5">
                  <RouterLink
                    v-for="member in run.members"
                    :key="`${member.region}-${member.realm}-${member.name}`"
                    :to="{
                      name: 'character-detail',
                      params: {
                        region: member.region,
                        realm: member.realm,
                        name: member.name,
                      },
                    }"
                    class="hover:underline truncate max-w-[80px]"
                    :style="{ color: getClassColor(member.class_id ?? 0) ?? '#e0d0b0' }"
                  >
                    {{ displayName(member.name) }}
                  </RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex justify-center gap-2 mt-4">
        <button
          @click="page = Math.max(1, page - 1)"
          :disabled="page <= 1"
          class="text-xs px-3 py-1 rounded border border-[#5c4a32] text-[#aa8855] disabled:opacity-30"
        >
          Prev
        </button>
        <span class="text-xs text-[#665533] flex items-center">{{ page }} / {{ lastPage }}</span>
        <button
          @click="page = Math.min(lastPage, page + 1)"
          :disabled="page >= lastPage"
          class="text-xs px-3 py-1 rounded border border-[#5c4a32] text-[#aa8855] disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>

    <div v-else class="text-xs text-[#665533] italic py-4 text-center">No run data yet</div>
  </div>
</template>
