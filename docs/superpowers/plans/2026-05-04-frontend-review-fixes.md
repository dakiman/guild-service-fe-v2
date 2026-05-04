# Frontend Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pair the deferred Blizzard OAuth state-CSRF + redirect-URI allowlist work from the backend review (Task 3 of `backend/docs/superpowers/plans/2026-05-04-backend-review-fixes.md`) with the matching FE handshake so the two PRs can ship together.

**Architecture:** The FE today smuggles the user's chosen region through Battle.net's `state` query param (`url.searchParams.set('state', oauthRegion.value)` in `ProfilePage.vue`). The BE change repurposes `state` as a 32–128-char CSRF nonce minted by a new `POST /{region}/blizzard-oauth/state` endpoint, cached server-side under `blizzard:oauth-state:{userId}:{region}:{state}` and consumed once on code exchange. The FE therefore needs a different region carrier across the redirect — we use `sessionStorage` (same-origin, survives the redirect within the tab, no allowlist explosion). On callback, the FE reads `{region, state, redirectUri}` back, asserts the returned `state` query matches, and posts to `/{region}/blizzard-oauth` with the trio.

**Tech Stack:** Vue 3 (`<script setup>` + TS), axios via `src/api/client.ts`, Pinia auth store, Vue Router, vitest + jsdom for unit tests, Cypress for E2E smoke. Backend coordination: Laravel 11, Sanctum, Cache (Redis).

**Coordination:** Task 1 lands BE Task 3 in `backend/.worktrees/backend-review-fixes/` on branch `fix/backend-review-fixes` (the same branch as the rest of the BE review fixes). Tasks 2–5 land in `frontend/.worktrees/oauth-state/` on branch `fix/frontend-review-fixes`. Task 6 verifies them together. The two PRs ship as a pair.

**Coverage scope:** No prior FE review document exists. The only confirmed cross-stack dependency from the BE review is OAuth state. If additional FE findings surface during review, fold them in as new tasks at the bottom — do not retrofit them into this plan's existing tasks.

---

## File Structure

**Backend (Task 1 — executed against `backend/.worktrees/backend-review-fixes/`):**
- Modify: `config/blizzard.php` — add `oauth.redirect_uris` allowlist + `oauth.state_ttl`
- Modify: `.env.example` — add `BLIZZARD_OAUTH_REDIRECT_URIS`, `BLIZZARD_OAUTH_STATE_TTL`
- Modify: `app/Http/Requests/BlizzardOAuthRequest.php` — require `state` (32–128) + allowlist `redirectUri`
- Create: `app/Http/Requests/BlizzardOAuthStateRequest.php` — validate `redirectUri` against allowlist
- Modify: `app/Http/Controllers/BlizzardController.php` — add `state()` action, consume cached state in `handleCode()`
- Modify: `routes/api.php` — register `POST /{region}/blizzard-oauth/state`
- Create: `tests/Feature/Blizzard/OAuthControllerTest.php`

**Frontend (Tasks 2–5 — executed against `frontend/.worktrees/oauth-state/`):**
- Create: `src/utils/oauthPending.ts` — sessionStorage helper for the in-flight `{region,state,redirectUri}` triple
- Create: `src/utils/oauthPending.test.ts` — unit tests for the helper
- Modify: `src/api/blizzard.ts` — add `mintOAuthState`, extend `exchangeOAuthCode` to send `state`
- Create: `src/api/blizzard.test.ts` — unit tests for both API functions (mocked axios client)
- Modify: `src/pages/ProfilePage.vue` — `startOAuth` becomes async: mint state, persist pending, redirect with the *real* state token
- Modify: `src/pages/BlizzardOAuthCallbackPage.vue` — derive region/redirectUri from `oauthPending`, assert `state` query matches, pass `state` into `exchangeOAuthCode`

**Out of scope:**
- No changes to `frontend/CLAUDE.md` — the OAuth flow detail belongs in code, not documentation; the existing CLAUDE.md only mentions env vars.
- No changes to `src/stores/auth.ts` — the helper is self-contained; logout doesn't need to clear pending OAuth (sessionStorage is per-tab and pending lives <10 min).

