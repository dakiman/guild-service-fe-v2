import { api } from './client'
import type { Region } from '@/types/api'

export interface AchievementListItem {
  achievement_id: number
  completed_timestamp: number | null
  name: string | null
  category_name: string | null
}

export interface AchievementsPage {
  data: AchievementListItem[]
  meta: {
    total: number
    per_page: number
    next_cursor: string | null
  }
}

export async function fetchCharacterAchievements(
  region: Region,
  realm: string,
  name: string,
  params: { cursor?: string | null; perPage?: number; includeFeats?: boolean },
): Promise<AchievementsPage> {
  const res = await api.get<AchievementsPage>(`/characters/${region}/${realm}/${name}/achievements`, {
    params: {
      cursor: params.cursor || undefined,
      per_page: params.perPage,
      include_feats: params.includeFeats ? 1 : 0,
    },
  })
  return res.data
}
