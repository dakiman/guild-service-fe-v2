# Profile Page Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the character profile page with 6 visual/UX improvements: hero banner header, gear audit indicators, ilvl context bar, spec icon badge on avatar, "last seen" timestamp, and copy-shareable link button.

**Architecture:** All changes are frontend-only (no BE changes). The hero banner replaces the existing `CharacterHeader` card with a full-width banner using the character's inset render as a blurred backdrop. The remaining 5 features are small additions to existing components. A new `gearAudit.ts` utility handles enchant/gem slot validation logic, keeping it out of component code.

**Tech Stack:** Vue 3 (`<script setup>` + TS), Tailwind + DaisyUI, lucide-vue-next icons, existing `ma-*` CSS custom properties.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/components/character/CharacterHeader.vue` | Hero banner layout, spec badge on avatar, "last seen" timestamp, share link button |
| Modify | `src/components/character/CharacterStatPills.vue` | Add ilvl context bar below the ilvl pill |
| Modify | `src/components/character/EquipmentSlot.vue` | Render gear audit warning icon |
| Create | `src/utils/gearAudit.ts` | Pure functions: `ENCHANTABLE_SLOTS`, `auditItem()`, `GearAuditResult` type |
| Modify | `src/style.css` | Add `.ma-hero-banner` class and `.ma-ilvl-bar` styling |
| Modify | `src/pages/CharacterDetailLayout.vue` | Pass `synced_at` to `CharacterHeader` (already available) |

---

### Task 1: Hero Banner — CSS Foundation

**Files:**
- Modify: `src/style.css:32-58` (add new classes in `@layer components`)

- [ ] **Step 1: Add `.ma-hero-banner` and `.ma-ilvl-bar` classes to `style.css`**

Insert after the `.ma-card-inner` block (after line 58):

```css
  /* Hero banner — character inset render as blurred backdrop. */
  .ma-hero-banner {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(var(--ma-border) / 0.3);
    box-shadow:
      0 4px 30px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(var(--ma-violet) / 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  .ma-hero-banner__bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center 20%;
    filter: blur(20px) brightness(0.35);
    transform: scale(1.15);
  }
  .ma-hero-banner__accent {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
  }
  .ma-hero-banner__content {
    position: relative;
    z-index: 1;
  }

  /* iLvl context bar — thin progress indicator. */
  .ma-ilvl-bar {
    height: 4px;
    border-radius: 9999px;
    background-color: rgba(var(--ma-card-inner) / 0.6);
  }
  .ma-ilvl-bar__fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, rgba(var(--ma-violet) / 0.8), rgb(var(--ma-gold)));
    transition: width 0.6s ease-out;
  }
```

- [ ] **Step 2: Verify build passes**

Run: `cd /home/dakiman/projects/guild-service-v2/frontend && npx vue-tsc -b --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat(profile): add hero banner and ilvl bar CSS classes"
```

---

### Task 2: Gear Audit Utility

**Files:**
- Create: `src/utils/gearAudit.ts`

- [ ] **Step 1: Create `src/utils/gearAudit.ts`**

```ts
import type { EquipmentItem } from '@/types/character'
import type { Slot } from '@/types/wow'

export interface GearAuditResult {
  missingEnchant: boolean
  missingGems: boolean
}

const ENCHANTABLE_SLOTS: ReadonlySet<Slot> = new Set<Slot>([
  'back',
  'chest',
  'wrist',
  'legs',
  'feet',
  'finger_1',
  'finger_2',
  'main_hand',
])

const GEMABLE_SLOTS: ReadonlySet<Slot> = new Set<Slot>([
  'head',
  'neck',
  'wrist',
  'waist',
  'finger_1',
  'finger_2',
])

