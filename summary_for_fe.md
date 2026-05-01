> **HISTORICAL — Plan 1 hand-off, frozen 2026-04-22.** Plans 1–4 have all shipped (current state, as of v0.1: stats, titles, reputations, collections, achievements all rendering). The "null in Plan 1, lands in Plan 2/3" caveats throughout this document and the 5-key `meta.freshness` shape are no longer accurate — the live shape now carries 10 slice keys. For the current contract, see `CLAUDE.md` (this repo), the BE's `CLAUDE.md` at `../backend/CLAUDE.md`, and the latest plan docs under `docs/superpowers/plans/` in either repo.

---

# Backend API Changes — Plan 1 Integration Summary

**As of:** 2026-04-22 · BE repo: `../guild-service-be-v2` · Merged to `master`

This file describes the changes on the backend (`guild-service-be-v2`) that you need to consume in the frontend. **Plan 1 shipped.** Plans 2 and 3 follow later; their slots are present in the API response today as `null` — safe to wire in now and they'll populate when Plans 2/3 land.

---

## TL;DR — what changed for you

| Area | Status in Plan 1 | Your FE work |
|---|---|---|
| Per-item `equipment[]` shape | **Enriched** (new: `name`, `bonus`, `gems`, `enchantments`, `set_id`, `stats`) | Extend `EquipmentItem` type. Wire Wowhead props. |
| `talents` shape | **Extended** with `pvp` branch + top-level `talent_loadout_code` | Extend type. Optionally render PvP talents / copy-code button. |
| Top-level `meta` block | **New** (`game_version`, `forced_refresh`, `freshness`) | Wrap API parsing to read `meta`. Show per-slice freshness chips. |
| `mythic_plus_rating`, `pvp_brackets`, `professions`, `raid_progress` | Always `null` in Plan 1 | Type them as nullable now; will populate in **Plan 2**. |
| `/characters/classic/…` endpoint | Not yet live | Will exist in **Plan 3**. |
| `?refresh=1` force-refresh | Not yet live | Will exist in **Plan 3**. |
| Throttle on character show route | **Live now:** 10 req/min/IP | Don't hammer the endpoint; back off on 429. |

---

## 1. Endpoint: `GET /api/v1/characters/{region}/{realm}/{name}`

### Behavior changes
- **Throttled** to 10 requests per minute per IP. Exceeding returns `429 Too Many Requests` with `Retry-After` header. Honor it.
- `X-Data-Staleness: stale` header is still emitted when the cached data is stale. The new `meta.freshness` block (below) is the richer per-slice signal — use it going forward.

### Full response shape

```jsonc
{
  "data": {
    "id": 42,
    "name": "dakiboy",
    "realm": "ravencrest",
    "region": "eu",
    "game_version": "retail",           // NEW — always "retail" on this endpoint
    "gender": "Male",
    "faction": "Alliance",
    "race_id": 4,
    "class_id": 6,
    "level": 80,
    "achievement_points": 30455,
    "average_item_level": 622,
    "equipped_item_level": 618,
    "active_specialization": "Unholy",
    "talent_loadout_code": "CAMAsB…",   // NEW — Blizzard import string (nullable)
    "mythic_plus_rating": null,         // Plan 2 populates; expect {rating, per_spec} when live
    "media": { "avatar": "…", "inset": "…", "main": "…" },
    "talents": {                        // `pvp` branch is NEW
      "class": [{ "id": 123, "rank": 2 }],
      "spec":  [{ "id": 456, "rank": 1 }],
      "hero":  [{ "id": 789, "rank": 1 }],
      "pvp":   [{ "slot": 0, "talent_id": 5555, "spell_id": 41535 }]
    },
    "equipment": [ /* see §2 */ ],
    "pvp_brackets":  null,              // Plan 2
    "professions":   null,              // Plan 2
    "raid_progress": null,              // Plan 2
    "recruitment": false,
    "guild": { /* unchanged GuildSummary shape */ },
    "dungeon_runs": [ /* unchanged */ ],
    "last_searched_at": "2026-04-22T10:00:00Z",   // NEW
    "mythics_synced_at": "2026-04-22T09:45:00Z",  // NEW
    "synced_at": "2026-04-22T09:45:00Z"           // was already there
  },
  "meta": {                             // NEW top-level block
    "game_version": "retail",
    "forced_refresh": false,            // Plan 3 sets true when ?refresh=1 is used
    "freshness": {
      "profile":     "fresh",           // "fresh" | "stale" | "never_synced"
      "mythic_plus": "fresh",
      "pvp":         "never_synced",    // null while Plan 2 is unshipped
      "professions": "never_synced",    // null while Plan 2 is unshipped
      "raids":       "never_synced"     // null while Plan 2 is unshipped
    }
  }
}
```

