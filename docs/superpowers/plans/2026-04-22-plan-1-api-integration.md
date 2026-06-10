# Plan 1 — API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consume the enriched `guild-service-be-v2` Plan 1 character response in the `guild-service-fe-v2` frontend — new equipment shape, PvP talents + loadout code, top-level `meta.freshness`, and HTTP 429 throttle handling.

**Architecture:** All work happens in the existing Vue 3 + TS + Pinia + TanStack Vue Query + Tailwind/DaisyUI SPA. We update the type layer first, then the API adapter to parse the new `{data, meta}` envelope and map 429 → a typed error, then wire new props through `WowheadLink` + `EquipmentList`, then surface the new talents/loadout/freshness UI. Pure helpers (Wowhead URL builder, tier-set grouping) are extracted into `src/utils/` and unit-tested with the already-installed Vitest.

**Tech Stack:** Vue 3 `<script setup>` + TypeScript + Vite + Pinia + TanStack Vue Query + Tailwind + DaisyUI + `vue-sonner` toasts. Unit tests: Vitest + @vue/test-utils (both already in `devDependencies`; test script wiring is added in Task 0). E2E: Cypress (untouched here).

**Source spec:** `summary_for_fe.md` (removed — was a historical hand-off doc). Backend sources: `../guild-service-be-v2/docs/superpowers/specs/2026-04-22-v1-feature-parity-and-enrichment-design.md` and `../guild-service-be-v2/docs/superpowers/plans/2026-04-22-plan-1-schema-and-equipment-enrichment.md`.

---

## File Structure

Files created or touched, grouped by responsibility:

**Types (data contract)**
- Modify: `src/types/character.ts` — expand `EquipmentItem`, replace `TalentEntry`, add `PvpTalentEntry`, `MythicPlusRating`, `CharacterResource` extensions, `MetaBlock`, `CharacterResponse`, update `CharacterLookupResult` to carry `meta`.
- Modify: `src/types/api.ts` — add `ThrottledError`.

**API adapter**
- Modify: `src/api/characters.ts` — parse `{data, meta}` envelope, accept 429, map 429 → `ThrottledError`, still set `isStale` (prefer `meta.freshness.profile`, fall back to header).
- Modify: `src/composables/usePollingLookup.ts` — do not auto-retry `ThrottledError`.

**Pure utilities (new, unit-tested)**
- Create: `src/utils/wowhead.ts` — `buildWowheadHref(opts)` pure function.
- Create: `src/utils/wowhead.test.ts`
- Create: `src/utils/equipmentSets.ts` — `groupEquipmentBySetId(equipment)` + `getPcsFor(item, groups)` pure functions.
- Create: `src/utils/equipmentSets.test.ts`

**UI — presentational components**
- Modify: `src/components/wow/WowheadLink.vue` — accept `bonus`, `gems`, `enchantments`, `pcs`, `classic` props; delegate URL building to `buildWowheadHref`.
- Modify: `src/components/character/EquipmentList.vue` — group by `set_id`, pass new props to `WowheadLink`, label with `item.name`.
- Modify: `src/components/character/TalentTree.vue` — adapt to new `TalentEntry {id, rank}` shape, add optional PvP panel, add optional "Copy loadout" button.
- Create: `src/components/feedback/FreshnessChips.vue` — five chips driven by `MetaBlock.freshness`.
- Modify: `src/components/feedback/ErrorState.vue` — render a throttled variant with a live `Retry-After` countdown when the error is `ThrottledError`.

**Page wiring**
- Modify: `src/pages/CharacterDetailPage.vue` — pass `character.talent_loadout_code` into `TalentTree`, mount `FreshnessChips` using `lookup.data.value?.meta.freshness`.

**Test / build infra**
- Modify: `package.json` — add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- Create: `src/utils/__smoke.test.ts` — trivial sanity test proving Vitest is wired up (removed at the end of the plan).

**Unchanged — confirmed during task work but no edit needed:**
- `index.html` — already loads `https://wow.zamimg.com/widgets/power.js` with the right `whTooltips` config.
- `src/composables/useWowhead.ts` — `useWowheadRefresh` already keys off the `character` computed; the new shape still triggers it.
- `src/composables/useStaleAutoRefresh.ts` — continues to work off the `isStale` boolean we set in the API adapter.
- Plan 2 slots (`mythic_plus_rating`, `pvp_brackets`, `professions`, `raid_progress`) — typed as nullable, rendered nowhere yet; will populate when Plan 2 ships without further FE change.

---

## Task 0 — Wire up Vitest so later tasks can TDD pure helpers

**Why this exists:** `vitest`, `@vue/test-utils`, and `jsdom` are already in `devDependencies` but there is no `test` script and no config, so the next task that wants to TDD a pure function would otherwise have to add infra mid-stream. This task stands up the smallest possible surface.

**Files:**
- Modify: `package.json`
- Create: `src/utils/__smoke.test.ts`

