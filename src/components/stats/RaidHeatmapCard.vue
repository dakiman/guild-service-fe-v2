<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRaidKillStats } from '@/composables/useCharacterStats'
import { CLASS_COLORS } from '@/utils/wowConstants'

const CLASS_ABBREV: Record<number, string> = {
  1: 'WR',
  2: 'PA',
  3: 'HU',
  4: 'RO',
  5: 'PR',
  6: 'DK',
  7: 'SH',
  8: 'MA',
  9: 'WL',
  10: 'MO',
  11: 'DR',
  12: 'DH',
  13: 'EV',
}
const CLASS_IDS = [6, 12, 11, 13, 3, 8, 10, 2, 5, 4, 7, 9, 1]

function dotSize(kills: number, maxInRow: number): number {
  if (maxInRow === 0 || kills === 0) return 0
  return Math.max(3, Math.round((kills / maxInRow) * 16))
}

function getMaxInRow(killsByClass: Record<string, number>): number {
  const values = Object.values(killsByClass)
  return values.length > 0 ? Math.max(...values) : 0
}

function dotStyle(classId: number, kills: number, maxInRow: number) {
  const size = dotSize(kills, maxInRow)
  const color = CLASS_COLORS[classId] ?? '#666'
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: `radial-gradient(circle, ${color}, ${color}88)`,
    boxShadow: `0 0 4px ${color}66`,
  }
}

const difficulty = ref('heroic')
const expansion = ref('current')
const { data, isLoading, isFetching } = useRaidKillStats(difficulty, expansion)

watch(data, (val) => {
  if (val?.current_expansion && expansion.value === 'current') {
    expansion.value = val.current_expansion
  }
})
</script>

<template>
  <div class="stats-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="stats-card-title">Raid Boss Kills by Class</h3>
      <div class="flex items-center gap-2">
        <select
          v-if="data?.expansions?.length"
          v-model="expansion"
          class="text-[10px] px-2 py-0.5 rounded border border-[#5c4a32] bg-transparent text-[#e0d0b0] outline-none cursor-pointer"
        >
          <option
            v-for="exp in data.expansions"
            :key="exp"
            :value="exp"
            class="bg-[#1a1410] text-[#e0d0b0]"
          >
            {{ exp }}
          </option>
        </select>
        <div class="flex gap-1">
          <button
            v-for="diff in ['normal', 'heroic', 'mythic']"
            :key="diff"
            class="text-[10px] px-2 py-0.5 rounded border capitalize"
            :class="
              difficulty === diff
                ? 'border-[#aa8855] text-[#ffcc88] bg-[rgba(170,136,85,0.15)]'
                : 'border-[#5c4a32] text-[#665533]'
            "
            @click="difficulty = diff"
          >
            {{ diff }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-xs text-[#665533] py-4 text-center">Loading...</div>

    <div
      v-else-if="data?.raids.length"
      class="transition-opacity duration-200"
      :class="{ 'opacity-50 pointer-events-none': isFetching }"
    >
      <!-- Class header row -->
      <div class="heatmap-grid mb-2">
        <div></div>
        <div
          v-for="classId in CLASS_IDS"
          :key="classId"
          class="text-center text-[10px] font-semibold"
          :style="{ color: CLASS_COLORS[classId] }"
        >
          {{ CLASS_ABBREV[classId] }}
        </div>
      </div>

      <!-- Raid sections -->
      <div v-for="raid in data.raids" :key="raid.instance_id" class="mb-3">
        <div class="text-xs font-semibold text-[#aa8855] mb-1.5 pl-2 border-l-3 border-[#5c4a32]">
          {{ raid.name }}
        </div>

        <!-- Boss rows -->
        <div
          v-for="boss in raid.bosses"
          :key="boss.encounter_id"
          class="heatmap-grid items-center py-0.5"
        >
          <span class="text-xs text-[#e0d0b0] truncate pr-2">{{ boss.name }}</span>
          <div
            v-for="classId in CLASS_IDS"
            :key="classId"
            class="flex items-center justify-center"
          >
            <div
              v-if="(boss.kills_by_class[String(classId)] ?? 0) > 0"
              class="heatmap-dot rounded-full"
              :title="`${CLASS_ABBREV[classId]}: ${boss.kills_by_class[String(classId)]} kills`"
              :style="
                dotStyle(
                  classId,
                  boss.kills_by_class[String(classId)] ?? 0,
                  getMaxInRow(boss.kills_by_class),
                )
              "
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-xs text-[#665533] italic py-4 text-center">No raid data</div>
  </div>
</template>

<style scoped>
.heatmap-grid {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) repeat(13, minmax(28px, 1fr));
}
.heatmap-dot {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.heatmap-dot:hover {
  transform: scale(1.4);
}
</style>
