# Split Dungeons & Raids Tab — Design

**Date:** 2026-05-03
**Scope:** Frontend only. No backend changes.

## Motivation

The current `Dungeons & Raids` tab (`CharacterPveTab.vue`, single-page) is dense: combined `PveHeadlineStrip` + `RaidProgressionSection` + `MythicPlusSection` produces a long scroll where M+ data and raid data compete for attention. Plan 4 collapsed prior subtabs into one page; with real data on screen the page is too tall to digest at a glance.

This spec splits the single tab into two **top-level** tabs (`Dungeons` and `Raids`), each with its own focused headline. No subtabs — a flat top-level split, parallel to how `Talents`, `Titles`, `Reputations` sit at the top level today.

## Out of scope

- Backend changes. `character.dungeon_runs`, `character.mythic_plus_rating` (already includes `color`), `character.raid_progress` cover everything the new tabs render.
- Subtab routing under a parent `pve` route (explicitly rejected).
- Any change to `RaidProgressionSection`, `RaidInstanceCard`, `BossRow`, `MythicPlusBestPerDungeon`, `MythicPlusAllRuns`, `AffixIcon` internals — these components keep their current behavior.

## Tab strip

`src/pages/CharacterDetailLayout.vue` — replace the single `Dungeons & Raids` tab entry with two adjacent entries in the same slot:

| Order | Label | Route name | Icon (lucide-vue-next) |
| --- | --- | --- | --- |
| 1 | Summary | `character-summary` | `Sparkles` |
| 2 | Talents | `character-talents` | `BookOpen` |
| 3 | Titles | `character-titles` | `Crown` |
| 4 | Collections | `character-collections` | `Gem` |
| 5 | **Dungeons** | **`character-dungeons`** | **`Skull`** |
| 6 | **Raids** | **`character-raids`** | **`Swords`** |
| 7 | Reputations | `character-reputations` | `Star` |
| 8 | Achievements | `character-achievements` | `Trophy` |

`Skull` (current Dungeons & Raids icon) stays with the M+/dungeon side. `Swords` (new import from `lucide-vue-next`) carries Raids.

## Routes

`src/router/index.ts` — replace the single `pve` child of `character-detail` with two leaf children:

```ts
{
  path: 'dungeons',
  name: 'character-dungeons',
  component: () => import('@/pages/character/CharacterDungeonsTab.vue'),
},
{
  path: 'raids',
  name: 'character-raids',
  component: () => import('@/pages/character/CharacterRaidsTab.vue'),
},
```

The old `path: 'pve'` / `name: 'character-pve'` route is **deleted outright** (no redirect). Project is pre-production with no live users — no bookmarks to preserve. Any in-FE caller pointing at `character-pve` is updated as part of this work; existing callers identified up-front:

- `src/components/character/CharacterStatPills.vue:72` — `mythicPlusRoute` → `character-dungeons`
- `src/components/character/CharacterStatPills.vue:73` — `raidRoute` → `character-raids`

A grep of the FE source tree before merging must show zero hits for `character-pve`. Cypress specs currently have zero references to `character-pve` (verified 2026-05-03), so no e2e changes are expected — the implementer must re-verify before claiming done.

## Page components

### `src/pages/character/CharacterDungeonsTab.vue` (new)

Replaces the M+ portion of `CharacterPveTab.vue`. Composition:

```
<DungeonsHeadline :runs :rating :current-season />
<MythicPlusBestPerDungeon ... />     // existing, unchanged
<MythicPlusAllRuns ... />            // existing, unchanged
```

The local view-switcher between `MythicPlusBestPerDungeon` and `MythicPlusAllRuns` that lives inside `MythicPlusSection.vue` today is moved into this page (same logic — DaisyUI `tabs` with local state). `MythicPlusSection.vue` is then deleted.

`currentSeason` comes from `useMythicDungeons()` (`composables/usePveGameData.ts`) — same source as today's `MythicPlusKpiTiles` consumes via the parent.

### `src/pages/character/CharacterRaidsTab.vue` (new)

Replaces the raid portion of `CharacterPveTab.vue`. Composition:

```
<RaidsHeadline :raid-progress />
<RaidProgressionSection :raid-progress />     // existing, unchanged
```

## Headline components

### `src/components/character/pve/DungeonsHeadline.vue` (new)

Single full-width strip in `ma-card` style. Two-region flex layout (wraps on narrow viewports):

**Left — hero block:**
- Eyebrow: "M+ Score" (10px uppercase, `text-ma-muted/70`)
- Score: large (text-4xl or 5xl, `tabular-nums`, `font-bold`) — color comes from `rating.color` (BE-supplied hex string). Fall back to `ma-gold` when `rating.color` is null/missing.
- Sub-label: season name from `useMythicDungeons().data.value?.season?.name` (e.g. "Mythic+ Season 1") — `text-xs text-ma-muted/60`.

**Right — KPI pills (inline, wrap on narrow):**
- Three pills using the existing `ma-stat-pill` class: `Timed 2+`, `Timed 5+`, `Timed 10+` — same numbers `MythicPlusKpiTiles` computes today (filter `dungeon_runs` by `season === currentSeason && is_completed_on_time && keystone_level >= N`).
- Pills sit horizontally to the right of the hero block on wide screens; wrap below on narrow screens.

**Props:**
```ts
defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
  currentSeason: number | null
}>()
```

