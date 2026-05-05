import { api } from './client'
import type { CharacterStatsResponse } from '@/types/stats'

export async function fetchCharacterStats(): Promise<CharacterStatsResponse> {
  const res = await api.get<CharacterStatsResponse>('/stats/characters')
  return res.data
}
