# Guild page roster redesign

**Date:** 2026-05-03
**Touches:** `frontend/`, `backend/`

## Goal

Make the guild page roster denser and more informative. The current `RosterTable.vue` shows only `name | class (icon+text) | race (initial-badge+text) | level | rank` at default DaisyUI density (~3.5rem rows). Replace this with a tighter, icon-first table that surfaces the data players actually compare on (item level, M+ score, spec, faction) and uses real race icons instead of the current placeholder badge.

## Scope

In:
- New columns: spec icon, faction icon, equipped item level, M+ rating
- Real race icons sourced from Wowhead's `zamimg` CDN
- Tighter row density and smaller class icon
- Sortable column headers (client-side)
- Mobile column-collapsing
- Backend `GuildMemberResource` that joins character data when available

Out (deferred):
- Server-side sorting/pagination — keep client-side; revisit when guilds exceed ~500 members
- Race/class game-data tables — frontend static map is sufficient for now
- Activity / last-online column — Blizzard API does not expose this reliably for non-guild-master tokens

## Columns

Left to right:

| # | Column | Source | Sortable | Mobile (sm) |
|---|--------|--------|----------|-------------|
| 1 | Name | `display_name ?? name`, tinted with class color | yes | shown |
| 2 | Class | 18px icon, tooltip on hover | no | shown |
| 3 | Spec | 18px icon, tooltip on hover; `—` when unsynced | no | hidden |
| 4 | Race | 18px icon (Wowhead zamimg), tooltip on hover | no | shown |
| 5 | Faction | 14px badge (Alliance / Horde / Neutral) | no | hidden |
| 6 | Level | right-aligned int | yes | shown |
| 7 | iLvl | right-aligned int; `—` when unsynced | yes | hidden |
| 8 | M+ Score | colored numeric (Blizzard rating color); `—` when unsynced | yes | hidden |
| 9 | Rank | int | yes | shown |

Existing client-side name filter is retained.

## Visual & density spec

- **Row height** ~32px
- **Cell padding** `px-3 py-1.5`
- **All icons** 18px (down from 24px) with `rounded-sm`
- **Class color** applied as text color on the name cell only (not whole row); uses standard WoW class color hex map
- **Stale-data indicator**: `synced_at` older than 7 days renders iLvl + M+ in muted/italic style
- **Mobile (`sm` breakpoint)**: hide spec, faction, iLvl, M+; keep name/class/race/level/rank

## Backend changes

Endpoint: `GET /api/v1/guilds/{region}/{realm}/{guild}` — same route, same shape, but `members.data[]` items are now serialized through a new `GuildMemberResource`.

`GuildMemberResource` exposes:

```php
[
    'id'                       => $this->id,
    'guild_id'                 => $this->guild_id,
    'name'                     => $this->name,
    'realm'                    => $this->realm,
    'display_name'             => $this->display_name,
    'display_realm'            => $this->display_realm,
    'level'                    => $this->level,
    'class_id'                 => $this->class_id,
    'race_id'                  => $this->race_id,
    'rank'                     => $this->rank,
    'faction'                  => $this->factionFromRaceId(), // 'alliance' | 'horde' | 'neutral'
    // Character-derived (null when no linked character)
    'equipped_item_level'      => $this->character?->equipped_item_level,
    'mythic_plus_rating'       => $this->character ? [
        'rating' => $this->character->mythic_plus_rating,
        'color'  => $this->character->mythic_plus_rating_color,
    ] : null,
    'active_specialization_id' => $this->character?->active_specialization_id,
    'synced_at'                => $this->character?->synced_at,
]
```

Eager-load: `Guild::members()` query gets `->with('character:id,equipped_item_level,mythic_plus_rating,mythic_plus_rating_color,active_specialization_id,synced_at')`. The `GuildMember -> Character` relationship is added if not already present (`belongsTo` on `character_id`).

Faction is computed server-side from `race_id` via a static map on `GuildMember` (or a tiny `RaceFaction` enum/helper). Earthen and Pandaren resolve to `neutral`.

## Frontend changes

### New / modified components

