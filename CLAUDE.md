# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 5173 (hard-coded in `vite.config.ts`; Cypress `baseUrl` assumes it).
- `npm run build` — runs `vue-tsc -b` first; type errors block the build even if Vite would succeed. Output goes to `dist/`.
- `npm run preview` — serve the built `dist/` locally.
- `npx eslint .` — lint (no npm script wired up).
- `npx prettier --write .` — format.
- `npx cypress open` / `npx cypress run` — E2E; specs live in `cypress/e2e/*.cy.ts`. Dev server must already be running.
- No unit test runner is wired up in `scripts` even though `vitest` and `@vue/test-utils` are installed; add a `test` script before invoking them.

Environment variables (Vite, so they must be prefixed `VITE_`): copy `.env.example` → `.env`. `VITE_API_BASE_URL` defaults to `http://localhost:8091/api/v1` (the Laravel backend in `../guild-service-be-v2`). `VITE_BLIZZARD_CLIENT_ID` and `VITE_BLIZZARD_REDIRECT_URI` are required for the Blizzard OAuth flow.

## Architecture

Single-page app: **Vue 3 (`<script setup>` + TS) + Vite + Pinia + vue-router + TanStack Vue Query + Tailwind/DaisyUI**. Path alias `@` → `src`.

### Backend contract (the load-bearing bit)

The Laravel backend uses an async sync-on-read pattern for character/guild lookups. `src/api/characters.ts` and `src/api/guilds.ts` accept three statuses:

- **200** → fresh data; response may include `x-data-staleness: stale` header → treated as stale but usable.
- **202** → sync in progress. Body is empty; `Retry-After` header gives seconds until retry. The API layer throws `SyncPendingError(retryAfter)`.
- **404** → throws `NotFoundError`.

`src/composables/usePollingLookup.ts` wires this into Vue Query: `retry` returns true only for `SyncPendingError` up to `MAX_POLLING_ATTEMPTS` (12, ~60s), and `retryDelay` reads `error.retryAfter`. This is why lookup queries "poll" without any manual interval — they ride TanStack's retry mechanism. **When adding new endpoints that can return 202, follow the same `validateStatus: (s) => s === 200 || s === 202 || s === 404` + throw-typed-errors pattern so the polling composable keeps working.**

Paginated responses (`src/types/api.ts` → `Paginated<T>`) match Laravel's `LengthAwarePaginator::toArray()` directly — the BE does **not** wrap in a `ResourceCollection`, so there is no outer `data` envelope; `data` is the items array and pagination fields are siblings.

Stale-data auto-refresh: components that render potentially-stale resources use `useStaleAutoRefresh` to trigger a refetch.

### HTTP client & auth

`src/api/client.ts` exports a single axios instance. It uses injected closures (`getToken`, `onUnauthorized`) configured from `main.ts` at boot — this avoids a circular import between the axios client and the Pinia auth store. On 401 the client calls `onUnauthorized`, which clears the session and redirects to `/login`.

`src/stores/auth.ts` persists the token via `useStorage('auth.token', ...)` (VueUse → localStorage). `main.ts` calls `auth.fetchMe()` before mounting so the app boots with a resolved auth state.

### Routing

`src/router/index.ts` — all pages lazy-loaded. Guards in `router/guards.ts`: `meta.requiresAuth` redirects to `/login?next=...`; `meta.guestOnly` redirects authed users to `/`. Dynamic route params `:region/:realm/:name` use `props: true` and are passed directly into pages.

### Wowhead tooltips

`index.html` loads `https://wow.zamimg.com/widgets/power.js` (correct CDN is `zamimg.com`, not `zamzig.com` — a stale build once had this wrong and silently broke all tooltips). Components render anchors with `:data-wowhead="item=123"` / `spell=123` attributes (see `src/components/wow/WowheadLink.vue`). When tooltip-bearing content is re-rendered (e.g. after a query resolves), call `useWowheadRefresh(deps)` from `src/composables/useWowhead.ts` — it waits for `window.$WowheadPower` to exist and invokes `refreshLinks()` on dep changes.

### Component layout

- `src/pages/*` — route targets (one file per route).
- `src/components/{character,guild,layout,form,feedback,wow}/` — grouped by domain. `wow/` holds WoW-specific presentational widgets (class/race icons, faction badges, wowhead links).
- `src/composables/` — cross-cutting logic (polling, stale refresh, wowhead).
- `src/api/` — one file per backend resource; all call the shared `api` client.
- `src/types/` — TypeScript types mirroring BE resources. Keep in sync with `../guild-service-be-v2` Laravel resources.

### Styling

Tailwind + DaisyUI. Themes are limited to `business` (default, set on `<html data-theme>`) and `dracula` in `tailwind.config.js`. Use DaisyUI semantic classes (`btn`, `card`, `badge`, `tabs`) rather than rolling bespoke Tailwind combos where a DaisyUI primitive fits.

### Deployment

`nginx.conf` serves the built `dist/` on port **8092** and proxies `/api/v1/` to `127.0.0.1:8091` (the Laravel BE). `index.html` is served with `no-store`; hashed assets under `/assets/` get a 1-year immutable cache. A stale `dist/index.html` is a common source of "my change didn't show up" — remember to `npm run build` after editing `index.html` or anything else affecting bundle output.
