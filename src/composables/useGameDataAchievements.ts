import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { fetchGameDataAchievements } from '@/api/game-data'
import type { GameDataAchievement } from '@/types/character'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Fetch the full achievements catalog with aggressive client-side caching.
 *
 * Returns:
 *   - `query` — the TanStack Query result (loading, error, data).
 *   - `byId` — a computed Map<id, GameDataAchievement> for O(1) lookup.
 *
 * The catalog is ~1MB JSON, ~40k entries — fetched once per session.
 */
export function useGameDataAchievements() {
  const query = useQuery<GameDataAchievement[]>({
    queryKey: ['game-data', 'achievements'],
    queryFn: fetchGameDataAchievements,
    staleTime: ONE_DAY_MS,
    gcTime: ONE_DAY_MS,
  })

  const byId = computed<Map<number, GameDataAchievement>>(() => {
    const map = new Map<number, GameDataAchievement>()
    for (const a of query.data.value ?? []) {
      map.set(a.id, a)
    }

    return map
  })

  return { query, byId }
}
