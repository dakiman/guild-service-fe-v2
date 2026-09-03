# Nav fundamentals + quick search — design

**Date:** 2026-09-03 · **Scope:** `frontend/` only · **Status:** approved in chat, awaiting spec review

## Problem

`AppNav.vue` has four concrete defects observed at phone, tablet and desktop widths on 2026-09-03:

1. **Tablet overflow.** Between ~768px and ~900px the seven links plus "Sign in" / "Register" do not fit; "Sign in" wraps to two lines and the bar grows taller. The wider Merriweather Sans body face (shipped the same day) made it slightly worse.
2. **Active state is lost on detail pages.** `isActive()` matches exact route names except for a `leaderboards` prefix, so on any character page, guild page or M+ archive page nothing in the nav is highlighted.
3. **No search outside the home page.** Looking up a character is the core action of the site, but from any other page the user has to go Home first. `NameAutocomplete.vue` and the `/characters/suggest` endpoint already exist.
4. **Redundant Home link.** The PEON wordmark already links home and takes the same space.

## Design

### 1. Nav fundamentals

- **Drop the `Home` link** from `navLinks`. The wordmark stays the home link. Six links remain: Guilds, Characters, Mythic+, Leaderboards, Meta, Raids.
- **Prefix-based active state.** Replace `isActive()` with a static map from nav entry to the route-name prefixes it owns:

  | Nav entry | Active when `route.name` is / starts with |
  |---|---|
  | Guilds | `guild-search`, `guild-detail` |
  | Characters | `character-search`, `character-` (all detail routes: `character-detail`, `character-summary`, `character-talents`, …) |
  | Mythic+ | `mythic-plus`, `mythic-plus-archive` |
  | Leaderboards | `leaderboards` (covers region/realm/class/spec and all `leaderboards-season-*`) |
  | Meta | `meta` |
  | Raids | `raids` |

  Implementation note: `character-search` starts with `character-`, so the Characters entry can be a single `character-` prefix. Keep the table explicit in the code comment anyway.
- **Collapse breakpoint moves from `md` (768px) to `lg` (1024px).** Desktop links and the desktop search box render at `lg:` and up; the hamburger renders below `lg`. Between 768 and 1024 the bar shows wordmark, auth actions and the hamburger only. No link-padding tricks.

### 2. Quick search

**Desktop (`lg+`).** A compact character search input sits in the bar between the links and the auth actions, right-aligned before "Sign in". Fixed width ~14rem (`w-56`), `wsa-input` styling at the nav's reduced height, placeholder "Find a character…", a small magnifier icon on the left, and a faint `/` key hint on the right that hides when the input is focused or non-empty.

**Mobile / tablet (`< lg`).** The same search input is the first row of the hamburger menu, full width, above the links. No magnifier button in the bar.

**Behaviour.**

- Reuses `NameAutocomplete.vue` with `kind="character"` unchanged: 200 ms debounce, ≥2 chars, `/characters/suggest`, arrow/Enter/Escape handling, the existing dropdown.
- **Pick a suggestion** → `router.push({ name: 'character-detail', params: { region, realm, name } })` (same as the home form), then clear the input, close the dropdown, and close the mobile menu if open.
- **Enter with no highlighted suggestion** (empty results, or the user pressed Enter before results arrived) → `router.push({ name: 'home', query: { q: <trimmed text> } })`. The home page reads `route.query.q` once on mount and prefills the character `LookupForm`'s name field, focusing the realm combobox so the user only has to pick a realm. The query param is not kept in sync afterwards and is removed from the URL via `router.replace` after prefill so a refresh doesn't re-apply it.
- **Escape** with the dropdown closed blurs the input.
- **`/` shortcut.** A document-level `keydown` listener in `AppNav.vue`: when `/` is pressed and the event target is not an editable element (`input`, `textarea`, `select`, `[contenteditable]`) and no modifier is held, prevent default and focus the desktop search input. Below `lg` the shortcut opens the mobile menu and focuses its search input. Listener is registered in `onMounted`, removed in `onBeforeUnmount`.
- After any navigation triggered from the nav search, the input is cleared. Navigations from elsewhere leave it alone.

**Needed changes to existing components.**

- `NameAutocomplete.vue` gains one optional emit, `submit: [value: string]`, fired on Enter when there is no highlighted suggestion. Existing consumers (`LookupForm.vue`) ignore it; its own form `submit` handling is unchanged.
- `NameAutocomplete.vue` gains an `expose({ focus })` so the nav can focus it. Alternatively the nav passes a `ref` through; exposing `focus()` is simpler.
- `LookupForm.vue` gains an optional `initialName?: string` prop applied once to its local `name` ref, and exposes `focusRealm()`. Both no-ops when unused.
- `HomePage.vue` reads `route.query.q` as described and passes it to the character `LookupForm`.

**Visual details.** Dropdown reuses the existing `NameAutocomplete` listbox, anchored under the input (the input's wrapper is `relative`; in the nav it must be allowed to overflow the bar, so the nav must not clip overflow). The desktop dropdown is at least as wide as the input and may grow to `w-96` to fit the realm + rating columns; anchor it to the input's right edge so it never runs off-screen at 1024px.

### Out of scope (rejected for now, with reasons)

- **Guild search in the nav** — separate endpoint, would double requests per keystroke, and guild lookups from a random page are rare. Home page still has the full guild form.
- **Inline realm picker in the dropdown** — keeps the nav box small; the "Enter → home with prefill" hand-off covers the unknown-character case.
- **Grouping Mythic+ / Leaderboards / Meta under a dropdown** — option 3 from the nav review; revisit after search settles the layout.
- **Visual pass** (sticky bar, gold underline active state, overlay mobile menu, larger wordmark) — option 4; separate pass.
- **Magnifier icon button in the mobile bar** — extra open/closed state; the menu row is enough.
- **Recent-search memory in the dropdown** — the home page already has "Recently searched"; not needed here.

## Testing

- Vitest unit tests for: active-state map (each prefix in the table plus a negative), `/` shortcut focus + editable-target guard, pick → route push + input cleared + mobile menu closed, Enter-no-match → home with `q`, home prefill consumes `q` and strips it from the URL.
- Playwright (headless, against the built `dist` on :8092 or `vite preview`): screenshots at 390, 820, 1280 px of a character page with the search dropdown open; confirm no overflow at 820 and 1024.
- Existing `LookupForm` / `NameAutocomplete` tests keep passing.
