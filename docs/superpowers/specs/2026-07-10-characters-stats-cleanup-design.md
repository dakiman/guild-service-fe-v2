# /characters Stats Page Cleanup — Design

**Date:** 2026-07-10
**Scope:** Frontend only. No backend or API changes; every change uses the existing `GET /stats/characters` payload.
**Context:** A dedicated Mythic+ page is planned later; this cleanup keeps all current sections (including the Top M+ Runs leaderboard) and fixes bugs + layout only.

## Problems

Verified against the live API and a full-page screenshot (1440px):

1. **Demon Hunter's new spec has no icon.** `spec_id: 1480` (Devourer, added in Midnight, ranged DPS — the most-played DH spec at ~27k characters) is missing from `SPEC_ICON_POS`, `SPEC_NAMES`, `SPEC_TO_CLASS`, and `SPEC_ROLES`.
2. **Monk shows 4 specs, one with the Resto Shaman icon.** The API returns a dirty row `{spec_id: 264, class_id: 10, count: 1}` — one character with corrupt class/spec data. `SpecPopularityCard` groups by `class_id`, so a genuine Resto Shaman icon renders under Monk with a 0.0% bar.
3. **Most Popular Spec KPI shows only a number** (`37,180 / characters`) — no icon or spec name, even though `spec_id` and `class_id` are in the payload.
4. **Faction Balance number collision.** At the 350px column width, the Horde and Alliance totals render as one run-on string ("289,353264,577").
5. **Uneven KPI row.** 7 mini cards in a `lg:grid-cols-5` grid → full row of 5 plus 2 orphans.
6. **Dead space in Faction Balance card** — ~200px of content stretched to the tall Class Distribution card's height.
7. **Dead space under Performance by Class** — it ends well before Spec Popularity in the same grid row.
8. **Search bar invisible.** The collapsed "Search Characters" bar uses the same background/border as every stats card and doesn't read as an action.

## Design

### 1. Spec data fixes

`src/utils/wowIcons.ts`:
- `SPEC_ICON_POS[1480] = [-64, -64]` — the Devourer tile already exists in the shipped `specs-sprite.png` (sprite tile (1,1), verified visually and against raider.io's `mainStyles-*.css` `.spec_demon-hunter_devourer` rule).
- `SPEC_NAMES[1480] = 'Devourer'`.

`src/utils/wowConstants.ts`:
- `SPEC_TO_CLASS[1480] = 12`, `SPEC_ROLES[1480] = 'dps'` (Devourer is a ranged DPS spec per Wowhead/Icy Veins Midnight guides).

`src/components/stats/SpecPopularityCard.vue`:
- Filter out rows where `SPEC_TO_CLASS[spec.spec_id] !== spec.class_id` (drops unknown spec ids and class/spec-mismatched dirty rows). Apply the filter at the top of the computed chain so role filtering, grouping, totals, and percentages all exclude bad rows.

### 2. Most Popular Spec KPI card

`StatMiniCard.vue` gains an optional named slot (e.g. `#icon`) rendered inline before the value — generic, not spec-specific.

`CharacterSearchPage.vue` uses it for Most Popular Spec:
- Value: spec name ("Retribution") colored with the spec's class color.
- Icon: `SpecIcon` (~24px).
- Subtitle: `Paladin · 37,180 chars` (class name + count).
- Falls back gracefully if the spec id is unknown (plain count, as today).

### 3. Faction Balance card

Fix the collision:
- Shrink count typography (e.g. `text-lg`, `tabular-nums`), keep emblems, ensure a real gap between the two blocks (`justify-between` with `gap`, `min-w-0`) so numbers can't visually merge at 350px.

Fill the dead space with **Top Races** (from `race_distribution`, already fetched, currently only used for the Top Race KPI):
- Section header "Top Races" under the territory bar.
- Top 6 races: `RaceIcon` + race name + count + thin horizontal bar scaled to the max race count.
- Uses `RACES` name map and existing `RaceIcon.vue` fallback behavior for unknown races.

### 4. KPI row

Remove two redundant cards:
- **Total Characters** — duplicates the Class Distribution donut's center label.
- **Top Race** — subsumed by the Top Races list in the Faction card.

Result: exactly 5 cards in the existing `lg:grid-cols-5` grid, one uniform row: Avg Item Level, Avg M+ Rating, Avg Achievements, Top Class, Most Popular Spec. (Order tweak: Most Popular Spec last, next to Top Class.)

### 5. Row 3/5 restructure

- Row 3 right column becomes a stack: `PerformanceByClassCard` + `HighestKeysCard` (moves up from row 5), roughly matching Spec Popularity's height.
- Row 5 becomes the three `TopPerformersCard`s alone in a full-width `md:grid-cols-3` row (the `lg:grid-cols-[300px_1fr]` wrapper goes away).
- Row 6 Top M+ Runs leaderboard unchanged.

### 6. Search bar

Keep the collapsible behavior; restyle the trigger as a call-to-action distinct from stats cards:
- Gold/amber border (`#aa8855`-family, brighter than the card border), Lucide `Search` icon before the label, brighter label text (`#ffcc88`-family).
- Subtle hover state (border/glow brightening, ~200ms transition).
- Chevron affordance stays.

## Error handling

- Unknown spec ids: filtered out of Spec Popularity; Most Popular Spec falls back to the numeric display.
- Zero/missing distributions: existing empty-state paths unchanged ("No spec data", `—` placeholders).
- Race icons: `RaceIcon` already falls back to an initial-badge on unknown slug/load error.

## Testing

- Component tests live in `src/components/stats/__tests__/` — extend for: mismatched spec row filtered out (264/monk case), Devourer rendered with icon and counted in DPS role filter, StatMiniCard icon slot, FactionSplitCard top-races rendering.
- Visual check via headless Playwright against the dev server at 1440px and a mobile width.

## Out of scope

- Backend data hygiene for the corrupt character row (count=1; frontend filter is sufficient).
- M+ section migration/truncation — waits for the dedicated M+ page.
- Raid heatmap, leaderboard, and Top Performers internals.
