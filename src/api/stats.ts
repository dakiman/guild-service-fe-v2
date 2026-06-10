import { api } from './client'
import type {
  CharacterStatsResponse,
  RaidKillStatsResponse,
  TopKeysResponse,
  TopRun,
} from '@/types/stats'
import type { Paginated } from '@/types/api'

export async function fetchCharacterStats(): Promise<CharacterStatsResponse> {
  const res = await api.get<CharacterStatsResponse>('/stats/characters')
  return res.data
}

export async function fetchRaidKillStats(
  difficulty: string,
  expansion?: string,
): Promise<RaidKillStatsResponse> {
  const { data } = await api.get('/stats/characters/raid-kills', {
    params: { difficulty, expansion },
  })
  return data
}

export async function fetchTopKeys(): Promise<TopKeysResponse> {
  const { data } = await api.get('/stats/characters/top-keys')
  return data
}

export async function fetchTopRuns(
  page: number,
  perPage = 20,
  dungeonId?: number,
): Promise<Paginated<TopRun>> {
  const { data } = await api.get('/stats/characters/top-runs', {
    params: { page, per_page: perPage, dungeon_id: dungeonId },
  })
  return data
}
