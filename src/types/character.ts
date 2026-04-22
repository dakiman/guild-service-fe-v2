import type { Region } from './api'
import type { Faction, Slot } from './wow'
import type { GuildSummary } from './guild'

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

export interface EquipmentItem {
  id: number
  item_level: number
  quality: string
  slot: Slot
}

export interface TalentEntry {
  id: number
  name: string
}

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
  affixes: string[]
  members: DungeonRunMember[]
}

export interface CharacterResource {
  id: number
  name: string
  realm: string
  region: Region
  gender: string
  faction: Faction
  race_id: number
  class_id: number
  level: number
  achievement_points: number
  average_item_level: number
  equipped_item_level: number
  active_specialization: string | null
  media: { avatar: string; inset: string; main: string }
  talents: { class: TalentEntry[]; spec: TalentEntry[]; hero: TalentEntry[] }
  equipment: EquipmentItem[]
  recruitment: boolean
  guild: GuildSummary | null
  dungeon_runs: DungeonRun[]
  synced_at: string
}

export interface CharacterLookupResult {
  data: CharacterResource
  isStale: boolean
}
