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
}
