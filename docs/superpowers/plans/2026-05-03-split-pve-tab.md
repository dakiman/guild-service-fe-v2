# Split PvE Tab — Dungeons & Raids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `Dungeons & Raids` PvE tab into two top-level tabs (`Dungeons` and `Raids`), each with its own focused headline, and delete the now-unused single-page combination.

**Architecture:** Two new leaf routes (`character-dungeons`, `character-raids`) replace the single `character-pve` route. Two new headline components (`DungeonsHeadline`, `RaidsHeadline`) replace the combined `PveHeadlineStrip` and the absorbed `MythicPlusKpiTiles`. The M+ view-switcher (best-per-dungeon ↔ all-runs) moves out of `MythicPlusSection` and lives directly in the new Dungeons page; `MythicPlusSection` is then deleted along with the single-page parent and the absorbed tiles. Backend is untouched — only the FE TS type widens to expose `mythic_plus_rating.color` (already on the wire).

**Tech Stack:** Vue 3 `<script setup>` + TS, vue-router, Tailwind/DaisyUI, lucide-vue-next icons, TanStack Query (already wired via `useMythicDungeons` / `useRaidInstances`).

---

## File Structure

**New:**
- `src/pages/character/CharacterDungeonsTab.vue` — leaf route for `/dungeons`. Composes `DungeonsHeadline`, hosts the local view-switcher tabs, renders `MythicPlusBestPerDungeon` or `MythicPlusAllRuns`.
- `src/pages/character/CharacterRaidsTab.vue` — leaf route for `/raids`. Composes `RaidsHeadline` + `RaidProgressionSection`.
- `src/components/character/pve/DungeonsHeadline.vue` — full-width strip: M+ score (colored) + season name + three "Timed" KPI pills.
- `src/components/character/pve/RaidsHeadline.vue` — full-width strip: hero `{killed}/{total} {diff}` + `N · H · M` chip row.

**Modified:**
- `src/types/character.ts:97-100` — extend `MythicPlusRating` with `color: string | null`.
- `src/router/index.ts:94-98` — replace single `pve` child with `dungeons` + `raids` children.
- `src/pages/CharacterDetailLayout.vue:55, 113-117` — import `Swords`; replace single `Dungeons & Raids` tab entry with two adjacent entries (`Dungeons` / `Raids`).
- `src/components/character/CharacterStatPills.vue:72-73` — point `mythicPlusRoute` at `character-dungeons`, `raidRoute` at `character-raids`.
- `frontend/CLAUDE.md` — replace the "PvE tab (single-page, raider.io-style)" section with two parallel sections (Dungeons tab + Raids tab).

**Deleted:**
- `src/pages/character/CharacterPveTab.vue`
- `src/components/character/pve/PveHeadlineStrip.vue`
- `src/components/character/pve/MythicPlusKpiTiles.vue`
- `src/components/character/pve/MythicPlusSection.vue`

---

## Pre-flight (already done by the planner — confirm before starting)

- Branch `feature/split-pve-tab` cut from `master`. Confirm with `git branch --show-current`.
- Working tree clean. Confirm with `git status`.
- Pre-implementation grep result for `character-pve` is **4 hits** (`router/index.ts`, `CharacterDetailLayout.vue`, two in `CharacterStatPills.vue`). All four are touched by tasks below; the post-implementation grep must show **0 hits**.

---

## Task 1: Widen `MythicPlusRating` type to include `color`

**Files:**
- Modify: `src/types/character.ts:97-100`

- [ ] **Step 1: Open the file and locate the existing interface**

Confirm lines 97-100 currently read:

```ts
export interface MythicPlusRating {
  rating: number
  per_spec: Record<string, number>
}
```

- [ ] **Step 2: Add the `color` field**

Replace the interface with:

```ts
export interface MythicPlusRating {
  rating: number
  color: string | null
  per_spec: Record<string, number>
}
```

- [ ] **Step 3: Verify no compile errors yet**

