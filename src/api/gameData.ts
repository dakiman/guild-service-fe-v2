import { api } from './client'
import type { RaidInstancesResponse, MythicKeystoneDungeonsResponse } from '@/types/gameData'

export type RaidInstanceScope = 'current' | 'all'
export type MythicSeasonScope = 'current'

export async function getRaidInstances(
  params: { expansion?: RaidInstanceScope } = {},
): Promise<RaidInstancesResponse> {
  const res = await api.get<RaidInstancesResponse>('/game-data/raid-instances', {
    params: {
      expansion: params.expansion ?? 'current',
    },
  })
  return res.data
}

export async function getMythicKeystoneDungeons(
  params: { season?: MythicSeasonScope } = {},
): Promise<MythicKeystoneDungeonsResponse> {
  const res = await api.get<MythicKeystoneDungeonsResponse>(
    '/game-data/mythic-keystone-dungeons',
    {
      params: {
        season: params.season ?? 'current',
      },
    },
  )
  return res.data
}
