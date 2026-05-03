# Class & Spec Icons — Design

Date: 2026-05-03
Scope: frontend only (no BE changes)

## Goal

Replace the colored-letter `ClassIcon` placeholder with real WoW class icons, and introduce a matching `SpecIcon` for the modern 39 specs. Apply to a minimum surface set first; broader rollout (e.g. roster spec column) tracked separately.

## Source

raider.io serves both icon families as CSS sprite sheets from its CDN. We download the sheets once and vendor them into `frontend/src/assets/wow/` so we are not dependent on raider.io's CDN at runtime.

- Classes sprite: `https://cdn.raiderio.net/assets/img/classes_sprite-10eae88147999f6eb57d.png` — 256×256 PNG, 4×4 grid of 64×64 tiles, 13 classes.
- Specs sprite: `https://cdn.raiderio.net/assets/img/specs_sprite-865f2e6ad5cf51fd4951.png` — 448×384 PNG, 7×6 grid of 64×64 tiles, 40 specs (including 1 unused legacy/preview tile, `demon-hunter_devourer`).

Tile coordinates were extracted directly from raider.io's `mainStyles-*.css` `.class_<slug>` and `.spec_<class>_<spec>` rules. Slugs do not need to live in our app — we map our integer ids straight to `[x, y]` pixel offsets at build time.

## Components

### `frontend/src/components/wow/ClassIcon.vue` (rewrite)

Keep the existing public API: `defineProps<{ classId: number; size?: number }>()`. `size` defaults to **24**.

Renders a `<span>` with the classes sprite as `background-image` and the precomputed offset as `background-position`. Both `background-position` and `background-size` are scaled from the 64px source by `size / 64` so the rendered tile is sharp.

```html
<span
  class="inline-block align-middle"
  :style="{
    width: `${size}px`,
    height: `${size}px`,
    backgroundImage: `url(${classesSprite})`,
    backgroundSize: `${(256 * size) / 64}px ${(256 * size) / 64}px`,
    backgroundPosition: `${(pos[0] * size) / 64}px ${(pos[1] * size) / 64}px`,
  }"
  :title="name"
/>
```

