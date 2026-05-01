import { api } from './client'
import type { RaidInstancesResponse, MythicKeystoneDungeonsResponse } from '@/types/gameData'

export type RaidInstanceScope = 'current' | 'all'
export type MythicSeasonScope = 'current'

// Force the browser to revalidate against the BE on every fetch. The endpoints
// emit `Cache-Control: max-age=3600, public`, which is great for production
// stability but bites during deploy iterations because browsers will hold a
// stale response for an hour. `Cache-Control: no-cache` on the *request*
// asks the browser cache to revalidate (cheap 304 path when the BE response
// hasn't changed) without disabling caching altogether.
const REVALIDATE_HEADERS = { 'Cache-Control': 'no-cache' }

export async function getRaidInstances(
  params: { expansion?: RaidInstanceScope } = {},
): Promise<RaidInstancesResponse> {
  const res = await api.get<RaidInstancesResponse>('/game-data/raid-instances', {
    params: {
      expansion: params.expansion ?? 'current',
    },
    headers: REVALIDATE_HEADERS,
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
      headers: REVALIDATE_HEADERS,
    },
  )
  return res.data
}
