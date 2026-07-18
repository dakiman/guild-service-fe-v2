import type { Region } from './api'
import type { Faction } from './wow'

export interface GuildSummary {
  id: number
  name: string
  realm: string
  region: Region
  display_name?: string | null
  display_realm?: string | null
  faction: Faction
}

export interface GuildSummaryWithMetric extends GuildSummary {
  metric: number
  metric_label: 'achievement_points' | 'member_count' | 'created_timestamp'
}

export interface GuildDiscoverData {
  recently_searched: GuildSummary[]
  most_popular: GuildSummary[]
  top_achievement_points: GuildSummaryWithMetric[]
  largest_by_members: GuildSummaryWithMetric[]
  recently_created: GuildSummaryWithMetric[]
  faction_split: Record<'Alliance' | 'Horde', number>
  region_breakdown: Array<{ region: Region; alliance: number; horde: number }>
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
  display_name?: string | null
  display_realm?: string | null
  level: number
  class_id: number
  race_id: number
  rank: number
  faction: 'Alliance' | 'Horde' | null
  equipped_item_level: number | null
  mythic_plus_rating: { rating: number; color: string | null } | null
  active_specialization_id: number | null
  synced_at: string | null
}

export interface GuildLookupResult {
  guild: GuildResource
  members: import('./api').Paginated<GuildMember>
  isStale: boolean
  isSyncing: boolean
}

export interface GuildStatsResponse {
  member_count: number
  avg_item_level: number
  avg_mythic_plus_rating: number
  top_mythic_plus: {
    rating: number
    character: { name: string; realm: string; region: string; class_id: number }
  } | null
  role_coverage: { tank: number; healer: number; dps: number }
  best_keys: {
    dungeon_id: number
    dungeon_name: string
    key_level: number
  }[]
}
