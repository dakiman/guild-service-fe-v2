# Dungeon Runs — Collapsible "All Runs" Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-expanded run cards in `MythicPlusAllRuns.vue` with click-to-expand cards that show a one-row header (existing data + per-member spec/ilvl pills) by default and reveal the affix row + members table on click.

**Architecture:** Single-file change. The existing card markup is split: the header row becomes a `<button type="button" aria-expanded aria-controls>` toggle (with a leading rotating chevron and 5 trailing member pills), and the affix row + existing members table move into a `v-show`-gated wrapper. Local component state (`Set<runId>`) tracks expanded cards; nothing is persisted. Spec at `docs/superpowers/specs/2026-05-03-dungeon-runs-collapsible-design.md`.

**Tech Stack:** Vue 3 `<script setup>` + TS, Tailwind/DaisyUI utility classes, lucide-vue-next icons (`ChevronRight` already used elsewhere in the codebase). No new deps, no new files.

---

## File Structure

**Modified:**
- `frontend/src/components/character/pve/MythicPlusAllRuns.vue` — only file touched.

**Not touched (explicitly out of scope per spec):**
- `frontend/src/components/character/pve/MythicPlusBestPerDungeon.vue`
- `frontend/src/components/character/pve/DungeonsHeadline.vue`
- `frontend/src/components/character/pve/AffixIcon.vue`
- `frontend/src/pages/character/CharacterDungeonsTab.vue`
- `frontend/src/types/character.ts` — types are sufficient as-is.

---

## Pre-flight

Run from `frontend/`:

- [ ] **Confirm working tree is clean and on master**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend status
git -C /home/dakiman/projects/guild-service-v2/frontend branch --show-current
```

Expected: `nothing to commit, working tree clean`, branch `master`. The design-spec commit (`9ee97d5`) should already be on master.

- [ ] **Cut a feature branch**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend checkout -b feature/dungeon-runs-collapsible
```

- [ ] **Confirm baseline build passes before any changes**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npm run build
```

Expected: `vue-tsc -b` finishes with no errors and Vite produces `dist/`. If this already fails, stop and surface the failure — it's not from this work.

---

## Task 1: Add expand/collapse state and wrap the header in a toggle button

This task ships a default-collapsed UI. Body content (affixes + members table) is preserved unchanged but hidden behind `v-show`. Member pills come in Task 2; affix relocation in Task 3.

**Files:**
- Modify: `frontend/src/components/character/pve/MythicPlusAllRuns.vue` (full replacement of `<template>` + additions to `<script setup>`).

- [ ] **Step 1: Add the chevron import and collapse state**

Open `frontend/src/components/character/pve/MythicPlusAllRuns.vue`. Inside `<script setup>`, after the existing imports (currently lines 79-86), add:

```ts
import { ChevronRight } from 'lucide-vue-next'
```

Then, after the existing `defineProps` block (currently ending around line 92), add:

```ts
const expanded = ref<Set<number>>(new Set())

function isOpen(run: DungeonRun): boolean {
  return expanded.value.has(run.id)
}

function toggle(run: DungeonRun): void {
  const next = new Set(expanded.value)
  if (next.has(run.id)) next.delete(run.id)
  else next.add(run.id)
  expanded.value = next
}