### Partial-data rule
If a slice has never synced for a character (or the last attempt failed), its top-level `data.*` key is **`null`**, not omitted. For Plan 1, expect `data.pvp_brackets`, `data.professions`, `data.raid_progress` to be `null` for all characters. Design the UI around the `null` case.

`meta.freshness.*` values are an enum of exactly **`"fresh" | "stale" | "never_synced"`**. Use `never_synced` as the signal that the slot is empty on purpose (not an error), and show an "awaiting first sync" state.

---

## 2. New equipment item shape (the important one)

Each entry in `data.equipment[]`:

```jsonc
{
  "id": 219325,
  "name": "Djaradin's Pinata",
  "quality": "epic",
  "slot": "head",
  "item_level": 486,
  "bonus":        [7981, 8781, 9144],   // int[]  for Wowhead &bonus=
  "gems":         [192985, 0, 192958],  // int[]  for Wowhead &gems=; 0 means empty socket
  "enchantments": [6652],               // int[]  for Wowhead &ench=
  "set_id":       1615,                 // int | null; see §4 "tier-set bonuses"
  "stats": [
    { "type": "haste_rating", "value": 782, "is_negated": false },
    { "type": "versatility",  "value": 556, "is_negated": false }
  ]
}
```

### Important contract rules
- **`gems` is positional.** A 3-socket item with a gem only in sockets 1 and 3 emits `[id1, 0, id3]`. Wowhead's `&gems=` parses `0` as "empty socket". Never collapse zeros out when building the URL — it will mis-render the remaining gems.
- **`bonus`, `gems`, `enchantments`** are all `int[]`. Join them with `:` for the Wowhead URL.
- **`set_id`** is the item's set id (for class tier / tier set grouping). To build Wowhead's `&pcs=` param, collect all equipped items sharing the same `set_id` and list their item IDs.
- **`stats[].type`** is lowercased and snake-cased (`haste_rating`, `versatility`, `strength`, …). Use it as-is for lookup in a stat-label map if you render stats.

### Updating the `EquipmentItem` type

Replace the current `src/types/character.ts` shape:
```ts
// BEFORE
export interface EquipmentItem {
  id: number
  item_level: number
  quality: string
  slot: Slot
}
```
with:
```ts
// AFTER
export interface EquipmentStat {
  type: string           // e.g. 'haste_rating', 'versatility'
  value: number
  is_negated: boolean
}

export interface EquipmentItem {
  id: number
  name: string                    // NEW
  quality: string                 // 'common'|'uncommon'|'rare'|'epic'|'legendary'|'artifact'|'heirloom'
  slot: Slot
  item_level: number
  bonus: number[]                 // NEW — positional; for Wowhead &bonus=
  gems: number[]                  // NEW — positional; 0 = empty socket; for Wowhead &gems=
  enchantments: number[]          // NEW — positional; for Wowhead &ench=
  set_id: number | null           // NEW — for grouping tier-set pieces
  stats: EquipmentStat[]          // NEW
}
```

---

## 3. Wowhead tooltip integration

The current `src/components/wow/WowheadLink.vue` only supports `item=id&ilvl=N`. To render the enriched tooltips correctly, extend it to build the full Wowhead URL from the new per-item fields.

Target URL format (what Wowhead expects):
```
https://www.wowhead.com/item=219325&ilvl=486&bonus=7981:8781:9144&gems=192985:0:192958&ench=6652&pcs=219326:219327&domain=classic
```

### Updated `WowheadLink.vue`

Pattern that works (adapted from the v1 app):

```vue
<template>
  <a
    :href="`https://www.wowhead.com/${href}`"
    :data-wowhead="href"
    :class="qualityClass"
    target="_blank"
    rel="noopener"
  >
    <slot>{{ label }}</slot>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  itemId?: number
  spellId?: number
  itemLevel?: number
  qualityId?: number
  label?: string
  bonus?: number[]
  gems?: number[]
  enchantments?: number[]
  pcs?: number[]            // set-piece item_ids from OTHER equipped items sharing this set_id
  classic?: boolean | string
}>()

