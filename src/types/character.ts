import type { Region } from './api'
import type { Faction, Slot } from './wow'
import type { GuildSummary } from './guild'

export type GameVersion = 'retail' | 'classic'
export type FreshnessState = 'fresh' | 'stale' | 'never_synced'

export interface CharacterSummary {
  id: number
  name: string
  realm: string
  region: Region
  class_id: number
  level: number
  faction: Faction
  active_specialization: string | null
  media: string | null
}

export interface EquipmentStat {
  type: string
  value: number
  is_negated: boolean
}

export interface EquipmentItem {
  id: number
  name: string
  quality: string
  slot: Slot
  item_level: number
  bonus: number[]
  gems: number[]
  enchantments: number[]
  set_id: number | null
  stats: EquipmentStat[]
}

export interface TalentEntry {
  id: number
  rank: number
}

export interface PvpTalentEntry {
  slot: number
  talent_id: number
  spell_id: number
}

export interface CharacterTalents {
  class: TalentEntry[]
  spec: TalentEntry[]
  hero: TalentEntry[]
  pvp: PvpTalentEntry[]
}

export interface MythicPlusRating {
  rating: number
  per_spec: Record<string, number>
}

// Plan 2 placeholders — real shape arrives when Plan 2 ships.
export type PvpBracketStats = Record<string, unknown>
export type Professions = Record<string, unknown>
export type RaidProgress = Record<string, unknown>

export interface DungeonRunMember {
  character_id: number
  character_name: string
  character_realm: string
  character_region: Region
  spec_id: number | null
  spec_name: string
  equipped_item_level: number
}

export interface DungeonRun {
  id: number
  season: number
  dungeon_id: number
  dungeon_name: string
  keystone_level: number
  duration: number
  completed_timestamp: number
  is_completed_on_time: boolean
  affixes: { id: number; name: string }[]
  members: DungeonRunMember[]
}

export interface CharacterResource {
  id: number
  name: string
  realm: string
  region: Region
  game_version: GameVersion
  gender: string
  faction: Faction
  race_id: number
  class_id: number
  level: number
  achievement_points: number
  average_item_level: number
  equipped_item_level: number
  active_specialization: string | null
  talent_loadout_code: string | null
  mythic_plus_rating: MythicPlusRating | null
  media: { avatar: string; inset: string; main: string }
  talents: CharacterTalents
  equipment: EquipmentItem[]
  pvp_brackets: PvpBracketStats[] | null
  professions: Professions | null
  raid_progress: RaidProgress | null
  recruitment: boolean
  guild: GuildSummary | null
  dungeon_runs: DungeonRun[]
  last_searched_at: string | null
  mythics_synced_at: string | null
  synced_at: string | null
}

export interface MetaBlock {
  game_version: GameVersion
  forced_refresh: boolean
  freshness: {
    profile: FreshnessState
    mythic_plus: FreshnessState
    pvp: FreshnessState
    professions: FreshnessState
    raids: FreshnessState
  }
}

export interface CharacterResponse {
  data: CharacterResource
  meta: MetaBlock
}

export interface CharacterLookupResult {
  data: CharacterResource
  meta: MetaBlock
  isStale: boolean
}
