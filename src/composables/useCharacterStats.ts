import { useQuery } from '@tanstack/vue-query'
import { fetchCharacterStats } from '@/api/stats'
import type { CharacterStatsResponse } from '@/types/stats'

const FIVE_MINUTES_MS = 5 * 60 * 1000

export function useCharacterStats() {
  return useQuery<CharacterStatsResponse>({
    queryKey: ['stats', 'characters'],
    queryFn: fetchCharacterStats,
    staleTime: FIVE_MINUTES_MS,
  })
}
