import { useQuery } from '@tanstack/vue-query'
import { getRaidInstances, getMythicKeystoneDungeons } from '@/api/gameData'
import type {
  RaidInstancesResponse,
  MythicKeystoneDungeonsResponse,
} from '@/types/gameData'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function useRaidInstances() {
  return useQuery<RaidInstancesResponse>({
    queryKey: ['game-data', 'raid-instances', 'current'],
    queryFn: () => getRaidInstances({ expansion: 'current' }),
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
