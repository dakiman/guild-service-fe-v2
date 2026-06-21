import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { useRaidInstances } from '@/composables/usePveGameData'
import type { RaidEncounterProgress } from '@/types/character'
import type { RaidInstanceGameData } from '@/types/gameData'

export type RaidDifficulty = 'Mythic' | 'Heroic' | 'Normal' | 'LFR'

export interface BestRaidProgression {
  killed: number
  total: number
  difficulty: RaidDifficulty
  instanceName: string
}

const DIFFICULTY_PRIORITY: { key: 'mythic' | 'heroic' | 'normal' | 'lfr'; label: RaidDifficulty }[] = [
  { key: 'mythic', label: 'Mythic' },
  { key: 'heroic', label: 'Heroic' },
  { key: 'normal', label: 'Normal' },
  { key: 'lfr',    label: 'LFR' },
]

export function matchesDifficulty(
  row: RaidEncounterProgress,
  key: (typeof DIFFICULTY_PRIORITY)[number]['key'],
): boolean {
  const lower = row.difficulty.toLowerCase()
  if (key === 'lfr') return lower.includes('lfr') || lower.includes('raid finder')
  return lower.includes(key)
}

export function useBestRaidProgression(
  raidProgress: MaybeRefOrGetter<RaidEncounterProgress[] | null>,
): ComputedRef<BestRaidProgression | null> {
  const { data: raidData } = useRaidInstances()

  return computed<BestRaidProgression | null>(() => {
    const instances = raidData.value?.instances ?? []
    const progress = toValue(raidProgress) ?? []
    if (instances.length === 0) return null

    // Backend convention: smallest display_order = newest expansion. (P1.8)
    const newest = instances.reduce<RaidInstanceGameData | null>(
      (best, instance) =>
        best === null || instance.expansion.display_order < best.expansion.display_order
          ? instance
          : best,
      null,
    )
    if (newest === null) return null

    const latestInstances = instances.filter((i) => i.expansion.id === newest.expansion.id)

    for (const diff of DIFFICULTY_PRIORITY) {
      let best: { instance: RaidInstanceGameData; killed: number } | null = null
      for (const instance of latestInstances) {
        const killed = progress.filter(
          (row) => row.instance_id === instance.id && matchesDifficulty(row, diff.key),
        ).length
        if (killed > 0 && (!best || killed > best.killed)) {
          best = { instance, killed }
        }
      }
      if (best) {
        return {
          killed: best.killed,
          total: best.instance.encounters.length,
          difficulty: diff.label,
          instanceName: best.instance.name,
        }
      }
    }
    return null
  })
}

export function shortDifficulty(d: RaidDifficulty): string {
  return d === 'Mythic' ? 'M' : d === 'Heroic' ? 'H' : d === 'Normal' ? 'N' : 'LFR'
}