- **`frontend/src/utils/wowConstants.ts`** — race_id → `{ slug, defaultGender, faction }` map covering all 24 playable races. Slug uses Wowhead's lowercase concatenated form (`bloodelf`, `nightelf`, `kultiran`, `voidelf`, `lightforgeddraenei`, `magharorc`, `darkirondwarf`, `highmountaintauren`, `zandalaritroll`, `mechagnome`, `earthendwarf`, `dracthyr`, etc. — note `undead` → `scourge`).
- **`frontend/src/components/wow/RaceIcon.vue`** — replace the initial-badge placeholder. Renders `<img src="https://wow.zamimg.com/images/wow/icons/medium/race_{slug}_{gender}.jpg" />` with `@error` fallback to the existing initial-badge so a missing slug never breaks layout. Accepts `raceId`, optional `gender` (defaults to `defaultGender` from the map), and `size` (default 18).
- **`frontend/src/components/wow/ClassIcon.vue`** — accept a `size` prop (default 24). Existing sprite math already scales — just expose the prop. Tooltip text already present.
- **`frontend/src/components/wow/SpecIcon.vue`** — new. Uses the existing `specs-sprite.png` and the spec sprite map already in `wowIcons.ts`. Accepts `specId` and `size`. Returns `null` when `specId` is null so callers can render `—`.
- **`frontend/src/components/wow/FactionIcon.vue`** — new. Two local SVG assets (`alliance.svg`, `horde.svg`) plus a neutral fallback (small dot or generic crest). Accepts `faction` prop.
- **`frontend/src/components/guild/RosterTable.vue`** — full rewrite for the new columns and density. Sortable headers via a small inline composable: `useTableSort(rows, defaultKey)` returning `{ sortedRows, sortKey, sortDir, toggle(key) }`. No external dep.
- **`frontend/src/types/guild.ts`** — extend `GuildMember` with the new fields (all optional, all nullable on the unsynced path).

### Documentation

- **`frontend/CLAUDE.md`** — add an "Icon sources" section documenting:
  - **Runtime CDN** for race icons: `https://wow.zamimg.com/images/wow/icons/{size}/race_{slug}_{gender}.jpg` (sizes: `large` 56px, `medium` 36px, `small` 18px). Domain is already trusted via the Wowhead tooltip widget.
  - **Manual references** (do not hotlink — Fandom blocks programmatic fetches and may block hotlinking):
    - https://wowpedia.fandom.com/wiki/Wowpedia:WoW_Icons — index of icon categories
    - https://wowpedia.fandom.com/wiki/Wowpedia:List_of_humanoid_icons — race / humanoid icon catalog with slugs in PascalCase
    - https://wowpedia.fandom.com/wiki/Wowpedia:List_of_small_icons — `ObjectIconsAtlas.png` reference (faction sigils, currency icons, etc.) — extract sprites manually if needed
  - Class & spec icons remain on the local sprite sheets in `frontend/src/assets/wow/`

## Behavior details

- **Unsynced characters** (no `character_id`, or character row deleted): spec/iLvl/M+ render as `—`; sorts treat null as the lowest value (sinks to bottom on ascending sort).
- **Stale-data threshold**: 7 days from `synced_at`. Constant lives in `wowConstants.ts` so it's tweakable in one place.
- **Default sort** on first load: rank ascending (preserves current behavior).
- **Class color tint** uses the same hex map already in use elsewhere in the app. During implementation, locate the existing class color map (likely `wowIcons.ts` or a sibling util) and reuse it; do not duplicate the hex values.
- **Race-icon error fallback**: if the Wowhead URL returns 404 or fails to load, swap in the initial-badge placeholder. This gracefully covers any race added in a future expansion before our static map is updated.

## Risks & mitigations

- **Wowhead CDN unavailability** — already trusted for the tooltip widget; if it ever becomes unreliable we can mirror the icons under `frontend/src/assets/wow/races/`. Migration is a single-line URL swap in `RaceIcon.vue`.
- **Eager-load fan-out** — `with('character:...')` over 50 paginated members is bounded; no N+1 risk.
- **Faction logic drift** — keeping the race→faction map server-side ensures one source of truth; the frontend never re-derives faction from `race_id`.
- **Sort stability** — the inline sort composable must be stable (preserve insertion order on ties) so sorting by, e.g., level doesn't scramble equal-level rows by name.
