# Data-Contract Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close three pre-existing FE/BE data-contract gaps surfaced while rendering dungeon-run members (plan `2026-04-22-plan-1-api-integration.md` follow-up).

**Architecture:** Three independent fixes across two repos. No shared state between them, so they dispatch cleanly as three parallel sub-agents.

**Tech Stack:** Laravel 11 + PHPUnit (BE `../backend`); Vue 3 + TypeScript + vue-tsc + Cypress (FE `../frontend`).

**Parallelizability:** All three tasks edit disjoint files. Tasks 1 and 2 are 100% independent. Task 3 touches only `src/components/wow/*`, `src/composables/useWowhead.ts`, and the two character-page components that render `WowheadLink` — no overlap with Task 2 which only edits `src/types/character.ts` and the affix block of `DungeonRunsList.vue`.

---

## Context

During the audit plan `2026-04-22-plan-1-api-integration.md`, three issues slipped through because the only test character (`eu/the-maelstrom/cirna`) happens to be a Classic character with one affix per run and no loaded members — making the defects invisible until the dungeon-run member feature forced a deeper look. Specifically:

1. **BE eager-load gap** — `CharacterController::show` loads `['guild', 'dungeonRuns']` but not `dungeonRuns.members`. `DungeonRunResource::toArray()` uses `whenLoaded('members', …)`, so the members key is silently omitted from every response. The FE's dungeon-run party-roster UI (including the new clickable member links) is therefore dead until this is fixed. (FE has a defensive `run.members?.length` guard, so no crash — just a dark feature.)

2. **Affixes type/render mismatch** — BE returns `affixes: [{id: number, name: string}]`; FE types it as `string[]` and renders `{{ affix }}`, which currently prints stringified JSON like `{ "id": 165, "name": "Lindormi's Guidance" }` on every dungeon run card. Has been visible in production for this whole feature.

3. **Wowhead classic-tooltip failures** — `index.html` loads `https://wow.zamimg.com/widgets/power.js` and the widget defaults to retail's `nether.wowhead.com` tooltip API. Classic spell IDs 404 there (cirna alone produces ~66 errors on page load). `WowheadLink.vue` already accepts a `classic` prop and `buildWowheadHref` tacks `&domain=classic` onto the link URL, but neither the widget's tooltip fetch nor any caller threads the character's `game_version` through.

---

## File Structure

### Task 1 files

- Modify: `/home/dakiman/projects/guild-service-v2/backend/app/Http/Controllers/CharacterController.php` (one-line load change)
- Modify: `/home/dakiman/projects/guild-service-v2/backend/tests/Feature/Endpoints/RetailCharacterEndpointTest.php` (add `dungeon_runs.*.members` structure assertion)

### Task 2 files

- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/types/character.ts:86` (affixes type)
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/DungeonRunsList.vue:22-29` (affix block)

### Task 3 files

- Investigate: `/home/dakiman/projects/guild-service-v2/frontend/src/composables/useWowhead.ts` (how `$WowheadPower.refreshLinks` initialises; whether global config is supported)
- Investigate: `/home/dakiman/projects/guild-service-v2/frontend/index.html` (power.js script tag — may need to set `window.whTooltips` before it)
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/wow/WowheadLink.vue` (emit `data-wowhead="spell=X&domain=classic"` when classic)
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/TalentTree.vue` (pass `:classic="isClassic"`)
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/EquipmentList.vue` (pass `:classic="isClassic"`)
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/pages/CharacterDetailPage.vue` (compute `isClassic` from `character.game_version` and pass down)

---

## Task 1: BE — Eager-load dungeonRuns.members