- [ ] **Step 1: Add test scripts to `package.json`**

Open `package.json` and edit the `scripts` block so it becomes exactly:

```json
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 2: Write a throwaway smoke test to prove the runner works**

Create `src/utils/__smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest smoke test', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 3: Run it**

Run: `npm test`
Expected: Vitest starts, finds `src/utils/__smoke.test.ts`, prints `1 passed`, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add package.json src/utils/__smoke.test.ts
git commit -m "chore: wire up vitest with a smoke test"
```

The smoke file is removed in Task 11 after the real pure-function tests exist.

---

## Task 1 — Expand the type definitions to the new BE contract

**Why this exists:** Every downstream task reads from these types. Updating them first lets every later task lean on the compiler.

**Files:**
- Modify: `src/types/character.ts`
- Modify: `src/types/api.ts`
- Modify: `src/components/character/TalentTree.vue` (tiny fix — the old `:label="t.name"` no longer compiles because `TalentEntry.name` is gone; we replace it with a rank string to keep the build green. Full talents rework lands in Task 8.)

- [ ] **Step 1: Replace `src/types/character.ts` with the new shape**

Overwrite `src/types/character.ts` with:

```ts
import type { Region } from './api'
import type { Faction, Slot } from './wow'
import type { GuildSummary } from './guild'

export type GameVersion = 'retail' | 'classic'
export type FreshnessState = 'fresh' | 'stale' | 'never_synced'

export interface CharacterSummary {
  id: number
  name: string
  realm: string
  region: Region
  class_id: number
  level: number
  faction: Faction
  active_specialization: string | null
  media: string | null
}

export interface EquipmentStat {
  type: string
  value: number
  is_negated: boolean
}

export interface EquipmentItem {
  id: number
  name: string
  quality: string
  slot: Slot
  item_level: number
  bonus: number[]
  gems: number[]
  enchantments: number[]
  set_id: number | null
  stats: EquipmentStat[]
}

export interface TalentEntry {
  id: number
  rank: number
}

export interface PvpTalentEntry {
  slot: number
  talent_id: number
  spell_id: number
}

export interface CharacterTalents {
  class: TalentEntry[]
  spec: TalentEntry[]
  hero: TalentEntry[]
  pvp: PvpTalentEntry[]
}

export interface MythicPlusRating {
  rating: number
  per_spec: Record<string, number>
}

// Plan 2 placeholders — real shape arrives when Plan 2 ships.
export type PvpBracketStats = Record<string, unknown>
export type Professions = Record<string, unknown>
export type RaidProgress = Record<string, unknown>

export interface DungeonRunMember {
  character_id: number
  character_name: string
  character_realm: string
  character_region: Region
  spec_id: number | null
  spec_name: string
  equipped_item_level: number
}

export interface DungeonRun {
  id: number
  season: number
  dungeon_id: number
  dungeon_name: string
  keystone_level: number
  duration: number
  completed_timestamp: number
  is_completed_on_time: boolean
  affixes: string[]
  members: DungeonRunMember[]
}

export interface CharacterResource {
  id: number
  name: string
  realm: string
  region: Region
  game_version: GameVersion
  gender: string
  faction: Faction
  race_id: number
  class_id: number
  level: number
  achievement_points: number
  average_item_level: number
  equipped_item_level: number
  active_specialization: string | null
  talent_loadout_code: string | null
  mythic_plus_rating: MythicPlusRating | null
  media: { avatar: string; inset: string; main: string }
  talents: CharacterTalents
  equipment: EquipmentItem[]
  pvp_brackets: PvpBracketStats[] | null
  professions: Professions | null
  raid_progress: RaidProgress | null
  recruitment: boolean
  guild: GuildSummary | null
  dungeon_runs: DungeonRun[]
  last_searched_at: string | null
  mythics_synced_at: string | null
  synced_at: string | null
}

export interface MetaBlock {
  game_version: GameVersion
  forced_refresh: boolean
  freshness: {
    profile: FreshnessState
    mythic_plus: FreshnessState
    pvp: FreshnessState
    professions: FreshnessState
    raids: FreshnessState
  }
}

export interface CharacterResponse {
  data: CharacterResource
  meta: MetaBlock
}

export interface CharacterLookupResult {
  data: CharacterResource
  meta: MetaBlock
  isStale: boolean
}
```

- [ ] **Step 2: Add `ThrottledError` to `src/types/api.ts`**

Append the following class to `src/types/api.ts` below the existing `NotFoundError`:

```ts
export class ThrottledError extends Error {
  readonly retryAfter: number
  constructor(retryAfter: number) {
    super('THROTTLED')
    this.name = 'ThrottledError'
    this.retryAfter = retryAfter
  }
}
```

`retryAfter` is in **milliseconds**, matching the existing `SyncPendingError` convention (the adapter in Task 2 converts from the `Retry-After` header's seconds to ms at the throw site).

- [ ] **Step 3: Keep `TalentTree.vue` compiling after `TalentEntry.name` goes away**

Open `src/components/character/TalentTree.vue`. There are three `<WowheadLink :spell-id="t.id" :label="t.name" />` sites (one each in the Class / Spec / Hero sections). In each one, drop `:label="t.name"` and put rank-driven slot content inside the link. Example for the Class section (apply the same treatment to Spec and Hero):

```vue
<li v-for="t in talents.class" :key="`class-${t.id}`">
  <WowheadLink :spell-id="t.id">Rank {{ t.rank }}</WowheadLink>
