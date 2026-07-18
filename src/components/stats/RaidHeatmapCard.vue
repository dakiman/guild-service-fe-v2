<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRaidKillStats } from '@/composables/useCharacterStats'
import { useAllRaidInstances } from '@/composables/usePveGameData'
import { CLASS_COLORS, CLASSES } from '@/utils/wowConstants'
import ClassIcon from '@/components/wow/ClassIcon.vue'

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
// The query ref stays 'current' so the fetch key never changes when the BE
// resolves the concrete current-expansion name — avoids a duplicate cache
// entry (and a second fetch) for identical data. (F2)
const expansion = ref('current')
const { data, isLoading, isFetching } = useRaidKillStats(difficulty, expansion)
const { data: raidGameData } = useAllRaidInstances()

const resolvedCurrent = computed(() => data.value?.current_expansion ?? null)

// The dropdown shows the concrete current-expansion name while the query key
// stays 'current'; re-picking the resolved current maps back to 'current'.
const expansionModel = computed({
  get: () => (expansion.value === 'current' ? (resolvedCurrent.value ?? 'current') : expansion.value),
  set: (v) => {
    expansion.value = v === resolvedCurrent.value ? 'current' : v
  },
})

const raidMediaMap = computed(() => {
  const map = new Map<number, string>()
  for (const inst of raidGameData.value?.instances ?? []) {
    if (inst.media_url) map.set(inst.id, inst.media_url)
  }
  return map
})
</script>

<template>
  <div class="wsa-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wsa-text-heading text-[15px]">Raid Boss Kills by Class</h3>
      <div class="flex items-center gap-2">
        <select
          v-if="(data?.expansions?.length ?? 0) > 1"
          v-model="expansionModel"
          class="text-[10px] px-2 py-0.5 rounded border border-wsa-border bg-transparent text-wsa-text outline-none cursor-pointer"
        >
          <option
            v-for="exp in data?.expansions ?? []"
            :key="exp"
            :value="exp"
            class="bg-base-100 text-wsa-text"
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
                ? 'border-wsa-muted text-wsa-gold bg-wsa-muted/15'
                : 'border-wsa-border text-wsa-disabled'
            "
            @click="difficulty = diff"
          >
            {{ diff }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-xs text-wsa-disabled py-4 text-center">Loading...</div>

    <div
      v-else-if="data?.raids.length"
      class="overflow-x-auto transition-opacity duration-200"
      :class="{ 'opacity-50 pointer-events-none': isFetching }"
    >
      <div class="min-w-[520px]">
        <!-- Class header row -->
        <div class="heatmap-grid mb-2">
          <div></div>
          <div
            v-for="classId in CLASS_IDS"
            :key="classId"
            class="flex items-center justify-center"
          >
            <ClassIcon :class-id="classId" :size="18" />
          </div>
        </div>

        <!-- Raid sections -->
        <div v-for="raid in data.raids" :key="raid.instance_id" class="mb-3">
          <div class="flex items-center gap-1.5 mb-1.5 pl-2 border-l-3 border-wsa-border">
            <img
              v-if="raidMediaMap.get(raid.instance_id)"
              :src="raidMediaMap.get(raid.instance_id)"
              :alt="raid.name"
              class="w-5 h-5 rounded object-cover"
            />
            <span class="text-xs font-semibold text-wsa-muted">{{ raid.name }}</span>
          </div>

          <!-- Boss rows -->
          <div
            v-for="boss in raid.bosses"
            :key="boss.encounter_id"
            class="heatmap-grid items-center py-0.5"
          >
            <span class="text-xs text-wsa-text truncate pr-2">{{ boss.name }}</span>
            <div
              v-for="classId in CLASS_IDS"
              :key="classId"
              class="flex items-center justify-center"
            >
              <div
                v-if="(boss.kills_by_class[String(classId)] ?? 0) > 0"
                class="heatmap-dot rounded-full"
                :title="`${CLASSES[classId]}: ${boss.kills_by_class[String(classId)]} kills`"
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
    </div>

    <div v-else class="text-xs text-wsa-disabled italic py-4 text-center">No raid data</div>
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
