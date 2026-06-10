# Titles Tab Redesign — Design

**Date:** 2026-05-01
**Scope:** `frontend/src/pages/character/CharacterTitlesTab.vue`
**Direction:** Hero showcase + refined collection (option A)

## Problem

The current titles tab is visually flat: an equipped-title row with a crown icon, then a 2-column grid of muted text rows. Titles in WoW are achievements with character — the tab does not reflect that. There is no focal point and no way to preview how a non-equipped title would read with the character's name.

## Goals

- Give the tab a clear focal point: the equipped title, presented like a trophy.
- Let the user preview any owned title rendered with their character's name, on both desktop and mobile, without backend changes.
- Keep the work scoped to a single component file. No backend work, no new data dependencies.

## Non-goals

- Search / filter (defer until characters with very large title counts are observed).
- Categorization by source (PvP / Raid / Reputation / etc.) — requires backend game-data work.
- Sort options beyond alphabetical.
- Persisting any preview state across navigation.

## Design

### Layout

Single `ma-card`, two stacked regions inside it:

1. **Hero showcase** — top region, pure typography. Centered, large display weight, accent color. A small uppercase tracked label (`Equipped` or `Preview`) sits above the rendered name. Thin horizontal divider/flourish lines bracket the showcase to separate it from the grid below.
2. **Collection grid** — non-equipped titles only, as refined chips. The equipped title is not duplicated in the grid; it lives only in the hero.

A muted **`{N} titles earned`** counter sits at the top-right of the card, where `N = character.titles.length` (includes the equipped one).

### Hero showcase content

- Renders the title with the character's name inserted, not stripped: `Melaniya, the Shadowblade` for suffix titles, `Lightbringer Melaniya` for prefix titles. Driven by the `{name}` placeholder position in the raw title string (`name_male` / `name_female` from `game_data` when present, otherwise `display_string`).
- Uses the same display-name convention as `CharacterHeader.vue` (title-case the first letter of the lowercased canonical `character.name`).
- Gender-aware variant selection mirrors the current `variantFor` helper.
- Label above the name:
  - `Equipped` when showing the equipped title.
  - `Preview` when showing a hovered/tapped title.
  - When no title is equipped and nothing is being previewed: hero shows `Select a title to preview` (single platform-neutral copy, no UA sniffing). Same dimensions as a rendered title, no layout shift.

### Collection chips

- Grid: `grid-cols-1 sm:grid-cols-2`, modest gap. Sorted alphabetically by rendered (bare) title — same sort as today.
- Each chip:
  - Rounded, padded, 1px subtle border (`border-base-300/60`).
  - 2px-wide left accent bar (`text-ma-accent`-tinted) that brightens when the chip is the active preview.
  - Renders the bare title only (`the Astral Walker`), no character name.
  - Hover/active states brighten the border and accent bar.
- The currently-previewed chip is visually distinct (brighter border + accent bar) so the link between the chip and the hero is obvious.

### Interaction model

State: a single ref `previewedTitleId: number | null` local to the component.

Hero reads: `previewedTitle ?? equippedTitle`.

- **Pointer (desktop):** `mouseenter` on a chip sets `previewedTitleId`; `mouseleave` clears it.
- **Touch:** `click` on a chip toggles it as `previewedTitleId`. A click anywhere else on the card clears it.
- Hero swap uses a 150ms crossfade so the change reads as intentional, not as a flicker.
- No persistence, no router/store interaction, no API calls.

### Edge cases

| Case | Behavior |
|---|---|
| `character.titles.length === 0` | Existing `EmptyTab` path is preserved unchanged. |
| Only an equipped title, no others | Hero renders equipped; grid section is omitted entirely (no empty grid stub). |
| Titles exist but none equipped (`is_selected === false` for all) | Hero shows the `Hover/Tap a title to preview` prompt; grid renders all titles. Hovering swaps hero to the previewed one. |
| `previewedTitleId` points to a title no longer in the list (cannot happen in practice — list is static for a given render — but treat as null) | Falls back to equipped (or the prompt). |
| Character is `gender: 'female'` and `name_female` is missing | Falls back to `name_male`, then `display_string`, matching current `variantFor` precedence. |

### Rendering helpers

The current `stripPlaceholder` helper removes `{name}`, used today for every rendered title. We need both forms now:

- `stripName(raw: string): string` — for bare chips. Same logic as current `stripPlaceholder`.
- `renderWithName(raw: string, name: string): string` — for the hero. Substitutes `{name}` with the display-cased character name, then collapses whitespace and trims surrounding punctuation. If `{name}` is absent (rare/malformed data), prepends `name + ', '` to preserve the trophy form rather than rendering a bare title in the hero.

### Files touched

- `frontend/src/pages/character/CharacterTitlesTab.vue` — only file modified.
- No new components, no new types, no API or store changes.

### Out of scope (explicitly)

- Search / filter input.
- Categorization or grouping.
- Non-alphabetical sort.
- Animations beyond the 150ms hero crossfade.
- Any backend work.

## Risks

- **Hero re-renders on every hover** could feel jittery if the crossfade is mistuned. Mitigation: 150ms crossfade and a single transition target (the rendered text node), not the entire card.
- **`{name}` insertion correctness** for prefix titles depends on Blizzard's raw strings consistently using `{name}` as the placeholder. If a title string lacks the placeholder, the `renderWithName` fallback prepends the name with a comma, which reads acceptably for both prefix and suffix forms.
- **Touch dismissal** (tap-elsewhere-to-clear) is easy to get wrong — the click handler must be on the card root with a chip-click handler that stops propagation, otherwise the same tap that sets a preview will immediately clear it.

## Open questions

None. All three calls flagged at design time were approved:
- Equipped title is omitted from the grid (lives only in the hero).
- No-title-equipped state shows a `Select a title to preview` prompt.
- Prefix vs suffix titles render with the name in the correct position via `{name}` substitution.
