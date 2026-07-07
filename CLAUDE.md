# CLAUDE.md

Frontend guidance. Cross-repo context (current expansion, not-in-prod, test characters) lives in `../CLAUDE.md`.

## Commands

- `npm run dev` — Vite on **5173** (hard-coded in `vite.config.ts`; Cypress `baseUrl` assumes it).
- `npm run build` — runs `vue-tsc -b` first; type errors block the build. Output → `dist/`.
- `npm run preview` — serve built `dist/`.
- `npx eslint .` / `npx prettier --write .` — no npm scripts wired.
- `npx cypress open|run` — E2E specs in `cypress/e2e/*.cy.ts`; dev server must be running.
- `npm test` — runs `vitest run` (single pass).

Env: copy `.env.example` → `.env`. `VITE_API_BASE_URL` defaults to `http://localhost:8091/api/v1`. `VITE_BLIZZARD_CLIENT_ID` + `VITE_BLIZZARD_REDIRECT_URI` required for OAuth.

## Architecture

Vue 3 (`<script setup>` + TS) + Vite + Pinia + vue-router + TanStack Query + Tailwind + DaisyUI (base tokens only). Path alias `@` → `src`.

### Backend contract (load-bearing)

BE uses async sync-on-read. `src/api/characters.ts` and `src/api/guilds.ts` accept three statuses:
- **200** — fresh; `x-data-staleness: stale` header marks stale-but-usable.
- **202** — sync in progress, empty body, `Retry-After` seconds. API layer throws `SyncPendingError(retryAfter)`.
- **404** — throws `NotFoundError`.

`src/composables/usePollingLookup.ts` wires this into Vue Query with a time budget (`src/composables/pollingSchedule.ts`): poll at the server's `Retry-After` for 3 min, then once per minute until 15 min, then surface a real error. `SyncPendingError` carries `retryAfter` (ms) + `queueDepth` (from the 202 body's `queue_depth`); both lookups expose `syncPendingSince` (drives `PollingState`'s message tiers) and `restartPolling()` (resets the budget — bind it to ErrorState's retry, NOT plain `refetch()`). **New 202-capable endpoints must use `validateStatus: (s) => s === 200 || s === 202 || s === 404` + throw typed errors** so the composable keeps working.

Paginated responses (`Paginated<T>` in `src/types/api.ts`) match Laravel's `LengthAwarePaginator::toArray()` directly — BE does **not** wrap in `ResourceCollection`, so there's **no outer `data` envelope**; `data` is the items array, pagination fields are siblings.

Possibly-stale resources call `useStaleAutoRefresh` to trigger a refetch.

### Character tabs

`pages/character/Character{Tab}Tab.vue` — one file per top-level tab. Two tabs nest subtabs: `pages/character/pve/` (`MythicSubtab`, `RaidsSubtab`) and `pages/character/collections/` (`MountsSubtab`, `PetsSubtab`, `ToysSubtab`).

**Basic-tier (sub-max-level) characters.** BE sends `meta.profile_tier: 'full' | 'basic'` — basic means the BE tracks profile/gear/talents only (no slice syncs, slice relation keys omitted from the payload, `meta.freshness` has only `profile`). `CharacterDetailLayout.vue` keys off it: shows `components/feedback/BasicProfileNotice.vue`, hides `FreshnessChips`, and trims tabs to Summary + Talents. Slice-relation fields on `CharacterResource` are optional (`titles?`, `dungeon_runs?`, `pvp_brackets?`, ...) — normalize with `?? []` / `?? null` at consumer sites.

`components/feedback/FreshnessChips.vue` renders 10 slice chips in fixed order: `Profile, M+, PvP, Profs, Raids, Stats, Titles, Reps, Collect., Achievs`. **Order must match `meta.freshness` keys from BE — drift is silent.** (Hidden entirely for basic-tier characters.)