</li>
```

This is a stop-gap so the build stays green. Task 8 revisits the rendering and adds the PvP panel + copy-loadout affordance.

- [ ] **Step 4: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/character.ts src/types/api.ts src/components/character/TalentTree.vue
git commit -m "types: adopt Plan 1 character shape and add ThrottledError"
```

---

## Task 2 — Update `fetchCharacter` for the `{data, meta}` envelope and 429

**Files:**
- Modify: `src/api/characters.ts`
- Modify: `src/pages/CharacterDetailPage.vue` (one-line null-safety fix — `synced_at` is now `string | null`, `StaleBadge.lastSyncedAt` is `string | undefined`)

- [ ] **Step 1: Rewrite `fetchCharacter`**

Replace the body of `src/api/characters.ts` with:

```ts
import { api } from './client'
import { NotFoundError, SyncPendingError, ThrottledError } from '@/types/api'
import type {
  CharacterLookupResult,
  CharacterResource,
  CharacterResponse,
  CharacterSummary,
} from '@/types/character'
import type { Region } from '@/types/api'

export async function fetchCharacter(
  region: Region,
  realm: string,
  name: string,
): Promise<CharacterLookupResult> {
  const res = await api.get<CharacterResponse>(`/characters/${region}/${realm}/${name}`, {
    validateStatus: (s) => s === 200 || s === 202 || s === 404 || s === 429,
  })

  if (res.status === 202) {
    throw new SyncPendingError(parseInt(res.headers['retry-after'] ?? '5', 10) * 1000)
  }

  if (res.status === 404) {
    throw new NotFoundError()
  }

  if (res.status === 429) {
    throw new ThrottledError(parseInt(res.headers['retry-after'] ?? '60', 10) * 1000)
  }

  const { data, meta } = res.data
  const headerStale = res.headers['x-data-staleness'] === 'stale'
  const metaStale = meta?.freshness?.profile === 'stale'

  return {
    data,
    meta,
    isStale: metaStale || headerStale,
  }
}

export async function fetchPopularCharacters(): Promise<{
  recently_searched: CharacterSummary[]
  most_popular: CharacterSummary[]
}> {
  const res = await api.get<{
    recently_searched: CharacterSummary[]
    most_popular: CharacterSummary[]
  }>('/characters/popular')
  return res.data
}

export async function toggleRecruitment(id: number): Promise<CharacterResource> {
  const res = await api.patch<CharacterResource>(`/characters/${id}/recruitment`)
  return res.data
}
```

Notes:
- `meta.freshness.profile === 'stale'` is now the primary staleness signal; the header is kept as a fallback so an older BE deploy does not break the banner.
- `toggleRecruitment` still returns `CharacterResource` — the PATCH response is not wrapped in `{data, meta}`, per the existing convention. If the BE later changes this, update here.

- [ ] **Step 2: Null-safety fix in `CharacterDetailPage.vue`**

Task 1 widened `CharacterResource.synced_at` to `string | null`, but `StaleBadge`'s `lastSyncedAt` prop is declared `string | undefined`. The existing template passes `character.synced_at` directly. Open `src/pages/CharacterDetailPage.vue` and change the one affected line:

```vue
<StaleBadge v-if="isStale" :last-synced-at="character.synced_at ?? undefined" />
```

That is the only change in this file for Task 2. Page-level wiring of `meta` and `FreshnessChips` is still Task 10's job.