Calls `useMythicDungeons()` internally to read `season.name` for the sub-label (matches today's `PveHeadlineStrip` pattern). The page passes `currentSeason` (numeric id) for the run filtering — derived in the page via `dungeonData.value?.season?.id ?? null`.

**Type change required:** `src/types/character.ts` — extend `MythicPlusRating`:

```ts
export interface MythicPlusRating {
  rating: number
  color: string | null
  per_spec: Record<string, number>
}
```

(BE already sends `mythic_plus_rating.color` from `app/Http/Resources/CharacterResource.php` — this only widens the FE TS type to match.)

### `src/components/character/pve/RaidsHeadline.vue` (new)

Single full-width strip in `ma-card` style. Two-row layout, both rows aligned on the same instance:

**Hero row (top):** Use `useBestRaidProgression(raidProgress)` (existing composable) to pick the headline difficulty (highest difficulty with progress, ties broken in favor of higher difficulty). Render:
- Eyebrow: "Raid Progression"
- Hero: `{killed}/{total} {shortDifficulty}` at large size (text-4xl-5xl, gold)
- Sub-label: instance name (e.g. "The Voidspire") in `text-xs text-ma-muted/60`

**Secondary row (bottom):** For the **same instance** that the hero row picked, render all three difficulties' progress as inline chips, in fixed order **N · H · M**:

```
[N 6/6]  [H 6/6]  [M 4/6]
```

Per user decision (2026-05-03): show all three difficulties including the hero's own — no demotion or omission. Chips use a smaller font and `text-ma-muted/80` to read as secondary information without competing with the hero. Use the existing `shortDifficulty` helper from `useBestRaidProgression.ts` to format labels.

**Computation:** Filter `raid_progress` to the hero's `instance_id`, then for each of the three difficulties (Normal, Heroic, Mythic) count `defeated` encounters and total encounters from the matched instance. If the instance has no entry for a given difficulty (e.g. the character has never opened it on Heroic), render `0/{total}` using the encounter count from the hero difficulty (same instance, total bosses are difficulty-invariant on retail).

**Props:**
```ts
defineProps<{
  raidProgress: RaidEncounterProgress[] | null
}>()
```

When `useBestRaidProgression` returns null (character has no raid progress at all), render the same `—` placeholder pattern the current `PveHeadlineStrip` uses, with no secondary row.

## Cleanup (deletions)

- `src/pages/character/CharacterPveTab.vue`
- `src/components/character/pve/PveHeadlineStrip.vue`
- `src/components/character/pve/MythicPlusKpiTiles.vue`
- `src/components/character/pve/MythicPlusSection.vue`

Survivors (used by new pages):
- `RaidProgressionSection.vue`, `RaidInstanceCard.vue`, `BossRow.vue` — used by Raids tab
- `MythicPlusBestPerDungeon.vue`, `MythicPlusAllRuns.vue`, `AffixIcon.vue` — used by Dungeons tab
- `useBestRaidProgression.ts` — used by `RaidsHeadline`
- `usePveGameData.ts` — `useMythicDungeons` used by Dungeons tab + `DungeonsHeadline`; `useRaidInstances` used by `RaidProgressionSection`

## Documentation update

`frontend/CLAUDE.md` "PvE tab (single-page, raider.io-style)" section is now stale. Rewrite as **two sections** (Dungeons tab + Raids tab) describing:

- The two top-level tabs (route names `character-dungeons`, `character-raids`)
- That the headline-per-tab replaces the old combined `PveHeadlineStrip`
- That `MythicPlusKpiTiles` is gone — its data is folded into `DungeonsHeadline`
- That the M+ view-switcher (best-per-dungeon ↔ all-runs) is local-state on the Dungeons page (same pattern as before, just relocated)

## Test plan

Manual smoke (the only "tests" this codebase has for this area, per `frontend/CLAUDE.md`):

1. `npm run build` — vue-tsc must pass (catches type drift on `MythicPlusRating.color` and route name changes).
2. Navigate to `/characters/eu/the-maelstrom/melaniya/dungeons` — Dungeons headline shows colored rating, season name, three Timed pills; below it the M+ view-switcher and best-per-dungeon / all-runs render.
3. Navigate to `/characters/eu/the-maelstrom/melaniya/raids` — Raids headline shows hero `{killed}/{total} {diff}` for the highest-progress raid (currently The Voidspire / March on Quel'Danas / The Dreamrift on Midnight) plus the N · H · M chip row underneath; below it the per-instance raid cards render unchanged.
4. Tab strip shows `Dungeons` and `Raids` as two separate top-level entries in the right order; clicking each navigates without a redirect blip.
5. `/characters/eu/the-maelstrom/melaniya/pve` returns the SPA's not-found / falls through to layout default — confirm no console error and no broken redirect.
6. `CharacterStatPills` M+ pill click lands on `/dungeons`; raid pill click lands on `/raids`.
7. Stale-grep: `grep -rn "character-pve" src/` returns zero hits before merging.

## Risk / migration notes

- **BE coupling:** none — `dungeon_runs`, `mythic_plus_rating`, `raid_progress` already live on `CharacterResource`. Only FE type widens.
- **Cypress:** no current spec references `character-pve` — verified by grep. If new specs land between spec sign-off and implementation, re-grep.
- **Route deletion:** intentional and project-context-approved (pre-production, no live users). If priorities change before merge, swap the deletion for `redirect: { name: 'character-dungeons' }` on a kept `path: 'pve'` entry — purely additive.
