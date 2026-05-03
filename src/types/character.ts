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
  display_name?: string | null
  display_realm?: string | null
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

export interface CharacterStats {
  // Top-level numeric fields the FE renders prominently.
  health?: number
  power?: number
  power_type?: { id?: number; name?: string; type?: string }

  // Primary stats — Blizzard nests as { base, effective }.
  strength?: { base: number; effective: number }
  agility?: { base: number; effective: number }
  intellect?: { base: number; effective: number }
  stamina?: { base: number; effective: number }

  // Secondaries — Blizzard nests as { value, effective, rating, rating_bonus }.
  melee_crit?: { value: number; effective: number; rating: number; rating_bonus: number }
  melee_haste?: { value: number; effective: number; rating: number; rating_bonus: number }
  mastery?: { value: number; effective: number; rating: number; rating_bonus: number }
  versatility_damage_done_bonus?: number
  versatility_healing_done_bonus?: number
  versatility_damage_taken_bonus?: number

  // Defensive
  armor?: { base: number; effective: number }
  dodge?: { value: number; rating: number; rating_bonus: number }
  parry?: { value: number; rating: number; rating_bonus: number }
  block?: { value: number; rating: number; rating_bonus: number }

  // Offensive
  attack_power?: number
  spell_power?: number
  spell_crit?: { value: number; rating: number; rating_bonus: number }

  // Forward-compatible: any other Blizzard-emitted key.
  [key: string]: unknown
}

export interface TalentEntry {
  id: number
  spell_id: number
  rank: number
  max_rank: number
}

export interface PvpTalentEntry {
  slot: number
  talent_id: number
  spell_id: number
  name: string
}

export interface CharacterTalents {
  class: TalentEntry[]
  spec: TalentEntry[]
  hero: TalentEntry[]
  pvp: PvpTalentEntry[]
}

export interface MythicPlusRating {
  rating: number
  color: string | null
  per_spec: Record<string, number>
}

export interface PvpMatchStatistics {
  played: number
  won: number
  lost: number
}

export interface PvpBracketStats {
  bracket: string
  rating: number
  tier_name: string | null
  season: PvpMatchStatistics
  weekly: PvpMatchStatistics
}

export interface Profession {
  profession_id: number
  profession_name: string
  tier_name: string
  skill_points: number
  max_skill_points: number
  is_primary: boolean
  expansion: { id: number; name: string; display_order: number } | null
}

export interface CharacterTitleGameData {
  name_male: string
  name_female: string
}

export interface CharacterTitle {
  id: number
  name: string
  display_string: string
  is_selected: boolean
  game_data?: CharacterTitleGameData
}

export type ReputationStanding =
  | 'hated'
  | 'hostile'
  | 'unfriendly'
  | 'neutral'
  | 'friendly'
  | 'honored'
  | 'revered'
  | 'exalted'

export interface Expansion {
  id: number
  name: string
  display_order: number
}

export interface FactionGameData {
  id: number
  name: string
  parent_faction_id: number | null
  expansion: Expansion | null
}

export interface Reputation {
  faction_id: number
  faction_name: string
  standing: ReputationStanding
  value: number
  max: number
  faction: FactionGameData | null
}

export interface RaidEncounterProgress {
  expansion: string
  instance_id: number
  instance_name: string
  encounter_id: number
  encounter_name: string
  difficulty: string
  completed_count: number
  last_kill_timestamp: number
}

export interface DungeonRunMember {
  character_id: number
  character_name: string
  character_realm: string
  character_realm_display?: string | null
  character_region: Region
  spec_id: number | null
  spec_name: string
  equipped_item_level: number
}

export interface MountGameData {
  description: string | null
  source_text: string | null
  summon_spell_id: number | null
  item_id: number | null
}

export interface Mount {
  mount_id: number
  name: string
  is_useable: boolean
  game_data?: MountGameData | null
}

export interface Pet {
  pet_id: number
  species_id: number
  name: string
  level: number
  breed_id: number | null
  quality: string | null
  is_favorite: boolean
  creature_display_id: number | null
}

export interface Toy {
  toy_id: number
  name: string
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
  display_name?: string | null
  display_realm?: string | null
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
  active_specialization_id: number | null
  talent_tree_id: number | null
  talent_loadout_code: string | null
  mythic_plus_rating: MythicPlusRating | null
  media: { avatar: string; inset: string; main: string }
  talents: CharacterTalents
  equipment: EquipmentItem[]
  stats: CharacterStats | null
  pvp_brackets: PvpBracketStats[] | null
  professions: Profession[] | null
  raid_progress: RaidEncounterProgress[] | null
  titles: CharacterTitle[]
  reputations: Reputation[] | null
  recruitment: boolean
  guild: GuildSummary | null
  dungeon_runs: DungeonRun[]
  mounts: Mount[] | null
  pets: Pet[] | null
  toys: Toy[] | null
  last_searched_at: string | null
  mythics_synced_at: string | null
  stats_synced_at: string | null
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
    stats: FreshnessState
    titles: FreshnessState
    reputations: FreshnessState
    collections: FreshnessState
    achievements: FreshnessState
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
