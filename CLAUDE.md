# CLAUDE.md

Guidance for Claude Code working in this repository.

Cross-repo context (current expansion, not-in-production status, test characters) lives in `../CLAUDE.md`.

## Commands

- `npm run dev` — Vite on port 5173 (hard-coded in `vite.config.ts`; Cypress `baseUrl` assumes it).
- `npm run build` — runs `vue-tsc -b` first; type errors block the build. Output → `dist/`.
- `npm run preview` — serve built `dist/`.
- `npx eslint .` / `npx prettier --write .` — lint / format (no npm scripts wired).
- `npx cypress open|run` — E2E specs in `cypress/e2e/*.cy.ts`; dev server must be running.
- No unit-test script wired despite `vitest` + `@vue/test-utils` being installed; add a `test` script first.

Env vars (must be `VITE_`-prefixed): copy `.env.example` → `.env`. `VITE_API_BASE_URL` defaults to `http://localhost:8091/api/v1` (Laravel BE at `../backend`). `VITE_BLIZZARD_CLIENT_ID` and `VITE_BLIZZARD_REDIRECT_URI` are required for Blizzard OAuth.

## Architecture

Vue 3 (`<script setup>` + TS) + Vite + Pinia + vue-router + TanStack Query + Tailwind/DaisyUI. Path alias `@` → `src`.

### Backend contract (load-bearing)

Laravel BE uses async sync-on-read for character/guild lookups. `src/api/characters.ts` and `src/api/guilds.ts` accept three statuses:

- **200** → fresh; `x-data-staleness: stale` header marks stale-but-usable.
- **202** → sync in progress, empty body, `Retry-After` seconds. API layer throws `SyncPendingError(retryAfter)`.
- **404** → throws `NotFoundError`.

`src/composables/usePollingLookup.ts` wires this into Vue Query: `retry` returns true only for `SyncPendingError` up to `MAX_POLLING_ATTEMPTS` (12, ~60s); `retryDelay` reads `error.retryAfter`. Lookups "poll" via TanStack's retry — no manual interval. **New 202-capable endpoints must use `validateStatus: (s) => s === 200 || s === 202 || s === 404` + throw typed errors so the composable keeps working.**

Paginated responses (`src/types/api.ts` → `Paginated<T>`) match Laravel's `LengthAwarePaginator::toArray()` directly — BE does **not** wrap in `ResourceCollection`, so there is **no outer `data` envelope**; `data` is the items array, pagination fields are siblings.

Components rendering possibly-stale resources call `useStaleAutoRefresh` to trigger a refetch.

### Character tabs (Plan 4)

`pages/character/Character{Tab}Tab.vue` — one file per top-level tab. Two tabs nest subtabs: `pages/character/pve/` (`MythicSubtab`, `RaidsSubtab`) and `pages/character/collections/` (`MountsSubtab`, `PetsSubtab`, `ToysSubtab`).

`components/feedback/FreshnessChips.vue` renders 10 slice chips in fixed order: `Profile, M+, PvP, Profs, Raids, Stats, Titles, Reps, Collect., Achievs`. **Order must match `meta.freshness` keys from BE — drift is silent** (wrong label binds to wrong key, no error).

`AchievementsList.vue` is the only virtualized list (`@tanstack/vue-virtual`, fixed **56px rows, overscan 8**) — characters can carry 30k achievements. Loads via `useInfiniteQuery` against `GET /characters/{region}/{realm}/{name}/achievements` (server-side join + cursor pagination, default 100/page, filters out `Feats of Strength` by default); `api/achievements.ts` wraps it. The watch on `virtualizer.getVirtualItems()` calls `fetchNextPage()` when the last virtual row is within **~200px** of `getTotalSize()` — scroll triggers prefetch without a sentinel. The "Include Feats of Strength" checkbox toggles `includeFeats`, which **participates in the query key**, so TanStack treats it as a fresh query (no manual reset). BE row carries resolved `name` and `category_name`, so Wowhead's `power.js` is no longer load-bearing for the inline label (still hydrates the hover tooltip).

### Dungeons tab

`pages/character/CharacterDungeonsTab.vue` is a leaf route (`character-dungeons`, path `/dungeons`). It composes `components/character/pve/DungeonsHeadline.vue` (M+ score colored from `rating.color`, season name, three "Timed N+" KPI pills — same numbers `MythicPlusKpiTiles` used to compute) on top of a local view-switcher between `MythicPlusBestPerDungeon` and `MythicPlusAllRuns`. The view-switcher is local-state DaisyUI `ma-tab`s — NOT routes (same pattern the old `MythicPlusSection` used; just relocated into the page).

### Raids tab