export function auditItem(item: EquipmentItem): GearAuditResult {
  return {
    missingEnchant: ENCHANTABLE_SLOTS.has(item.slot) && item.enchantments.length === 0,
    missingGems: GEMABLE_SLOTS.has(item.slot) && item.gems.length === 0,
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd /home/dakiman/projects/guild-service-v2/frontend && npx vue-tsc -b --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/gearAudit.ts
git commit -m "feat(profile): add gear audit utility for enchant/gem checks"
```

---

### Task 3: Gear Audit Indicators on Equipment Slots

**Files:**
- Modify: `src/components/character/EquipmentSlot.vue`

This task adds a small warning icon next to gear items that are missing enchants or gems. The icon uses `lucide-vue-next`'s `AlertTriangle` and renders as a tiny amber triangle with a tooltip.

- [ ] **Step 1: Add audit import and computed to `EquipmentSlot.vue`**

In the `<script setup>` section, add the import after the existing imports:

```ts
import { AlertTriangle } from 'lucide-vue-next'
import { auditItem, type GearAuditResult } from '@/utils/gearAudit'
```

Add a computed after the existing `qualityClass` computed:

```ts
const audit = computed<GearAuditResult | null>(() =>
  props.item ? auditItem(props.item) : null,
)

const auditTooltip = computed(() => {
  if (!audit.value) return ''
  const parts: string[] = []
  if (audit.value.missingEnchant) parts.push('Missing enchant')
  if (audit.value.missingGems) parts.push('Missing gem')
  return parts.join(' · ')
})

const hasAuditWarning = computed(() =>
  audit.value ? audit.value.missingEnchant || audit.value.missingGems : false,
)
```

- [ ] **Step 2: Add the warning icon to the template**

In the template, find the `item_level` span (line 38-40):

```html
      <span class="text-xs font-mono text-ma-gold shrink-0">
        {{ item.item_level }}
      </span>
```

Replace it with:

```html
      <span class="flex items-center gap-1.5 shrink-0">
        <AlertTriangle
          v-if="hasAuditWarning"
          class="w-3.5 h-3.5 text-amber-400"
          :title="auditTooltip"
        />
        <span class="text-xs font-mono text-ma-gold">
          {{ item.item_level }}
        </span>
      </span>
```

- [ ] **Step 3: Verify build passes**

Run: `cd /home/dakiman/projects/guild-service-v2/frontend && npx vue-tsc -b --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/character/EquipmentSlot.vue
git commit -m "feat(profile): add gear audit warning icons on equipment slots"
```

---

### Task 4: iLvl Context Bar

**Files:**
- Modify: `src/components/character/CharacterStatPills.vue`

Adds a thin progress bar below the ilvl stat pill showing `equipped / tier_max`. The tier max is hardcoded per season (Midnight Season 1 = 658 Mythic cap). This is a simple constant that gets bumped when a new tier drops.

- [ ] **Step 1: Add tier max constant and computed**

In `CharacterStatPills.vue`, add after the existing imports:

```ts
const CURRENT_TIER_MAX_ILVL = 658
```

Add a computed after `raidProgressionLabel`:

```ts
const ilvlPercent = computed(() => {
  const ilvl = props.character.equipped_item_level
  if (!ilvl || ilvl <= 0) return 0
  return Math.min(100, Math.round((ilvl / CURRENT_TIER_MAX_ILVL) * 100))
})
```

- [ ] **Step 2: Add the context bar below the ilvl pill**

Replace the entire ilvl `<RouterLink>` block (the first pill, lines 3-11):

```html
    <div class="flex flex-col gap-1">
      <RouterLink
        :to="summaryRoute"
        class="ma-stat-pill ma-stat-pill-link"
        title="Equipment & gear"
      >
        <Shield class="w-4 h-4 text-ma-gold" />
        <span class="text-[10px] uppercase tracking-wider text-ma-muted/70">iLvl</span>
        <span class="font-bold text-ma-gold tabular-nums">{{ character.equipped_item_level }}</span>
        <span class="text-[10px] text-ma-muted/50 tabular-nums">/ {{ CURRENT_TIER_MAX_ILVL }}</span>
      </RouterLink>
      <div class="ma-ilvl-bar mx-1">
        <div class="ma-ilvl-bar__fill" :style="{ width: `${ilvlPercent}%` }" />
      </div>
    </div>
```

- [ ] **Step 3: Verify build passes**

Run: `cd /home/dakiman/projects/guild-service-v2/frontend && npx vue-tsc -b --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/character/CharacterStatPills.vue
git commit -m "feat(profile): add ilvl context bar showing equipped vs tier max"
```

---

### Task 5: Hero Banner Header

**Files:**
- Modify: `src/components/character/CharacterHeader.vue`
- Modify: `src/pages/CharacterDetailLayout.vue`

This is the biggest visual change. The current flat `card bg-base-200` is replaced with `.ma-hero-banner` that uses the character's inset render as a blurred/darkened backdrop, with a class-colored accent bar along the bottom edge. The avatar gets a spec icon badge overlay. A "last seen" relative timestamp and share link button are added.

- [ ] **Step 1: Update `CharacterHeader.vue` props**

Replace the existing props definition:

```ts
const props = defineProps<{ character: CharacterResource; achievementsEnabled?: boolean }>()
```

With:

```ts
const props = defineProps<{
  character: CharacterResource
  achievementsEnabled?: boolean
  syncedAt?: string | null
}>()
```

- [ ] **Step 2: Add new imports**

Add to the existing imports in `CharacterHeader.vue`:

```ts
import { Share2, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
```

- [ ] **Step 3: Add computed values for new features**

Add after the existing `guildRoute` computed:

```ts
const relativeTime = computed(() => {
  if (!props.syncedAt) return null
  const then = new Date(props.syncedAt).getTime()
  if (Number.isNaN(then)) return null
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
})

async function onShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Profile link copied')
  } catch {
    toast.error('Could not copy link')
  }
}
```

- [ ] **Step 4: Replace the template**

Replace the entire `<template>` of `CharacterHeader.vue` with:

```html
<template>
  <div class="ma-hero-banner">
    <div
      v-if="character.media?.inset"
      class="ma-hero-banner__bg"
      :style="{ backgroundImage: `url(${character.media.inset})` }"
    />
    <div
      class="ma-hero-banner__accent"
      :style="{ backgroundColor: classColor }"
    />

    <div class="ma-hero-banner__content p-6 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="relative shrink-0 self-start">
        <div class="w-14 h-14 sm:w-24 sm:h-24 rounded-lg bg-base-300 overflow-hidden ring-2 ring-white/10">
          <img
            v-if="character.media?.avatar"
            :src="character.media.avatar"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
        </div>
        <SpecIcon
          v-if="character.active_specialization_id"
          :spec-id="character.active_specialization_id"
          :fallback-class-id="character.class_id"
          :size="22"
          class="absolute -bottom-1 -right-1 rounded-full ring-2 ring-black/60 bg-base-300"
        />
      </div>

      <div class="flex flex-col gap-2 flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold text-white drop-shadow-md">{{ displayName }}</h1>
          <FactionBadge :faction="character.faction" />
          <button
            type="button"
            class="p-1.5 rounded-md text-ma-muted/60 hover:text-ma-gold transition-colors"
            title="Copy profile link"
            @click="onShareLink"
          >
            <Share2 class="w-4 h-4" />
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="text-white/70">
            {{ displayRealm }} ({{ character.region.toUpperCase() }})
            <template v-if="character.guild && guildRoute">
              &middot;
              <RouterLink
                :to="guildRoute"
                class="text-ma-gold hover:underline"
              >
                &lt;{{ displayGuildName(character.guild.name, character.guild.display_name) }}&gt;
              </RouterLink>
            </template>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="text-white/70">Level {{ character.level }}</span>
          <span class="text-white/70">{{ raceName }}</span>
          <span class="font-semibold" :style="{ color: classColor }">
            {{ className }}
          </span>
          <span v-if="character.active_specialization" class="inline-flex items-center gap-1.5 text-white/90">
            <SpecIcon
              :spec-id="character.active_specialization_id"
              :fallback-class-id="character.class_id"
              :size="20"
            />
            <span>{{ character.active_specialization }}</span>
          </span>
          <span v-if="relativeTime" class="inline-flex items-center gap-1 text-xs text-white/40">
            <Clock class="w-3 h-3" />
            {{ relativeTime }}
          </span>
        </div>

        <CharacterStatPills :character="character" :achievements-enabled="achievementsEnabled" class="mt-1" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Pass `syncedAt` in `CharacterDetailLayout.vue`**

In `CharacterDetailLayout.vue`, find the `<CharacterHeader>` usage (line 10):

```html
      <CharacterHeader :character="character" :achievements-enabled="meta?.feature_flags?.achievements !== false" />
```

Replace with:

```html
      <CharacterHeader
        :character="character"
        :achievements-enabled="meta?.feature_flags?.achievements !== false"
        :synced-at="character.synced_at"
      />
```

- [ ] **Step 6: Verify build passes**

Run: `cd /home/dakiman/projects/guild-service-v2/frontend && npx vue-tsc -b --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/character/CharacterHeader.vue src/pages/CharacterDetailLayout.vue
git commit -m "feat(profile): hero banner header with spec badge, last-seen, and share link"
```

---

### Task 6: Visual Smoke Test

**Files:** none (read-only verification)

This task verifies all 6 features render correctly by checking a real character profile in the browser.

- [ ] **Step 1: Build and verify no type errors**

Run: `cd /home/dakiman/projects/guild-service-v2/frontend && npm run build`
Expected: build succeeds with no errors

- [ ] **Step 2: Open the profile in the browser**

Navigate to `http://100.82.124.39:8092/characters/eu/the-maelstrom/melaniya/summary`

Verify:
1. **Hero banner**: inset render visible as blurred backdrop behind header content, class-colored accent bar at bottom edge
2. **Spec badge**: small spec icon overlaid at bottom-right corner of the avatar
3. **"Last seen"**: clock icon + relative timestamp (e.g., "3h ago") in the header details row
4. **Share link**: small share icon next to character name, clicking copies URL and shows toast
5. **iLvl context bar**: thin progress bar below the iLvl stat pill showing ratio to 658
6. **Gear audit**: amber warning triangles on equipment slots missing enchants or gems (check rings, weapon for enchants; check head/neck for gems)

- [ ] **Step 3: Check mobile layout**

Resize browser to ~375px width. Verify the hero banner stacks gracefully (avatar above text), no horizontal overflow.

- [ ] **Step 4: Check empty/edge states**

Navigate to a character with minimal data (no guild, no M+ rating) to confirm nothing crashes on missing fields. The hero banner should still render (dark gradient fallback when no inset render).