`AchievementsList.vue` virtualizes its infinite-query list (`@tanstack/vue-virtual`, fixed **56px rows, overscan 8**) — characters can carry 30k achievements. (The Mounts/Pets/Toys collections subtabs also virtualize, via the reusable `components/character/VirtualGrid.vue` — row-based with a responsive `ResizeObserver` column count and a scoped `#item` slot — since collections can hold 1-2k rows.) Loads via `useInfiniteQuery` against `GET /characters/{region}/{realm}/{name}/achievements` (cursor pagination, default 100/page, filters out Feats of Strength by default). The watch on `virtualizer.getVirtualItems()` calls `fetchNextPage()` when the last virtual row is within ~200px of `getTotalSize()` — scroll triggers prefetch without a sentinel. The "Include Feats of Strength" checkbox toggles `includeFeats`, which **participates in the query key** (no manual reset). BE row carries resolved `name` and `category_name`; Wowhead's `power.js` is no longer load-bearing for the inline label (still hydrates the hover tooltip).

### Dungeons + Raids tabs

- **Dungeons.** `pages/character/CharacterDungeonsTab.vue` (route `character-dungeons`, path `/dungeons`). Composes `DungeonsHeadline` (M+ score colored from `rating.color`, season name, three "Timed N+" KPI pills) on top of a `wsa-tab` view-switcher between `MythicPlusBestPerDungeon` and `MythicPlusAllRuns` (NOT routes). `MythicPlusAllRuns.vue` renders one card per run with click-to-expand header; expand container animated via `grid-template-rows: 0fr ↔ 1fr` (no `v-show`). Expanded state is component-local `Set<runId>` — not persisted across navigations. Each run header is a `<button>`, so decorative children (member pills, chevron, name) must be non-interactive `<span>`s — `<ul>`/`<li>`/`<h3>` are invalid phrasing-content inside buttons.
- **Raids.** `pages/character/CharacterRaidsTab.vue` (route `character-raids`, path `/raids`). Composes `RaidsHeadline` (hero `{killed}/{total} {diff}` for highest-progress instance via `useBestRaidProgression`, plus an `N · H · M` chip row) on top of `RaidProgressionSection` (per-instance cards, difficulty tabs, `BossRow` portraits).

### PvE game-data endpoints

Two public endpoints:
- `GET /api/v1/game-data/raid-instances?expansion=current` → `{ instances: [...] }`
- `GET /api/v1/game-data/mythic-keystone-dungeons?season=current` → `{ dungeons: [...], affixes: { "<id>": {...} }, season: null }`

Affixes ride along on the dungeons response keyed by id (`Record<number, KeystoneAffixGameData>`) so `<AffixIcon>` does O(1) lookup. Neither uses a `data` envelope. `composables/usePveGameData.ts` exposes `useRaidInstances()` + `useMythicDungeons()` with `staleTime: Infinity` + `gcTime: 24h` (responses change only on patch). Affix dictionary is passed down from page to `AffixIcon` — no per-icon query coupling.

### HTTP client + auth

`src/api/client.ts` — single axios instance with injected closures (`getToken`, `onUnauthorized`) configured from `main.ts` at boot (avoids circular import between client and Pinia auth store). **On 401 the client calls `onUnauthorized`, which clears the session and redirects to `/login`.**

`src/stores/auth.ts` persists the token via `useStorage('auth.token', ...)`. `main.ts` calls `auth.fetchMe()` before mounting so the app boots with resolved auth state.

### Routing

`src/router/index.ts` — all pages lazy-loaded. Guards in `router/guards.ts`: `meta.requiresAuth` → `/login?next=...`; `meta.guestOnly` redirects authed users to `/`. Dynamic params `:region/:realm/:name` use `props: true`.

**Identity casing.** `character.name` and `character.realm` from BE are canonical lowercased/slug forms (`melaniya`, `the-maelstrom`); they round-trip into URLs and lookups, so do **not** mutate them. Display formatting is the component's job: `CharacterHeader.vue` exposes `displayName` (title-case first letter) and `displayRealm` (split on `-`, title-case each word, join with spaces). New components should follow the same pattern, not `.toUpperCase()` on raw fields.

### Wowhead tooltips

