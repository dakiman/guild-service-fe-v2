import { api } from './client'
import type { LeaderboardQuery, LeaderboardResponse, RealmRunsResponse } from '@/types/leaderboards'
import type { Region } from '@/types/api'

export async function fetchCharacterLeaderboard(
  params: LeaderboardQuery,
  opts?: { signal?: AbortSignal },
): Promise<LeaderboardResponse> {
  const res = await api.get<LeaderboardResponse>('/leaderboards/characters', { params, signal: opts?.signal })
  return res.data
}

export async function fetchRealmRuns(
  region: Region,
  realm: string,
  opts?: { signal?: AbortSignal },
): Promise<RealmRunsResponse> {
  const res = await api.get<RealmRunsResponse>('/leaderboards/realm-runs', {
    params: { region, realm },
    signal: opts?.signal,
  })
  return res.data
}