Fallback when `classId` is unknown (shouldn't happen with current data, but guard cheaply): render the existing letter-badge using a tiny inline implementation. Keeps callers from blowing up if BE ever returns an unmapped id.

### `frontend/src/components/wow/SpecIcon.vue` (new)

Same shape as `ClassIcon` with `defineProps<{ specId: number | null; size?: number; fallbackClassId?: number | null }>()`. `size` defaults to **24**.

Behaviour:
- `specId` known → render spec tile.
- `specId === null` and `fallbackClassId` provided → render that class icon.
- Neither → render nothing (no placeholder, no layout shift if used inline with text).

The fallback path covers the known case where BE has class but no resolved spec yet (fresh-character sync edge case).

### `frontend/src/utils/wowIcons.ts` (new)

Single source of truth for the offset tables and display names. Imports the two sprite assets so Vite tracks them, and re-exports both image URLs so the components don't each do their own import (keeps the bundler graph tidy and asset names identical across components).

```ts
import classesSprite from '@/assets/wow/classes-sprite.png'
import specsSprite from '@/assets/wow/specs-sprite.png'

export { classesSprite, specsSprite }

export const CLASS_SPRITE_SIZE = 256 // both width and height of the source PNG
export const SPECS_SPRITE_W = 448
export const SPECS_SPRITE_H = 384
export const TILE_SIZE = 64

// id -> [x, y] in pixels at native 64px tile size (negative = sprite offset convention)
export const CLASS_ICON_POS: Record<number, readonly [number, number]> = {
  1: [0, -192],   // Warrior
  2: [-64, -128], // Paladin
  3: [-128, 0],   // Hunter
  4: [-192, 0],   // Rogue
  5: [-128, -128],// Priest
  6: [0, 0],      // Death Knight
  7: [-192, -64], // Shaman
  8: [-128, -64], // Mage
  9: [-192, -128],// Warlock
  10:[0, -128],   // Monk
  11:[0, -64],    // Druid
  12:[-64, 0],    // Demon Hunter
  13:[-64, -64],  // Evoker
}

export const SPEC_ICON_POS: Record<number, readonly [number, number]> = {
  // Warrior
  71: [-384, -128], 72: [-384, -192], 73: [-384, -256],
  // Paladin
  65: [-128, -256], 66: [-192, -256], 70: [-256, -256],
  // Hunter
  253: [-64, -192], 254: [-128, -192], 255: [-192, -192],
  // Rogue
  259: [-320, -192], 260: [0, -320], 261: [-64, -320],
  // Priest
  256: [-320, 0], 257: [-320, -64], 258: [-320, -128],
  // Death Knight
  250: [0, 0], 251: [-64, 0], 252: [0, -64],
  // Shaman
  262: [-128, -320], 263: [-192, -320], 264: [-256, -320],
  // Mage
  62: [-256, 0], 63: [-256, -64], 64: [-256, -128],
  // Warlock
  265: [-320, -320], 266: [-384, 0], 267: [-384, -64],
  // Monk
  268: [-256, -192], 269: [0, -256], 270: [-64, -256],
  // Druid
  102: [0, -128], 103: [-64, -128], 104: [-128, -128], 105: [-192, 0],
  // Demon Hunter
  577: [-128, 0], 581: [-128, -64],
  // Evoker
  1467: [-192, -128], 1468: [0, -192], 1473: [-192, -64],
}

export const SPEC_NAMES: Record<number, string> = {
  71: 'Arms', 72: 'Fury', 73: 'Protection',
  65: 'Holy', 66: 'Protection', 70: 'Retribution',
  253: 'Beast Mastery', 254: 'Marksmanship', 255: 'Survival',
  259: 'Assassination', 260: 'Outlaw', 261: 'Subtlety',
  256: 'Discipline', 257: 'Holy', 258: 'Shadow',
  250: 'Blood', 251: 'Frost', 252: 'Unholy',
  262: 'Elemental', 263: 'Enhancement', 264: 'Restoration',
  62: 'Arcane', 63: 'Fire', 64: 'Frost',
  265: 'Affliction', 266: 'Demonology', 267: 'Destruction',
  268: 'Brewmaster', 269: 'Mistweaver', 270: 'Windwalker',
  102: 'Balance', 103: 'Feral', 104: 'Guardian', 105: 'Restoration',
  577: 'Havoc', 581: 'Vengeance',
  1467: 'Devastation', 1468: 'Preservation', 1473: 'Augmentation',
}
```

`CLASSES` (id → class name) and `SPEC_TO_CLASS` already live in `utils/wowConstants.ts` and stay there. `SpecIcon`'s `title` is built as `${CLASSES[SPEC_TO_CLASS[id]]} — ${SPEC_NAMES[id]}` (e.g. "Mage — Frost").

## Surface changes

### `CharacterHeader.vue`

Current:
```html
<span v-if="character.active_specialization" class="badge badge-outline">
  {{ character.active_specialization }}
</span>
```

After:
```html
<span v-if="character.active_specialization" class="inline-flex items-center gap-1.5">
  <SpecIcon
    :spec-id="character.active_specialization_id"
    :fallback-class-id="character.class_id"
    :size="20"
  />
  <span>{{ character.active_specialization }}</span>
</span>
```

The badge wrapper goes away — the icon + name reads better without the outline pill, matching raider.io's treatment. If feedback says we want the pill back we can add it without touching the icon.

### `MythicPlusAllRuns.vue`

Party-member rows currently:
```html
<td class="px-2 py-1 text-ma-muted/70">{{ member.spec_name }}</td>
```

After:
```html
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
```

`DungeonRunMember` exposes `spec_id` and `spec_name` but **not** `class_id` (verified in `types/character.ts:182-191`). Class id is derived from `spec_id` via `SPEC_TO_CLASS` — the same pattern this file already uses elsewhere (no new import). When `spec_id` is null we have no class signal either, so the icon renders nothing and the row falls back to text-only `spec_name` (which is the empty string in that case anyway).

### Existing `ClassIcon` callers

`HomePage.vue` (×2), `ProfilePage.vue`, `RosterTable.vue` — no markup changes. Component upgrade is transparent: same 24px footprint, same prop, just renders a real icon instead of a colored letter. RosterTable's adjacent `{{ className(m.class_id) }}` text label stays.

## Assets

Two PNGs vendored to `frontend/src/assets/wow/`:
- `classes-sprite.png` (256×256, ~120KB)
- `specs-sprite.png` (448×384, ~340KB)

Total ~460KB committed once. Vite hashes them, browser caches them long-term, and they won't change unless Blizzard ships a new spec.

Acquisition step is a one-time `curl` from raider.io's CDN — documented in the implementation plan, not done by app code.

## Out of scope (deferred)

- Adding a spec column to `RosterTable` — explicit follow-up after this lands.
- Class color theming based on icon (e.g. tinting borders to match class) — separate concern.
- Talent-tree spec headers (already use a different icon convention via Wowhead spell icons) — leave alone.
- Migrating to Blizzard's media API for icons — vendor-sprite path is simpler and the icons are visually identical.

## Testing

- Visual smoke test in browser at `100.82.124.39:8092`: load `/character/eu/the-maelstrom/melaniya`, confirm spec icon next to "Frost" (or whichever spec) in header, and on each M+ party-member row.
- Load `/` (HomePage) and any guild page with roster, confirm class icons render without layout shift versus current letter-badges.
- `npm run build` must pass (vue-tsc) — types only, no new tests required.
