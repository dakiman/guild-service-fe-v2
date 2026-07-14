import { useQuery } from '@tanstack/vue-query'
import { getRaidInstances, getMythicKeystoneDungeons, getRealms, getSeasons } from '@/api/gameData'
import type {
  RaidInstancesResponse,
  MythicKeystoneDungeonsResponse,
  RealmsResponse,
  SeasonsResponse,
} from '@/types/gameData'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

export function useRaidInstances() {
  return useQuery<RaidInstancesResponse>({
    queryKey: ['game-data', 'raid-instances', 'current'],
    queryFn: ({ signal }) => getRaidInstances({ expansion: 'current' }, { signal }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useAllRaidInstances() {
  return useQuery<RaidInstancesResponse>({
    queryKey: ['game-data', 'raid-instances', 'all'],
    queryFn: ({ signal }) => getRaidInstances({ expansion: 'all' }, { signal }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useMythicDungeons() {
  return useQuery<MythicKeystoneDungeonsResponse>({
    queryKey: ['game-data', 'mythic-keystone-dungeons', 'current'],
    queryFn: ({ signal }) => getMythicKeystoneDungeons({ season: 'current' }, { signal }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useRealmIndex() {
  return useQuery<RealmsResponse>({
    queryKey: ['game-data', 'realms'],
    queryFn: ({ signal }) => getRealms({ signal }),
    staleTime: Infinity,
    gcTime: ONE_WEEK_MS,
  })
}

export function useSeasons() {
  return useQuery<SeasonsResponse>({
    queryKey: ['game-data', 'seasons'],
    queryFn: ({ signal }) => getSeasons({ signal }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}