---

### Task 1: Backend — OAuth state CSRF + redirect-URI allowlist

**Worktree:** `backend/.worktrees/backend-review-fixes/` (branch `fix/backend-review-fixes`).

**Source of truth for steps:** `backend/docs/superpowers/plans/2026-05-04-backend-review-fixes.md`, Task 3 (Steps 1–9, lines ~330–500). That file is checked into the same branch and contains complete code blocks for every change. Execute it verbatim — do **not** improvise.

The deferred header (`> **DEFERRED — DO NOT EXECUTE.**`) inside that BE plan is now lifted: by executing this Task 1 you are pairing the BE change with the FE work in this plan, which is the precondition the deferral required. **Remove the deferral notice as Step 0 below.**

- [ ] **Step 0: Lift the deferral notice in the BE plan**

In `backend/.worktrees/backend-review-fixes/docs/superpowers/plans/2026-05-04-backend-review-fixes.md`, replace this line (currently directly under the `### Task 3:` heading):

```markdown
> **DEFERRED — DO NOT EXECUTE.** Requires a paired frontend change (FE must call the new `/state` endpoint and pass `state` back into the code-exchange request). Shipping this without the FE PR breaks live OAuth. Skip to Task 4.
```

with:

```markdown
> **Paired with FE plan `frontend/docs/superpowers/plans/2026-05-04-frontend-review-fixes.md`.** Execute alongside that plan's tasks; the two PRs must ship together.
```

- [ ] **Step 1: Execute BE Task 3 Step 1 (config + env)**

Apply the diff specified in BE plan Task 3 Step 1 (config block + `.env.example` lines).

- [ ] **Step 2: Execute BE Task 3 Step 2 (write failing tests)**

Create `tests/Feature/Blizzard/OAuthControllerTest.php` exactly as specified in BE plan Task 3 Step 2. Seven test cases.

- [ ] **Step 3: Execute BE Task 3 Step 3 (confirm failure)**

```bash
docker compose exec app composer test -- --filter=OAuthControllerTest
```

Expected: tests fail (no `/state` route, no `state` field validation, etc.).

- [ ] **Step 4: Execute BE Task 3 Steps 4–7 (implement)**

In order:
1. Replace `app/Http/Requests/BlizzardOAuthRequest.php`.
2. Create `app/Http/Requests/BlizzardOAuthStateRequest.php`.
3. Replace `app/Http/Controllers/BlizzardController.php`.
4. Replace the Blizzard OAuth route block in `routes/api.php`.

All code is in the BE plan — copy verbatim.

- [ ] **Step 5: Execute BE Task 3 Step 8 (confirm green)**

```bash
docker compose exec app composer test -- --filter=OAuthControllerTest
```

Expected: all seven OAuth tests pass.

- [ ] **Step 6: Set the local `BLIZZARD_OAUTH_REDIRECT_URIS` env value**

In `backend/.env` (the live `.env`, NOT `.env.example`) — add or update:

```env
BLIZZARD_OAUTH_REDIRECT_URIS=http://localhost:8092/blizzard-oauth,http://100.82.124.39:8092/blizzard-oauth
BLIZZARD_OAUTH_STATE_TTL=600
```

The two host:port pairs match the FE deployment (nginx-served `dist/` on `8092` + Tailscale IP). Restart `app` so config cache picks them up:

```bash
docker compose exec app php artisan config:clear
```

(Required because `config()->get('blizzard.oauth.redirect_uris')` is read at request time but `env()` reads inside `config/blizzard.php` get cached if `php artisan config:cache` was run.)

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/plans/2026-05-04-backend-review-fixes.md \
        config/blizzard.php .env.example \
        app/Http/Requests/BlizzardOAuthRequest.php \
        app/Http/Requests/BlizzardOAuthStateRequest.php \
        app/Http/Controllers/BlizzardController.php \
        routes/api.php \
        tests/Feature/Blizzard/OAuthControllerTest.php
