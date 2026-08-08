export type MetaRegion = 'all' | 'eu' | 'us'
export type MetaPeriodParam = number | 'current'

export interface MetaPeriod {
  period_id: number
  start_at: string | null
  end_at: string | null
  is_current: boolean
}

export interface SpecMetaEntry {
  spec_id: number
  count: number
  share: number
  timed_rate: number
}

export interface SpecBracket {
  roles: { tank: SpecMetaEntry[]; healer: SpecMetaEntry[]; dps: SpecMetaEntry[] }
  total_runs: number
}

export interface MetaSpecsResponse {
  period_id: number
  region: string
  brackets: Record<string, SpecBracket>
}

export interface DungeonReportEntry {
  dungeon_id: number
  name: string | null
  runs: number
  timed_rate: number
  avg_key: number
  avg_duration_ms: number
  timer_ms: number | null
  avg_margin_ms: number | null
  highest_key: number
}

export interface DungeonTrendPoint {
  period_id: number
  timed_rate: number
}

export interface MetaDungeonsResponse {
  period_id: number
  region: string
  dungeons: DungeonReportEntry[]
  dungeon_of_the_week: number | null
  trends: Record<string, DungeonTrendPoint[]>
}

export interface CompEntry {
  signature: string
  tank_spec_id: number
  healer_spec_id: number
  dps_spec_ids: number[]
  count: number
  timed_rate: number
}

export interface PairingEntry {
  tank_spec_id: number
  healer_spec_id: number
  count: number
  timed_rate: number
}

export interface MetaCompsResponse {
  period_id: number
  region: string
  comps: CompEntry[]
  pairings: PairingEntry[]
  min_sample: number
}