function runBodyId(run: DungeonRun): string {
  return `mplus-run-body-${run.id}`
}
```

Update the existing `import { computed } from 'vue'` line (currently line 79) to also import `ref`:

```ts
import { computed, ref } from 'vue'
```

- [ ] **Step 2: Replace the per-run card markup with the collapsible structure**

In the same file, replace the `v-for` block (currently lines 6-74 — the entire `<div v-for="run in sortedRuns" ...>` and its contents) with this exact markup:

```vue
    <div v-for="run in sortedRuns" :key="run.id" class="ma-card p-4">
      <button
        type="button"
        class="flex flex-wrap items-center gap-3 w-full text-left"
        :aria-expanded="isOpen(run)"
        :aria-controls="runBodyId(run)"
        @click="toggle(run)"
      >
        <ChevronRight
          aria-hidden="true"
          class="w-4 h-4 shrink-0 text-ma-muted/70 transition-transform duration-150"
          :class="{ 'rotate-90': isOpen(run) }"
        />
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
      </button>

      <div :id="runBodyId(run)" v-show="isOpen(run)" class="mt-3">
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
                <th class="text-left px-2 py-1 font-medium">Realm</th>
                <th class="text-left px-2 py-1 font-medium">Spec</th>
                <th class="text-right px-2 py-1 font-medium">iLvl</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(member, idx) in run.members"
                :key="`${member.character_region}:${member.character_realm}:${member.character_name}:${idx}`"
                class="border-t border-ma-border/15"
              >
                <td class="px-2 py-1">
                  <RouterLink
                    :to="memberRoute(member)"
                    class="font-semibold hover:underline transition-colors"
                    :style="{ color: memberColor(member) }"
                  >
                    {{ displayName(member.character_name) }}
                  </RouterLink>
                </td>
                <td class="px-2 py-1 text-ma-muted/70">{{ formatRealm(member.character_realm, member.character_realm_display) }}</td>
                <td class="px-2 py-1 text-ma-muted/70">
                  <span class="inline-flex items-center gap-1.5">
                    <SpecIcon
                      :spec-id="member.spec_id"
                      :fallback-class-id="member.spec_id != null ? SPEC_TO_CLASS[member.spec_id] ?? null : null"
                      :size="18"
                    />
                    <span>{{ member.spec_name }}</span>
                  </span>
                </td>
                <td class="px-2 py-1 text-right tabular-nums">{{ member.equipped_item_level }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
```

Notes:
- The `mb-3` margin previously sitting on the affixes wrapper inside the card is preserved on the inner wrapper; the outer body now uses `mt-3` for top spacing instead of relying on the deleted `mb-3` from the header.
- The empty-state wrapper outside the loop (`<div v-if="seasonRuns.length === 0">…`) is unchanged.

- [ ] **Step 3: Verify type-check and build still pass**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npm run build
```

Expected: PASS. If `vue-tsc` reports an error, fix typos first — the most likely error is a missing or mistyped import.

- [ ] **Step 4: Smoke-check in the browser**

Start the dev server in a second shell (or use the existing dockerized FE at `http://100.82.124.39:8092/`), and load the All Runs view:

```
http://localhost:5173/character/eu/the-maelstrom/melaniya/dungeons
```

Click "All Runs". Confirm:
- Every run renders as a single one-line row (no inline table).
- Clicking the row toggles the chevron (right → down) and reveals the existing affix row + members table.
- Clicking again collapses; re-expanding the same card is instant.

If you cannot run a browser, say so explicitly in the commit body — do not claim verified.

- [ ] **Step 5: Commit**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend add src/components/character/pve/MythicPlusAllRuns.vue
git -C /home/dakiman/projects/guild-service-v2/frontend commit -m "feat(fe): collapse MythicPlusAllRuns cards by default

Wrap each run's header row in a button toggle with a rotating chevron.
Affix row + members table move behind v-show, gated by a Set<runId> of
expanded ids. Default state is collapsed for every run; no persistence.
Member pills come in a follow-up commit."
```

---

## Task 2: Add per-member spec/ilvl pills to the collapsed header

The collapsed row currently ends at the timestamp. Add 5 small pills after it so the viewer can read the party comp without expanding.

**Files:**
- Modify: `frontend/src/components/character/pve/MythicPlusAllRuns.vue`.

- [ ] **Step 1: Add the member-pill markup to the header button**

In `MythicPlusAllRuns.vue`, inside the `<button>` element (added in Task 1), immediately after the existing timestamp `<span>` and **before** the closing `</button>`, insert:

```vue
        <ul class="flex flex-wrap items-center gap-1 list-none m-0 p-0">
          <li
            v-for="(member, idx) in run.members"
            :key="`pill:${run.id}:${idx}`"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-ma-border/30 bg-ma-card/40 text-[11px] text-ma-muted/80"
            :title="`${displayName(member.character_name)} • ${formatRealm(member.character_realm, member.character_realm_display)}`"
          >
            <SpecIcon
              :spec-id="member.spec_id"
              :fallback-class-id="member.spec_id != null ? SPEC_TO_CLASS[member.spec_id] ?? null : null"
              :size="14"
            />
            <span class="tabular-nums">{{ member.equipped_item_level }}</span>
          </li>
        </ul>
```

Rationale for `<ul><li>`: the parent is a `<button>`; nesting another button-like clickable inside would be invalid HTML. A list of non-interactive `<li>` chips inherits the parent button's click target, so clicking a pill toggles the card (which is the intended behavior — the pill is decorative).

- [ ] **Step 2: Verify type-check and build still pass**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 3: Smoke-check in the browser**

Reload the All Runs view. For each collapsed row confirm:
- Up to 5 trailing pills appear (one per member, in member-array order).
- Each pill shows a 14px spec icon + ilvl number.
- Hovering a pill shows a native tooltip `"Name • Realm"` (e.g. `"Melaniya • The Maelstrom"`).
- Clicking a pill still toggles the parent card (no separate click handler swallowed the event).
- On a narrow viewport (resize window to ~600px), the pills wrap to a second line beneath the existing chips; no overflow.

- [ ] **Step 4: Commit**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend add src/components/character/pve/MythicPlusAllRuns.vue
git -C /home/dakiman/projects/guild-service-v2/frontend commit -m "feat(fe): render member spec/ilvl pills in collapsed M+ run header

Each run row now ends with one chip per party member: 14px spec icon +
equipped ilvl. Title attribute carries 'name • realm' for at-a-glance
identification without expanding. Chips are non-interactive <li>s — the
parent button absorbs clicks and toggles the card."
```

---

## Task 3: Empty-members fallback in expanded body

The body currently renders nothing if `run.members.length === 0`. Per spec, show a small muted line so an expanded card is never visually empty.

**Files:**
- Modify: `frontend/src/components/character/pve/MythicPlusAllRuns.vue`.

- [ ] **Step 1: Add an `<else>` branch alongside the existing members table**

Locate the members `<div v-if="run.members.length" class="overflow-x-auto">…</div>` block in the expanded body (added in Task 1). Add an `else` sibling immediately after the closing `</div>` of that block:

```vue
        <p v-else class="text-xs text-ma-muted/60 italic m-0">No member data recorded.</p>
```

The full branch should now read:

```vue
        <div v-if="run.members.length" class="overflow-x-auto">
          <!-- existing table unchanged -->
        </div>
        <p v-else class="text-xs text-ma-muted/60 italic m-0">No member data recorded.</p>
```

- [ ] **Step 2: Verify build still passes**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 3: Verify visually if possible**

This branch is rare in practice (BE seeds 5 members for current-season runs), so a synthetic test isn't worth wiring. Confirm at least that the existing test character renders the populated branch unchanged. Note in the commit body that the empty branch was not exercised live.

- [ ] **Step 4: Commit**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend add src/components/character/pve/MythicPlusAllRuns.vue
git -C /home/dakiman/projects/guild-service-v2/frontend commit -m "feat(fe): show muted fallback when M+ run has no member data

Defends against legacy/unseeded runs where members[] is empty. Populated
branch verified live; empty branch not exercised."
```

---

## Task 4: Add a height transition on expand/collapse

Pure-CSS, no JS measurement, no extra dep. Uses the `grid-template-rows: 0fr ↔ 1fr` trick on a wrapper around the body content. The scroll/click feedback from the chevron rotation is already in place from Task 1; this task adds the body's smooth open/close.

**Files:**
- Modify: `frontend/src/components/character/pve/MythicPlusAllRuns.vue`.

- [ ] **Step 1: Wrap the body in a grid-row animator and switch from `v-show` to a CSS-driven open class**

Replace the body `<div :id="runBodyId(run)" v-show="isOpen(run)" class="mt-3">…</div>` (added in Task 1) with a two-layer wrapper that animates `grid-template-rows`:

```vue
      <div
        :id="runBodyId(run)"
        class="grid transition-[grid-template-rows] duration-150 ease-out"
        :class="isOpen(run) ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'"
        :aria-hidden="!isOpen(run)"
      >
        <div class="overflow-hidden min-h-0">
          <!-- existing affix row + (members table | empty fallback) unchanged -->
        </div>
      </div>
```

Notes:
- `aria-hidden` replaces the implicit hide that `v-show` provided.
- The existing `aria-controls` on the toggle button still points at the same `id` — no change needed there.
- `min-h-0` on the inner wrapper is required so the grid row can collapse to 0; without it the inner content's intrinsic height holds the row open.
- `mt-3` only applies when open, so collapsed cards have no dangling margin under the header.

- [ ] **Step 2: Verify build still passes**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npm run build
```

Expected: PASS. Tailwind v3 supports arbitrary `transition-[…]` values and `grid-rows-[…]` out of the box; if either class compiles to nothing, fall back to step 3.

- [ ] **Step 3: Smoke-check the animation**

Reload the All Runs view. Click a row. Expected: the body slides open over ~150ms and slides closed on toggle. The chevron rotates concurrently. There should be no flash of un-clipped content (i.e. the table doesn't briefly appear at full height before the wrapper's grid-row catches up).

If the animation looks janky against `ma-card` padding (e.g. content visibly clips into the card border during the transition), fall back to a no-animation version:

- Replace the wrapper with the original `v-show` form from Task 1 and skip the rest of this task.
- Note the fallback in the commit body.

- [ ] **Step 4: Commit**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend add src/components/character/pve/MythicPlusAllRuns.vue
git -C /home/dakiman/projects/guild-service-v2/frontend commit -m "feat(fe): animate M+ run card expand/collapse with grid-rows trick

Pure-CSS height transition via grid-template-rows 0fr ↔ 1fr on a wrapper
around the body. ~150ms ease-out, no JS measurement, no new dep. Chevron
rotation already animates from the previous commit; the body now matches."
```

---

## Task 5: Update `frontend/CLAUDE.md` Dungeons-tab section

Keep CLAUDE.md in sync with the new behavior so future work doesn't accidentally re-render every table.

**Files:**
- Modify: `frontend/CLAUDE.md` — the "Dungeons tab" section.

- [ ] **Step 1: Locate the Dungeons-tab section**

Run:

```bash
grep -n "Dungeons tab" /home/dakiman/projects/guild-service-v2/frontend/CLAUDE.md
```

Expected: one hit. The section currently reads (single paragraph):

> `pages/character/CharacterDungeonsTab.vue` is a leaf route … local-state DaisyUI `ma-tab`s — NOT routes (same pattern the old `MythicPlusSection` used; just relocated into the page).

- [ ] **Step 2: Append a sentence about collapsible All Runs**

At the end of the existing Dungeons-tab paragraph (just before the next section heading), append:

```
`MythicPlusAllRuns.vue` renders one card per run with a click-to-expand header (chevron + dungeon name + keystone pill + on-time chip + duration + timestamp + 5 spec/ilvl member pills); the affix row and members table live in a `v-show`-gated body animated via `grid-template-rows: 0fr ↔ 1fr`. Expanded state is component-local (`Set<runId>`) — not persisted across navigations.
```

- [ ] **Step 3: Verify the addition reads coherently with the surrounding doc**

Read the updated section start-to-finish in your editor. It should describe the page, then the headline, then the view-switcher, then the new All-Runs collapse behavior. No duplicated facts.

- [ ] **Step 4: Commit**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend add CLAUDE.md
git -C /home/dakiman/projects/guild-service-v2/frontend commit -m "docs(fe): document collapsible MythicPlusAllRuns in CLAUDE.md"
```

---

## Final Verification

- [ ] **Step 1: Full build**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npm run build
```

Expected: PASS, dist/ regenerated.

- [ ] **Step 2: Cypress smoke (optional but recommended if dev server is up)**

```bash
cd /home/dakiman/projects/guild-service-v2/frontend && npx cypress run --spec cypress/e2e/smoke.cy.ts
```

Expected: existing smoke spec still passes (it doesn't assert on the M+ table, but it routes through the character page, so a runtime error on the dungeons tab will fail it).

- [ ] **Step 3: End-to-end manual check on the test character**

Load `http://100.82.124.39:8092/character/eu/the-maelstrom/melaniya/dungeons` (or `localhost:5173/...` if running `npm run dev`). Switch to **All Runs**. Confirm in one pass:

1. Every run renders collapsed (one row, no table visible).
2. Each row shows: chevron, dungeon name, `+N` pill, on-time/over-time chip, duration, date, then up to 5 member pills (spec icon + ilvl).
3. Hovering a member pill shows a "Name • Realm" tooltip.
4. Clicking the row (anywhere, including a member pill) toggles the body.
5. Expanded body shows affix icons (if any) above the existing members table, exactly as the old layout did.
6. Re-collapsing then re-expanding is instant.
7. On narrow viewport (~600px wide), header content wraps without overflow; member pills wrap to a second line.
8. Best-per-Dungeon view is unchanged.

- [ ] **Step 4: Push the branch (if pushing)**

```bash
git -C /home/dakiman/projects/guild-service-v2/frontend push -u origin feature/dungeon-runs-collapsible
```

(Skip if the user wants to review locally before pushing.)