**Repo:** `../backend` (separate from the plan file's repo — the sub-agent must `cd` there or operate with absolute paths).

**Files:**
- Modify: `/home/dakiman/projects/guild-service-v2/backend/app/Http/Controllers/CharacterController.php:30`
- Modify: `/home/dakiman/projects/guild-service-v2/backend/tests/Feature/Endpoints/RetailCharacterEndpointTest.php`

- [ ] **Step 1: Read the Character model and DungeonRunResource to confirm the relation path**

```bash
# From /home/dakiman/projects/guild-service-v2/backend
grep -n "dungeonRuns\|members" app/Models/Character.php app/Models/DungeonRun.php
```

Expected: `Character::dungeonRuns()` returns `belongsToMany(DungeonRun::class, 'dungeon_run_members')`; `DungeonRun::members()` returns a relation to `Character` (or similar) via the same pivot. The eager-load path is therefore `dungeonRuns.members`.

- [ ] **Step 2: Write a failing test assertion**

Edit `/home/dakiman/projects/guild-service-v2/backend/tests/Feature/Endpoints/RetailCharacterEndpointTest.php`. Inside `test_retail_endpoint_returns_valid_response`, after the existing `assertJsonStructure` call, add:

```php
$dungeonRuns = $response->json('data.dungeon_runs');
$this->assertIsArray($dungeonRuns);

if (!empty($dungeonRuns)) {
    foreach ($dungeonRuns as $i => $run) {
        $this->assertArrayHasKey('members', $run, "dungeon_runs[{$i}] missing members — controller must eager-load dungeonRuns.members");
        $this->assertIsArray($run['members'], "dungeon_runs[{$i}].members must be an array");

        foreach ($run['members'] as $j => $member) {
            $this->assertArrayHasKey('character_id', $member, "dungeon_runs[{$i}].members[{$j}] missing character_id");
            $this->assertArrayHasKey('character_name', $member, "dungeon_runs[{$i}].members[{$j}] missing character_name");
            $this->assertArrayHasKey('character_realm', $member, "dungeon_runs[{$i}].members[{$j}] missing character_realm");
            $this->assertArrayHasKey('character_region', $member, "dungeon_runs[{$i}].members[{$j}] missing character_region");
            $this->assertArrayHasKey('spec_name', $member, "dungeon_runs[{$i}].members[{$j}] missing spec_name");
            $this->assertArrayHasKey('equipped_item_level', $member, "dungeon_runs[{$i}].members[{$j}] missing equipped_item_level");
        }
    }
}
```

- [ ] **Step 3: Run the test and confirm it fails**

```bash
cd /home/dakiman/projects/guild-service-v2/backend
vendor/bin/phpunit --filter test_retail_endpoint_returns_valid_response tests/Feature/Endpoints/RetailCharacterEndpointTest.php
```

Expected: FAIL with `dungeon_runs[0] missing members — controller must eager-load dungeonRuns.members`. If it passes (e.g. because no fixture character has recorded runs), warm a character that does via `php artisan tinker` and retry. Do NOT skip — the assertion is only meaningful when a character with runs is tested.

- [ ] **Step 4: Apply the one-line fix**

Edit `/home/dakiman/projects/guild-service-v2/backend/app/Http/Controllers/CharacterController.php`. Change line 30:

```php
$result->load(['guild', 'dungeonRuns']);
```

to:

```php
$result->load(['guild', 'dungeonRuns.members']);
```

- [ ] **Step 5: Run the test and confirm it passes**

```bash
cd /home/dakiman/projects/guild-service-v2/backend
vendor/bin/phpunit --filter test_retail_endpoint_returns_valid_response tests/Feature/Endpoints/RetailCharacterEndpointTest.php
```

Expected: PASS.

- [ ] **Step 6: Sanity-check with curl against the running BE**

```bash
curl -s http://localhost:8091/api/v1/characters/eu/the-maelstrom/cirna \
  | python3 -c "import sys,json; d=json.load(sys.stdin); runs=d['data']['dungeon_runs']; print('runs:', len(runs)); print('first run has members key:', 'members' in runs[0] if runs else 'no runs')"
```

Expected: `first run has members key: True`. If cirna's runs have empty `members` arrays that's a BE data issue outside this task's scope — file a separate ticket. The key assertion here is that the **shape is correct**.

- [ ] **Step 7: Commit**

```bash
cd /home/dakiman/projects/guild-service-v2/backend
git add app/Http/Controllers/CharacterController.php tests/Feature/Endpoints/RetailCharacterEndpointTest.php
git commit -m "fix(character): eager-load dungeonRuns.members so party roster ships with each run"
```

---

## Task 2: FE — Correct affixes type and rendering

**Repo:** `../frontend`.

**Files:**
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/types/character.ts` (affixes type on `DungeonRun`)
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/DungeonRunsList.vue:22-29` (template)

- [ ] **Step 1: Confirm the actual BE shape**

```bash
curl -s http://localhost:8091/api/v1/characters/eu/the-maelstrom/cirna \
  | python3 -c "import sys,json; d=json.load(sys.stdin); runs=d['data']['dungeon_runs']; print(runs[0]['affixes'] if runs else 'no runs')"
```

Expected: array of objects like `[{'id': 165, 'name': "Lindormi's Guidance"}]`. If the actual shape differs, update the types and template to match — do not invent a contract.

- [ ] **Step 2: Fix the TypeScript type**

Edit `/home/dakiman/projects/guild-service-v2/frontend/src/types/character.ts`. Change line 86 from:

```ts
  affixes: string[]
```

to:

```ts
  affixes: { id: number; name: string }[]
```

- [ ] **Step 3: Fix the template rendering**

Edit `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/DungeonRunsList.vue`. Replace lines 22–30:

```vue
          <div v-if="run.affixes.length" class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="affix in run.affixes"
              :key="affix"
              class="badge badge-outline badge-sm"
            >
              {{ affix }}
            </span>
          </div>
```

with:

```vue
          <div v-if="run.affixes.length" class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="affix in run.affixes"
              :key="affix.id"
              class="badge badge-outline badge-sm"
            >
              {{ affix.name }}
            </span>
          </div>
```

- [ ] **Step 4: Run vue-tsc to confirm the template is type-consistent**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npx vue-tsc -b
```

Expected: no output (clean). If the template still references `affix` as a string somewhere, vue-tsc will surface the error; fix before moving on.

- [ ] **Step 5: Visually verify in the browser**

Prereq: BE on 8091, FE dev server on 5173 launched with `VITE_API_BASE_URL=http://localhost:8091/api/v1 npm run dev` (see `.env` — it's set to relative `/api/v1` which won't work without a Vite proxy; override for local dev).

```bash
# If not already running:
cd /home/dakiman/projects/guild-service-v2/frontend
VITE_API_BASE_URL=http://localhost:8091/api/v1 npm run dev &
```

Navigate to `http://localhost:5173/characters/eu/the-maelstrom/cirna`. In the Mythic+ Runs card, each run should show affix badges labelled with affix names (e.g. `Lindormi's Guidance`), not `[object Object]` or stringified JSON.

- [ ] **Step 6: Commit**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
git add src/types/character.ts src/components/character/DungeonRunsList.vue
git commit -m "fix(character): render dungeon-run affixes by name; match BE shape in types"
```

---

## Task 3: FE — Plumb game_version to Wowhead links for Classic tooltips

**Repo:** `../frontend`.

This task has an investigative step because the exact Wowhead-widget classic-switch mechanism needs verification. `WowheadLink.vue` already accepts a `classic: boolean` prop and `buildWowheadHref` appends `&domain=classic`, but that only affects the anchor `href` — the tooltip fetch is driven by `data-wowhead` attribute and/or `window.whTooltips` config read by `power.js`. The sub-agent must confirm which mechanism works.

**Files:**
- Investigate, then modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/wow/WowheadLink.vue`
- Investigate, then modify: `/home/dakiman/projects/guild-service-v2/frontend/src/composables/useWowhead.ts` and/or `/home/dakiman/projects/guild-service-v2/frontend/index.html`
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/TalentTree.vue`
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/EquipmentList.vue`
- Modify: `/home/dakiman/projects/guild-service-v2/frontend/src/pages/CharacterDetailPage.vue`

- [ ] **Step 1: Reproduce and characterise the failure**

Navigate to `http://localhost:5173/characters/eu/the-maelstrom/cirna` and open DevTools → Network. Filter for `nether.wowhead.com`. Confirm: tooltip requests go to `https://nether.wowhead.com/tooltip/spell/{id}?dataEnv=1&locale=0` and 404 on classic-era spell IDs (e.g. spell `82701`). Retail-side IDs like item `255889` should succeed.

Verify the class of the character is Classic: `curl -s http://localhost:8091/api/v1/characters/eu/the-maelstrom/cirna | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['game_version'])"` → `classic`.

- [ ] **Step 2: Read the existing Wowhead plumbing**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
cat src/components/wow/WowheadLink.vue src/composables/useWowhead.ts src/utils/wowhead.ts
grep -n "wowhead\|power.js\|whTooltips" index.html
```

Confirm: `WowheadLink.vue` already takes a `classic?: boolean` prop and passes it through `buildWowheadHref`, which appends `&domain=classic` to the `href`. The `data-wowhead` attribute currently mirrors the href but without domain awareness — this is the likely root cause.

- [ ] **Step 3: Determine the correct classic-switch mechanism**

Read Wowhead's power.js documentation. Two known options:

- **Per-link:** embed `&domain=classic` in the `data-wowhead` attribute (not just the visible href). The widget parses `data-wowhead` and respects domain query params.
- **Global:** set `window.whTooltips = { ... domain: 'classic' }` before `power.js` loads. This flips every tooltip on the page to Classic and is simplest if the whole page is Classic.

The detail page has a single `game_version`, so global is viable. However global is risky in SPA navigation (switching from a classic char to a retail char without reload leaves stale config). **Recommend per-link: add `&domain=classic` to `data-wowhead`.** This matches the per-link `href` treatment already in place.

Validate the recommendation by spot-checking a known-good classic reference: inspect how a public Classic-era character on wowhead.com/dressing-room is marked up. If `data-wowhead` includes `&domain=classic` there, we have our answer.

- [ ] **Step 4: Update WowheadLink to include domain in data-wowhead**

Edit `/home/dakiman/projects/guild-service-v2/frontend/src/components/wow/WowheadLink.vue`:

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
```

The `:data-wowhead="href"` line is already using the same `href` computed that includes `&domain=classic` when `classic` is true. **No change needed to WowheadLink if `href` already bakes in the domain.** Confirm this by running the existing component unchanged and checking the DOM attribute in DevTools after passing `:classic="true"` from a caller.

If the computed `href` does NOT carry `&domain=classic` into `data-wowhead` (e.g. because it's prepended only to the visible URL), update `buildWowheadHref` so the domain suffix is always emitted when `classic` is true, and verify `data-wowhead` inherits it.

- [ ] **Step 5: Plumb isClassic from CharacterDetailPage through talents and equipment**

Edit `/home/dakiman/projects/guild-service-v2/frontend/src/pages/CharacterDetailPage.vue`. Add a computed:

```ts
const isClassic = computed(() => character.value?.game_version === 'classic')
```

Then update the TalentTree and EquipmentList invocations:

```vue
<EquipmentList :equipment="character.equipment" :classic="isClassic" />
<TalentTree
  :talents="character.talents"
  :loadout-code="character.talent_loadout_code"
  :classic="isClassic"
/>
```

- [ ] **Step 6: Accept and forward classic in TalentTree**

Edit `/home/dakiman/projects/guild-service-v2/frontend/src/components/character/TalentTree.vue`. Extend the props:

```ts
const props = defineProps<{
  talents: CharacterTalents
  loadoutCode?: string | null
  classic?: boolean
}>()
```

Update every `<WowheadLink :spell-id="...">` in the template to also pass `:classic="props.classic"`:

```vue
<WowheadLink :spell-id="t.id" :classic="props.classic">Rank {{ t.rank }}</WowheadLink>
```

…for class/spec/hero lists and the PvP slot:

```vue
<WowheadLink :spell-id="p.spell_id" :classic="props.classic">Slot {{ p.slot + 1 }}</WowheadLink>
```

- [ ] **Step 7: Accept and forward classic in EquipmentList**

Read `src/components/character/EquipmentList.vue` first to confirm it uses `WowheadLink`, then add the same `classic?: boolean` prop and thread it into every `<WowheadLink>` invocation.

- [ ] **Step 8: Run vue-tsc**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
npx vue-tsc -b
```

Expected: no output.

- [ ] **Step 9: Browser verify**

Navigate to `http://localhost:5173/characters/eu/the-maelstrom/cirna`. Open DevTools → Network, filter for `classic.wowhead.com` (or confirm `nether.wowhead.com` requests now include `&domain=classic`). Tooltip fetches should succeed (200) for the classic spell IDs that previously 404'd. Hover a talent link; the Wowhead tooltip should appear with real spell data.

For a negative test, load any retail character's page and confirm its tooltip requests do NOT include `&domain=classic` — i.e. the classic flag is correctly scoped to classic characters only.

- [ ] **Step 10: Commit**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend
git add src/components/wow/WowheadLink.vue src/components/character/TalentTree.vue src/components/character/EquipmentList.vue src/pages/CharacterDetailPage.vue src/utils/wowhead.ts
git commit -m "fix(wowhead): route classic characters' tooltips through Wowhead's classic domain"
```

---

## Self-review checklist

- **Spec coverage:** Each of the three issues from the audit session has exactly one task. Nothing surplus, nothing missing.
- **Placeholder scan:** No `TBD` / `implement later` / `handle edge cases`. Task 3 has one investigative step (Step 3) but it's bounded — the recommendation is named and Step 4 gives the fix if the recommendation holds, with a fallback path if it doesn't.
- **Type consistency:** `affixes: { id: number; name: string }[]` used consistently in type change and `:key="affix.id"` / `{{ affix.name }}` template. `isClassic` computed reused across TalentTree and EquipmentList with the same `classic?: boolean` prop name.
- **Cross-task ordering:** Task 1 must ship before the previously-added clickable dungeon-member link (in plan `2026-04-22-plan-1-api-integration.md`) does anything useful — but Tasks 1, 2, and 3 don't block each other and the main plan's code is already merged.

---

## Execution handoff — dispatch as 3 parallel sub-agents

Because all three tasks edit disjoint files and the user asked for a sub-agent-focused plan, the recommended execution mode is **parallel sub-agent dispatch** via `superpowers:dispatching-parallel-agents`.

Launch three agents in a single message:

```
Agent("BE: eager-load dungeonRuns.members")
   → prompt: "Execute Task 1 from docs/superpowers/plans/2026-04-23-data-contract-followups.md.
              The task is self-contained: read the task, execute the steps, commit.
              Work in /home/dakiman/projects/guild-service-v2/backend (BE repo).
              Do NOT touch files outside Task 1's file list.
              Return a one-paragraph summary plus the commit SHA."

Agent("FE: affixes type+render fix")
   → prompt: "Execute Task 2 from docs/superpowers/plans/2026-04-23-data-contract-followups.md.
              Work in /home/dakiman/projects/guild-service-v2/frontend.
              Do NOT touch files outside Task 2's file list.
              Return commit SHA + confirmation that vue-tsc is clean."

Agent("FE: plumb classic game_version to Wowhead tooltips")
   → prompt: "Execute Task 3 from docs/superpowers/plans/2026-04-23-data-contract-followups.md.
              Task 3 has one investigative step (Step 3) — commit to a recommendation and execute.
              Do NOT touch files outside Task 3's file list.
              Return commit SHA + confirmation that the classic tooltip 404s are gone."
```

After all three return, verify in a single browser session by loading cirna's character page and checking that (a) dungeon-run rosters have member rows with clickable names, (b) affixes show as names, (c) Wowhead tooltips load without 404s. Run `npx vue-tsc -b` once more to catch any cross-task type drift (there shouldn't be any, since the file sets are disjoint, but verify).

Sequential fallback (if the user prefers not to parallelise): Task 2 → Task 1 → Task 3. Task 2 is lowest-risk and self-contained. Task 1 requires the BE test harness and a warm character. Task 3 has the investigative step.
