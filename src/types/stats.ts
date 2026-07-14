import type { KeystoneUpgradeThreshold } from './gameData'

export interface ClassDistribution {
  class_id: number
  count: number
  avg_ilvl: number
  avg_mythic_plus_rating: number
}

export interface SpecDistribution {
  spec_id: number
  class_id: number
  count: number
}

export interface RaceDistribution {
  race_id: number
  count: number
}

export interface TopPerformer {
  name: string
  realm: string
  region: string
  class_id: number
  spec_id: number | null
  value: number
}

export interface CharacterStatsResponse {
  total_characters: number
  class_distribution: ClassDistribution[]
  spec_distribution: SpecDistribution[]
  faction_distribution: { horde: number; alliance: number }
  race_distribution: RaceDistribution[]
  top_performers: {
    mythic_plus: TopPerformer[]
    item_level: TopPerformer[]
    achievement_points: TopPerformer[]
  }
  avg_achievement_points: number
  most_popular_spec: { spec_id: number; class_id: number; count: number } | null
}

export interface RaidBossKills {
  encounter_id: number
  name: string
  kills_by_class: Record<string, number>
}

export interface RaidKillsData {
  instance_id: number
  name: string
  bosses: RaidBossKills[]
}

export interface RaidKillStatsResponse {
  raids: RaidKillsData[]
  expansions: string[]
  current_expansion: string | null
}

export interface TopKeyDungeon {
  dungeon_id: number
  dungeon_name: string
  key_level: number
  duration: number
  character: {
    name: string
    realm: string
    region: string
    class_id: number | null
  } | null
}

export interface TopKeysResponse {
  dungeons: TopKeyDungeon[]
}

export interface RunMember {
  name: string
  realm: string
  region: string
  spec_id: number | null
  spec_name: string | null
  class_id: number | null
  ilvl: number | null
}

export interface TopRun {
  id: number
  dungeon_id: number
  dungeon_name: string
  keystone_level: number
  duration: number
  is_completed_on_time: boolean
  affixes: Record<string, unknown>[]
  completed_at: string
  members: RunMember[]
}

export interface ArchiveDungeon {
  id: number
  name: string
  media_url: string | null
  keystone_upgrades: KeystoneUpgradeThreshold[] | null
}

// Frozen /mythic-plus page payload written by the BE season:rollover
// command — shapes intentionally mirror the live endpoints above.
export interface SeasonArchivePayload {
  meta: {
    season_id: number
    slug: string
    name: string
    snapshotted_at: string
    total_runs: number
  }
  top_runs: TopRun[]
  top_keys: TopKeysResponse
  top_performers: { mythic_plus: TopPerformer[] }
  class_distribution: ClassDistribution[]
  dungeons: ArchiveDungeon[]
}