`pages/character/CharacterRaidsTab.vue` is a leaf route (`character-raids`, path `/raids`). It composes `components/character/pve/RaidsHeadline.vue` (hero `{killed}/{total} {diff}` for the highest-progress instance via `useBestRaidProgression`, plus an `N · H · M` chip row counting that same instance's progress at all three difficulties) on top of `RaidProgressionSection` (per-instance cards, difficulty tabs, `BossRow` portraits — unchanged).

### PvE game-data endpoints

PvE game-data comes from two public endpoints:
- `GET /api/v1/game-data/raid-instances?expansion=current` → `{ instances: [...] }`
- `GET /api/v1/game-data/mythic-keystone-dungeons?season=current` → `{ dungeons: [...], affixes: { "<id>": {...} }, season: null }`

Affixes ride along on the dungeons response keyed by id (`Record<number, KeystoneAffixGameData>`) so `<AffixIcon>` does O(1) lookup. Neither uses a `data` envelope (matches BE convention). `composables/usePveGameData.ts` exposes `useRaidInstances()` and `useMythicDungeons()` with `staleTime: Infinity` + `gcTime: 24h` (responses change only on patch). `api/gameData.ts` wraps the calls; types in `src/types/gameData.ts`. The affix dictionary is passed down from page to `AffixIcon` — no per-icon query coupling.

### HTTP client & auth

`src/api/client.ts` exports a single axios instance using injected closures (`getToken`, `onUnauthorized`) configured from `main.ts` at boot — avoids a circular import between client and Pinia auth store. **On 401 the client calls `onUnauthorized`, which clears the session and redirects to `/login`.**

`src/stores/auth.ts` persists the token via `useStorage('auth.token', ...)` (VueUse → localStorage). `main.ts` calls `auth.fetchMe()` before mounting so the app boots with resolved auth state.

### Routing

`src/router/index.ts` — all pages lazy-loaded. Guards in `router/guards.ts`: `meta.requiresAuth` → `/login?next=...`; `meta.guestOnly` redirects authed users to `/`. Dynamic params `:region/:realm/:name` use `props: true`.

**Identity casing.** `character.name` and `character.realm` from BE are canonical lowercased/slug forms (`melaniya`, `the-maelstrom`); they round-trip into URLs and lookups, so do **not** mutate them. Display formatting is the component's job: `CharacterHeader.vue` exposes `displayName` (title-case first letter) and `displayRealm` (split on `-`, title-case each word, join with spaces). New components should follow the same pattern, not `.toUpperCase()` on raw fields.

### Wowhead tooltips

`index.html` loads `https://wow.zamimg.com/widgets/power.js` (correct CDN is `zamimg.com`, not `zamzig.com` — a stale build once had this wrong and silently broke all tooltips). Components render anchors with `:data-wowhead="item=123"` / `spell=123`. **`src/utils/wowhead.ts` (`buildWowheadHref`) is the single source of truth for the URL fragment** — `WowheadLink.vue` and any bypassing component (currently only `EquipmentSlot.vue`) call this helper. `EquipmentSlot.vue` emits raw `<a data-wowhead>` instead of `<WowheadLink>` because it needs a sized icon-anchor (slot icon) plus a separate text-anchor with `q{quality_id}` color class — power.js injects the icon into the empty anchor at the chosen size. After tooltip-bearing content re-renders (e.g. on query resolve), call `useWowheadRefresh(deps)` from `src/composables/useWowhead.ts` — it waits for `window.$WowheadPower` then invokes `refreshLinks()` on dep changes.

### Component layout

- `src/pages/*` — route targets (one file per route).
- `src/components/{character,guild,layout,form,feedback,wow}/` — grouped by domain. `wow/` holds WoW-specific presentational widgets (class/race icons, faction badges, wowhead links).
- `src/composables/` — cross-cutting logic (polling, stale refresh, wowhead).
- `src/api/` — one file per BE resource; all use the shared `api` client.
- `src/types/` — TS types mirroring BE resources; keep in sync with `../backend` Laravel resources.

### Styling

Tailwind + DaisyUI. Themes limited to `business` (default, set on `<html data-theme>`) and `dracula` in `tailwind.config.js`. Prefer DaisyUI semantic classes (`btn`, `card`, `badge`, `tabs`) over bespoke Tailwind combos.

### Deployment

`nginx.conf` serves built `dist/` on port **8092** and proxies `/api/v1/` → `127.0.0.1:8091` (Laravel BE). `index.html` is served `no-store`; hashed `/assets/` get 1-year immutable cache. A stale `dist/index.html` is a common "my change didn't show up" cause — `npm run build` after editing `index.html` or anything affecting bundle output.
