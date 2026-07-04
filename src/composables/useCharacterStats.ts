import { useQuery } from '@tanstack/vue-query'
import { fetchCharacterStats, fetchRaidKillStats, fetchTopKeys, fetchTopRuns } from '@/api/stats'
import type {
  CharacterStatsResponse,
  RaidKillStatsResponse,
  TopKeysResponse,
  TopRun,
} from '@/types/stats'
import type { Paginated } from '@/types/api'
import type { Ref } from 'vue'

const FIVE_MINUTES_MS = 5 * 60 * 1000

export function useCharacterStats() {
  return useQuery<CharacterStatsResponse>({
    queryKey: ['stats', 'characters'],
    queryFn: ({ signal }) => fetchCharacterStats({ signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}

export function useRaidKillStats(difficulty: Ref<string>, expansion: Ref<string>) {
  return useQuery<RaidKillStatsResponse>({
    queryKey: ['stats', 'raid-kills', difficulty, expansion],
    queryFn: ({ signal }) => fetchRaidKillStats(difficulty.value, expansion.value, { signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}

export function useTopKeys() {
  return useQuery<TopKeysResponse>({
    queryKey: ['stats', 'top-keys'],
    queryFn: ({ signal }) => fetchTopKeys({ signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}

export function useTopRuns(page: Ref<number>, perPage = 20, dungeonId?: Ref<number | undefined>) {
  return useQuery<Paginated<TopRun>>({
    queryKey: ['stats', 'top-runs', page, dungeonId],
    queryFn: ({ signal }) => fetchTopRuns(page.value, perPage, dungeonId?.value, { signal }),
    staleTime: FIVE_MINUTES_MS,
  })
}