const href = computed(() => {
  let h = ''
  if (props.itemId)  h += `item=${props.itemId}`
  if (props.spellId) h += `spell=${props.spellId}`
  if (props.itemLevel)          h += `&ilvl=${props.itemLevel}`
  if (props.bonus?.length)      h += `&bonus=${props.bonus.join(':')}`
  if (props.gems?.length)       h += `&gems=${props.gems.join(':')}`
  if (props.enchantments?.length) h += `&ench=${props.enchantments.join(':')}`
  if (props.pcs?.length)        h += `&pcs=${props.pcs.join(':')}`
  if (props.classic)            h += `&domain=classic`
  return h
})

const qualityClass = computed(() => (props.qualityId !== undefined ? `q${props.qualityId}` : ''))
</script>
```

### Updating `EquipmentList.vue`

The set-piece computation is the only non-trivial bit. For each item with a `set_id`, collect the other equipped items' `id`s that share the same `set_id`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import { itemQualityToId } from '@/utils/wowConstants'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{ equipment: EquipmentItem[] }>()

// Map set_id → list of item_ids equipped in that set
const setsById = computed(() => {
  const m = new Map<number, number[]>()
  for (const it of props.equipment) {
    if (it.set_id == null) continue
    if (!m.has(it.set_id)) m.set(it.set_id, [])
    m.get(it.set_id)!.push(it.id)
  }
  return m
})

function pcsFor(item: EquipmentItem): number[] | undefined {
  if (item.set_id == null) return undefined
  // Pass all set piece ids; Wowhead computes bonuses from the piece count.
  return setsById.value.get(item.set_id)
}

// ... existing sortedEquipment / SLOT_ORDER code stays ...
</script>

<template>
  <!-- inside the v-for -->
  <WowheadLink
    :item-id="item.id"
    :item-level="item.item_level"
    :quality-id="itemQualityToId(item.quality)"
    :bonus="item.bonus"
    :gems="item.gems"
    :enchantments="item.enchantments"
    :pcs="pcsFor(item)"
    class="flex-1 truncate"
  >
    {{ item.item_level }} {{ item.name || formatQuality(item.quality) }}
  </WowheadLink>
</template>
```

### Wowhead script (once per page)

Wowhead's embed script must be loaded for the `data-wowhead` attribute to hydrate into tooltips. If not already in `index.html`:

```html
<script>const whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true };</script>
<script src="https://wow.zamimg.com/js/tooltips.js"></script>
```

---

## 4. Talents — add PvP branch + loadout code

### Type update

```ts
export interface TalentEntry {
  id: number
  rank: number                // was missing before — rank is how many points spent in the talent
}

export interface PvpTalentEntry {
  slot: number                // 0-indexed PvP talent slot
  talent_id: number
  spell_id: number            // what the player actually casts / what Wowhead should render
}

export interface CharacterTalents {
  class: TalentEntry[]
  spec:  TalentEntry[]
  hero:  TalentEntry[]
  pvp:   PvpTalentEntry[]     // NEW
}
```

And on `CharacterResource`:

```ts
export interface CharacterResource {
  // ...
  talent_loadout_code: string | null    // NEW — copy-paste into WoW's Import Loadout box
  talents: CharacterTalents
  // ...
}
```

### UI ideas
- **"Copy loadout" button** — `navigator.clipboard.writeText(character.talent_loadout_code)`. Show nothing when `null`.
- **PvP talents panel** — render as a small row next to the class/spec/hero tree. Each slot is a spell tooltip (use `spellId`).

---

## 5. The new `meta.freshness` block

The top-level `meta.freshness` is a per-slice health signal. Today (Plan 1), only `profile` and `mythic_plus` can be `fresh`/`stale`; the others are always `never_synced` until Plan 2 fills them.

Suggested UI: a row of small status chips beside the character header.

```ts
export type FreshnessState = 'fresh' | 'stale' | 'never_synced'

export interface MetaBlock {
  game_version: 'retail' | 'classic'
  forced_refresh: boolean
  freshness: {
    profile:     FreshnessState
    mythic_plus: FreshnessState
    pvp:         FreshnessState
    professions: FreshnessState
    raids:       FreshnessState
  }
}

export interface CharacterResponse {
  data: CharacterResource
  meta: MetaBlock
}
```

