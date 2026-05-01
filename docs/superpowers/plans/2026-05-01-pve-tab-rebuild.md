# Plan B — Frontend PvE Tab Rebuild

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing two-subtab PvE view (`Raids` / `Mythic+`) with a single scrolling raider.io-style page driven by the new BE PvE game-data resolver. Adds `RaidProgressionSection` (with denominator headlines, per-difficulty tabs, boss portraits, raid backgrounds, "Show legacy raids" expander) and `MythicPlusSection` (KPI tiles, Best-per-Dungeon table, All-Runs list, affix icons).

**Architecture:** Strict bottom-up dependency order. Types first → API client + composables → leaf presentational components (`AffixIcon`, `BossRow`) → mid-level cards (`RaidInstanceCard`, `MythicPlusKpiTiles`, `MythicPlusBestPerDungeon`, `MythicPlusAllRuns`) → section wrappers (`RaidProgressionSection`, `MythicPlusSection`) → headline strip (`PveHeadlineStrip`) → page rewrite (`CharacterPveTab.vue`) → router cleanup + delete obsolete files. New components live under `src/components/character/pve/` and consume `useCharacterContext()` for the character payload while pulling raid/dungeon/affix metadata from two TanStack queries (`staleTime: Infinity`) backed by `api/gameData.ts`. M+ view-switch tabs reuse the existing `CharacterTabStrip`. Raid difficulty tabs are local to `RaidInstanceCard` (don't go through the router) and use a small inline tab control.

**Tech Stack:** Vue 3 + TypeScript (`<script setup>`) + Vite + Tailwind 3 + DaisyUI + TanStack Vue Query. Verification via `npx vue-tsc -b` and `npm run build`. No unit-test runner wired (`vitest` is installed but no `test` script — out of scope to wire). Visual smoke-test on `melaniya@the-maelstrom` (EU) via the nginx-fronted port 8092 since the user's `.env` uses relative `/api/v1` that Vite-5173 won't proxy.

**Repo:** `/home/dakiman/projects/guild-service-v2/frontend` (cut a fresh branch `feature/pve-tab-redesign` off `master`).

**Spec:** `/home/dakiman/projects/guild-service-v2/backend/docs/superpowers/specs/2026-05-01-pve-tab-redesign-design.md` — read §2.1, §2.4, §2.6, §2.7, §2.8, §3, §4 before executing.

**Plan A (BE) assumption:** Plan A — BE PvE game-data resolver — is **already merged to `master`** in the backend repo. The endpoints `GET /api/game-data/raid-instances?expansion=current` and `GET /api/game-data/mythic-keystone-dungeons?season=current` return populated JSON in the shapes pinned in spec §2.6. If you reach Task 4 and the endpoints 404, halt and confirm Plan A merged before continuing.

**Test character:** `melaniya` on `the-maelstrom` (EU). Access via `http://localhost:8092/characters/eu/the-maelstrom/melaniya/pve` (nginx port 8092 — NOT Vite 5173, since the user's `.env` uses relative `/api/v1`). See project memory `reference_test_characters.md`.

---

## File Structure

### Creates
- `src/types/gameData.ts` — `RaidInstanceGameData`, `RaidEncounterGameData`, `MythicKeystoneDungeonGameData`, `KeystoneAffixGameData`
- `src/api/gameData.ts` — `getRaidInstances({ expansion })`, `getMythicKeystoneDungeons({ season })`
- `src/composables/usePveGameData.ts` — `useRaidInstances()`, `useMythicDungeons()` TanStack queries
- `src/components/character/pve/AffixIcon.vue`
- `src/components/character/pve/BossRow.vue`
- `src/components/character/pve/RaidInstanceCard.vue`
- `src/components/character/pve/RaidProgressionSection.vue`
- `src/components/character/pve/MythicPlusKpiTiles.vue`
- `src/components/character/pve/MythicPlusBestPerDungeon.vue`
- `src/components/character/pve/MythicPlusAllRuns.vue`
- `src/components/character/pve/MythicPlusSection.vue`
- `src/components/character/pve/PveHeadlineStrip.vue`

### Modifies
- `src/pages/character/CharacterPveTab.vue` — full rewrite; drop tab strip + router-view, render new tree directly
- `src/router/index.ts` — remove `character-pve-raids` and `character-pve-mythic` child routes; remove redirect on `character-pve`; make `character-pve` a leaf route
- `frontend/CLAUDE.md` — append a brief note describing the new PvE component tree + endpoints

### Deletes
- `src/pages/character/pve/RaidsSubtab.vue`
- `src/pages/character/pve/MythicSubtab.vue`
- `src/components/character/RaidEncountersList.vue`
- `src/components/character/DungeonRunsList.vue`

---

## Task 0: Cut feature branch

**Files:** none (git only)

- [ ] **Step 1: Confirm clean working tree on master**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
git status
git rev-parse --abbrev-ref HEAD
```

Expected: branch `master`, working tree clean. If dirty, stash or commit first — DO NOT proceed.

- [ ] **Step 2: Cut the branch**

```bash
git checkout -b feature/pve-tab-redesign
```

Expected: `Switched to a new branch 'feature/pve-tab-redesign'`.

- [ ] **Step 3: Confirm**

```bash
git rev-parse --abbrev-ref HEAD
```

Expected: `feature/pve-tab-redesign`.

No commit yet — this task only sets up the workspace.

---

## Task 1: Add `types/gameData.ts`

**Why first:** All downstream components, the API client, and the composables import from this file. Adding it first keeps every later task's imports valid in isolation.

**Files:**
- Create: `src/types/gameData.ts`

- [ ] **Step 1: Create `src/types/gameData.ts`**

```ts
// Game-data shapes returned by the BE PvE resolver endpoints. These are
// global, static-ish (changes only on patch) — character payloads do not
// embed them; the FE caches them with `staleTime: Infinity` (see
// composables/usePveGameData.ts).

export interface RaidEncounterGameData {
  id: number
  name: string
  display_order: number
  creature_display_id: number | null
  portrait_url: string | null
}

export interface RaidInstanceGameData {
  id: number
  name: string
  display_order: number
  media_url: string | null
  expansion: {
    id: number
    name: string
    display_order: number
  }
  encounters: RaidEncounterGameData[]
}

export interface KeystoneAffixGameData {
  id: number
  name: string
  icon_url: string | null
}

export interface MythicKeystoneDungeonGameData {
  id: number
  name: string
  media_url: string | null
  journal_instance_id: number | null
}

// `getMythicKeystoneDungeons` returns dungeons + an affix dictionary in the
// same response (per spec §2.6 — affixes ride along since they're tiny).
export interface MythicKeystoneDungeonsResponse {
  dungeons: MythicKeystoneDungeonGameData[]
  affixes: Record<number, KeystoneAffixGameData>
  season: {
    id: number
    name: string
  } | null
}

export interface RaidInstancesResponse {
  instances: RaidInstanceGameData[]
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npx vue-tsc -b
```

Expected: clean (no output). The new file has no imports or consumers yet, so it cannot break anything.

- [ ] **Step 3: Commit**

```bash
git add src/types/gameData.ts
git commit -m "$(cat <<'EOF'
types: add gameData shapes for PvE resolver (raid instances, dungeons, affixes)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add `api/gameData.ts`

**Files:**
- Create: `src/api/gameData.ts`

- [ ] **Step 1: Create `src/api/gameData.ts`**

Mirrors `api/achievements.ts`'s shape (single file per backend resource, named exports calling the shared `api` client). Both endpoints are public (no auth) per spec §2.6 — the shared `api` client handles auth headers conditionally so this is fine.

```ts
import { api } from './client'
import type { RaidInstancesResponse, MythicKeystoneDungeonsResponse } from '@/types/gameData'

export type RaidInstanceScope = 'current' | 'all'
export type MythicSeasonScope = 'current'

export async function getRaidInstances(
  params: { expansion?: RaidInstanceScope } = {},
): Promise<RaidInstancesResponse> {
  const res = await api.get<RaidInstancesResponse>('/game-data/raid-instances', {
    params: {
      expansion: params.expansion ?? 'current',
    },
  })
  return res.data
}

export async function getMythicKeystoneDungeons(
  params: { season?: MythicSeasonScope } = {},
): Promise<MythicKeystoneDungeonsResponse> {
  const res = await api.get<MythicKeystoneDungeonsResponse>(
    '/game-data/mythic-keystone-dungeons',
    {
      params: {
        season: params.season ?? 'current',
      },
    },
  )
  return res.data
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/api/gameData.ts
git commit -m "$(cat <<'EOF'
api: add gameData client with getRaidInstances + getMythicKeystoneDungeons

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add `composables/usePveGameData.ts`

**Files:**
- Create: `src/composables/usePveGameData.ts`

- [ ] **Step 1: Create `src/composables/usePveGameData.ts`**

Single composable file exporting two queries. `staleTime: Infinity` + `gcTime: 24h` per spec §2.6 — game-data only changes on patch, so a session-long cache is correct. Both `expansion` and `season` are scoped to `'current'` here; the underlying API still accepts wider scopes if a future caller needs them.

```ts
import { useQuery } from '@tanstack/vue-query'
import { getRaidInstances, getMythicKeystoneDungeons } from '@/api/gameData'
import type {
  RaidInstancesResponse,
  MythicKeystoneDungeonsResponse,
} from '@/types/gameData'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function useRaidInstances() {
  return useQuery<RaidInstancesResponse>({
    queryKey: ['game-data', 'raid-instances', 'current'],
    queryFn: () => getRaidInstances({ expansion: 'current' }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}

export function useMythicDungeons() {
  return useQuery<MythicKeystoneDungeonsResponse>({
    queryKey: ['game-data', 'mythic-keystone-dungeons', 'current'],
    queryFn: () => getMythicKeystoneDungeons({ season: 'current' }),
    staleTime: Infinity,
    gcTime: ONE_DAY_MS,
  })
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/composables/usePveGameData.ts
git commit -m "$(cat <<'EOF'
composables: add usePveGameData with raid + dungeon TanStack queries

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Smoke-test the BE endpoints (no commit)

**Why before building components:** Confirms Plan A is actually merged & deployed before we build a UI on assumptions. Cheap insurance — 30 seconds of curl beats discovering at Task 14 that the endpoints 404.

- [ ] **Step 1: Hit both endpoints via the nginx port (8092 — same proxy the SPA uses)**

```bash
curl -s -o /tmp/raid-instances.json -w "HTTP %{http_code}\n" 'http://localhost:8092/api/v1/game-data/raid-instances?expansion=current'
curl -s -o /tmp/dungeons.json -w "HTTP %{http_code}\n" 'http://localhost:8092/api/v1/game-data/mythic-keystone-dungeons?season=current'
```

Expected: `HTTP 200` for both. If 404, Plan A is not merged — halt this plan and confirm the BE work has shipped.

- [ ] **Step 2: Sanity-check the shapes**

```bash
jq '.instances | length, .instances[0] | {id, name, expansion: .expansion?.name, encounters: (.encounters | length)}' /tmp/raid-instances.json
jq '{dungeons: (.dungeons | length), affixes: (.affixes | keys | length), season}' /tmp/dungeons.json
```

Expected: a positive `instances` count, each instance with `id`/`name`/`expansion.name`/non-empty `encounters`. Dungeons should have a positive count and affixes ~12 keys (current-patch affix pool). If either is empty, the BE sync command may not have been run on this DB — flag to the user before continuing.

No commit. This is reconnaissance.

---

## Task 5: Create `AffixIcon.vue`

**Files:**
- Create: `src/components/character/pve/AffixIcon.vue`

This is a leaf component — used inside `MythicPlusBestPerDungeon` and `MythicPlusAllRuns`. Must come before its consumers.

- [ ] **Step 1: Verify the parent dir exists**

```bash
ls /home/dakiman/projects/guild-service-v2/frontend/src/components/character/
```

There is no `pve/` subdir yet — create-on-write via the Write tool will produce it implicitly.

- [ ] **Step 2: Create `src/components/character/pve/AffixIcon.vue`**

```vue
<template>
  <span class="inline-flex items-center" :title="resolved?.name ?? `Affix ${affixId}`">
    <img
      v-if="resolved?.icon_url"
      :src="resolved.icon_url"
      :alt="resolved.name"
      class="w-6 h-6 rounded"
      loading="lazy"
    />
    <span
      v-else
      class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-ma-border/40 text-ma-muted/80"
    >
      {{ resolved?.name ?? `#${affixId}` }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KeystoneAffixGameData } from '@/types/gameData'

const props = defineProps<{
  affixId: number
  affixes: Record<number, KeystoneAffixGameData> | undefined | null
}>()

const resolved = computed<KeystoneAffixGameData | null>(() => {
  if (!props.affixes) return null
  return props.affixes[props.affixId] ?? null
})
</script>
```

The `affixes` dictionary is passed in by the parent so this stays a pure presentational component (no direct query coupling). Spec §2.8 says "fall back to a text chip" — that's the `v-else` branch when `icon_url` is missing.

- [ ] **Step 3: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/character/pve/AffixIcon.vue
git commit -m "$(cat <<'EOF'
character/pve: add AffixIcon leaf component with text-chip fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create `BossRow.vue`

**Files:**
- Create: `src/components/character/pve/BossRow.vue`

Leaf component — consumed by `RaidInstanceCard` (Task 7). Must come before its consumer.

- [ ] **Step 1: Create `src/components/character/pve/BossRow.vue`**

Renders a single boss with portrait, name, and (when killed) kill-count + last-kill date. Spec §2.8: 40px square portraits, `opacity-40` on un-killed rows, no kill metadata column when not killed.

The `progress` prop is the single `RaidEncounterProgress` row matching `(encounter_id, difficulty)` from `character.raid_progress`, or `null` if the boss hasn't been killed on the active difficulty.

```vue
<template>
  <div
    class="flex items-center gap-3 p-2 rounded ma-card-inner"
    :class="{ 'opacity-40': !progress }"
  >
    <div class="shrink-0 w-10 h-10 rounded overflow-hidden bg-base-300 flex items-center justify-center">
      <img
        v-if="encounter.portrait_url"
        :src="encounter.portrait_url"
        :alt="encounter.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <Skull v-else class="w-5 h-5 text-ma-muted/40" />
    </div>

    <div class="flex flex-col flex-1 min-w-0">
      <span class="text-sm text-ma-text truncate">{{ encounter.name }}</span>
      <span v-if="progress" class="text-[11px] text-ma-muted/60 truncate">
        {{ progress.completed_count }} kill{{ progress.completed_count === 1 ? '' : 's' }}
        <template v-if="progress.last_kill_timestamp">
          · {{ formatTimestamp(progress.last_kill_timestamp) }}
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Skull } from 'lucide-vue-next'
import type { RaidEncounterGameData } from '@/types/gameData'
import type { RaidEncounterProgress } from '@/types/character'

defineProps<{
  encounter: RaidEncounterGameData
  progress: RaidEncounterProgress | null
}>()

function formatTimestamp(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
```

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/BossRow.vue
git commit -m "$(cat <<'EOF'
character/pve: add BossRow with portrait + kill metadata + ghost state

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create `RaidInstanceCard.vue`

**Files:**
- Create: `src/components/character/pve/RaidInstanceCard.vue`

One raid instance: header strip with raid background image, four difficulty tabs (LFR / Normal / Heroic / Mythic) with per-difficulty `X/Y` counts, and a boss grid below filtered to the active difficulty. Difficulty tabs are local state (not router-driven) — they only switch the boss-grid filter.

The `progress` prop is the FULL `character.raid_progress` array; the card filters internally to the rows whose `instance_id` matches `instance.id`. This avoids parent-side prep work and keeps the data flow uniform across all four difficulties.

- [ ] **Step 1: Create `src/components/character/pve/RaidInstanceCard.vue`**

```vue
<template>
  <div class="ma-card overflow-hidden">
    <!-- Header strip: raid background tinted dark, instance name overlaid. -->
    <div
      class="relative px-4 py-5 border-b border-ma-border/30"
      :style="headerStyle"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div class="relative flex items-center justify-between">
        <h3 class="ma-text-heading text-lg">{{ instance.name }}</h3>
        <span class="text-xs text-ma-muted/70 uppercase tracking-wider">
          {{ instance.expansion.name }}
        </span>
      </div>
    </div>

    <!-- Difficulty tabs: per-difficulty X/Y counts -->
    <div class="flex flex-wrap gap-1 px-3 py-2 border-b border-ma-border/20">
      <button
        v-for="diff in DIFFICULTIES"
        :key="diff.key"
        type="button"
        class="ma-tab text-xs"
        :class="[
          activeDifficulty === diff.key ? 'ma-tab--active' : '',
          difficultyBorderClass(diff.key),
          'border-l-2 pl-3',
        ]"
        @click="activeDifficulty = diff.key"
      >
        <span>{{ diff.label }}</span>
        <span class="tabular-nums text-ma-muted/80">
          {{ killedCountFor(diff.key) }}/{{ instance.encounters.length }}
        </span>
      </button>
    </div>

    <!-- Boss grid for the active difficulty -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
      <BossRow
        v-for="encounter in sortedEncounters"
        :key="encounter.id"
        :encounter="encounter"
        :progress="progressFor(encounter.id, activeDifficulty)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BossRow from './BossRow.vue'
import type { RaidInstanceGameData } from '@/types/gameData'
import type { RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  instance: RaidInstanceGameData
  progress: RaidEncounterProgress[] | null
}>()

interface DifficultyDescriptor {
  key: 'lfr' | 'normal' | 'heroic' | 'mythic'
  label: string
}

const DIFFICULTIES: DifficultyDescriptor[] = [
  { key: 'lfr',     label: 'LFR' },
  { key: 'normal',  label: 'Normal' },
  { key: 'heroic',  label: 'Heroic' },
  { key: 'mythic',  label: 'Mythic' },
]

const activeDifficulty = ref<DifficultyDescriptor['key']>('mythic')

const instanceProgress = computed<RaidEncounterProgress[]>(() => {
  if (!props.progress) return []
  return props.progress.filter((row) => row.instance_id === props.instance.id)
})

const sortedEncounters = computed(() =>
  [...props.instance.encounters].sort((a, b) => a.display_order - b.display_order),
)

const headerStyle = computed(() => {
  if (!props.instance.media_url) {
    return { backgroundColor: 'rgb(var(--ma-card-inner) / 0.5)' }
  }
  return {
    backgroundImage: `url(${props.instance.media_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

function matchesDifficulty(row: RaidEncounterProgress, key: DifficultyDescriptor['key']): boolean {
  const lower = row.difficulty.toLowerCase()
  if (key === 'lfr') return lower.includes('lfr') || lower.includes('raid finder')
  return lower.includes(key)
}

function progressFor(encounterId: number, key: DifficultyDescriptor['key']): RaidEncounterProgress | null {
  return (
    instanceProgress.value.find(
      (row) => row.encounter_id === encounterId && matchesDifficulty(row, key),
    ) ?? null
  )
}

function killedCountFor(key: DifficultyDescriptor['key']): number {
  return instanceProgress.value.filter((row) => matchesDifficulty(row, key)).length
}

function difficultyBorderClass(key: DifficultyDescriptor['key']): string {
  switch (key) {
    case 'mythic': return 'border-orange-500'
    case 'heroic': return 'border-purple-500'
    case 'normal': return 'border-blue-500'
    case 'lfr':    return 'border-teal-500'
  }
}
</script>
```

Style notes per spec §2.8: difficulty colors reused from old `RaidEncountersList.vue` (`border-orange-500` / `border-purple-500` / `border-blue-500` / `border-teal-500`). Default active difficulty is Mythic — matches raider.io's convention of leading with the hardest tier.

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/RaidInstanceCard.vue
git commit -m "$(cat <<'EOF'
character/pve: add RaidInstanceCard with difficulty tabs + boss grid

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Create `RaidProgressionSection.vue`

**Files:**
- Create: `src/components/character/pve/RaidProgressionSection.vue`

Section wrapper: title row, list of `RaidInstanceCard` for the current expansion, and a "Show legacy raids" toggle that lazily expands older expansions below.

- [ ] **Step 1: Create `src/components/character/pve/RaidProgressionSection.vue`**

```vue
<template>
  <section class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h2 class="ma-text-heading text-xl">Raid Progression</h2>
      <button
        v-if="legacyExpansions.length > 0"
        type="button"
        class="text-sm text-ma-violet-soft hover:text-ma-gold transition-colors"
        @click="showLegacy = !showLegacy"
      >
        {{ showLegacy ? 'Hide legacy raids' : 'Show legacy raids' }}
      </button>
    </header>

    <div v-if="isLoading" class="ma-card p-6 text-sm text-ma-muted/70">
      Loading raid data…
    </div>
    <div v-else-if="isError" class="ma-card p-6 text-sm text-red-300">
      Couldn't load raid data. <button type="button" class="underline" @click="() => refetch()">Retry</button>
    </div>
    <div v-else-if="!latestExpansion" class="ma-card p-6 text-sm text-ma-muted/70">
      No raid data available.
    </div>
    <template v-else>
      <RaidInstanceCard
        v-for="instance in latestExpansion.instances"
        :key="instance.id"
        :instance="instance"
        :progress="raidProgress"
      />

      <template v-if="showLegacy">
        <div
          v-for="exp in legacyExpansions"
          :key="exp.expansion.id"
          class="flex flex-col gap-3"
        >
          <h3 class="ma-text-heading text-base text-ma-muted/80 mt-2">{{ exp.expansion.name }}</h3>
          <RaidInstanceCard
            v-for="instance in exp.instances"
            :key="instance.id"
            :instance="instance"
            :progress="raidProgress"
          />
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RaidInstanceCard from './RaidInstanceCard.vue'
import { useRaidInstances } from '@/composables/usePveGameData'
import type { RaidEncounterProgress } from '@/types/character'
import type { RaidInstanceGameData } from '@/types/gameData'

defineProps<{
  raidProgress: RaidEncounterProgress[] | null
}>()

const { data, isLoading, isError, refetch } = useRaidInstances()
const showLegacy = ref(false)

interface ExpansionGroup {
  expansion: RaidInstanceGameData['expansion']
  instances: RaidInstanceGameData[]
}

const groupedByExpansion = computed<ExpansionGroup[]>(() => {
  const instances = data.value?.instances ?? []
  const map = new Map<number, ExpansionGroup>()
  for (const instance of instances) {
    const existing = map.get(instance.expansion.id)
    if (existing) {
      existing.instances.push(instance)
    } else {
      map.set(instance.expansion.id, {
        expansion: instance.expansion,
        instances: [instance],
      })
    }
  }
  // Sort within each expansion by display_order asc.
  for (const group of map.values()) {
    group.instances.sort((a, b) => a.display_order - b.display_order)
  }
  // Sort expansions by display_order DESC (latest first).
  return Array.from(map.values()).sort(
    (a, b) => b.expansion.display_order - a.expansion.display_order,
  )
})

const latestExpansion = computed<ExpansionGroup | null>(() => groupedByExpansion.value[0] ?? null)
const legacyExpansions = computed<ExpansionGroup[]>(() => groupedByExpansion.value.slice(1))
</script>
```

Note on the BE contract: spec §2.6 says the default `expansion=current` returns only the latest expansion's raids. If a future caller passes `expansion=all`, this component groups by expansion correctly. Today, `legacyExpansions.length` will be 0 with the default scope and the toggle button hides — the spec calls for the toggle to expand "older expansions below" but the default scope doesn't fetch them. The toggle button is plumbed for the future where this section can request `expansion=all` on demand; for now it stays inert (button hidden when empty). If the user wants the toggle to actively fetch on click, that's a follow-up — flag it during smoke-test review.

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/RaidProgressionSection.vue
git commit -m "$(cat <<'EOF'
character/pve: add RaidProgressionSection grouping instances by expansion

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create `MythicPlusKpiTiles.vue`

**Files:**
- Create: `src/components/character/pve/MythicPlusKpiTiles.vue`

Four `.ma-stat-pill` tiles per spec §2.7: M+ Score, Timed 10+, Timed 5+, Timed 2+. Counts derived from `dungeon_runs[]` filtered to the current season + `is_completed_on_time`.

- [ ] **Step 1: Create `src/components/character/pve/MythicPlusKpiTiles.vue`**

```vue
<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">M+ Score</span>
      <span class="font-bold text-lg tabular-nums" :style="scoreStyle">
        {{ scoreLabel }}
      </span>
    </div>
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 10+</span>
      <span class="font-bold text-lg tabular-nums text-ma-gold">{{ timed10 }}</span>
    </div>
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 5+</span>
      <span class="font-bold text-lg tabular-nums text-ma-gold">{{ timed5 }}</span>
    </div>
    <div class="ma-stat-pill flex-col !items-start !rounded-xl !py-3 !px-4">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 2+</span>
      <span class="font-bold text-lg tabular-nums text-ma-gold">{{ timed2 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DungeonRun, MythicPlusRating } from '@/types/character'

const props = defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
  currentSeason: number | null
}>()

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const timedRuns = computed(() => seasonRuns.value.filter((r) => r.is_completed_on_time))

const timed10 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 10).length)
const timed5 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 5).length)
const timed2 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 2).length)

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

// `mythic_plus_rating_color` lives on the BE today but isn't surfaced on
// the FE type — fall back to the gold accent until that wiring exists.
const scoreStyle = computed(() => ({ color: 'rgb(var(--ma-gold))' }))
</script>
```

The `currentSeason` prop is the season id resolved by the parent (`MythicPlusSection`) from the dungeons-response `season` field. If null (BE didn't resolve a current season) the tiles fall back to counting all runs.

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/MythicPlusKpiTiles.vue
git commit -m "$(cat <<'EOF'
character/pve: add MythicPlusKpiTiles with score + timed-N counts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Create `MythicPlusBestPerDungeon.vue`

**Files:**
- Create: `src/components/character/pve/MythicPlusBestPerDungeon.vue`

Per-dungeon best-run table: one row per dungeon (from the M+ dungeons game-data list), showing the character's best run for that dungeon (highest `keystone_level`, ties broken by lowest `duration`). Renders an empty placeholder for un-run dungeons.

- [ ] **Step 1: Create `src/components/character/pve/MythicPlusBestPerDungeon.vue`**

```vue
<template>
  <div class="ma-card overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-ma-border/30 text-[10px] uppercase tracking-wider text-ma-muted/70">
          <th class="text-left px-3 py-2 font-medium">Dungeon</th>
          <th class="text-right px-3 py-2 font-medium">Level</th>
          <th class="text-right px-3 py-2 font-medium hidden sm:table-cell">Time</th>
          <th class="text-left px-3 py-2 font-medium hidden md:table-cell">Affixes</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.dungeon.id"
          class="border-b border-ma-border/15 last:border-0"
        >
          <td class="px-3 py-2">
            <div class="flex items-center gap-2 min-w-0">
              <img
                v-if="row.dungeon.media_url"
                :src="row.dungeon.media_url"
                :alt="row.dungeon.name"
                class="w-7 h-7 rounded shrink-0"
                loading="lazy"
              />
              <div v-else class="w-7 h-7 rounded bg-base-300 shrink-0" />
              <span class="truncate text-ma-text">{{ row.dungeon.name }}</span>
            </div>
          </td>
          <td class="px-3 py-2 text-right tabular-nums">
            <span v-if="row.bestRun" class="font-bold" :class="row.bestRun.is_completed_on_time ? 'text-ma-gold' : 'text-ma-muted/70'">
              +{{ row.bestRun.keystone_level }}
            </span>
            <span v-else class="text-ma-muted/40">—</span>
          </td>
          <td class="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
            <span v-if="row.bestRun" :class="row.bestRun.is_completed_on_time ? 'text-ma-text' : 'text-red-300/80'">
              {{ formatDuration(row.bestRun.duration) }}
            </span>
            <span v-else class="text-ma-muted/40">—</span>
          </td>
          <td class="px-3 py-2 hidden md:table-cell">
            <div v-if="row.bestRun" class="flex gap-1 flex-wrap">
              <AffixIcon
                v-for="affix in row.bestRun.affixes"
                :key="affix.id"
                :affix-id="affix.id"
                :affixes="affixes"
              />
            </div>
            <span v-else class="text-ma-muted/40">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AffixIcon from './AffixIcon.vue'
import type { DungeonRun } from '@/types/character'
import type { MythicKeystoneDungeonGameData, KeystoneAffixGameData } from '@/types/gameData'

const props = defineProps<{
  runs: DungeonRun[]
  dungeons: MythicKeystoneDungeonGameData[]
  affixes: Record<number, KeystoneAffixGameData> | undefined | null
  currentSeason: number | null
}>()

interface BestRow {
  dungeon: MythicKeystoneDungeonGameData
  bestRun: DungeonRun | null
}

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const rows = computed<BestRow[]>(() => {
  const sorted = [...props.dungeons].sort((a, b) => a.name.localeCompare(b.name))
  return sorted.map((dungeon) => ({
    dungeon,
    bestRun: bestRunFor(dungeon.id),
  }))
})

function bestRunFor(dungeonId: number): DungeonRun | null {
  const candidates = seasonRuns.value.filter((run) => run.dungeon_id === dungeonId)
  if (candidates.length === 0) return null
  return candidates.reduce((best, run) => {
    if (run.keystone_level > best.keystone_level) return run
    if (run.keystone_level === best.keystone_level && run.duration < best.duration) return run
    return best
  })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>
```

Per spec §2.8 mobile rule: Score and Time columns collapse to a stacked secondary line — implemented here via `hidden sm:table-cell` / `hidden md:table-cell`. On extra-small screens you get Dungeon + Level only; the row's `+N` already conveys the timed/over-time state via color.

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/MythicPlusBestPerDungeon.vue
git commit -m "$(cat <<'EOF'
character/pve: add MythicPlusBestPerDungeon table with affix icons

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Create `MythicPlusAllRuns.vue`

**Files:**
- Create: `src/components/character/pve/MythicPlusAllRuns.vue`

Chronological list of every run in the season. Re-uses the per-run card layout from the old `DungeonRunsList.vue` (party member table) but updated to the `.ma-card` design language and using `AffixIcon` for affix rendering.

- [ ] **Step 1: Create `src/components/character/pve/MythicPlusAllRuns.vue`**

```vue
<template>
  <div class="flex flex-col gap-3">
    <div v-if="seasonRuns.length === 0" class="ma-card p-6 text-sm text-ma-muted/70">
      No mythic+ runs recorded this season.
    </div>
    <div v-for="run in sortedRuns" :key="run.id" class="ma-card p-4">
      <div class="flex flex-wrap items-center gap-3 mb-3">
        <h3 class="font-semibold flex-1 text-ma-text">{{ run.dungeon_name }}</h3>
        <span class="ma-stat-pill !py-1 !px-2 text-sm font-bold">
          <span class="text-ma-gold">+{{ run.keystone_level }}</span>
        </span>
        <span
          class="text-xs px-2 py-0.5 rounded border"
          :class="run.is_completed_on_time
            ? 'border-emerald-400/40 text-emerald-300'
            : 'border-red-400/40 text-red-300'"
        >
          {{ run.is_completed_on_time ? 'On time' : 'Over time' }}
        </span>
        <span class="text-sm text-ma-muted/70 tabular-nums">{{ formatDuration(run.duration) }}</span>
        <span class="text-xs text-ma-muted/50 tabular-nums">{{ formatTimestamp(run.completed_timestamp) }}</span>
      </div>

      <div v-if="run.affixes.length" class="flex flex-wrap gap-1 mb-3">
        <AffixIcon
          v-for="affix in run.affixes"
          :key="affix.id"
          :affix-id="affix.id"
          :affixes="affixes"
        />
      </div>

      <div v-if="run.members.length" class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[10px] uppercase tracking-wider text-ma-muted/70">
              <th class="text-left px-2 py-1 font-medium">Name</th>
              <th class="text-left px-2 py-1 font-medium">Spec</th>
              <th class="text-right px-2 py-1 font-medium">iLvl</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="member in run.members"
              :key="member.character_id"
              class="border-t border-ma-border/15"
            >
              <td class="px-2 py-1 text-ma-text">{{ member.character_name }}</td>
              <td class="px-2 py-1 text-ma-muted/70">{{ member.spec_name }}</td>
              <td class="px-2 py-1 text-right tabular-nums">{{ member.equipped_item_level }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AffixIcon from './AffixIcon.vue'
import type { DungeonRun } from '@/types/character'
import type { KeystoneAffixGameData } from '@/types/gameData'

const props = defineProps<{
  runs: DungeonRun[]
  affixes: Record<number, KeystoneAffixGameData> | undefined | null
  currentSeason: number | null
}>()

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const sortedRuns = computed<DungeonRun[]>(() =>
  [...seasonRuns.value].sort((a, b) => b.completed_timestamp - a.completed_timestamp),
)

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTimestamp(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
```

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/MythicPlusAllRuns.vue
git commit -m "$(cat <<'EOF'
character/pve: add MythicPlusAllRuns chronological list with party tables

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Create `MythicPlusSection.vue`

**Files:**
- Create: `src/components/character/pve/MythicPlusSection.vue`

Section wrapper combining KPI tiles + view-switcher tabs (`Best per Dungeon` default, `All Runs`). Owns the dungeons query, derives `currentSeason` from the response, and forwards to children.

The view switcher is a plain local-state toggle (NOT routes — spec §2.4 only requires "switched via tabs", and we explicitly removed router-driven subtabs). Built inline rather than reusing `CharacterTabStrip` since that's `<router-link>`-based and we don't want a route here.

- [ ] **Step 1: Create `src/components/character/pve/MythicPlusSection.vue`**

```vue
<template>
  <section class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h2 class="ma-text-heading text-xl">Mythic+ Progression</h2>
      <span v-if="seasonLabel" class="text-xs text-ma-muted/70 uppercase tracking-wider">
        {{ seasonLabel }}
      </span>
    </header>

    <MythicPlusKpiTiles
      :runs="runs"
      :rating="rating"
      :current-season="currentSeason"
    />

    <div v-if="isLoading" class="ma-card p-6 text-sm text-ma-muted/70">
      Loading dungeon data…
    </div>
    <div v-else-if="isError" class="ma-card p-6 text-sm text-red-300">
      Couldn't load dungeon data.
      <button type="button" class="underline" @click="() => refetch()">Retry</button>
    </div>
    <template v-else>
      <nav class="flex gap-1" role="tablist">
        <button
          v-for="view in VIEWS"
          :key="view.key"
          type="button"
          class="ma-tab"
          :class="{ 'ma-tab--active': activeView === view.key }"
          role="tab"
          :aria-selected="activeView === view.key"
          @click="activeView = view.key"
        >
          <component :is="view.icon" class="w-4 h-4" />
          <span>{{ view.label }}</span>
        </button>
      </nav>

      <MythicPlusBestPerDungeon
        v-if="activeView === 'best'"
        :runs="runs"
        :dungeons="dungeons"
        :affixes="affixes"
        :current-season="currentSeason"
      />
      <MythicPlusAllRuns
        v-else
        :runs="runs"
        :affixes="affixes"
        :current-season="currentSeason"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Trophy, ListOrdered } from 'lucide-vue-next'
import MythicPlusKpiTiles from './MythicPlusKpiTiles.vue'
import MythicPlusBestPerDungeon from './MythicPlusBestPerDungeon.vue'
import MythicPlusAllRuns from './MythicPlusAllRuns.vue'
import { useMythicDungeons } from '@/composables/usePveGameData'
import type { DungeonRun, MythicPlusRating } from '@/types/character'

const props = defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
}>()

interface ViewDescriptor {
  key: 'best' | 'all'
  label: string
  icon: Component
}

const VIEWS: ViewDescriptor[] = [
  { key: 'best', label: 'Best per Dungeon', icon: Trophy },
  { key: 'all',  label: 'All Runs',         icon: ListOrdered },
]

const activeView = ref<ViewDescriptor['key']>('best')

const { data, isLoading, isError, refetch } = useMythicDungeons()

const dungeons = computed(() => data.value?.dungeons ?? [])
const affixes = computed(() => data.value?.affixes ?? {})
const currentSeason = computed<number | null>(() => data.value?.season?.id ?? null)
const seasonLabel = computed<string | null>(() => data.value?.season?.name ?? null)

// Re-export so the linter doesn't trip on the unused-variable rule for `props`.
void props
</script>
```

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/MythicPlusSection.vue
git commit -m "$(cat <<'EOF'
character/pve: add MythicPlusSection wrapping KPI tiles + view switcher

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Create `PveHeadlineStrip.vue`

**Files:**
- Create: `src/components/character/pve/PveHeadlineStrip.vue`

Top headline `.ma-card` with two big stats (Best M+ Score · Raid Progression aggregate) and a season/expansion subtitle.

The "Raid Progression aggregate" is the highest-difficulty `X/Y` headline across the latest expansion's instances. We compute it client-side: pick the difficulty with the most kills (preferring Mythic > Heroic > Normal > LFR on ties at zero), pick the instance with the most kills at that difficulty, render `X/Y <Difficulty short>`.

- [ ] **Step 1: Create `src/components/character/pve/PveHeadlineStrip.vue`**

```vue
<template>
  <div class="ma-card p-5 flex flex-wrap items-center justify-between gap-6">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Best M+ Score</span>
      <span class="text-3xl font-bold tabular-nums text-ma-gold">{{ scoreLabel }}</span>
      <span v-if="seasonLabel" class="text-xs text-ma-muted/60 mt-1">{{ seasonLabel }}</span>
    </div>
    <div class="flex flex-col items-end">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Raid Progression</span>
      <span class="text-3xl font-bold tabular-nums text-ma-gold">{{ raidHeadline }}</span>
      <span v-if="raidSubtitle" class="text-xs text-ma-muted/60 mt-1">{{ raidSubtitle }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRaidInstances, useMythicDungeons } from '@/composables/usePveGameData'
import type { MythicPlusRating, RaidEncounterProgress } from '@/types/character'
import type { RaidInstanceGameData } from '@/types/gameData'

const props = defineProps<{
  rating: MythicPlusRating | null
  raidProgress: RaidEncounterProgress[] | null
}>()

const { data: raidData } = useRaidInstances()
const { data: dungeonData } = useMythicDungeons()

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

const seasonLabel = computed<string | null>(() => dungeonData.value?.season?.name ?? null)

interface RaidHeadline {
  killed: number
  total: number
  difficulty: 'Mythic' | 'Heroic' | 'Normal' | 'LFR'
  instanceName: string
}

const DIFFICULTY_PRIORITY: { key: 'mythic' | 'heroic' | 'normal' | 'lfr'; label: RaidHeadline['difficulty'] }[] = [
  { key: 'mythic', label: 'Mythic' },
  { key: 'heroic', label: 'Heroic' },
  { key: 'normal', label: 'Normal' },
  { key: 'lfr',    label: 'LFR' },
]

function matchesDifficulty(row: RaidEncounterProgress, key: typeof DIFFICULTY_PRIORITY[number]['key']): boolean {
  const lower = row.difficulty.toLowerCase()
  if (key === 'lfr') return lower.includes('lfr') || lower.includes('raid finder')
  return lower.includes(key)
}

const headlineCandidate = computed<RaidHeadline | null>(() => {
  const instances = raidData.value?.instances ?? []
  const progress = props.raidProgress ?? []
  if (instances.length === 0) return null

  // Find the latest expansion (instances response is unordered; use display_order DESC).
  const latestExpansionId = instances.reduce<number | null>(
    (acc, instance) =>
      acc == null || instance.expansion.display_order > (instances.find((i) => i.expansion.id === acc)?.expansion.display_order ?? -Infinity)
        ? instance.expansion.id
        : acc,
    null,
  )
  if (latestExpansionId == null) return null

  const latestInstances = instances.filter((i) => i.expansion.id === latestExpansionId)

  for (const diff of DIFFICULTY_PRIORITY) {
    let best: { instance: RaidInstanceGameData; killed: number } | null = null
    for (const instance of latestInstances) {
      const killed = progress.filter(
        (row) => row.instance_id === instance.id && matchesDifficulty(row, diff.key),
      ).length
      if (killed > 0 && (!best || killed > best.killed)) {
        best = { instance, killed }
      }
    }
    if (best) {
      return {
        killed: best.killed,
        total: best.instance.encounters.length,
        difficulty: diff.label,
        instanceName: best.instance.name,
      }
    }
  }
  return null
})

const raidHeadline = computed<string>(() => {
  const c = headlineCandidate.value
  if (!c) return '—'
  const short = c.difficulty === 'Mythic' ? 'M' : c.difficulty === 'Heroic' ? 'H' : c.difficulty === 'Normal' ? 'N' : 'LFR'
  return `${c.killed}/${c.total} ${short}`
})

const raidSubtitle = computed<string | null>(() => headlineCandidate.value?.instanceName ?? null)
</script>
```

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/character/pve/PveHeadlineStrip.vue
git commit -m "$(cat <<'EOF'
character/pve: add PveHeadlineStrip with M+ score + raid progression headline

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Rewrite `CharacterPveTab.vue`

**Files:**
- Modify: `src/pages/character/CharacterPveTab.vue` (full rewrite — drop tab strip + router-view)

- [ ] **Step 1: Overwrite `src/pages/character/CharacterPveTab.vue`**

```vue
<template>
  <div class="flex flex-col gap-6">
    <PveHeadlineStrip
      :rating="character.mythic_plus_rating"
      :raid-progress="character.raid_progress"
    />
    <RaidProgressionSection :raid-progress="character.raid_progress" />
    <MythicPlusSection
      :runs="character.dungeon_runs"
      :rating="character.mythic_plus_rating"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import PveHeadlineStrip from '@/components/character/pve/PveHeadlineStrip.vue'
import RaidProgressionSection from '@/components/character/pve/RaidProgressionSection.vue'
import MythicPlusSection from '@/components/character/pve/MythicPlusSection.vue'

const { character } = useCharacterContext()
</script>
```

The old version had a `CharacterTabStrip` + `<router-view />` for `Raids`/`Mythic+` subtabs — both are gone. Per `useCharacterContext.ts`, `character` is a `ComputedRef<CharacterResource>` and Vue auto-unwraps it in templates, so `character.mythic_plus_rating` etc. work directly without `.value`.

- [ ] **Step 2: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean. Note that `RaidsSubtab.vue` and `MythicSubtab.vue` will still typecheck on their own (their imports of the about-to-delete `RaidEncountersList` / `DungeonRunsList` are still valid) — Task 15 deletes them next.

- [ ] **Step 3: Commit**

```bash
git add src/pages/character/CharacterPveTab.vue
git commit -m "$(cat <<'EOF'
character/pve: rewrite CharacterPveTab to single-page raider.io-style layout

Replaces the Raids/Mythic+ tab strip with a single scrolling page composed of
PveHeadlineStrip + RaidProgressionSection + MythicPlusSection. Subtab routes
and component files are deleted in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Remove obsolete subtab routes and delete old files

**Files:**
- Modify: `src/router/index.ts` — strip `character-pve-raids` and `character-pve-mythic` children + redirect; `character-pve` becomes a leaf
- Delete: `src/pages/character/pve/RaidsSubtab.vue`
- Delete: `src/pages/character/pve/MythicSubtab.vue`
- Delete: `src/components/character/RaidEncountersList.vue`
- Delete: `src/components/character/DungeonRunsList.vue`

- [ ] **Step 1: Edit `src/router/index.ts`**

Replace this block (lines 94-118 in the current file):

```ts
      {
        path: 'pve',
        name: 'character-pve',
        component: () => import('@/pages/character/CharacterPveTab.vue'),
        redirect: (to) => ({
          name: 'character-pve-raids',
          params: {
            region: to.params.region,
            realm: to.params.realm,
            name: to.params.name,
          },
        }),
        children: [
          {
            path: 'raids',
            name: 'character-pve-raids',
            component: () => import('@/pages/character/pve/RaidsSubtab.vue'),
          },
          {
            path: 'mythic',
            name: 'character-pve-mythic',
            component: () => import('@/pages/character/pve/MythicSubtab.vue'),
          },
        ],
      },
```

with:

```ts
      {
        path: 'pve',
        name: 'character-pve',
        component: () => import('@/pages/character/CharacterPveTab.vue'),
      },
```

(No redirect, no children — `character-pve` is now a leaf route serving the new single-page tab directly.)

- [ ] **Step 2: Verify no other consumer references the removed route names**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
grep -rn "character-pve-raids\|character-pve-mythic" src/ cypress/ 2>/dev/null
```

Expected: zero hits. If any remain (likely `cypress/e2e/*.cy.ts`), update those callers to use `character-pve` directly.

- [ ] **Step 3: Delete the four obsolete files**

```bash
git rm src/pages/character/pve/RaidsSubtab.vue \
       src/pages/character/pve/MythicSubtab.vue \
       src/components/character/RaidEncountersList.vue \
       src/components/character/DungeonRunsList.vue
```

- [ ] **Step 4: Remove the empty `pve/` page subdir if nothing else lives there**

```bash
ls src/pages/character/pve/ 2>/dev/null
```

If the listing is empty, remove the dir:

```bash
rmdir src/pages/character/pve/
```

If anything remains (e.g. a stray file someone added in the meantime), leave the dir alone.

- [ ] **Step 5: Run typecheck**

```bash
npx vue-tsc -b
```

Expected: clean. If anything errors, the most likely culprit is a stale import in a Cypress spec or in `CharacterDetailLayout.vue`'s tab descriptor — fix in place. Note the parent layout's `Trophy` icon entry for the PvE tab should stay; only the route definition changed, not its name.

- [ ] **Step 6: Commit**

```bash
git add src/router/index.ts
git commit -m "$(cat <<'EOF'
router: drop character-pve subtab children; PvE is a leaf route now

Removes the Raids/Mythic+ subtab routes plus the four files that backed them
(RaidsSubtab, MythicSubtab, RaidEncountersList, DungeonRunsList). The
new single-page CharacterPveTab handles both sections directly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

The `git rm` from Step 3 staged the deletions automatically — `git status` after commit should show a clean tree.

---

## Task 16: Production build check

**Files:** none

- [ ] **Step 1: Run the production build**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npm run build
```

`npm run build` runs `vue-tsc -b` first then `vite build`. Expected: clean exit, `dist/` populated. If `vite build` succeeds but `vue-tsc` fails, the CLAUDE.md note applies — type errors block the build.

- [ ] **Step 2: If build is dirty, fix in place and re-run**

Common gotchas:
- A stale import path that pointed at a deleted file (the typecheck would have caught this in Task 15 Step 5, so unlikely here).
- A computed ref accessed without `.value` in a non-template context.
- Lucide icon name typo (we used `Trophy`, `ListOrdered`, `Skull`, `BookOpen` — verify against `node_modules/lucide-vue-next` if any error mentions one of those).

No commit — this is a verification step. If you had to fix anything, those fixes go into the next commit (Task 17 or 18).

---

## Task 17: Update `frontend/CLAUDE.md`

**Files:**
- Modify: `frontend/CLAUDE.md`

Add a brief note after the existing "Character tabs (Plan 4)" subsection so future Claude sessions know about the new component tree + endpoints. Mirror the prose style of the achievements paragraph in that subsection.

- [ ] **Step 1: Open `frontend/CLAUDE.md` and locate the "Character tabs (Plan 4)" section**

It starts at the line `### Character tabs (Plan 4)` and ends at the next `### ` heading (`### HTTP client & auth`).

- [ ] **Step 2: Append a new paragraph at the end of that section**

After the achievements paragraph (the one ending with "still hydrates the hover tooltip).") and before the `### HTTP client & auth` heading, insert:

```markdown
### PvE tab (single-page raider.io-style)

`pages/character/CharacterPveTab.vue` is a leaf route (no subtabs — the old `character-pve-raids` and `character-pve-mythic` routes are gone). It composes three sections defined under `components/character/pve/`: `PveHeadlineStrip` (M+ score + raid progression headline), `RaidProgressionSection` (per-instance cards with difficulty tabs and `BossRow` portraits), and `MythicPlusSection` (KPI tiles + a local view-switcher between `MythicPlusBestPerDungeon` and `MythicPlusAllRuns`). The view-switcher uses plain local-state tabs — NOT routes — because the spec explicitly collapsed the routed-subtab indirection.

PvE game-data (raid instances + media, dungeons, affixes) is fetched from two new public endpoints: `GET /api/game-data/raid-instances?expansion=current` and `GET /api/game-data/mythic-keystone-dungeons?season=current` (affixes ride along on the dungeons response keyed by id). `composables/usePveGameData.ts` exposes `useRaidInstances()` and `useMythicDungeons()` TanStack queries with `staleTime: Infinity` + `gcTime: 24h` since both responses change only on patch. The `api/gameData.ts` client wraps these calls. Types live in `src/types/gameData.ts`. Components consume the affix dictionary by passing it down from the section to `AffixIcon` (no per-icon query coupling).
```

- [ ] **Step 3: Commit**

```bash
git add frontend/CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: note new PvE single-page tab + game-data endpoints in CLAUDE.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Manual smoke test on `melaniya@the-maelstrom`

**Files:** none. Pure verification.

- [ ] **Step 1: Build & confirm dev environment is up**

If the user's setup runs Vite for development, port 5173 won't proxy `/api/v1` — use the nginx port 8092 which serves the built `dist/` and proxies `/api/v1` to the Laravel BE. Per memory `reference_test_characters.md`.

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npm run build
```

Then verify nginx is up on 8092:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8092/
```

Expected: `HTTP 200`. If anything other than 200, ask the user to start nginx (`sudo nginx -s reload` or whatever they use locally).

- [ ] **Step 2: Open the test URL in a browser**

```
http://localhost:8092/characters/eu/the-maelstrom/melaniya/pve
```

(Open by hand — there's no headless verifier wired up.)

- [ ] **Step 3: Walk the spec §4 acceptance list**

Tick each off in order. If any fails, file the symptom + your hypothesis in commit-message form for the user to triage.

- [ ] Headline strip renders with a numeric M+ score and a raid progression `X/Y` headline. Subtitles show the season name and the headline-instance name.
- [ ] Raid Progression section header is visible. The latest expansion's raid instances appear as a vertical list of `RaidInstanceCard`s.
- [ ] Each raid card has a tinted background image header (or graceful fallback to flat dark) with the raid name + expansion subtitle.
- [ ] Difficulty tabs (LFR / Normal / Heroic / Mythic) inside each raid card show per-difficulty `X/Y` counts and switch the boss grid filter on click.
- [ ] Boss rows render with portraits. Un-killed bosses on the active difficulty render at `opacity-40` with no kill metadata. Killed bosses show kill count + last-kill date.
- [ ] "Show legacy raids" link is hidden (default `expansion=current` only returns latest). If the user wants legacy expansions toggleable now, that's a follow-up — note it.
- [ ] Mythic+ Progression section header is visible. KPI tiles show: M+ Score, Timed 10+, Timed 5+, Timed 2+. Counts are sane (timed-2+ should be ≥ timed-5+ ≥ timed-10+).
- [ ] View-switcher tabs `Best per Dungeon` (default) and `All Runs` toggle the visible content.
- [ ] Best-per-Dungeon table renders one row per dungeon with icon + best-run level + duration + affix icons. Un-run dungeons show `—` placeholders.
- [ ] All Runs view renders chronological list of every run in the current season, with party member tables and affix icons. On-time runs show emerald "On time" pill, over-time runs show red "Over time" pill.
- [ ] DevTools Network tab: `/api/v1/game-data/raid-instances?expansion=current` and `/api/v1/game-data/mythic-keystone-dungeons?season=current` each fire exactly once on page load (cached after that — navigate away and back to confirm no second call).
- [ ] DevTools Network tab: no broken images. Boss portraits, raid backgrounds, dungeon icons, affix icons all return 200.
- [ ] Browser console: no errors or warnings.

- [ ] **Step 4: Capture screenshot for the PR**

If a screenshot is part of the PR convention, take one at this point. Save under `tmp/pve-rebuild/melaniya-pve.png` (gitignored).

- [ ] **Step 5: Final commit if any nits were fixed during smoke-test**

If you touched any files during smoke-test (CSS tweaks, prop name fixes), commit them now with a descriptive message. If nothing was touched, skip.

```bash
git status
```

If clean, this task is done — no commit. If dirty:

```bash
git add <files>
git commit -m "$(cat <<'EOF'
character/pve: smoke-test fixups (<short reason>)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Spec coverage

Maps every requirement in spec §2.1, §2.4, §2.7, §2.8, §3, §4 to the task that delivers it.

| Spec ref | Requirement | Task(s) |
|---|---|---|
| §2.1 | Collapse subtabs into one scrolling page; `character-pve-raids` and `character-pve-mythic` removed; drop `CharacterTabStrip` from `CharacterPveTab.vue` | Task 14, Task 15 |
| §2.1 | `character-pve` becomes the leaf route | Task 15 |
| §2.4 | Two M+ views (`Best per Dungeon` default, `All Runs`) switched via tabs | Task 10, Task 11, Task 12 |
| §2.6 | Consume `GET /api/game-data/raid-instances?expansion=current` | Task 2, Task 3, Task 4, Task 8 |
| §2.6 | Consume `GET /api/game-data/mythic-keystone-dungeons?season=current` (affixes ride along) | Task 2, Task 3, Task 4, Task 12 |
| §2.6 | TanStack `staleTime: Infinity` | Task 3 |
| §2.7 | New `types/gameData.ts` (4 interfaces) | Task 1 |
| §2.7 | New `api/gameData.ts` (2 functions) | Task 2 |
| §2.7 | New `composables/usePveGameData.ts` (2 queries) | Task 3 |
| §2.7 | `PveHeadlineStrip.vue` | Task 13 |
| §2.7 | `RaidProgressionSection.vue` (header, "Show legacy raids" link, list of `RaidInstanceCard`s) | Task 8 |
| §2.7 | `RaidInstanceCard.vue` (raid background header, difficulty tabs with X/Y, boss grid) | Task 7 |
| §2.7 | `BossRow.vue` (portrait, kill count, last-kill date, ghost state) | Task 6 |
| §2.7 | `MythicPlusSection.vue` (header, KPI tiles, view tabs, active view) | Task 12 |
| §2.7 | `MythicPlusKpiTiles.vue` (4 `.ma-stat-pill` tiles) | Task 9 |
| §2.7 | `MythicPlusBestPerDungeon.vue` (per-dungeon best-run table) | Task 10 |
| §2.7 | `MythicPlusAllRuns.vue` (chronological run list with party tables) | Task 11 |
| §2.7 | `AffixIcon.vue` with text-chip fallback | Task 5 |
| §2.7 | Modify `CharacterPveTab.vue` — drop tab strip + router-view, render new tree | Task 14 |
| §2.7 | Delete `RaidsSubtab.vue`, `MythicSubtab.vue`, `RaidEncountersList.vue`, `DungeonRunsList.vue` | Task 15 |
| §2.7 | Remove `character-pve-raids` and `character-pve-mythic` routes | Task 15 |
| §2.8 | Use `.ma-card` / `.ma-stat-pill` / `.ma-text-heading` design primitives | Tasks 7, 8, 9, 10, 11, 12, 13 |
| §2.8 | Difficulty colors `border-orange-500` (mythic), `border-purple-500` (heroic), `border-blue-500` (normal), `border-teal-500` (LFR) | Task 7 |
| §2.8 | Raid background images at low opacity with dark overlay; flat fallback when `media_url` is null | Task 7 |
| §2.8 | Boss portraits 40px square; SVG fallback when missing | Task 6 |
| §2.8 | Ghosted un-killed boss rows (`opacity-40`, no kill metadata) | Task 6 |
| §2.8 | Affix icons 24px square with name tooltip | Task 5 |
| §2.8 | Mobile: KPI tiles wrap to 2x2 grid; Best-per-Dungeon Score+Time collapses to stacked secondary line | Task 9, Task 10 |
| §3 | Plan A merged before Plan B starts (assumption stated in header; verified in Task 4) | Header, Task 4 |
| §4 | New single-page layout at `/characters/eu/the-maelstrom/melaniya/pve` | Task 18 |
| §4 | Raid Progression section with latest expansion's raids and proper "X/Y" headlines | Task 18 |
| §4 | Mythic+ Progression with KPI tiles and Best-per-Dungeon by default | Task 18 |
| §4 | All images load (boss portraits, raid backgrounds, dungeon icons, affix icons) | Task 18 |
| §4 | "Show legacy raids" expands older expansions below | Task 8 (plumbed); Task 18 (smoke-noted as deferred under default `expansion=current` scope) |
| §4 | "All Runs" tab in M+ shows chronological list with party members | Task 11, Task 18 |
| §4 | `npm run build` and `vue-tsc -b` are green | Task 16 |
| §4 | No broken imports from removed components | Task 15 (verification step), Task 16 |

### Open questions noted during research

1. **"Show legacy raids" semantics under `expansion=current`.** Spec §4 says the toggle should "expand older expansions below". Spec §2.6 says the default endpoint scope is `expansion=current` — which only returns the latest expansion. Today the toggle button hides when there are no legacy expansions in the response. To make the toggle functional, the section would need to fire a second query with `expansion=all` on click. Flagged as a follow-up in Task 8 step 1; surface during Task 18 smoke-test.
2. **`mythic_plus_rating_color`.** The BE persists this hex color but it's not surfaced on the FE `MythicPlusRating` type today. The KPI tile and headline-strip score render in the static `--ma-gold` accent. Adding the color is a future polish — not blocking acceptance.
3. **Per-spec score breakdown.** Spec §2.9 lists this as out of scope. Confirmed — no task plans for it.
