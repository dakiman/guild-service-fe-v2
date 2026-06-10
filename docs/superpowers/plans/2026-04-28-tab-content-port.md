# Tab Content Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the four masked-armory empty-tab stubs that have live BE data — port `TalentTree` (Talents tab) and `DungeonRunsList` (PvE > Mythic), build `RaidEncountersList` (PvE > Raids), and fold orphan Plan 2 data (`pvp_brackets`, `professions`) into the Summary tab. Plan 4 tabs (Achievements / Collections / Reputations / Titles + the Stats card) stay as `EmptyTab` placeholders.

**Architecture:** Six tasks, all in the FE repo on `master`. Replace 3 placeholder FE types with real BE shapes first (Task 0); add the new Talents route + tab descriptor + page wrapper in one commit (Task 1); the remaining four tasks each create-or-port a single component and wire it into its host tab. New components consume from `useCharacterContext()` directly — no prop drilling. Ports stay in their existing DaisyUI styling and inherit `masked-armory` theme colors automatically. New components use `.ma-card`/`.ma-text-heading`/`.ma-stat-pill` for cohesion with the layout chrome.

**Tech Stack:** Vue 3 + TypeScript (`<script setup>`) + Vite + Tailwind 3 + DaisyUI + TanStack Vue Query. Verification via `npx vue-tsc -b`. No unit-test runner wired (`vitest` is installed but no `test` script — out of scope to wire). Cypress smoke-tests not included; visual verification is the user's job under item 4.

**Repo:** `/home/dakiman/projects/guild-service-v2/frontend` (branch `master`).

**Spec:** `/home/dakiman/projects/guild-service-v2/backend/docs/superpowers/specs/2026-04-28-character-collections-and-stats-design.md` covers the BE-side Plan 4 work. The current plan is **only the FE port** — no BE files are touched.

---

## Context

Path B (the masked-armory.com character-page redesign) shipped its visual shell on 2026-04-28: theme tokens (`f827fd0`), router rewire (`72ccd8e`), data-contract follow-ups (`74bfe5f`, `0f87a2e`, `62d5795`), classic-Wowhead context plumbing (`62ea844`), and orphan-page deletion (`6ad0e3f`). The new layout's tabs (`Summary`, `Titles`, `Collections`, `PvE`, `Reputations`, `Achievements`) currently render `EmptyTab` placeholders.

The BE response (`CharacterResource`) already includes:
- `talents` + `talent_loadout_code` (Plan 1)
- `dungeon_runs` (Plan 1)
- `pvp_brackets` (Plan 2 — currently unused on the FE)
- `professions` (Plan 2 — currently unused on the FE)
- `raid_progress` (Plan 2 — currently unused on the FE; note the field is `raid_progress`, not `raid_encounter_kills`, even though the BE relation is `raidEncounterKills`)

The other empty tabs (Achievements, Collections, Reputations, Titles, plus the `CharacterStatsCardPlaceholder` on Summary) wait on Plan 4 BE work — out of scope here.

---

## File Structure

### Creates
- `src/components/character/PvpRatingsCard.vue` — PvP brackets summary, rendered on Summary
- `src/components/character/ProfessionsStrip.vue` — compact profession chips, rendered under the equipment mirror on Summary
- `src/components/character/RaidEncountersList.vue` — raid encounter kills grouped by raid + difficulty, rendered on PvE > Raids
- `src/pages/character/CharacterTalentsTab.vue` — thin wrapper over the existing `TalentTree.vue`

### Modifies
- `src/types/character.ts` — replace placeholder types `PvpBracketStats`, `Professions`, `RaidProgress` with real shapes; update `CharacterResource` field types
- `src/router/index.ts` — add `talents` child route at the appropriate position
- `src/pages/CharacterDetailLayout.vue` — insert a Talents entry at index 1 in the `tabs` array passed to `CharacterTabStrip`
- `src/pages/character/CharacterSummaryTab.vue` — render `ProfessionsStrip` under `MirroredEquipmentLayout`; render `PvpRatingsCard` next to `CharacterStatsCardPlaceholder` in a 2-column grid
- `src/pages/character/pve/MythicSubtab.vue` — render `DungeonRunsList`
- `src/pages/character/pve/RaidsSubtab.vue` — render `RaidEncountersList`

