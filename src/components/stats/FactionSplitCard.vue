<script setup lang="ts">
import { computed } from 'vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'
import { RACES, RACE_FACTIONS } from '@/utils/wowConstants'
import type { RaceDistribution } from '@/types/stats'

const props = defineProps<{
  horde: number
  alliance: number
  races: RaceDistribution[]
}>()

const total = computed(() => props.horde + props.alliance)
const hordePercent = computed(() => (total.value > 0 ? (props.horde / total.value) * 100 : 50))
const alliancePercent = computed(() => (total.value > 0 ? (props.alliance / total.value) * 100 : 50))

const BAR_COLORS = { Alliance: '#153a6a', Horde: '#7a1515', mixed: '#aa8855' } as const

interface MergedRace {
  raceId: number
  name: string
  count: number
  barColor: string
}

const mergedRaces = computed<MergedRace[]>(() => {
  const groups = new Map<string, { ids: number[]; name: string; count: number }>()
  for (const race of props.races) {
    const known = RACES[race.race_id]
    // Unknown ids never merge — each keeps its own "Race {id}" row.
    const key = known ?? `#${race.race_id}`
    const group = groups.get(key)
    if (group) {
      group.ids.push(race.race_id)
      group.count += race.count
    } else {
      groups.set(key, {
        ids: [race.race_id],
        name: known ?? `Race ${race.race_id}`,
        count: race.count,
      })
    }
  }
  return [...groups.values()]
    .map((group) => {
      const factions = new Set(group.ids.map((id) => RACE_FACTIONS[id] ?? null))
      const faction = factions.size === 1 ? [...factions][0] : null
      return {
        raceId: Math.min(...group.ids),
        name: group.name,
        count: group.count,
        barColor: faction ? BAR_COLORS[faction] : BAR_COLORS.mixed,
      }
    })
    .sort((a, b) => b.count - a.count)
})

const raceTotal = computed(() => props.races.reduce((sum, race) => sum + race.count, 0))
const maxRaceCount = computed(() => mergedRaces.value[0]?.count ?? 1)

function sharePercent(count: number): string {
  return raceTotal.value > 0 ? ((count / raceTotal.value) * 100).toFixed(1) : '0.0'
}
</script>

<template>
  <div class="wsa-card">
    <h3 class="wsa-text-heading text-[15px] mb-4">Faction Balance</h3>

    <div class="flex items-center justify-between gap-4 mb-3">
      <!-- Horde emblem + count -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="faction-emblem faction-emblem--horde shrink-0">
          <img src="/factions/horde.png" alt="Horde" class="w-8 h-8 object-contain" />
        </div>
        <div class="min-w-0">
          <div class="text-lg font-bold tabular-nums text-[#ff4444]">{{ horde.toLocaleString() }}</div>
          <div class="text-xs text-[#aa6666]">Horde</div>
        </div>
      </div>

      <!-- Alliance emblem + count -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="min-w-0">
          <div class="text-lg font-bold tabular-nums text-[#3399ff] text-right">{{ alliance.toLocaleString() }}</div>
          <div class="text-xs text-[#6688aa] text-right">Alliance</div>
        </div>
        <div class="faction-emblem faction-emblem--alliance shrink-0">
          <img src="/factions/alliance.png" alt="Alliance" class="w-8 h-8 object-contain" />
        </div>
      </div>
    </div>

    <!-- Territory bar -->
    <div class="territory-bar">
      <div class="territory-horde" :style="{ width: hordePercent + '%' }"></div>
      <div class="territory-alliance" :style="{ width: alliancePercent + '%' }"></div>
      <div class="battle-line" :style="{ left: hordePercent + '%' }"></div>
    </div>

    <div class="flex justify-between mt-1.5">
      <span class="text-xs font-semibold text-[#aa6666]">{{ hordePercent.toFixed(1) }}%</span>
      <span class="text-xs font-semibold text-[#6688aa]">{{ alliancePercent.toFixed(1) }}%</span>
    </div>

    <!-- Races -->
    <div class="mt-5">
      <h4 class="stats-label font-medium uppercase tracking-wide mb-2">Races</h4>
      <div class="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
        <div
          v-for="race in mergedRaces"
          :key="race.raceId"
          class="flex items-center gap-2"
        >
          <RaceIcon :race-id="race.raceId" :size="20" />
          <span data-test="race-name" class="text-xs text-[#e0d0b0] w-24 truncate">
            {{ race.name }}
          </span>
          <div class="flex-1 h-[5px] rounded bg-[rgba(0,0,0,0.3)] overflow-hidden">
            <div
              data-test="race-bar"
              class="h-full rounded opacity-70"
              :style="{
                width: `${(race.count / maxRaceCount) * 100}%`,
                backgroundColor: race.barColor,
              }"
            />
          </div>
          <span class="text-[10px] tabular-nums text-[#e0d0b0] whitespace-nowrap">
            {{ race.count.toLocaleString() }} · {{ sharePercent(race.count) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Emblem circles */
.faction-emblem {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: emblem-glow 4s ease-in-out infinite;
}

.faction-emblem--horde {
  background: radial-gradient(circle, #4a1010, #1a0505);
  border: 2px solid #6b2020;
  --glow-color: rgba(180, 40, 40, 0.4);
}

.faction-emblem--alliance {
  background: radial-gradient(circle, #0a2244, #050f1a);
  border: 2px solid #2255aa;
  --glow-color: rgba(40, 100, 200, 0.4);
}

/* Territory bar */
.territory-bar {
  position: relative;
  height: 28px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  border: 1px solid #5c4a32;
}

.territory-horde {
  height: 100%;
  background: linear-gradient(135deg, #4a0a0a, #7a1515, #5a0e0e);
  background-size: 100% 100%;
  position: relative;
}

/* Horde diagonal hatch overlay */
.territory-horde::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 100, 100, 0.08) 4px,
    rgba(255, 100, 100, 0.08) 8px
  );
}

.territory-alliance {
  height: 100%;
  background: linear-gradient(135deg, #0a2244, #153a6a, #0e2a55);
  position: relative;
}

/* Alliance diagonal hatch overlay (opposite direction) */
.territory-alliance::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 4px,
    rgba(100, 150, 255, 0.08) 4px,
    rgba(100, 150, 255, 0.08) 8px
  );
}

/* Gold battle line at split point */
.battle-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, #cc7700, #ffaa00, #cc7700);
  box-shadow: 0 0 6px rgba(255, 170, 0, 0.7);
  z-index: 1;
  animation: battle-pulse 3s ease-in-out infinite;
}

/* Animations */
@keyframes battle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes emblem-glow {
  0%, 100% { box-shadow: 0 0 14px var(--glow-color); }
  50% { box-shadow: 0 0 22px var(--glow-color); }
}
</style>
