// Game-data shapes returned by the BE PvE resolver endpoints. These are
// global, static-ish (changes only on patch) — character payloads do not
// embed them; the FE caches them with `staleTime: Infinity` (see
// composables/usePveGameData.ts).

export interface RaidEncounterGameData {
  id: number
  name: string
  display_order: number
  creature_display_id: number | null
  portrait_url: string | null
}

export interface RaidInstanceGameData {
  id: number
  name: string
  display_order: number
  media_url: string | null
  expansion: {
    id: number
    name: string
    display_order: number
  }
  encounters: RaidEncounterGameData[]
}

export interface KeystoneAffixGameData {
  id: number
  name: string
  icon_url: string | null
}

export interface KeystoneUpgradeThreshold {
  upgrade_level: number
  qualifying_duration: number
}

export interface MythicKeystoneDungeonGameData {
  id: number
  name: string
  media_url: string | null
  keystone_upgrades: KeystoneUpgradeThreshold[] | null
  journal_instance_id: number | null
}

// `getMythicKeystoneDungeons` returns dungeons + an affix dictionary in the
// same response (per spec §2.6 — affixes ride along since they're tiny).
export interface MythicKeystoneDungeonsResponse {
  dungeons: MythicKeystoneDungeonGameData[]
  affixes: Record<number, KeystoneAffixGameData>
  season: {
    id: number
    name: string
  } | null
}

export interface RaidInstancesResponse {
  instances: RaidInstanceGameData[]
}

export interface RealmGameData {
  slug: string
  name: string
  region: import('./api').Region
}

export interface RealmsResponse {
  realms: RealmGameData[]
}