---

## Task 0: Replace placeholder FE types with real BE shapes

**Why first:** `frontend/src/types/character.ts:63-65` currently has `PvpBracketStats`, `Professions`, and `RaidProgress` typed as `Record<string, unknown>`. Subsequent tasks build components that consume these fields; without real types `vue-tsc` cannot catch shape mismatches. The shapes come from the BE resources at `backend/app/Http/Resources/PvpBracketResource.php`, `ProfessionResource.php`, `RaidEncounterResource.php` (already inspected when this plan was written — see snippets below).

**Files:**
- Modify: `src/types/character.ts:62-65, 110-112`

- [ ] **Step 1: Open `src/types/character.ts` and locate lines 62-65**

These are the placeholder types you'll replace:

```ts
// Plan 2 placeholders — real shape arrives when Plan 2 ships.
export type PvpBracketStats = Record<string, unknown>
export type Professions = Record<string, unknown>
export type RaidProgress = Record<string, unknown>
```

- [ ] **Step 2: Replace with real types**

Substitute lines 62-65 with the following (the placeholder comment goes too):

```ts
export interface PvpMatchStatistics {
  played: number
  won: number
  lost: number
}

export interface PvpBracketStats {
  bracket: string
  rating: number
  tier_name: string | null
  season: PvpMatchStatistics
  weekly: PvpMatchStatistics
}

export interface Profession {
  profession_id: number
  profession_name: string
  tier_name: string
  skill_points: number
  max_skill_points: number
  is_primary: boolean
}

export interface RaidEncounterProgress {
  expansion: string
  instance_id: number
  instance_name: string
  encounter_id: number
  encounter_name: string
  difficulty: string
  completed_count: number
  last_kill_timestamp: number
}
```

