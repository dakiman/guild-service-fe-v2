import { api } from './client'
import type { GameDataAchievement } from '@/types/character'

interface GameDataAchievementsResponse {
  data: GameDataAchievement[]
}

/**
 * Fetch the full achievements catalog. Designed to be fetched once per
 * session and cached aggressively (server returns Cache-Control: 24h +
 * ETag for 304 revalidation; TanStack Query layers a 24h staleTime on top).
 */
export async function fetchGameDataAchievements(): Promise<GameDataAchievement[]> {
  const response = await api.get<GameDataAchievementsResponse>('/game-data/achievements')

  return response.data.data
}