- [ ] **Step 3: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/api/characters.ts src/pages/CharacterDetailPage.vue
git commit -m "api: parse {data, meta} envelope and map 429 to ThrottledError"
```

---

## Task 3 — Do not auto-retry `ThrottledError`

**Files:**
- Modify: `src/composables/usePollingLookup.ts`

- [ ] **Step 1: Tighten the retry predicate in `useCharacterLookup`**

In `src/composables/usePollingLookup.ts`, the current `retry` callback only returns true for `SyncPendingError`, which already (correctly) implies it returns false for `ThrottledError`. However, TanStack Query has a default retry count of 3 for unknown errors — since we just added a new error class, we want to be explicit. Replace the body of `useCharacterLookup` with:

```ts
export function useCharacterLookup(
  region: Ref<Region>,
  realm: Ref<string>,
  name: Ref<string>,
) {
  return useQuery({
    queryKey: ['character', region, realm, name] as const,
    queryFn: () => fetchCharacter(region.value, realm.value, name.value),
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: (failureCount, error) => {
      if (error instanceof SyncPendingError) return failureCount < MAX_POLLING_ATTEMPTS
      // All other typed errors (NotFound, Throttled, …) must bubble to the UI immediately.
      return false
    },
    retryDelay: (_count, error) =>
      error instanceof SyncPendingError ? error.retryAfter : DEFAULT_RETRY_DELAY,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
```

Do the same treatment to `useGuildLookup` in the same file for consistency (guilds also run through the same client; a future 429 there should not be retried either):

```ts
export function useGuildLookup(
  region: Ref<Region>,
  realm: Ref<string>,
  name: Ref<string>,
  page: Ref<number>,
  perPage = 50,
) {
  return useQuery({
    queryKey: ['guild', region, realm, name, page, perPage] as const,
    queryFn: () => fetchGuild(region.value, realm.value, name.value, perPage, page.value),
    enabled: () => !!region.value && !!realm.value && !!name.value,
    retry: (failureCount, error) => {
      if (error instanceof SyncPendingError) return failureCount < MAX_POLLING_ATTEMPTS
      return false
    },
    retryDelay: (_count, error) =>
      error instanceof SyncPendingError ? error.retryAfter : DEFAULT_RETRY_DELAY,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
```

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/composables/usePollingLookup.ts
git commit -m "lookup: explicit retry policy — only SyncPendingError polls"
```

---

## Task 4 — Pure Wowhead URL builder utility (TDD)

**Files:**
- Create: `src/utils/wowhead.ts`
- Create: `src/utils/wowhead.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/wowhead.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildWowheadHref } from './wowhead'

describe('buildWowheadHref', () => {
  it('builds an item-only href', () => {
    expect(buildWowheadHref({ itemId: 123 })).toBe('item=123')
  })

  it('builds a spell-only href', () => {
    expect(buildWowheadHref({ spellId: 456 })).toBe('spell=456')
  })

  it('appends ilvl when item is present', () => {
    expect(buildWowheadHref({ itemId: 123, itemLevel: 486 })).toBe('item=123&ilvl=486')
  })

  it('joins bonus ids with colons', () => {
    expect(
      buildWowheadHref({ itemId: 1, bonus: [7981, 8781, 9144] }),
    ).toBe('item=1&bonus=7981:8781:9144')
  })

  it('preserves zero-placeholder empty sockets in gems', () => {
    expect(
      buildWowheadHref({ itemId: 1, gems: [192985, 0, 192958] }),
    ).toBe('item=1&gems=192985:0:192958')
  })

  it('joins enchantments with colons', () => {
    expect(
      buildWowheadHref({ itemId: 1, enchantments: [6652] }),
    ).toBe('item=1&ench=6652')
  })

  it('joins pcs and adds domain=classic when classic=true', () => {
    expect(
      buildWowheadHref({
        itemId: 1,
        pcs: [219326, 219327],
        classic: true,
      }),
    ).toBe('item=1&pcs=219326:219327&domain=classic')
  })

  it('omits empty array params', () => {
    expect(
      buildWowheadHref({
        itemId: 1,
        bonus: [],
        gems: [],
        enchantments: [],
        pcs: [],
      }),
    ).toBe('item=1')
  })

  it('combines every param in the spec order', () => {
    expect(
      buildWowheadHref({
        itemId: 219325,
        itemLevel: 486,
        bonus: [7981, 8781, 9144],
        gems: [192985, 0, 192958],
        enchantments: [6652],
        pcs: [219326, 219327],
        classic: true,
      }),
    ).toBe(
      'item=219325&ilvl=486&bonus=7981:8781:9144&gems=192985:0:192958&ench=6652&pcs=219326:219327&domain=classic',
    )
  })

  it('returns empty string when nothing useful is given', () => {
    expect(buildWowheadHref({})).toBe('')
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test -- wowhead`
Expected: FAIL — `Cannot find module './wowhead'` (the module does not exist yet).

- [ ] **Step 3: Implement `buildWowheadHref`**

Create `src/utils/wowhead.ts`:

```ts
export interface WowheadHrefOptions {
  itemId?: number
  spellId?: number
  itemLevel?: number
  bonus?: number[]
  gems?: number[]
  enchantments?: number[]
  pcs?: number[]
  classic?: boolean
}

export function buildWowheadHref(opts: WowheadHrefOptions): string {
  let h = ''
  if (opts.itemId) h += `item=${opts.itemId}`
  else if (opts.spellId) h += `spell=${opts.spellId}`

  if (opts.itemLevel) h += `&ilvl=${opts.itemLevel}`
  if (opts.bonus && opts.bonus.length) h += `&bonus=${opts.bonus.join(':')}`
  if (opts.gems && opts.gems.length) h += `&gems=${opts.gems.join(':')}`
  if (opts.enchantments && opts.enchantments.length) h += `&ench=${opts.enchantments.join(':')}`
  if (opts.pcs && opts.pcs.length) h += `&pcs=${opts.pcs.join(':')}`
  if (opts.classic) h += `&domain=classic`

  return h
}
```

Note: the `else if` between `itemId` and `spellId` differs from the old component's always-append behaviour. The old code silently concatenated `item=X` and `spell=Y` if both were passed, producing an invalid URL; the new helper prefers `item`, which matches how Wowhead disambiguates entity type from the first parameter.

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test -- wowhead`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/wowhead.ts src/utils/wowhead.test.ts
git commit -m "utils: extract pure buildWowheadHref with tests"
```

---

## Task 5 — `WowheadLink.vue` uses the new builder and the new props

**Files:**
- Modify: `src/components/wow/WowheadLink.vue`

- [ ] **Step 1: Replace the component body**

Overwrite `src/components/wow/WowheadLink.vue` with:

```vue
<template>
  <a
    :href="`https://www.wowhead.com/${href}`"
    :data-wowhead="href"
    :class="qualityClass"
    target="_blank"
    rel="noopener"
  >
    <slot>{{ label }}</slot>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildWowheadHref } from '@/utils/wowhead'

const props = defineProps<{
  itemId?: number
  spellId?: number
  itemLevel?: number
  qualityId?: number
  label?: string
  bonus?: number[]
  gems?: number[]
  enchantments?: number[]
  pcs?: number[]
  classic?: boolean
}>()

const href = computed(() =>
  buildWowheadHref({
    itemId: props.itemId,
    spellId: props.spellId,
    itemLevel: props.itemLevel,
    bonus: props.bonus,
    gems: props.gems,
    enchantments: props.enchantments,
    pcs: props.pcs,
    classic: props.classic,
  }),
)

const qualityClass = computed(() => (props.qualityId !== undefined ? `q${props.qualityId}` : ''))
</script>
```

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/wow/WowheadLink.vue
git commit -m "WowheadLink: add bonus/gems/enchantments/pcs/classic props"
```

---

## Task 6 — Pure tier-set grouping utility (TDD)

**Files:**
- Create: `src/utils/equipmentSets.ts`
- Create: `src/utils/equipmentSets.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/equipmentSets.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { groupEquipmentBySetId, getPcsFor } from './equipmentSets'
import type { EquipmentItem } from '@/types/character'

function item(partial: Partial<EquipmentItem> & Pick<EquipmentItem, 'id'>): EquipmentItem {
  return {
    id: partial.id,
    name: partial.name ?? 'x',
    quality: partial.quality ?? 'epic',
    slot: partial.slot ?? 'head',
    item_level: partial.item_level ?? 1,
    bonus: partial.bonus ?? [],
    gems: partial.gems ?? [],
    enchantments: partial.enchantments ?? [],
    set_id: partial.set_id ?? null,
    stats: partial.stats ?? [],
  }
}

describe('groupEquipmentBySetId', () => {
  it('returns an empty map when no item has a set_id', () => {
    const groups = groupEquipmentBySetId([item({ id: 1 }), item({ id: 2 })])
    expect(groups.size).toBe(0)
  })

  it('groups items that share a set_id', () => {
    const groups = groupEquipmentBySetId([
      item({ id: 1, set_id: 1615 }),
      item({ id: 2, set_id: 1615 }),
      item({ id: 3, set_id: null }),
      item({ id: 4, set_id: 1616 }),
    ])
    expect(groups.get(1615)).toEqual([1, 2])
    expect(groups.get(1616)).toEqual([4])
    expect(groups.has(null as unknown as number)).toBe(false)
  })
})

describe('getPcsFor', () => {
  it('returns undefined when the item has no set_id', () => {
    const groups = new Map<number, number[]>()
    expect(getPcsFor(item({ id: 1, set_id: null }), groups)).toBeUndefined()
  })

  it('returns the full sibling list (including the item itself) when it belongs to a set', () => {
    const groups = new Map<number, number[]>([[1615, [1, 2, 3]]])
    expect(getPcsFor(item({ id: 2, set_id: 1615 }), groups)).toEqual([1, 2, 3])
  })

  it('returns undefined when the set_id is not in the group map', () => {
    const groups = new Map<number, number[]>()
    expect(getPcsFor(item({ id: 1, set_id: 9999 }), groups)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test -- equipmentSets`
Expected: FAIL — `Cannot find module './equipmentSets'`.

- [ ] **Step 3: Implement the helpers**

Create `src/utils/equipmentSets.ts`:

```ts
import type { EquipmentItem } from '@/types/character'

export function groupEquipmentBySetId(equipment: EquipmentItem[]): Map<number, number[]> {
  const groups = new Map<number, number[]>()
  for (const it of equipment) {
    if (it.set_id == null) continue
    const list = groups.get(it.set_id)
    if (list) list.push(it.id)
    else groups.set(it.set_id, [it.id])
  }
  return groups
}

export function getPcsFor(
  item: EquipmentItem,
  groups: Map<number, number[]>,
): number[] | undefined {
  if (item.set_id == null) return undefined
  return groups.get(item.set_id)
}
```

Design note: we keep the item's own id in the returned list because Wowhead's `&pcs=` parameter computes set-bonus text from the piece count and shown items — passing the full list lets Wowhead render "N/M bonuses active" correctly. Matches the Wowhead `&pcs=` pattern from the original hand-off spec (removed `summary_for_fe.md:238-242`).

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test -- equipmentSets`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/equipmentSets.ts src/utils/equipmentSets.test.ts
git commit -m "utils: pure tier-set grouping helpers with tests"
```

---

## Task 7 — `EquipmentList.vue` wires the new props through

**Files:**
- Modify: `src/components/character/EquipmentList.vue`

- [ ] **Step 1: Update the script and template**

Overwrite `src/components/character/EquipmentList.vue` with:

```vue
<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Equipment</h2>
      <p v-if="!equipment.length" class="text-base-content/60">No equipment recorded.</p>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="item in sortedEquipment"
          :key="`${item.slot}-${item.id}`"
          class="flex items-center justify-between gap-2 px-3 py-2 rounded bg-base-100"
        >
          <span class="text-xs uppercase text-base-content/60 w-24">
            {{ formatSlot(item.slot) }}
          </span>
          <WowheadLink
            :item-id="item.id"
            :item-level="item.item_level"
            :quality-id="itemQualityToId(item.quality)"
            :bonus="item.bonus"
            :gems="item.gems"
            :enchantments="item.enchantments"
            :pcs="pcsFor(item)"
            class="flex-1 truncate"
          >
            {{ item.item_level }} {{ item.name || formatQuality(item.quality) }}
          </WowheadLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import { itemQualityToId } from '@/utils/wowConstants'
import { groupEquipmentBySetId, getPcsFor } from '@/utils/equipmentSets'
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

const props = defineProps<{ equipment: EquipmentItem[] }>()

const SLOT_ORDER: Slot[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'shirt',
  'tabard',
  'wrist',
  'hands',
  'waist',
  'legs',
  'feet',
  'finger_1',
  'finger_2',
  'trinket_1',
  'trinket_2',
  'main_hand',
  'off_hand',
  'ranged',
]

const sortedEquipment = computed(() => {
  const order = new Map<Slot, number>(SLOT_ORDER.map((s, i) => [s, i]))
  return [...props.equipment].sort((a, b) => {
    const ai = order.get(a.slot) ?? 999
    const bi = order.get(b.slot) ?? 999
    return ai - bi
  })
})

const sets = computed(() => groupEquipmentBySetId(props.equipment))

function pcsFor(item: EquipmentItem): number[] | undefined {
  return getPcsFor(item, sets.value)
}

function formatSlot(slot: string): string {
  return slot.replace(/_/g, ' ')
}

function formatQuality(quality: string): string {
  if (!quality) return ''
  return quality.charAt(0).toUpperCase() + quality.slice(1).toLowerCase()
}
</script>
```

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/EquipmentList.vue
git commit -m "EquipmentList: pass bonus/gems/enchantments/pcs to Wowhead"
```

(Full manual UI smoke is deferred to Task 11; steps 1–2 above are the guard here.)

---

## Task 8 — `TalentTree.vue` with PvP panel and Copy Loadout button

**Files:**
- Modify: `src/components/character/TalentTree.vue`
- Modify: `src/pages/CharacterDetailPage.vue` (pass `talent_loadout_code` down)

- [ ] **Step 1: Rewrite `TalentTree.vue`**

Overwrite `src/components/character/TalentTree.vue` with:

```vue
<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="card-title">Talents</h2>
        <button
          v-if="loadoutCode"
          type="button"
          class="btn btn-sm btn-outline"
          @click="copyLoadout"
        >
          {{ justCopied ? 'Copied!' : 'Copy loadout' }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Class
          </h3>
          <p v-if="!talents.class.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.class" :key="`class-${t.id}`">
              <WowheadLink :spell-id="t.id">Rank {{ t.rank }}</WowheadLink>
            </li>
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Spec
          </h3>
          <p v-if="!talents.spec.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.spec" :key="`spec-${t.id}`">
              <WowheadLink :spell-id="t.id">Rank {{ t.rank }}</WowheadLink>
            </li>
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Hero
          </h3>
          <p v-if="!talents.hero.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.hero" :key="`hero-${t.id}`">
              <WowheadLink :spell-id="t.id">Rank {{ t.rank }}</WowheadLink>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="talents.pvp && talents.pvp.length" class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
          PvP
        </h3>
        <ul class="flex flex-wrap gap-2">
          <li v-for="p in talents.pvp" :key="`pvp-${p.slot}`">
            <WowheadLink :spell-id="p.spell_id">Slot {{ p.slot + 1 }}</WowheadLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import type { CharacterTalents } from '@/types/character'

const props = defineProps<{
  talents: CharacterTalents
  loadoutCode?: string | null
}>()

const justCopied = ref(false)

async function copyLoadout() {
  if (!props.loadoutCode) return
  try {
    await navigator.clipboard.writeText(props.loadoutCode)
    justCopied.value = true
    toast.success('Loadout code copied — paste it into WoW\'s Import Loadout box')
    setTimeout(() => (justCopied.value = false), 2000)
  } catch {
    toast.error('Could not copy to clipboard')
  }
}
</script>
```

Notes:
- The `loadoutCode` prop is optional so the component stays usable on pages where it isn't available.
- The button only renders when `loadoutCode` is truthy, matching the spec's "Show nothing when `null`".
- PvP slots are shown as `Slot 1..4` (human-1-indexed) but keyed by the zero-indexed `slot`.

- [ ] **Step 2: Pass the loadout code from `CharacterDetailPage.vue`**

In `src/pages/CharacterDetailPage.vue`, find the existing usage:

```vue
<TalentTree :talents="character.talents" />
```

Replace with:

```vue
<TalentTree :talents="character.talents" :loadout-code="character.talent_loadout_code" />
```

- [ ] **Step 3: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/character/TalentTree.vue src/pages/CharacterDetailPage.vue
git commit -m "TalentTree: render PvP slots and add Copy Loadout button"
```

---

## Task 9 — `ErrorState.vue` shows a throttled variant

**Files:**
- Modify: `src/components/feedback/ErrorState.vue`

- [ ] **Step 1: Replace the component body**

Overwrite `src/components/feedback/ErrorState.vue` with:

```vue
<template>
  <div role="alert" class="alert" :class="isThrottled ? 'alert-warning' : 'alert-error'">
    <div class="flex-1">
      <h3 class="font-semibold">{{ resolvedTitle }}</h3>
      <p v-if="resolvedMessage" class="text-sm opacity-90">{{ resolvedMessage }}</p>
    </div>
    <div class="flex-none">
      <slot name="actions">
        <button
          type="button"
          class="btn btn-sm"
          :disabled="isThrottled && remainingSeconds > 0"
          @click="emit('retry')"
        >
          {{ retryLabel }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { NotFoundError, ThrottledError } from '@/types/api'

const props = defineProps<{
  title?: string
  message?: string
  error?: unknown
}>()

const emit = defineEmits<{ retry: [] }>()

const isNotFound = computed(() => props.error instanceof NotFoundError)
const isThrottled = computed(() => props.error instanceof ThrottledError)

const remainingSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.error,
  (err) => {
    stopTimer()
    if (err instanceof ThrottledError) {
      remainingSeconds.value = Math.ceil(err.retryAfter / 1000)
      timer = setInterval(() => {
        remainingSeconds.value = Math.max(0, remainingSeconds.value - 1)
        if (remainingSeconds.value === 0) stopTimer()
      }, 1000)
    } else {
      remainingSeconds.value = 0
    }
  },
  { immediate: true },
)

onBeforeUnmount(stopTimer)

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (isNotFound.value) return 'Not found'
  if (isThrottled.value) return 'Too many requests'
  return 'Something went wrong'
})

const resolvedMessage = computed(() => {
  if (props.message) return props.message
  if (isNotFound.value) return "We couldn't find that character/guild on Blizzard."
  if (isThrottled.value) {
    return remainingSeconds.value > 0
      ? `This endpoint is rate-limited. Try again in ${remainingSeconds.value}s.`
      : 'This endpoint is rate-limited. You can try again now.'
  }
  return undefined
})

const retryLabel = computed(() => {
  if (isThrottled.value && remainingSeconds.value > 0) return `Retry in ${remainingSeconds.value}s`
  return 'Try again'
})
</script>
```

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/feedback/ErrorState.vue
git commit -m "ErrorState: throttled variant with live Retry-After countdown"
```

---

## Task 10 — `FreshnessChips.vue` and page wiring

**Files:**
- Create: `src/components/feedback/FreshnessChips.vue`
- Modify: `src/pages/CharacterDetailPage.vue`

- [ ] **Step 1: Create the component**

Create `src/components/feedback/FreshnessChips.vue`:

```vue
<template>
  <div class="flex flex-wrap gap-1">
    <span
      v-for="slice in slices"
      :key="slice.key"
      class="badge badge-sm"
      :class="badgeClass(freshness[slice.key])"
      :title="tooltip(slice.label, freshness[slice.key])"
    >
      {{ slice.label }}: {{ label(freshness[slice.key]) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { FreshnessState, MetaBlock } from '@/types/character'

defineProps<{ freshness: MetaBlock['freshness'] }>()

const slices: Array<{ key: keyof MetaBlock['freshness']; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'mythic_plus', label: 'M+' },
  { key: 'pvp', label: 'PvP' },
  { key: 'professions', label: 'Profs' },
  { key: 'raids', label: 'Raids' },
]

function badgeClass(state: FreshnessState): string {
  if (state === 'fresh') return 'badge-success'
  if (state === 'stale') return 'badge-warning'
  return 'badge-ghost'
}

function label(state: FreshnessState): string {
  if (state === 'fresh') return 'fresh'
  if (state === 'stale') return 'stale'
  return 'awaiting'
}

function tooltip(sliceLabel: string, state: FreshnessState): string {
  if (state === 'fresh') return `${sliceLabel} data is up to date`
  if (state === 'stale') return `${sliceLabel} data is being refreshed — reload shortly for newer data`
  return `${sliceLabel} has never been synced yet`
}
</script>
```

- [ ] **Step 2: Mount it from `CharacterDetailPage.vue`**

Open `src/pages/CharacterDetailPage.vue`. Two changes:

1. Add the import near the other feedback-component imports:

```ts
import FreshnessChips from '@/components/feedback/FreshnessChips.vue'
```

2. Add the `<FreshnessChips>` line in the existing status row, directly after `<StaleBadge>` (which Task 2 already fixed with `?? undefined`):

```vue
<div class="flex flex-wrap items-center gap-3">
  <StaleBadge v-if="isStale" :last-synced-at="character.synced_at ?? undefined" />
  <FreshnessChips v-if="meta" :freshness="meta.freshness" />
  <button
    v-if="canToggleRecruitment"
    type="button"
    class="btn btn-sm"
    :class="character.recruitment ? 'btn-success' : 'btn-outline'"
    :disabled="isToggling"
    @click="onToggleRecruitment"
  >
    <span v-if="isToggling" class="loading loading-spinner loading-xs" />
    {{ character.recruitment ? 'Looking for guild' : 'Not looking for guild' }}
  </button>
</div>
```

3. Add a `meta` computed just under the existing `character` computed:

```ts
const character = computed(() => lookup.data.value?.data ?? null)
const meta = computed(() => lookup.data.value?.meta ?? null)
const isStale = computed(() => lookup.data.value?.isStale ?? false)
```

- [ ] **Step 3: Typecheck**

Run: `npx vue-tsc -b --force --noEmit`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/feedback/FreshnessChips.vue src/pages/CharacterDetailPage.vue
git commit -m "feedback: FreshnessChips driven by meta.freshness"
```

---

## Task 11 — Cleanup, full typecheck/build, manual smoke

**Files:**
- Delete: `src/utils/__smoke.test.ts`

- [ ] **Step 1: Remove the Task 0 smoke test**

The real pure-function suites in Tasks 4 and 6 now prove Vitest works.

```bash
rm src/utils/__smoke.test.ts
```

- [ ] **Step 2: Full test run**

Run: `npm test`
Expected: all suites in `src/utils/wowhead.test.ts` and `src/utils/equipmentSets.test.ts` pass, exit code 0.

- [ ] **Step 3: Full production build (includes strict typecheck)**

Run: `npm run build`
Expected: `vue-tsc -b` completes with no errors, then `vite build` emits to `dist/` with no errors.

- [ ] **Step 4: Manual smoke in the dev server**

Run: `npm run dev`

Open `http://localhost:5173/characters/eu/ravencrest/dakiboy` (or any valid character the backend has cached). Verify in-page, with the browser devtools open:

- No console errors.
- Character header renders (Task 8 didn't regress this).
- Equipment tooltips on hover show the full Wowhead card including bonus IDs, gems, enchants, and set-piece bonuses (not just "item level N"). Spot-check one item with gems and one with a set.
- If a character has a `talent_loadout_code`, the "Copy loadout" button is visible and clicking it puts the code on the clipboard (`navigator.clipboard.readText()` in devtools to verify, or paste into any text field).
- PvP section appears when `talents.pvp` is non-empty.
- The freshness chip row appears beside the StaleBadge area. Today (Plan 1), expect `profile` and `mythic_plus` to be fresh/stale and the others to read `awaiting`.

If any of those steps fail, file it against this plan rather than the BE spec — FE work should be self-contained at this point.

- [ ] **Step 5: Commit the cleanup**

```bash
git add -u
git commit -m "chore: drop vitest smoke test — real suites cover runner"
```

---

## Appendix — What this plan does *not* do (Plan 2/3 territory)

These are explicitly out of scope (per the original hand-off spec, removed `summary_for_fe.md`):

- Mythic+ rating rendering (`mythic_plus_rating` is typed nullable; arrives in Plan 2).
- PvP bracket stats panel (`pvp_brackets` typed nullable; Plan 2).
- Professions panel (`professions` typed nullable; Plan 2).
- Raid progress panel (`raid_progress` typed nullable; Plan 2).
- `GET /api/v1/characters/classic/…` Classic endpoint (Plan 3).
- `?refresh=1` force-refresh query param (Plan 3).

When Plan 2 or Plan 3 lands the backend will flip values from `null` to populated; no FE type change is required, only new presentational components to render them.
