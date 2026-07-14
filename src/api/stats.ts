import { api } from './client'
import type {
  CharacterStatsResponse,
  RaidKillStatsResponse,
  TopKeysResponse,
  TopRun,
  SeasonArchivePayload,
} from '@/types/stats'
import type { Paginated } from '@/types/api'

export async function fetchCharacterStats(
  opts?: { signal?: AbortSignal },
): Promise<CharacterStatsResponse> {
  const res = await api.get<CharacterStatsResponse>('/stats/characters', {
    signal: opts?.signal,
  })
  return res.data
}

export async function fetchRaidKillStats(
  difficulty: string,
  expansion?: string,
  opts?: { signal?: AbortSignal },
): Promise<RaidKillStatsResponse> {
  const { data } = await api.get('/stats/characters/raid-kills', {
    params: { difficulty, expansion },
    signal: opts?.signal,
  })
  return data
}

export async function fetchTopKeys(opts?: { signal?: AbortSignal }): Promise<TopKeysResponse> {
  const { data } = await api.get('/stats/characters/top-keys', {
    signal: opts?.signal,
  })
  return data
}

export async function fetchTopRuns(
  page: number,
  perPage = 20,
  dungeonId?: number,
  opts?: { signal?: AbortSignal },
): Promise<Paginated<TopRun>> {
  const { data } = await api.get('/stats/characters/top-runs', {
    params: { page, per_page: perPage, dungeon_id: dungeonId },
    signal: opts?.signal,
  })
  return data
}

export async function fetchSeasonArchive(
  slug: string,
  opts?: { signal?: AbortSignal },
): Promise<SeasonArchivePayload> {
  const { data } = await api.get<SeasonArchivePayload>(`/stats/archive/seasons/${slug}`, {
    signal: opts?.signal,
  })
  return data
}