Source-of-truth references (do not paste these into the file — for the writer's confidence only):
- `backend/app/Http/Resources/PvpBracketResource.php` returns `bracket, rating, tier_name, season{played,won,lost}, weekly{played,won,lost}`.
- `backend/app/Http/Resources/ProfessionResource.php` returns `profession_id, profession_name, tier_name, skill_points, max_skill_points, is_primary`.
- `backend/app/Http/Resources/RaidEncounterResource.php` returns `expansion, instance_id, instance_name, encounter_id, encounter_name, difficulty, completed_count, last_kill_timestamp`.

- [ ] **Step 3: Update `CharacterResource` field types at lines 110-112**

Change:

```ts
  pvp_brackets: PvpBracketStats[] | null
  professions: Professions | null
  raid_progress: RaidProgress | null
```

to:

```ts
  pvp_brackets: PvpBracketStats[] | null
  professions: Profession[] | null
  raid_progress: RaidEncounterProgress[] | null
```

(`pvp_brackets` already had `[]` — don't touch it. Only `professions` and `raid_progress` need the array suffix.)

- [ ] **Step 4: Run vue-tsc**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npx vue-tsc -b
```

Expected: clean (no output). The placeholder `Record<string, unknown>` types had no real consumers, so no other file should error. If anything does error, it means a consumer was reading these placeholder types without realizing — fix it inline (most likely a `// @ts-ignore` near the field; remove and address).

- [ ] **Step 5: Commit**

```bash
git add src/types/character.ts
git commit -m "$(cat <<'EOF'
types: replace Plan 2 placeholders with real shapes (pvp_brackets, professions, raid_progress)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1: Add Talents tab — route, tab descriptor, page wrapper

**Files:**
- Create: `src/pages/character/CharacterTalentsTab.vue`
- Modify: `src/router/index.ts` (add `talents` child route after `summary`)
- Modify: `src/pages/CharacterDetailLayout.vue` (insert `Talents` entry at index 1 in the `tabs` array)

- [ ] **Step 1: Create `src/pages/character/CharacterTalentsTab.vue`**

```vue
<template>
  <div class="flex flex-col gap-6">
    <TalentTree
      :talents="character.talents"
      :loadout-code="character.talent_loadout_code"
      :classic="isClassic"
    />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import TalentTree from '@/components/character/TalentTree.vue'

const { character, isClassic } = useCharacterContext()
</script>
```

The pattern matches the existing `CharacterSummaryTab.vue`: no `v-if` guard at the tab level (the layout's `v-else-if="character"` already gates the entire `<router-view />`), and the destructured `character` (a `ComputedRef<CharacterResource>` — not nullable) is read directly in the template via Vue's auto-unwrapping.

- [ ] **Step 2: Add `talents` child route in `src/router/index.ts`**

Find the `character-summary` child block (the first child of the parent character route — created in commit `72ccd8e`). Insert a new child route directly after it:

```ts
      {
        path: 'talents',
        name: 'character-talents',
        component: () => import('@/pages/character/CharacterTalentsTab.vue'),
      },
```

Match the indentation and trailing comma of the surrounding child blocks. The exact position in the array determines URL routing only — order in the file is independent of tab strip order, which is set in `CharacterDetailLayout.vue`.

- [ ] **Step 3: Insert Talents into the tab descriptor in `src/pages/CharacterDetailLayout.vue`**

Find the `tabs` computed (around line 96) — each entry has the shape:

```ts
{ label: 'Summary', to: { name: 'character-summary', params }, icon: Sparkles },
```

The `to` is a vue-router named-location object that uses the `params` reference already in scope (the `:region/:realm/:name` path params).

Add `BookOpen` to the lucide imports (the existing line near `import { Sparkles, Crown, Gem, Skull, Star, Trophy } from 'lucide-vue-next'`):

```ts
import { Sparkles, BookOpen, Crown, Gem, Skull, Star, Trophy } from 'lucide-vue-next'
```

Insert the Talents entry **at index 1** (immediately after the Summary line, before Titles):

```ts
    { label: 'Talents',      to: { name: 'character-talents', params },      icon: BookOpen },
```

(Match the exact whitespace/alignment of the existing entries — the existing lines pad `label` and `to` with spaces for column alignment.)

- [ ] **Step 4: Run vue-tsc**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npx vue-tsc -b
```

Expected: clean. If `TalentTree` errors on `props.classic`, that's because the prop was added in `62d5795` — confirm `src/components/character/TalentTree.vue` declares `classic?: boolean` in its `defineProps`. (It does; this is just a sanity reminder.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/character/CharacterTalentsTab.vue src/router/index.ts src/pages/CharacterDetailLayout.vue
git commit -m "$(cat <<'EOF'
character: add Talents tab — wraps TalentTree with character context

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Wire `DungeonRunsList` into PvE > Mythic subtab

**Files:**
- Modify: `src/pages/character/pve/MythicSubtab.vue`

- [ ] **Step 1: Read current contents**

```bash
cat src/pages/character/pve/MythicSubtab.vue
```

It will be an `EmptyTab` stub. Note its existing imports / structure so the replacement is coherent.

- [ ] **Step 2: Replace the stub with `DungeonRunsList`**

Overwrite the file:

```vue
<template>
  <DungeonRunsList :runs="character.dungeon_runs" />
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import DungeonRunsList from '@/components/character/DungeonRunsList.vue'

const { character } = useCharacterContext()
</script>
```

No `EmptyTab` fallback at the tab level — `CharacterDetailLayout.vue` already gates the `<router-view />` behind `v-else-if="character"`. If `DungeonRunsList` itself wants to render an empty state when `runs.length === 0`, that logic lives inside the component (verify against the file; if it doesn't, leave it for a follow-up — the dungeon-runs feature has been functional for weeks and shouldn't be touched in this port). `DungeonRunsList`'s prop is `runs: DungeonRun[]` (verify by grepping `defineProps` in the file before pasting if uncertain).

- [ ] **Step 3: Run vue-tsc**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/pages/character/pve/MythicSubtab.vue
git commit -m "$(cat <<'EOF'
character: wire DungeonRunsList into PvE > Mythic subtab

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Build `RaidEncountersList` and wire into PvE > Raids subtab

**Files:**
- Create: `src/components/character/RaidEncountersList.vue`
- Modify: `src/pages/character/pve/RaidsSubtab.vue`

- [ ] **Step 1: Create `RaidEncountersList.vue`**

```vue
<template>
  <div class="flex flex-col gap-4">
    <div v-if="!entries || entries.length === 0" class="text-ma-muted/70 text-sm">
      No raid encounter kills recorded.
    </div>

    <div v-else v-for="group in groupedByInstance" :key="group.instance_id" class="card bg-base-200">
      <div class="card-body p-4">
        <h3 class="card-title text-base">
          {{ group.instance_name }}
          <span class="text-xs text-ma-muted/70 font-normal">{{ group.expansion }}</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="kill in group.kills"
            :key="`${kill.encounter_id}-${kill.difficulty}`"
            class="flex items-center justify-between text-sm border-l-2 pl-2"
            :class="difficultyBorderClass(kill.difficulty)"
          >
            <div class="flex flex-col">
              <span>{{ kill.encounter_name }}</span>
              <span class="text-xs text-ma-muted/70">{{ kill.difficulty }} · {{ kill.completed_count }}x</span>
            </div>
            <span class="text-xs text-ma-muted/60 tabular-nums">{{ formatTimestamp(kill.last_kill_timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RaidEncounterProgress } from '@/types/character'

const props = defineProps<{
  entries: RaidEncounterProgress[] | null
}>()

interface InstanceGroup {
  instance_id: number
  instance_name: string
  expansion: string
  kills: RaidEncounterProgress[]
}

const groupedByInstance = computed<InstanceGroup[]>(() => {
  if (!props.entries) return []
  const map = new Map<number, InstanceGroup>()
  for (const entry of props.entries) {
    const existing = map.get(entry.instance_id)
    if (existing) {
      existing.kills.push(entry)
    } else {
      map.set(entry.instance_id, {
        instance_id: entry.instance_id,
        instance_name: entry.instance_name,
        expansion: entry.expansion,
        kills: [entry],
      })
    }
  }
  return Array.from(map.values())
})

function difficultyBorderClass(difficulty: string): string {
  const lower = difficulty.toLowerCase()
  if (lower.includes('mythic')) return 'border-orange-500'
  if (lower.includes('heroic')) return 'border-purple-500'
  if (lower.includes('normal')) return 'border-blue-500'
  return 'border-gray-500'
}

function formatTimestamp(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
```

This uses DaisyUI's `card`/`card-body`/`card-title` (theme-inherited, picks up masked-armory colors automatically) plus Tailwind difficulty-color hints on the left border. Per the locked styling decision, this falls between "port" and "new" — it's a new component but uses DaisyUI primitives like the ports do, since it shares a deeper-tab visual budget.

- [ ] **Step 2: Wire it into `src/pages/character/pve/RaidsSubtab.vue`**

Overwrite the file:

```vue
<template>
  <RaidEncountersList :entries="character.raid_progress" />
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import RaidEncountersList from '@/components/character/RaidEncountersList.vue'

const { character } = useCharacterContext()
</script>
```

The empty-data render lives inside `RaidEncountersList` itself (Step 1 above renders "No raid encounter kills recorded." when `entries` is null/empty). Layout-level character gating is handled by `CharacterDetailLayout`.

- [ ] **Step 3: Run vue-tsc**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/character/RaidEncountersList.vue src/pages/character/pve/RaidsSubtab.vue
git commit -m "$(cat <<'EOF'
character: add RaidEncountersList grouped by instance/difficulty; wire into PvE > Raids

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Build `ProfessionsStrip` and wire into Summary

**Files:**
- Create: `src/components/character/ProfessionsStrip.vue`
- Modify: `src/pages/character/CharacterSummaryTab.vue`

- [ ] **Step 1: Create `ProfessionsStrip.vue`**

The BE returns one entry per profession-tier (a character with both Khaz Algar Blacksmithing and Dragon Isles Blacksmithing gets two rows). Compact strip = flex-wrap of all entries, primary professions first.

```vue
<template>
  <div v-if="entries && entries.length > 0" class="flex flex-wrap gap-2">
    <span
      v-for="entry in sortedEntries"
      :key="`${entry.profession_id}-${entry.tier_name}`"
      class="ma-stat-pill"
    >
      <Hammer v-if="entry.is_primary" class="w-3.5 h-3.5 text-ma-gold" />
      <Wrench v-else class="w-3.5 h-3.5 text-ma-muted/70" />
      <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">
        {{ entry.profession_name }}
      </span>
      <span class="font-bold text-ma-gold tabular-nums">
        {{ entry.skill_points }}/{{ entry.max_skill_points }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Profession } from '@/types/character'
import { Hammer, Wrench } from 'lucide-vue-next'

const props = defineProps<{
  entries: Profession[] | null
}>()

const sortedEntries = computed(() =>
  [...(props.entries ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.profession_name.localeCompare(b.profession_name)
  })
)
</script>
```

Uses `.ma-stat-pill` (defined in `style.css` from `f827fd0`) for consistency with the header pills. If `Hammer`/`Wrench` aren't in the project's lucide version, substitute with `Anvil` / `Cog` — verify via `grep -l 'export.*Hammer\|export.*Wrench\|export.*Anvil' node_modules/lucide-vue-next/dist/lucide-vue-next.d.ts`.

- [ ] **Step 2: Add `ProfessionsStrip` to `CharacterSummaryTab.vue`**

The current file is:

```vue
<template>
  <div class="flex flex-col gap-6">
    <MirroredEquipmentLayout
      :equipment="character.equipment"
      :render-url="character.media.main"
      :character-name="character.name"
    />
    <CharacterStatsCardPlaceholder />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import MirroredEquipmentLayout from '@/components/character/MirroredEquipmentLayout.vue'
import CharacterStatsCardPlaceholder from '@/components/character/CharacterStatsCardPlaceholder.vue'

const { character } = useCharacterContext()
</script>
```

Replace it with:

```vue
<template>
  <div class="flex flex-col gap-6">
    <MirroredEquipmentLayout
      :equipment="character.equipment"
      :render-url="character.media.main"
      :character-name="character.name"
    />
    <ProfessionsStrip :entries="character.professions" />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CharacterStatsCardPlaceholder />
      <!-- PvpRatingsCard slot — Task 5 will add it here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import MirroredEquipmentLayout from '@/components/character/MirroredEquipmentLayout.vue'
import ProfessionsStrip from '@/components/character/ProfessionsStrip.vue'
import CharacterStatsCardPlaceholder from '@/components/character/CharacterStatsCardPlaceholder.vue'

const { character } = useCharacterContext()
</script>
```

(`MirroredEquipmentLayout` requires `:equipment`, `:render-url`, and `:character-name` props — keep all three; the existing call site already passes them correctly.)

- [ ] **Step 3: Run vue-tsc**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/character/ProfessionsStrip.vue src/pages/character/CharacterSummaryTab.vue
git commit -m "$(cat <<'EOF'
character: add ProfessionsStrip; place under equipment mirror on Summary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build `PvpRatingsCard` and wire into Summary

**Files:**
- Create: `src/components/character/PvpRatingsCard.vue`
- Modify: `src/pages/character/CharacterSummaryTab.vue` (replace the slot comment from Task 4)

- [ ] **Step 1: Create `PvpRatingsCard.vue`**

```vue
<template>
  <div class="ma-card p-4">
    <h3 class="ma-text-heading text-sm uppercase tracking-wider mb-3">PvP</h3>
    <div v-if="!brackets || brackets.length === 0" class="text-ma-muted/70 text-sm">
      No ranked PvP this season.
    </div>
    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="bracket in sortedBrackets"
        :key="bracket.bracket"
        class="flex items-center justify-between text-sm"
      >
        <span class="text-ma-text">{{ formatBracket(bracket.bracket) }}</span>
        <div class="flex items-center gap-3">
          <span class="text-ma-gold tabular-nums font-bold">{{ bracket.rating }}</span>
          <span class="text-ma-muted/70 tabular-nums text-xs">
            {{ bracket.season.won }}–{{ bracket.season.lost }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PvpBracketStats } from '@/types/character'

const props = defineProps<{
  brackets: PvpBracketStats[] | null
}>()

const sortedBrackets = computed(() =>
  [...(props.brackets ?? [])].sort((a, b) => b.rating - a.rating)
)

function formatBracket(slug: string): string {
  if (slug === '2v2') return '2v2'
  if (slug === '3v3') return '3v3'
  if (slug === 'rbg') return 'RBG'
  if (slug.startsWith('blitz-')) {
    const parts = slug.slice(6).split('-')
    return 'Blitz ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return slug
}
</script>
```

- [ ] **Step 2: Replace the slot comment in `CharacterSummaryTab.vue`**

Find this line from Task 4:

```vue
      <!-- PvpRatingsCard slot — Task 5 will add it here -->
```

Replace with:

```vue
      <PvpRatingsCard :brackets="character.pvp_brackets" />
```

Add the import at the top of `<script setup>`:

```ts
import PvpRatingsCard from '@/components/character/PvpRatingsCard.vue'
```

- [ ] **Step 3: Run vue-tsc**

```bash
npx vue-tsc -b
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/character/PvpRatingsCard.vue src/pages/character/CharacterSummaryTab.vue
git commit -m "$(cat <<'EOF'
character: add PvpRatingsCard; place next to stats placeholder on Summary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review checklist

Before declaring the plan complete, verify these:

- **Spec coverage:** Every component and edit in the design spec (`backend/docs/superpowers/specs/2026-04-28-character-collections-and-stats-design.md` is the BE spec; the design proposed in this conversation is the FE counterpart) has a task. The 4 creates + 5 modifies match the file structure section above.
- **No placeholders:** No `TBD`/`TODO`/`fill in details` in step bodies. Each task has complete code blocks for new files and exact replacement snippets for modifications. Two soft-touch points: (a) the lucide icon names are verified via grep at the relevant step rather than blind-coded, since the project's installed lucide version may not include every name; (b) `EmptyTab`'s prop signature (`label` vs `title`) is verified at the call site rather than baked in. Both have explicit verification steps.
- **Type consistency:** `Profession` (singular interface) vs `Profession[]` (array on `CharacterResource`) is internally consistent. `PvpBracketStats` stays `PvpBracketStats[]` per the existing `CharacterResource` declaration. `RaidEncounterProgress[]` replaces the placeholder `RaidProgress`.
- **Cross-task ordering:** Task 0 unblocks all downstream tasks. Task 1 is independent of Tasks 2-5 except that all consume from the new layout. Tasks 2-5 are pairwise independent and can be parallelized in subagent dispatch (file sets are disjoint), with one exception: Task 4 introduces a `<!-- PvpRatingsCard slot -->` comment in `CharacterSummaryTab.vue` that Task 5 replaces. If Task 5 runs before Task 4, the comment doesn't exist yet — sequential 4→5 is required, OR run them in a single composite agent.
- **Frontend-only scope:** No backend file is touched. Cypress smoke is excluded by design.

If you find issues, fix inline. No need to re-review.

---

## Execution handoff

Plan complete and saved to `frontend/docs/superpowers/plans/2026-04-28-tab-content-port.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration. Tasks 0-3 dispatch sequentially; Tasks 4 and 5 must run sequentially relative to each other (per the slot-comment dependency) but can run after Tasks 0-3 complete. Approximate parallelism: Task 0 → (Task 1 ∥ Task 2 ∥ Task 3) → Task 4 → Task 5.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints for review.