A `stale` chip on any slice means "a refresh has been dispatched; this data will be newer on the next request." A `never_synced` chip means "we haven't been able to fetch this yet" — treat it the same as the `null` in the corresponding `data.*` slot.

---

## 6. Updated `CharacterResource` type — copy-paste-ready

```ts
import type { Region } from './api'
import type { Faction, Slot } from './wow'
import type { GuildSummary } from './guild'

export type GameVersion = 'retail' | 'classic'
export type FreshnessState = 'fresh' | 'stale' | 'never_synced'

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
  spec:  TalentEntry[]
  hero:  TalentEntry[]
  pvp:   PvpTalentEntry[]
}

export interface MythicPlusRating {
  rating: number
  per_spec: Record<string, number>    // { "<spec_id>": rating }
}

// Empty placeholder types — contents arrive in Plan 2
export interface PvpBracketStats { /* Plan 2 */ }
export interface Professions     { /* Plan 2 */ }
export interface RaidProgress    { /* Plan 2 */ }

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
  mythic_plus_rating: MythicPlusRating | null       // null in Plan 1
  media: { avatar: string; inset: string; main: string }
  talents: CharacterTalents
  equipment: EquipmentItem[]
  pvp_brackets:  PvpBracketStats[] | null           // null in Plan 1
  professions:   Professions | null                 // null in Plan 1
  raid_progress: RaidProgress | null                // null in Plan 1
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
    profile:     FreshnessState
    mythic_plus: FreshnessState
    pvp:         FreshnessState
    professions: FreshnessState
    raids:       FreshnessState
  }
}

export interface CharacterResponse {
  data: CharacterResource
  meta: MetaBlock
}
```

---

## 7. Migration checklist for the FE

- [ ] Update `src/types/character.ts` with the new `EquipmentItem`, `CharacterTalents`, `CharacterResource`, and `MetaBlock` types.
- [ ] Update the character-fetch composable/service to return the `{ data, meta }` envelope (previously it may have returned `data` only).
- [ ] Extend `WowheadLink.vue` with `bonus`, `gems`, `enchantments`, `pcs`, `classic` props.
- [ ] Update `EquipmentList.vue` to compute `pcs` per item and pass the full prop set to `WowheadLink`.
- [ ] Confirm the Wowhead `tooltips.js` script is loaded on the character page.
- [ ] Add a "Copy loadout code" affordance somewhere near the talent tree when `talent_loadout_code` is non-null.
- [ ] (Optional) Add a PvP talents row rendered from `talents.pvp`.
- [ ] (Optional) Add a `FreshnessChips` component fed by `meta.freshness`.
- [ ] Handle HTTP 429 from `/characters/...`: surface a human message + `Retry-After` countdown.

---

## 8. Things that are **not yet in the API** — don't build against them yet

Arriving in **Plan 2:**
- `mythic_plus_rating` will become `{ rating: number; per_spec: Record<string, number> }`.
- `pvp_brackets` will become an array of bracket-stat objects (2v2/3v3/rbg/shuffle-\<class\>-\<spec\>).
- `professions` will become `{ primaries: [...], secondaries: [...] }`.
- `raid_progress` will become a per-raid map of encounter kills by difficulty.

Arriving in **Plan 3:**
- `GET /api/v1/characters/classic/{region}/{realm}/{name}` — read-through Classic endpoint (smaller response; no mythic+/pvp/professions/raids).
- `?refresh=1` query param on both retail and classic endpoints — force-refreshes, respecting the same `throttle:10,1`. On success, `meta.forced_refresh` is `true`.

You can wire the types as nullable/optional today; when Plans 2 and 3 ship, **no type change or endpoint change is required** — only the values flip from `null` to populated.

---

## 9. Questions or contract issues?

If the API response doesn't match this document, that's a backend bug — file it. Source of truth:

- Design spec: `guild-service-be-v2/docs/superpowers/specs/2026-04-22-v1-feature-parity-and-enrichment-design.md`
- Plan 1 (what just shipped): `guild-service-be-v2/docs/superpowers/plans/2026-04-22-plan-1-schema-and-equipment-enrichment.md`