Run: `npx vue-tsc -b`
Expected: PASS — adding an optional-style nullable field on a payload BE already sends does not break consumers; existing `MythicPlusKpiTiles.vue` and `PveHeadlineStrip.vue` only read `.rating`. No other type errors should surface.

- [ ] **Step 4: Commit**

```bash
git add src/types/character.ts
git commit -m "feat(types): widen MythicPlusRating with BE-supplied color"
```

---

## Task 2: Add `Swords` icon import in layout

**Files:**
- Modify: `src/pages/CharacterDetailLayout.vue:55`

- [ ] **Step 1: Update the lucide-vue-next import**

Replace line 55:

```ts
import { Sparkles, BookOpen, Crown, Gem, Skull, Star, Trophy } from 'lucide-vue-next'
```

with:

```ts
import { Sparkles, BookOpen, Crown, Gem, Skull, Swords, Star, Trophy } from 'lucide-vue-next'
```

- [ ] **Step 2: Save and verify build**

Run: `npx vue-tsc -b`
Expected: PASS. (Imported-but-unused warnings do NOT block the TS build in this repo's config; the icon is consumed in Task 4. ESLint will be satisfied once the icon is referenced — not run as part of this step.)

- [ ] **Step 3: No commit yet** — bundle with Task 4 to keep the layout edits in one commit.

---

## Task 3: Add new routes (keep old `pve` route in place for now)

**Files:**
- Modify: `src/router/index.ts:94-98`

> **Why we don't delete the `pve` route in this task:** the layout still references `character-pve` until Task 4. Deleting the route name now would break the build mid-plan. Task 6 deletes it once nothing references it.

- [ ] **Step 1: Replace the single `pve` child with two adjacent leaf children**

In the `children:` array of `character-detail`, locate lines 94-98:

```ts
{
  path: 'pve',
  name: 'character-pve',
  component: () => import('@/pages/character/CharacterPveTab.vue'),
},
```

Replace with:

```ts
{
  path: 'pve',
  name: 'character-pve',
  component: () => import('@/pages/character/CharacterPveTab.vue'),
},
{
  path: 'dungeons',
  name: 'character-dungeons',
  component: () => import('@/pages/character/CharacterDungeonsTab.vue'),
},
{
  path: 'raids',
  name: 'character-raids',
  component: () => import('@/pages/character/CharacterRaidsTab.vue'),
},
```

(Old route stays for one more task; new routes pre-resolve to files we'll create in Tasks 7–8. The lazy `() => import(...)` only resolves when navigated, so the build is fine until we visit those routes.)

- [ ] **Step 2: No build yet** — the lazy imports point at files that don't exist; we'd hit a runtime resolution error if we navigated. Build verification happens after Task 8 lands the page components.

---

## Task 4: Update tab strip — two adjacent entries

**Files:**
- Modify: `src/pages/CharacterDetailLayout.vue:113-117`

- [ ] **Step 1: Replace the single tab entry**

Locate lines 113-117 in the `tabs` computed:

```ts
{
  label: 'Dungeons & Raids',
  to: { name: 'character-pve', params },
  icon: Skull,
},
```

Replace with:

```ts
{
  label: 'Dungeons',
  to: { name: 'character-dungeons', params },
  icon: Skull,
},
{
  label: 'Raids',
  to: { name: 'character-raids', params },
  icon: Swords,
},
```

- [ ] **Step 2: Commit Tasks 2 + 3 + 4 together**

```bash
git add src/router/index.ts src/pages/CharacterDetailLayout.vue
git commit -m "feat(routing): add dungeons/raids leaf routes and tab strip entries"
```

(Build will not be clean until Task 8 lands the page components — that's fine; the lazy imports defer resolution to navigation time, and `vue-tsc` doesn't follow string paths inside `() => import()`.)

---

## Task 5: Repoint `CharacterStatPills` links

**Files:**
- Modify: `src/components/character/CharacterStatPills.vue:72-73`

- [ ] **Step 1: Update the two `RouterLink` targets**

Replace lines 72-73:

```ts
const mythicPlusRoute = computed(() => ({ name: 'character-pve', params: routeParams.value }))
const raidRoute = computed(() => ({ name: 'character-pve', params: routeParams.value }))
```

with:

```ts
const mythicPlusRoute = computed(() => ({ name: 'character-dungeons', params: routeParams.value }))
const raidRoute = computed(() => ({ name: 'character-raids', params: routeParams.value }))
```

- [ ] **Step 2: Commit**

```bash
git add src/components/character/CharacterStatPills.vue
git commit -m "feat(stats): point M+ and Raid pills at split routes"
```

---

## Task 6: Delete the old `pve` route entry

**Files:**
- Modify: `src/router/index.ts` — remove the `pve` block added in Task 3

> Now that nothing references `character-pve`, drop it. The old `CharacterPveTab.vue` file still exists at this point — Task 9 deletes the file itself once we're sure nothing else imports it.

- [ ] **Step 1: Remove the old `pve` route**

Remove this block (still present from Task 3):

```ts
{
  path: 'pve',
  name: 'character-pve',
  component: () => import('@/pages/character/CharacterPveTab.vue'),
},
```

- [ ] **Step 2: Run a stale-grep**

Run: `grep -rn "character-pve" src/ cypress/ 2>/dev/null`
Expected: zero hits.

- [ ] **Step 3: Commit**

```bash
git add src/router/index.ts
git commit -m "chore(router): drop legacy character-pve route"
```

(Build still won't be clean — the lazy imports for `character-dungeons` and `character-raids` resolve to files that arrive in Task 8. We commit each phase to keep the diff reviewable; the build gate runs at the end of Task 8 once the new pages exist.)

---

## Task 7: Create `DungeonsHeadline` component

**Files:**
- Create: `src/components/character/pve/DungeonsHeadline.vue`

**Behavior contract:**
- Eyebrow `M+ Score` (10px uppercase, `text-ma-muted/70`).
- Score: large (`text-4xl`, `tabular-nums`, `font-bold`). Inline color from `rating.color` (BE hex string). Fallback to gold (`rgb(var(--ma-gold))`) when `rating` or `rating.color` is null.
- Sub-label: season name from `useMythicDungeons().data.value?.season?.name` (`text-xs text-ma-muted/60`); hidden when null.
- Right block: three `ma-stat-pill` pills — `Timed 2+`, `Timed 5+`, `Timed 10+`. Counts derived from `runs` filtered by `currentSeason`, `is_completed_on_time`, `keystone_level >= N`.
- Layout: outer `ma-card p-5 flex flex-wrap items-center justify-between gap-6` (matches `PveHeadlineStrip` housing).
- When `rating` is null, render `—` for the score and skip color styling.

- [ ] **Step 1: Create the file with the full template + script**

```vue
<template>
  <div class="ma-card p-5 flex flex-wrap items-center justify-between gap-6">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">M+ Score</span>
      <span class="text-4xl font-bold tabular-nums" :style="scoreStyle">
        {{ scoreLabel }}
      </span>
      <span v-if="seasonLabel" class="text-xs text-ma-muted/60 mt-1">{{ seasonLabel }}</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <div class="ma-stat-pill">
        <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 2+</span>
        <span class="font-bold text-ma-gold tabular-nums">{{ timed2 }}</span>
      </div>
      <div class="ma-stat-pill">
        <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 5+</span>
        <span class="font-bold text-ma-gold tabular-nums">{{ timed5 }}</span>
      </div>
      <div class="ma-stat-pill">
        <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Timed 10+</span>
        <span class="font-bold text-ma-gold tabular-nums">{{ timed10 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMythicDungeons } from '@/composables/usePveGameData'
import type { DungeonRun, MythicPlusRating } from '@/types/character'

const props = defineProps<{
  runs: DungeonRun[]
  rating: MythicPlusRating | null
  currentSeason: number | null
}>()

const { data: dungeonData } = useMythicDungeons()

const scoreLabel = computed(() => {
  if (!props.rating) return '—'
  return Math.round(props.rating.rating).toLocaleString()
})

const scoreStyle = computed(() => {
  const color = props.rating?.color
  return { color: color ?? 'rgb(var(--ma-gold))' }
})

const seasonLabel = computed<string | null>(() => dungeonData.value?.season?.name ?? null)

const seasonRuns = computed<DungeonRun[]>(() => {
  if (props.currentSeason == null) return props.runs
  return props.runs.filter((run) => run.season === props.currentSeason)
})

const timedRuns = computed(() => seasonRuns.value.filter((r) => r.is_completed_on_time))
const timed2 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 2).length)
const timed5 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 5).length)
const timed10 = computed(() => timedRuns.value.filter((r) => r.keystone_level >= 10).length)
</script>
```

- [ ] **Step 2: No build yet** — page wiring lands in Task 8.

---

## Task 8: Create `RaidsHeadline` component

**Files:**
- Create: `src/components/character/pve/RaidsHeadline.vue`

**Behavior contract:**
- Hero row: eyebrow `Raid Progression`, hero `{killed}/{total} {shortDifficulty}` (text-4xl gold), sub-label = instance name. Pulled via `useBestRaidProgression(raidProgress)` — same composable `PveHeadlineStrip` uses today.
- Secondary row: chips for the **same instance** the hero row picked, in fixed order **N · H · M**. Always render all three; missing difficulty entries fall through to `0/{total}` using the encounter total from the headline instance.
- When the headline composable returns null, render `—` placeholder and omit the secondary row entirely.
- Need to look up the headline instance's full encounters list from `useRaidInstances()` to populate the secondary-row totals (the composable returns counts but only the headline difficulty's killed count). For each of N/H/M, count `raidProgress` entries with `instance_id === headlineInstance.id` and difficulty matching `matchesDifficulty(row, key)` — port the same case-insensitive `includes()` pattern used in `useBestRaidProgression.ts`.

- [ ] **Step 1: Create the file with the full template + script**

```vue
<template>
  <div class="ma-card p-5 flex flex-col gap-3">
    <div class="flex flex-col">
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">Raid Progression</span>
      <span class="text-4xl font-bold tabular-nums text-ma-gold">{{ heroLabel }}</span>
      <span v-if="instanceName" class="text-xs text-ma-muted/60 mt-1">{{ instanceName }}</span>
    </div>
    <div v-if="secondaryRow" class="flex flex-wrap gap-2">
      <span
        v-for="chip in secondaryRow"
        :key="chip.label"
        class="ma-stat-pill text-xs text-ma-muted/80"
      >
        <span class="font-semibold">{{ chip.label }}</span>
        <span class="tabular-nums">{{ chip.killed }}/{{ chip.total }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRaidInstances } from '@/composables/usePveGameData'
import { useBestRaidProgression, shortDifficulty } from '@/composables/useBestRaidProgression'
import type { RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  raidProgress: RaidEncounterProgress[] | null
}>()

const headline = useBestRaidProgression(toRef(props, 'raidProgress'))
const { data: raidData } = useRaidInstances()

const heroLabel = computed<string>(() => {
  const c = headline.value
  if (!c) return '—'
  return `${c.killed}/${c.total} ${shortDifficulty(c.difficulty)}`
})

const instanceName = computed<string | null>(() => headline.value?.instanceName ?? null)

interface DifficultyChip { label: 'N' | 'H' | 'M'; killed: number; total: number }

const DIFFICULTY_CHIPS: { label: 'N' | 'H' | 'M'; key: 'normal' | 'heroic' | 'mythic' }[] = [
  { label: 'N', key: 'normal' },
  { label: 'H', key: 'heroic' },
  { label: 'M', key: 'mythic' },
]

function matchesDifficulty(row: RaidEncounterProgress, key: 'normal' | 'heroic' | 'mythic'): boolean {
  return row.difficulty.toLowerCase().includes(key)
}

const secondaryRow = computed<DifficultyChip[] | null>(() => {
  const h = headline.value
  if (!h) return null
  const instance = raidData.value?.instances.find((i) => i.name === h.instanceName)
  if (!instance) return null
  const total = instance.encounters.length
  const progress = props.raidProgress ?? []
  return DIFFICULTY_CHIPS.map((d) => ({
    label: d.label,
    total,
    killed: progress.filter(
      (row) => row.instance_id === instance.id && matchesDifficulty(row, d.key),
    ).length,
  }))
})
</script>
```

> **Why match by name and not id:** `BestRaidProgression` exposes `instanceName` but not `instance_id`. Names are unique per expansion in the BE-resolved instance list, so this lookup is safe. (If a future change adds `instance_id` to `BestRaidProgression`, switch this lookup to id — purely additive cleanup.)

- [ ] **Step 2: No build yet** — happens at the end of Task 9 once both pages exist.

---

## Task 9: Create `CharacterDungeonsTab.vue`

**Files:**
- Create: `src/pages/character/CharacterDungeonsTab.vue`

**Behavior contract:**
- Pulls character via `useCharacterContext()`.
- Renders `DungeonsHeadline` at top (passes `runs`, `rating`, `currentSeason`).
- Hosts the local view-switcher (DaisyUI `ma-tab` style — same markup used in current `MythicPlusSection.vue:24-38`).
- Below the switcher, renders `MythicPlusBestPerDungeon` or `MythicPlusAllRuns` based on local state.
- Loading / error states for `useMythicDungeons()` mirror `MythicPlusSection.vue:16-22`.

- [ ] **Step 1: Create the file**

```vue
<template>
  <div class="flex flex-col gap-6">
    <DungeonsHeadline
      :runs="character.dungeon_runs"
      :rating="character.mythic_plus_rating"
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
        :runs="character.dungeon_runs"
        :dungeons="dungeons"
        :affixes="affixes"
        :current-season="currentSeason"
      />
      <MythicPlusAllRuns
        v-else
        :runs="character.dungeon_runs"
        :affixes="affixes"
        :current-season="currentSeason"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Trophy, ListOrdered } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import { useMythicDungeons } from '@/composables/usePveGameData'
import DungeonsHeadline from '@/components/character/pve/DungeonsHeadline.vue'
import MythicPlusBestPerDungeon from '@/components/character/pve/MythicPlusBestPerDungeon.vue'
import MythicPlusAllRuns from '@/components/character/pve/MythicPlusAllRuns.vue'

const { character } = useCharacterContext()

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
</script>
```

- [ ] **Step 2: No build yet** — Raids page lands next.

---

## Task 10: Create `CharacterRaidsTab.vue`

**Files:**
- Create: `src/pages/character/CharacterRaidsTab.vue`

- [ ] **Step 1: Create the file**

```vue
<template>
  <div class="flex flex-col gap-6">
    <RaidsHeadline :raid-progress="character.raid_progress" />
    <RaidProgressionSection :raid-progress="character.raid_progress" />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import RaidsHeadline from '@/components/character/pve/RaidsHeadline.vue'
import RaidProgressionSection from '@/components/character/pve/RaidProgressionSection.vue'

const { character } = useCharacterContext()
</script>
```

- [ ] **Step 2: Build once both pages exist**

Run: `npm run build`
Expected: vue-tsc passes; build artifacts emit to `dist/`. If `vue-tsc` complains about a missing module path in the router, double-check the file paths in Tasks 9–10 match the route imports in Task 3.

- [ ] **Step 3: Commit Tasks 7–10 together**

```bash
git add src/components/character/pve/DungeonsHeadline.vue \
        src/components/character/pve/RaidsHeadline.vue \
        src/pages/character/CharacterDungeonsTab.vue \
        src/pages/character/CharacterRaidsTab.vue
git commit -m "feat(pve): add Dungeons/Raids pages with split headlines"
```

---

## Task 11: Delete superseded files

**Files:**
- Delete: `src/pages/character/CharacterPveTab.vue`
- Delete: `src/components/character/pve/PveHeadlineStrip.vue`
- Delete: `src/components/character/pve/MythicPlusKpiTiles.vue`
- Delete: `src/components/character/pve/MythicPlusSection.vue`

- [ ] **Step 1: Verify nothing imports them**

Run: `grep -rn "CharacterPveTab\|PveHeadlineStrip\|MythicPlusKpiTiles\|MythicPlusSection" src/`
Expected: zero hits. (The lazy `() => import('@/pages/character/CharacterPveTab.vue')` was removed in Task 6; the other three were only consumed by `CharacterPveTab.vue` and `MythicPlusSection.vue`.)

- [ ] **Step 2: Delete the files**

```bash
git rm src/pages/character/CharacterPveTab.vue \
       src/components/character/pve/PveHeadlineStrip.vue \
       src/components/character/pve/MythicPlusKpiTiles.vue \
       src/components/character/pve/MythicPlusSection.vue
```

- [ ] **Step 3: Re-run the build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(pve): drop superseded combined PvE tab + helpers"
```

---

## Task 12: Update `frontend/CLAUDE.md`

**Files:**
- Modify: `frontend/CLAUDE.md` — replace the "PvE tab (single-page, raider.io-style)" section.

Locate the existing section (starts with `### PvE tab (single-page, raider.io-style)`) and the prose that follows it through (and including) the paragraph ending `…The affix dictionary is passed down from section to AffixIcon — no per-icon query coupling.`

- [ ] **Step 1: Replace that block with the following**

```markdown
### Dungeons tab

`pages/character/CharacterDungeonsTab.vue` is a leaf route (`character-dungeons`, path `/dungeons`). It composes `components/character/pve/DungeonsHeadline.vue` (M+ score colored from `rating.color`, season name, three "Timed N+" KPI pills — same numbers `MythicPlusKpiTiles` used to compute) on top of a local view-switcher between `MythicPlusBestPerDungeon` and `MythicPlusAllRuns`. The view-switcher is local-state DaisyUI `ma-tab`s — NOT routes (same pattern the old `MythicPlusSection` used; just relocated into the page).

### Raids tab

`pages/character/CharacterRaidsTab.vue` is a leaf route (`character-raids`, path `/raids`). It composes `components/character/pve/RaidsHeadline.vue` (hero `{killed}/{total} {diff}` for the highest-progress instance via `useBestRaidProgression`, plus an `N · H · M` chip row counting that same instance's progress at all three difficulties) on top of `RaidProgressionSection` (per-instance cards, difficulty tabs, `BossRow` portraits — unchanged).

### PvE game-data endpoints

PvE game-data comes from two public endpoints:
- `GET /api/v1/game-data/raid-instances?expansion=current` → `{ instances: [...] }`
- `GET /api/v1/game-data/mythic-keystone-dungeons?season=current` → `{ dungeons: [...], affixes: { "<id>": {...} }, season: null }`

Affixes ride along on the dungeons response keyed by id (`Record<number, KeystoneAffixGameData>`) so `<AffixIcon>` does O(1) lookup. Neither uses a `data` envelope (matches BE convention). `composables/usePveGameData.ts` exposes `useRaidInstances()` and `useMythicDungeons()` with `staleTime: Infinity` + `gcTime: 24h` (responses change only on patch). `api/gameData.ts` wraps the calls; types in `src/types/gameData.ts`. The affix dictionary is passed down from page to `AffixIcon` — no per-icon query coupling.
```

- [ ] **Step 2: Commit**

```bash
git add frontend/CLAUDE.md
git commit -m "docs(claude): rewrite PvE section as Dungeons + Raids tabs"
```

(If `git add frontend/CLAUDE.md` errors with "did not match any files" because we're inside `frontend/`, use `git add CLAUDE.md` instead.)

---

## Task 13: Smoke test

> Manual smoke is the only "test" for this area in this repo per `frontend/CLAUDE.md` (no unit-test runner wired). Don't skip — vue-tsc passing is necessary but not sufficient.

- [ ] **Step 1: Final stale-grep**

Run: `grep -rn "character-pve" src/ cypress/ 2>/dev/null`
Expected: zero hits.

Run: `grep -rn "PveHeadlineStrip\|MythicPlusKpiTiles\|MythicPlusSection\|CharacterPveTab" src/`
Expected: zero hits.

- [ ] **Step 2: Final build**

Run: `npm run build`
Expected: clean — vue-tsc passes, `dist/` rebuilt.

- [ ] **Step 3: Manual browser smoke**

The FE for this repo is served by the dockerized `guild-service-fe-v2` nginx on host port 8092 (see `../CLAUDE.md`). After `npm run build` writes a fresh `dist/`, navigate to:

- `http://100.82.124.39:8092/characters/eu/the-maelstrom/melaniya/dungeons`
  - Headline shows colored M+ score (color from `rating.color`), season name (e.g. "Mythic+ Season 1"), three Timed pills.
  - View-switcher tabs render below; toggling "All Runs" shows the runs list.
- `http://100.82.124.39:8092/characters/eu/the-maelstrom/melaniya/raids`
  - Headline shows hero `{killed}/{total} {diff}` (currently The Voidspire / March on Quel'Danas / The Dreamrift on Midnight).
  - Secondary row shows three chips in order N · H · M.
  - Per-instance raid cards render unchanged below.
- `http://100.82.124.39:8092/characters/eu/the-maelstrom/melaniya/pve`
  - Old route is gone — broken / blank page is the **expected** outcome (per user 2026-05-03: pre-prod, no live users, route is gone for good). The only thing we're confirming is that the rest of the SPA still works after navigating away — the failure here doesn't need to be graceful.
- Tab strip — verify `Dungeons` (Skull) and `Raids` (Swords) are two adjacent top-level tabs in the documented order.
- M+ pill in `CharacterStatPills` (visible on Summary tab) clicks through to `/dungeons`. Raid pill clicks through to `/raids`.

- [ ] **Step 4: Stop and report**

Do not push. Do not open a PR. Leave the branch checked out and report what changed so the user can review locally.

---

## Self-review (planner notes)

**Spec coverage check:**
- Tab strip: Tasks 2 + 4. ✓
- Routes (delete `pve`, add `dungeons` + `raids`): Tasks 3 + 6. ✓
- `CharacterStatPills` callers updated: Task 5. ✓
- `CharacterDungeonsTab.vue` + view-switcher relocation: Task 9. ✓
- `CharacterRaidsTab.vue`: Task 10. ✓
- `DungeonsHeadline` (with KPI pills absorbed from `MythicPlusKpiTiles`): Task 7. ✓
- `RaidsHeadline` with N · H · M chip row: Task 8. ✓
- `MythicPlusRating.color` type widening: Task 1. ✓
- Cleanup deletions of 4 superseded files: Task 11. ✓
- `frontend/CLAUDE.md` rewrite: Task 12. ✓
- Smoke test (build + browser + grep): Task 13. ✓

**Type-consistency check:** `MythicPlusRating.color: string | null` defined in Task 1 and only consumed in Task 7 (`props.rating?.color`) — matches. `BestRaidProgression.instanceName` consumed in Task 8 lookup — matches existing composable export. `MythicKeystoneDungeonsResponse.season.id` consumed in Task 9 — matches existing type.

**Placeholder scan:** No "TBD"/"implement later" patterns; every code step has full code.
