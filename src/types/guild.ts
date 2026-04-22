import type { Region } from './api'
import type { Faction } from './wow'

export interface GuildSummary {
  id: number
  name: string
  realm: string
  region: Region
  faction: Faction
}

export interface GuildResource extends GuildSummary {
  achievement_points: number
  member_count: number
  created_timestamp: number
  num_of_searches: number
  roster_synced_at: string | null
}

export interface GuildMember {
  id: number
  guild_id: number
  name: string
  realm: string
  level: number
  class_id: number
  race_id: number
  rank: number
}

export interface GuildLookupResult {
  guild: GuildResource
  members: import('./api').Paginated<GuildMember>
  isStale: boolean
}