git commit -m "feat(blizzard-oauth): mint state CSRF token and allowlist redirect URIs"
```

---

### Task 2: Frontend — `oauthPending` sessionStorage helper

**Files:**
- Create: `src/utils/oauthPending.ts`
- Create: `src/utils/oauthPending.test.ts`

The helper owns one storage key and three operations: `setOAuthPending`, `takeOAuthPending` (read + remove atomically), `clearOAuthPending`. It validates the shape on read and returns `null` on any malformed/missing payload so the callback can show a clean error rather than crash.

- [ ] **Step 1: Write failing tests**

Create `src/utils/oauthPending.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  setOAuthPending,
  takeOAuthPending,
  clearOAuthPending,
  type OAuthPending,
} from './oauthPending'

const sample: OAuthPending = {
  region: 'eu',
  state: 'a'.repeat(64),
  redirectUri: 'http://localhost:8092/blizzard-oauth',
}

describe('oauthPending', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips a value via set + take', () => {
    setOAuthPending(sample)
    expect(takeOAuthPending()).toEqual(sample)
  })

  it('take consumes the value (subsequent reads return null)', () => {
    setOAuthPending(sample)
    takeOAuthPending()
    expect(takeOAuthPending()).toBeNull()
  })

  it('returns null when nothing is stored', () => {
    expect(takeOAuthPending()).toBeNull()
  })

  it('returns null and clears storage when payload is not valid JSON', () => {
    sessionStorage.setItem('blizzard.oauth.pending', '{not json')
    expect(takeOAuthPending()).toBeNull()
    expect(sessionStorage.getItem('blizzard.oauth.pending')).toBeNull()
  })

  it('returns null when payload is missing fields', () => {
    sessionStorage.setItem(
      'blizzard.oauth.pending',
      JSON.stringify({ region: 'eu', state: 'x' }),
    )
    expect(takeOAuthPending()).toBeNull()
  })

  it('returns null when fields have wrong types', () => {
    sessionStorage.setItem(
      'blizzard.oauth.pending',
      JSON.stringify({ region: 1, state: 2, redirectUri: 3 }),
    )
    expect(takeOAuthPending()).toBeNull()
  })

  it('clearOAuthPending removes the key', () => {
    setOAuthPending(sample)
    clearOAuthPending()
    expect(sessionStorage.getItem('blizzard.oauth.pending')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and confirm failure**

```bash
npx vitest run src/utils/oauthPending.test.ts
```

Expected: FAIL — `Cannot find module './oauthPending'`.

- [ ] **Step 3: Implement the helper**

Create `src/utils/oauthPending.ts`:

```ts
import type { Region } from '@/types/api'

const KEY = 'blizzard.oauth.pending'

export interface OAuthPending {
  region: Region
  state: string
  redirectUri: string
}

const VALID_REGIONS: readonly Region[] = ['eu', 'us', 'kr', 'tw'] as const

function isOAuthPending(value: unknown): value is OAuthPending {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.region === 'string' &&
    (VALID_REGIONS as readonly string[]).includes(v.region) &&
    typeof v.state === 'string' &&
    v.state.length > 0 &&
    typeof v.redirectUri === 'string' &&
    v.redirectUri.length > 0
  )
}

export function setOAuthPending(value: OAuthPending): void {
  sessionStorage.setItem(KEY, JSON.stringify(value))
}

export function takeOAuthPending(): OAuthPending | null {
  const raw = sessionStorage.getItem(KEY)
  sessionStorage.removeItem(KEY)
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  return isOAuthPending(parsed) ? parsed : null
}

export function clearOAuthPending(): void {
  sessionStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Run the test and confirm green**

```bash
npx vitest run src/utils/oauthPending.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/oauthPending.ts src/utils/oauthPending.test.ts
git commit -m "feat(oauth): add sessionStorage helper for pending Battle.net flow"
```

---

### Task 3: Frontend — `mintOAuthState` + `state`-bearing `exchangeOAuthCode`

**Files:**
- Modify: `src/api/blizzard.ts`
- Create: `src/api/blizzard.test.ts`

`exchangeOAuthCode` keeps its `validateStatus: (s) => s === 202` guard — the BE returns 202 on success and 422 on state mismatch, and 422 will throw and be caught by the caller (the existing `getErrorMessage` helper extracts the BE's `response.data.message`).

- [ ] **Step 1: Write failing tests**

Create `src/api/blizzard.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('./client', () => ({ api: { post } }))

import { mintOAuthState, exchangeOAuthCode } from './blizzard'

describe('mintOAuthState', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('POSTs to /{region}/blizzard-oauth/state with the redirectUri', async () => {
    post.mockResolvedValueOnce({ data: { state: 'abc', expires_in: 600 } })
    const result = await mintOAuthState('eu', 'http://localhost:8092/blizzard-oauth')
    expect(post).toHaveBeenCalledWith('/eu/blizzard-oauth/state', {
      redirectUri: 'http://localhost:8092/blizzard-oauth',
    })
    expect(result).toEqual({ state: 'abc', expires_in: 600 })
  })
})

describe('exchangeOAuthCode', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('POSTs code, redirectUri, and state and accepts only 202', async () => {
    post.mockResolvedValueOnce({ status: 202 })
    await exchangeOAuthCode('eu', 'thecode', 'http://localhost:8092/blizzard-oauth', 'thestate')
    expect(post).toHaveBeenCalledTimes(1)
    const [path, body, config] = post.mock.calls[0] as [
      string,
      Record<string, unknown>,
      { validateStatus?: (s: number) => boolean },
    ]
    expect(path).toBe('/eu/blizzard-oauth')
    expect(body).toEqual({
      code: 'thecode',
      redirectUri: 'http://localhost:8092/blizzard-oauth',
      state: 'thestate',
    })
    expect(config.validateStatus?.(202)).toBe(true)
    expect(config.validateStatus?.(200)).toBe(false)
    expect(config.validateStatus?.(422)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and confirm failure**

```bash
npx vitest run src/api/blizzard.test.ts
```

Expected: FAIL — `mintOAuthState` not exported, and the existing `exchangeOAuthCode` doesn't accept a `state` arg.

- [ ] **Step 3: Implement the API helpers**

Replace `src/api/blizzard.ts` with:

```ts
import { api } from './client'
import type { Region } from '@/types/api'

export interface OAuthStateResponse {
  state: string
  expires_in: number
}

export async function mintOAuthState(
  region: Region,
  redirectUri: string,
): Promise<OAuthStateResponse> {
  const { data } = await api.post<OAuthStateResponse>(
    `/${region}/blizzard-oauth/state`,
    { redirectUri },
  )
  return data
}

export async function exchangeOAuthCode(
  region: Region,
  code: string,
  redirectUri: string,
  state: string,
): Promise<void> {
  await api.post(
    `/${region}/blizzard-oauth`,
    { code, redirectUri, state },
    { validateStatus: (s) => s === 202 },
  )
}
```

- [ ] **Step 4: Run the test and confirm green**

```bash
npx vitest run src/api/blizzard.test.ts
```

Expected: PASS — 2 tests.

- [ ] **Step 5: Type check**

```bash
npx vue-tsc -b
```

Expected: clean exit (no callers updated yet, but the existing callers in `ProfilePage.vue` only call `startOAuth` which doesn't touch `exchangeOAuthCode`; `BlizzardOAuthCallbackPage.vue` calls `exchangeOAuthCode` with the old 3-arg signature → **expected to fail** the type-check on the missing `state` argument).

If the typecheck fails on the callback page (it should), that's expected — the next task fixes it. Proceed without committing yet so the API change and the callback fix land atomically and CI never sees an intermediate broken state.

Skip the commit; carry the staged changes into Task 5.

---

### Task 4: Frontend — `ProfilePage.vue` mints state and persists pending

**Files:**
- Modify: `src/pages/ProfilePage.vue`

The current `startOAuth` is synchronous and abuses `state` to encode region. The new flow:

1. Disable the button while in flight (`oauthBusy`).
2. Call `mintOAuthState(region, env.blizzardRedirectUri)`.
3. Store `{region, state, redirectUri}` in sessionStorage via `setOAuthPending`.
4. Redirect to Battle.net with the minted state.
5. On error, surface the BE message via `getErrorMessage` + toast.

No unit test for the page itself — Pinia + Vue Router + window mocking is heavier than the value adds, and the wiring is verified end-to-end in Task 6. The API call shape is locked in by Task 3's tests.

- [ ] **Step 1: Apply the change**

In `src/pages/ProfilePage.vue`, update the `<script setup>` imports — replace:

```ts
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { toggleRecruitment } from '@/api/characters'
import RegionSelect from '@/components/form/RegionSelect.vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import { env } from '@/utils/env'
import { displayName, displayRealm } from '@/utils/display'
import type { Region } from '@/types/api'
import { getErrorMessage } from '@/utils/errors'
```

with:

```ts
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { toggleRecruitment } from '@/api/characters'
import { mintOAuthState } from '@/api/blizzard'
import { setOAuthPending } from '@/utils/oauthPending'
import RegionSelect from '@/components/form/RegionSelect.vue'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import { env } from '@/utils/env'
import { displayName, displayRealm } from '@/utils/display'
import type { Region } from '@/types/api'
import { getErrorMessage } from '@/utils/errors'
```

Then replace the `startOAuth` function (and add the `oauthBusy` ref). Replace this block:

```ts
function startOAuth() {
  // Pass the chosen region via the OAuth `state` param so the callback knows which
  // /{region}/blizzard-oauth endpoint to POST to without needing a separate query param.
  const url = new URL(`https://${oauthRegion.value}.battle.net/oauth/authorize`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', env.blizzardClientId)
  url.searchParams.set('redirect_uri', env.blizzardRedirectUri)
  url.searchParams.set('scope', 'openid wow.profile')
  url.searchParams.set('state', oauthRegion.value)
  window.location.href = url.toString()
}
```

with:

```ts
const oauthBusy = ref(false)

async function startOAuth() {
  if (oauthBusy.value) return
  oauthBusy.value = true
  try {
    const { state } = await mintOAuthState(oauthRegion.value, env.blizzardRedirectUri)
    setOAuthPending({
      region: oauthRegion.value,
      state,
      redirectUri: env.blizzardRedirectUri,
    })
    const url = new URL(`https://${oauthRegion.value}.battle.net/oauth/authorize`)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.blizzardClientId)
    url.searchParams.set('redirect_uri', env.blizzardRedirectUri)
    url.searchParams.set('scope', 'openid wow.profile')
    url.searchParams.set('state', state)
    window.location.href = url.toString()
  } catch (err) {
    oauthBusy.value = false
    toast.error(getErrorMessage(err, 'Failed to start Battle.net sync.'))
  }
  // Note: no `finally` — on success we redirect away, so resetting oauthBusy
  // would be a no-op anyway. The error branch is the only one that returns
  // control to the user; that branch resets explicitly above.
}
```

In the template, wire the button to the busy flag. Replace:

```vue
<button type="button" class="btn btn-primary" @click="startOAuth">
  Sync from Battle.net
</button>
```

with:

```vue
<button
  type="button"
  class="btn btn-primary"
  :disabled="oauthBusy"
  @click="startOAuth"
>
  <span v-if="oauthBusy" class="loading loading-spinner loading-xs" />
  Sync from Battle.net
</button>
```

- [ ] **Step 2: Type check**

```bash
npx vue-tsc -b
```

Expected: still failing on `BlizzardOAuthCallbackPage.vue` (missing `state` arg to `exchangeOAuthCode`) — that's Task 5. The Profile changes themselves should not introduce new errors.

Carry the staged changes into Task 5; do not commit yet.

---

### Task 5: Frontend — `BlizzardOAuthCallbackPage.vue` consumes pending and asserts state

**Files:**
- Modify: `src/pages/BlizzardOAuthCallbackPage.vue`

The new flow:
1. Read `code` and `state` from the route query.
2. Read `{region, state: storedState, redirectUri}` via `takeOAuthPending()` (atomic read+remove).
3. If `code`, `state` query, or pending payload is missing → error.
4. If `pending.state !== route.query.state` → error (defensive; BE will also reject).
5. Call `exchangeOAuthCode(pending.region, code, pending.redirectUri, pending.state)`.
6. Same toast/redirect as before on success.

This task also lands the API + Profile changes from Tasks 3 and 4 in the same commit, since those changes are coupled by the contract (`state` arg).

- [ ] **Step 1: Apply the change**

Replace the `<script setup>` block of `src/pages/BlizzardOAuthCallbackPage.vue` with:

```ts
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { exchangeOAuthCode } from '@/api/blizzard'
import { takeOAuthPending } from '@/utils/oauthPending'
import { useAuthStore } from '@/stores/auth'
import PollingState from '@/components/feedback/PollingState.vue'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const status = ref<'processing' | 'success' | 'error'>('processing')
const message = ref('')

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : undefined
  const stateParam = typeof route.query.state === 'string' ? route.query.state : undefined
  const pending = takeOAuthPending()

  if (!code || !stateParam || !pending) {
    status.value = 'error'
    message.value =
      'Battle.net session is missing or expired. Start the sync again from your profile.'
    return
  }

  if (pending.state !== stateParam) {
    status.value = 'error'
    message.value =
      'Battle.net session does not match. Start the sync again from your profile.'
    return
  }

  try {
    await exchangeOAuthCode(pending.region, code, pending.redirectUri, pending.state)
    toast.success('Battle.net sync started — your characters will appear shortly.')
    status.value = 'success'
    // BE returns 202 + Retry-After. Schedule a delayed fetchMe so the profile
    // reflects the synced characters once the background job finishes.
    setTimeout(() => auth.fetchMe(), 8000)
    router.push({ name: 'profile' })
  } catch (err) {
    status.value = 'error'
    message.value = getErrorMessage(err, 'Failed to start Battle.net sync.')
    toast.error(message.value)
  }
})
```

The unused imports (`env`, `Region`, `VALID_REGIONS`) are gone — region now comes from `pending`, not the query. Leave the `<template>` block untouched.

- [ ] **Step 2: Type check + run all unit tests**

```bash
npx vue-tsc -b && npx vitest run
```

Expected: clean exit on type check; all vitest tests pass (including the new `oauthPending` and `blizzard` tests).

- [ ] **Step 3: Production build sanity**

```bash
npm run build
```

Expected: exit 0, `dist/` regenerated. Required because the FE on port 8092 serves `dist/`, not Vite — Task 6 verifies against the built bundle.

- [ ] **Step 4: Commit (Tasks 3 + 4 + 5 together)**

```bash
git add src/api/blizzard.ts src/api/blizzard.test.ts \
        src/pages/ProfilePage.vue \
        src/pages/BlizzardOAuthCallbackPage.vue \
        docs/superpowers/plans/2026-05-04-frontend-review-fixes.md
git commit -m "feat(oauth): mint server-side state CSRF and consume on callback"
```

(The plan file ships in the same commit so the branch carries its own spec, mirroring how the BE branch carries `2026-05-04-backend-review-fixes.md`.)

---

### Task 6: End-to-end verification

**Goal:** confirm the FE handshake works against the locally-running BE that has Task 1 applied. This is a manual smoke — there is no automated cross-stack test.

**Preconditions:**
- BE Task 1 is committed on `fix/backend-review-fixes` and the `app` container is running with the updated config.
- FE worktree's `dist/` has been built (Task 5 Step 3).
- nginx-served FE is up on `http://localhost:8092` with `/api/v1/` proxying to the BE on 8091.
- A test user is logged in on the FE (any registered user — OAuth requires `auth:sanctum`).

- [ ] **Step 1: Verify nginx is serving the FE worktree's `dist/`**

The `guild-service-fe-v2` nginx container points at `frontend/dist`. Since both the main checkout and the worktree share the same `dist/` location only if you build from the same path, **build from the worktree explicitly**:

```bash
cd /home/dakiman/projects/guild-service-v2/frontend/.worktrees/oauth-state
npm run build
```

`dist/` is gitignored so no diff appears, but the served bundle now reflects the worktree's source.

(If the user's nginx points at the main checkout's `dist/` instead — verify with `docker compose -f ~/dakis-server/docker-compose.yml ps guild-service-fe-v2` and `inspect` — copy the worktree `dist/` over the main one or rebuild from the main checkout after merging. Either way, the served bundle must reflect the changes before testing.)

- [ ] **Step 2: Mint-state happy path**

In an authenticated browser session on `http://localhost:8092/profile`:
1. Open DevTools → Network.
2. Choose region (EU) and click **Sync from Battle.net**.
3. Confirm a `POST http://localhost:8092/api/v1/eu/blizzard-oauth/state` returns 200 with `{state, expires_in: 600}`.
4. In Application → Session Storage, confirm `blizzard.oauth.pending` contains `{region:"eu", state:"<64 chars>", redirectUri:"http://localhost:8092/blizzard-oauth"}`.
5. The browser redirects to `https://eu.battle.net/oauth/authorize?...&state=<64 chars>`.

- [ ] **Step 3: Callback happy path**

After authorizing on Battle.net:
1. The redirect lands at `http://localhost:8092/blizzard-oauth?code=...&state=<64 chars>`.
2. A `POST /api/v1/eu/blizzard-oauth` is sent with `{code, redirectUri, state}`; BE returns 202.
3. Toast shows "Battle.net sync started — your characters will appear shortly."
4. Browser navigates to `/profile`.
5. Session Storage `blizzard.oauth.pending` is now gone.
6. After ~8 s, `auth.fetchMe()` runs and the character list renders (assuming the sync job completed).

- [ ] **Step 4: Tampered-state rejection**

Reproduce the start flow up to the redirect, then **before** Battle.net redirects back, manually navigate to:

```
http://localhost:8092/blizzard-oauth?code=fake&state=tamperedstate
```

Expected: error card "Battle.net session does not match. Start the sync again from your profile." (FE catches the mismatch locally; no BE call is made.)

- [ ] **Step 5: Missing-pending rejection**

Clear `sessionStorage` (DevTools → Application → Storage → Clear site data, or just `sessionStorage.clear()` in console), then navigate to:

```
http://localhost:8092/blizzard-oauth?code=fake&state=anystate
```

Expected: error card "Battle.net session is missing or expired. Start the sync again from your profile."

- [ ] **Step 6: BE state-mismatch rejection (server side)**

Repeat the start flow normally, but in the callback page intercept the `POST /api/v1/eu/blizzard-oauth` request and rewrite its body to use a different (valid-looking) 64-char `state` than the one in storage. (DevTools → Network → Right-click → Override → modify body, or use a Charles/mitmproxy interception.) Expected: BE returns 422 with `{message: "Invalid OAuth state."}`; FE shows the BE message via toast.

If interception is too fiddly, skip this step — the BE side is unit-tested in Task 1 Step 5 and the locally-side mismatch is covered in Step 4.

- [ ] **Step 7: Single-use enforcement**

After completing Step 3 successfully, navigate **back** to `/blizzard-oauth?code=...&state=<the-now-consumed-state>`. Expected: error card "Battle.net session is missing or expired" (sessionStorage was cleared atomically by `takeOAuthPending`).

- [ ] **Step 8: Record results**

Note in the PR description which steps passed and any environmental quirks (e.g. nginx pointed at the wrong checkout). If any step fails, **do not** open the PR — file the failure here, fix, repeat from Step 2.

---

## Coverage Verification

- BE OAuth state CSRF + redirect-URI allowlist: **Task 1** (executes BE plan Task 3 verbatim).
- FE state-mint API: **Task 3** Step 3 (`mintOAuthState`).
- FE redirect carries minted state, region stored separately: **Task 4**.
- FE callback consumes pending, asserts match, sends triple to BE: **Task 5**.
- End-to-end happy path + tampered + missing + single-use: **Task 6**.

No FE review document existed; therefore no other findings to fold in. If new FE issues are surfaced during review of this PR, they get a separate plan rather than retrofit here.
