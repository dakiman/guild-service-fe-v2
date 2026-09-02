import type { TopRun } from '@/types/stats'
import type { Region } from '@/types/api'

export type LeaderboardScope = 'world' | 'region' | 'realm' | 'class' | 'spec'

export interface LeaderboardRow {
  rank: number
  rating: number
  color: string | null
  character: {
    name: string
    display_name: string | null
    realm: string
    display_realm: string | null
    region: Region
    class_id: number
    spec_id: number | null
    faction: string | null
  }
}

export interface LeaderboardSeason {
  id: number
  slug: string
  name: string
  is_current: boolean
}

export interface LeaderboardMeta {
  scope: LeaderboardScope
  region: Region | null
  realm: string | null
  connected_realm_id: number | null
  class_id: number | null
  spec_id: number | null
  season: LeaderboardSeason | null
  season_id: number | null
  population: number
  computed_at: string | null
}

export interface LeaderboardResponse {
  data: LeaderboardRow[]
  meta: LeaderboardMeta
}

export interface RealmRunsResponse {
  data: TopRun[]
  meta: {
    period_id: number | null
    region: Region
    realm: string
    connected_realm_id: number
    computed_at: string | null
  }
}

export interface LeaderboardQuery {
  scope: LeaderboardScope
  region?: Region
  realm?: string
  class_id?: number
  spec_id?: number
  /** Registry slug (`season-mn-1`); omitted = current season. */
  season?: string
}
