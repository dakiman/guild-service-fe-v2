# Dungeon Runs — Collapsible "All Runs" Cards

**Date:** 2026-05-03
**Status:** Approved (design)
**Scope:** `frontend/src/components/character/pve/MythicPlusAllRuns.vue` only.

## Problem

The character "Dungeons → All Runs" view renders one card per M+ run with the full 5-row members table baked into every card. A typical season produces dozens of runs, so the page is mostly tables and requires lots of scrolling to scan recent activity. Most of the per-run information a viewer wants at a glance — keystone level, timed status, duration, when, who ran it — fits in a single line if the members table is hidden by default.

## Goal

Each run starts as a compact one-row card that surfaces the existing header data plus per-member spec/ilvl pills. Clicking anywhere on the row expands the card to reveal the full existing members table (and the affix icons). All other dungeon UI on the page is unchanged.

## Non-goals

- No changes to `MythicPlusBestPerDungeon.vue`, `DungeonsHeadline.vue`, or `CharacterDungeonsTab.vue`.
- No changes to BE responses or types.
- No persistence of expanded state across navigations.
- No "expand all / collapse all" toolbar.
- No filter/sort controls beyond what exists today (already sorted by `completed_timestamp` desc).

## Design

### Collapsed row (default state)

The current header row keeps its content and styling, with two changes:

1. The whole row becomes a single `<button type="button">` toggle (`aria-expanded`, `aria-controls`) with a leading lucide `ChevronRight` icon that rotates 90° when open.
2. After the existing items (`dungeon_name`, `+N` keystone pill, on-time/over-time chip, duration, timestamp), append one **member pill** per `run.members[i]`:
   - Visual: a small `ma-stat-pill`-style chip containing `<SpecIcon size={16}>` + ilvl text (`tabular-nums`).
   - Always render five slots in member-array order. Missing/null data falls back to a muted placeholder pill so row width is stable.
   - Pills are decorative within the header — they have no click handler and no router link. Hovering a pill shows a native `title` tooltip with `"<displayName(member)> • <formatRealm(member)>"` for at-a-glance identification without expanding.
3. Affix icons move **out** of the always-on header and into the expanded body — they are detail content and contributed most of the vertical noise after the table.

The row keeps `flex flex-wrap items-center gap-3` so on narrow viewports the member pills wrap to a second line beneath the existing chips.

### Expanded body

`<div :id="runBodyId(run)" v-show="isOpen(run)">` containing:

1. The affix icons row (only if `run.affixes.length > 0`), styled as today.
2. The existing members table, exactly as it is today (Name, Realm, Spec, iLvl, with class-colored router links).
3. If `run.members.length === 0`, render a single muted line: `"No member data recorded."` instead of the table. Affixes still render above it if present.

`v-show` (not `v-if`) so re-expanding the same card is instant.

### Animation

Use a pure-CSS height transition via the `grid-template-rows: 0fr ↔ 1fr` trick on a wrapper around the body — no JS height measurement, plays nicely with `v-show`. Duration ~150ms, ease-out. If this conflicts with existing `ma-card` padding, fall back to no animation; chevron rotation is enough click-feedback on its own.

### State

```ts
const expanded = ref(new Set<number>())
function isOpen(run: DungeonRun) { return expanded.value.has(run.id) }
function toggle(run: DungeonRun) {
  if (expanded.value.has(run.id)) expanded.value.delete(run.id)
  else expanded.value.add(run.id)
  // trigger reactivity
  expanded.value = new Set(expanded.value)
}
```

Component-local. Not persisted to route, query, or storage.

### Accessibility

- The header `<button>` carries `aria-expanded={isOpen(run)}` and `aria-controls={runBodyId(run)}`.
- Body wrapper has the matching `id`.
- Native `<button>` keyboard semantics (Enter / Space toggle); no custom key handling needed.
- Chevron icon has `aria-hidden="true"`.

### Empty state

If the season has no runs, the existing "No mythic+ runs recorded this season." card is unchanged.

## Files touched

- `frontend/src/components/character/pve/MythicPlusAllRuns.vue` — only file modified.

No new components, no new composables, no new types. The card contains a small enough chunk of markup that extracting `MythicPlusRunCard.vue` is not justified by current scope (single consumer, single layout).

## Risks / open questions

- **Affix tooltip refresh.** The current code renders `<AffixIcon>` once on mount. With `v-show` the icons stay in the DOM, so no re-mount issues. With `v-if` we'd need `useWowheadRefresh`; we're using `v-show` to avoid this and to make re-expand instant.
- **Grid-row animation against `ma-card` padding.** The wrapper used for the height transition needs `min-h: 0` and `overflow: hidden` to clip during animation. Verify visually before merging; degrade to no animation if it fights existing card styles.

## Verification

- Manual: load `/character/eu/the-maelstrom/melaniya/dungeons` (default test character), switch to "All Runs", confirm:
  - All runs collapsed on first paint.
  - Click any header toggles that one card; chevron rotates; aria-expanded flips.
  - Member pills show 5 slots, in order, with spec icon + ilvl. Hover shows name • realm.
  - Expanded body shows affixes (if any) above the existing table.
  - Re-collapsing then re-expanding the same card is instant (state preserved).
- `npm run build` passes (vue-tsc with no errors).
