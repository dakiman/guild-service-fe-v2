import { useQuery } from '@tanstack/vue-query'
import { getRaidInstances, getMythicKeystoneDungeons, getRealms } from '@/api/gameData'
import type {
  RaidInstancesResponse,
  MythicKeystoneDungeonsResponse,
  RealmsResponse,
} from '@/types/gameData'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

export function useRaidInstances() {
  return useQuery<RaidInstancesResponse>({
    queryKey: ['game-data', 'raid-instances', 'current'],
    queryFn: () => getRaidInstances({ expansion: 'current' }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useAllRaidInstances() {
  return useQuery<RaidInstancesResponse>({
    queryKey: ['game-data', 'raid-instances', 'all'],
    queryFn: () => getRaidInstances({ expansion: 'all' }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useMythicDungeons() {
  return useQuery<MythicKeystoneDungeonsResponse>({
    queryKey: ['game-data', 'mythic-keystone-dungeons', 'current'],
    queryFn: () => getMythicKeystoneDungeons({ season: 'current' }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useRealmIndex() {
  return useQuery<RealmsResponse>({
    queryKey: ['game-data', 'realms'],
    queryFn: getRealms,
    staleTime: Infinity,
    gcTime: ONE_WEEK_MS,
  })
}