`index.html` loads `https://wow.zamimg.com/widgets/power.js` (correct CDN is **`zamimg.com`**, not `zamzig.com` — a stale build once had this wrong and silently broke all tooltips). Components render anchors with `:data-wowhead="item=123"` / `spell=123`.

`src/utils/wowhead.ts` (`buildWowheadHref`) is the single source of truth for the URL fragment — `WowheadLink.vue` and any bypassing component (currently only `EquipmentSlot.vue`) call this helper. `EquipmentSlot.vue` emits raw `<a data-wowhead>` instead of `<WowheadLink>` because it needs a sized icon-anchor (slot icon) + a separate text-anchor with `q{quality_id}` color class — power.js injects the icon into the empty anchor at the chosen size.

After tooltip-bearing content re-renders, call `useWowheadRefresh(deps)` from `src/composables/useWowhead.ts` — waits for `window.$WowheadPower` then invokes `refreshLinks()` on dep changes.

### Icon sources

- **Race icons (CDN).** `https://wow.zamimg.com/images/wow/icons/{size}/race_{slug}_{gender}.jpg` — `{size}` ∈ `large`(56) / `medium`(36) / `small`(18); `{slug}` lowercase no-separators (`bloodelf`, `nightelf`, `kultiran`, `lightforgeddraenei`, `magharorc`, `darkirondwarf`, `earthendwarf`, ...); `{gender}` ∈ `male`/`female`. Maps in `src/utils/wowConstants.ts` (`RACE_WOWHEAD_SLUGS`, `RACE_DEFAULT_GENDERS`). `RaceIcon.vue` falls back to a styled initial-badge on unknown slug or load error. Slug quirks: Forsaken/Undead (5) → `scourge`; Earthen (84/85) → `earthendwarf`.
- **Class + spec icons (local).** `src/assets/wow/{classes-sprite.png 256×256, specs-sprite.png 448×384}`, both 64px tiles. Coordinate maps in `src/utils/wowIcons.ts`. Used by `ClassIcon.vue` + `SpecIcon.vue`. Shipped locally so they're stable across CDN changes.
- **Manual reference catalogs (do not hotlink).** Fandom blocks programmatic + may block hotlinking. Human-only references:
  - https://wowpedia.fandom.com/wiki/Wowpedia:WoW_Icons
  - https://wowpedia.fandom.com/wiki/Wowpedia:List_of_humanoid_icons (PascalCase race slugs)
  - https://wowpedia.fandom.com/wiki/Wowpedia:List_of_small_icons (`ObjectIconsAtlas.png`)

### Layout + styling

- `src/pages/*` — route targets.
- `src/components/{character,guild,layout,form,feedback,wow}/` — grouped by domain. `wow/` holds presentational widgets (class/race icons, faction badges, wowhead links).
- `src/composables/` — cross-cutting (polling, stale refresh, wowhead).
- `src/api/` — one file per BE resource; all use shared `api` client.
- `src/types/` — TS types mirroring BE Resources; **keep in sync** with `../backend`.

Tailwind + DaisyUI (`dark-leather` theme, `<html data-theme="dark-leather">`). **Do NOT use DaisyUI component classes** (`btn`, `card`, `badge`, `alert`, `table`, `navbar`, `skeleton`, `loading`, `join`, `form-control`). Use the custom `wsa-*` component classes defined in `src/style.css` instead: `wsa-card`, `wsa-btn`, `wsa-input`, `wsa-badge`, `wsa-spinner`, `wsa-tab`, `wsa-hero-banner`, `wsa-stat-pill`. For text colors use Tailwind utilities: `text-wsa-text`, `text-wsa-muted`, `text-wsa-disabled`, `text-wsa-heading`/`text-wsa-gold`. DaisyUI base tokens (`bg-base-100`, `text-base-content`) are fine for page-level backgrounds. Full reference: `docs/design-guide.md`.

### Deployment

`nginx.conf` serves `dist/` on **8092** and proxies `/api/v1/` → `127.0.0.1:8091`. `index.html` is `no-store`; hashed `/assets/` get 1y immutable cache. A stale `dist/index.html` is the common "my change didn't show up" cause — `npm run build` after touching `index.html` or anything affecting bundle output.
