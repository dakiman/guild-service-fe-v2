# Design Implementation Spec: Unified Dark Leather & Gold Theme

## Status: IMPLEMENTED (2026-05-05)

All phases complete. Key renames applied during implementation:
- CSS variable prefix: `--ma-*` → `--wsa-*`
- Tailwind color namespace: `ma.*` → `wsa.*`
- Component class prefix: `.ma-*` → `.wsa-*`
- DaisyUI theme: `masked-armory` → `dark-leather`
- `stats-theme.css` deleted — classes absorbed into `style.css`

**Note:** The body below uses the original `ma-*` naming from the planning phase. The implemented code uses `wsa-*` everywhere.

---

## 1. Problem Statement

The app currently has **three competing visual systems**:

| System | Palette | Used Where | CSS Infrastructure |
|--------|---------|------------|-------------------|
| **DaisyUI "masked-armory"** | Violet/purple (`rgb(139,92,246)`) | Nav, footer, home, auth, guild search, profile, forms, badges, tables | DaisyUI theme tokens (`bg-base-*`, `btn-*`, `card`, etc.) |
| **Masked Armory (`ma-*`)** | Dark violet + amber | Character detail pages (header, tabs, equipment, stats, PvP, raids, dungeons, reputations, talents) | CSS variables in `style.css` + Tailwind `ma.*` aliases |
| **Stats theme (`stats-*`)** | Dark leather + gold | Guild stats section, character search, all `stats/` components (heatmap, leaderboard, charts) | Hardcoded hex in `stats-theme.css` |

**Result:** Visual incoherence — navigating from guild stats (warm leather) to character detail (cool violet) to home page (generic dark) feels like three different apps.

**Target:** Unify everything under the **Dark Leather & Gold** palette documented in `design-guide.md`.

---

## 2. Strategy: Recolor, Don't Rewrite

The `ma-*` CSS variable infrastructure is well-architected (single source of truth in `:root`, Tailwind aliases, component classes). Rather than deleting it and starting over:

1. **Recolor** `ma-*` CSS variables from violet → leather/gold values
2. **Recolor** the DaisyUI `masked-armory` theme to match
3. **Absorb** `stats-theme.css` classes into the `ma-*` layer (eliminate the second system)
4. **Migrate** remaining raw DaisyUI component classes (`btn`, `card`, `badge`, `navbar`, etc.) to themed equivalents
5. **Fix** UX/visibility issues surfaced during audit

This means every component using `ma-card`, `text-ma-gold`, `bg-ma-bg`, etc. automatically gets the new palette with zero template changes.

---

## 3. Color Token Mapping

### 3.1 CSS Variable Recolor (`style.css :root`)

| Variable | Current (violet) | New (leather/gold) | Design guide ref |
|----------|-------------------|---------------------|------------------|
| `--ma-bg` | `3 1 8` | `26 20 16` (`#1a1410`) | Page background |
| `--ma-card` | `26 15 46` | `42 32 24` (`#2a2018`) | Card gradient end |
| `--ma-card-2` | `18 11 30` | `26 20 16` (`#1a1410`) | Card gradient start |
| `--ma-card-inner` | `45 27 78` | `35 27 19` (midpoint) | Inner row card |
| `--ma-border` | `139 92 246` | `92 74 50` (`#5c4a32`) | Card border |
| `--ma-text` | `241 232 255` | `224 208 176` (`#e0d0b0`) | Primary text |
| `--ma-text-muted` | `241 247 254` | `170 136 85` (`#aa8855`) | Label text (base for alpha) |
| `--ma-text-disabled` | `217 237 255` | `102 85 51` (`#665533`) | Muted/empty text |
| `--ma-heading` | `186 167 255` | `255 204 136` (`#ffcc88`) | Card titles, gold accent |
| `--ma-gold` | `255 217 85` | `255 204 136` (`#ffcc88`) | Gold accent (same token) |
| `--ma-violet` | `139 92 246` | `170 136 85` (`#aa8855`) | Accent (was violet, now warm gold) |
| `--ma-violet-soft` | `167 139 250` | `204 170 102` (lighter gold) | Soft accent variant |
| `--ma-amber` | `253 230 138` | `255 204 136` (`#ffcc88`) | Amber → gold (merge) |

**Rename consideration:** `--ma-violet` → `--ma-accent` in a follow-up rename pass. Not blocking — the values will work regardless of the variable name.

### 3.2 DaisyUI Theme Recolor (`tailwind.config.js`)

```js
'masked-armory': {
  'color-scheme': 'dark',
  primary:           'rgb(170 136 85)',    // #aa8855 — warm gold accent
  'primary-content': 'rgb(224 208 176)',   // #e0d0b0 — readable on gold bg
  secondary:         'rgb(255 204 136)',   // #ffcc88 — gold
  'secondary-content': 'rgb(26 20 16)',    // #1a1410
  accent:            'rgb(255 136 68)',    // #ff8844 — M+ orange
  'accent-content':  'rgb(26 20 16)',
  neutral:           'rgb(42 32 24)',      // #2a2018 — card bg
  'neutral-content': 'rgb(224 208 176)',   // #e0d0b0
  'base-100':        'rgb(26 20 16)',      // #1a1410 — page bg
  'base-200':        'rgb(35 27 19)',      // mid leather
  'base-300':        'rgb(42 32 24)',      // #2a2018
  'base-content':    'rgb(224 208 176)',   // #e0d0b0
  info:              'rgb(136 204 255)',   // #88ccff — iLvl blue
  success:           'rgb(39 204 78)',     // keep green
  warning:           'rgb(255 204 136)',   // #ffcc88
  error:             'rgb(255 68 68)',     // #ff4444
}
```

### 3.3 Stat Colors (unchanged)

WoW stat colors (`--stat-health`, `--stat-crit`, etc.) and WoW class colors (`CLASS_COLORS`) are domain-specific and stay as-is.

### 3.4 Faction Colors (unchanged)

Horde red (`#ff4444`) and Alliance blue (`#3399ff`) are canonical WoW colors — no change.

---

## 4. CSS Consolidation

### 4.1 Merge stats-theme.css into style.css

Delete `stats-theme.css`. Redefine the classes in `@layer components` in `style.css`, backed by CSS variables:

```css
/* Replace hardcoded hex with variable-backed equivalents */
.stats-card {
  background: linear-gradient(135deg, rgb(var(--ma-card-2)), rgb(var(--ma-card)));
  border: 2px solid rgb(var(--ma-border));
  border-radius: 0.5rem;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  padding: 1.25rem;
}

.stats-card-title {
  color: rgb(var(--ma-heading));
  font-size: 15px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.stats-label {
  color: rgb(var(--ma-text-muted));
  font-size: 11px;
}

.stats-value {
  color: rgb(var(--ma-text));
  font-weight: 700;
}

.stats-muted {
  color: rgb(var(--ma-text-disabled));
}
```

This way `stats-*` and `ma-*` classes share the same token source. Existing templates don't need changes.

### 4.2 Update ma-card to match design guide

The design guide specifies a different visual treatment than current ma-card:
- **Border:** `2px solid` (currently `1px solid`) 
- **Border-radius:** `0.5rem` (currently `12px` = `0.75rem`)
- **Box-shadow:** `inset 0 0 20px rgba(0,0,0,0.5)` (currently external shadows + violet glow)
- **No violet glow** — the warm palette doesn't have glow effects on standard cards

```css
.ma-card {
  background-image: linear-gradient(
    135deg,
    rgb(var(--ma-card-2)) 0%,
    rgb(var(--ma-card)) 100%
  );
  border: 2px solid rgb(var(--ma-border));
  border-radius: 0.5rem;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}
```

### 4.3 Update ma-card-inner

```css
.ma-card-inner {
  background: rgba(0, 0, 0, 0.25);  /* design guide: row bg inside cards */
  border: 1px solid rgba(var(--ma-border) / 0.2);
  border-radius: 8px;
}
```

### 4.4 Update ma-hero-banner

Keep the hero banner structure but recolor:
- Border: `2px solid rgb(var(--ma-border))` 
- Box-shadow: inset leather shadow (no violet glow)
- The blurred character render backdrop still works with warm tones

### 4.5 Update ma-tab

```css
.ma-tab:hover {
  background-color: rgba(var(--ma-border) / 0.15);  /* was violet */
}
.ma-tab--active {
  background-color: rgba(170, 136, 85, 0.15);  /* warm gold fill */
  border-color: rgb(var(--ma-border));
  color: rgb(var(--ma-heading));  /* gold text */
}
```

### 4.6 Update ma-text-heading

```css
.ma-text-heading {
  color: rgb(var(--ma-heading));  /* now #ffcc88 gold */
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  /* Remove Cinzel font — it was specific to the violet aesthetic.
     Use system default or keep if you prefer the decorative look. */
}
```

**Decision needed:** Keep or drop the Cinzel display font? It gives a medieval feel that fits the leather theme, but it's a Google Font dependency. Recommendation: **keep it** — it reinforces the fantasy RPG identity.

### 4.7 Update ma-wordmark

```css
.ma-wordmark {
  background: linear-gradient(135deg, #ffcc88 0%, #aa8855 100%);
  /* gold → dark gold gradient instead of amber → violet */
  ...
}
```

### 4.8 Update ma-stat-pill

```css
.ma-stat-pill {
  border: 1px solid rgba(var(--ma-border) / 0.3);
  background-color: rgba(var(--ma-card) / 0.5);
  /* automatic recolor via variables */
}
```

---

## 5. Component Migration Plan

### 5.1 Phase 1: Foundation (no visual changes yet)

| Task | File | What |
|------|------|------|
| Recolor CSS vars | `src/style.css` | Update `:root` values per section 3.1 |
| Recolor DaisyUI theme | `tailwind.config.js` | Update `masked-armory` per section 3.2 |
| Merge stats-theme | `src/style.css` + delete `src/assets/stats-theme.css` | Move classes to `@layer components`, variable-backed |
| Update ma-card | `src/style.css` | Per section 4.2 |
| Update ma-card-inner | `src/style.css` | Per section 4.3 |
| Update ma-hero-banner | `src/style.css` | Recolor border/shadow |
| Update ma-tab | `src/style.css` | Per section 4.5 |
| Update ma-text-heading | `src/style.css` | Per section 4.6 |
| Update ma-wordmark | `src/style.css` | Per section 4.7 |
| Update Tailwind safelist | `tailwind.config.js` | Remove violet/amber patterns if unused |

**After Phase 1:** Every page using `ma-*` or `stats-*` classes automatically shows the leather/gold palette. Character pages, guild stats, search — all recolored.

### 5.2 Phase 2: App Shell

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **App.vue** | `bg-base-100 text-base-content` | Keep (DaisyUI theme recolor handles it) | Already correct after Phase 1 |
| **AppNav.vue** | `navbar bg-base-200` + `btn btn-ghost` | Themed nav per design guide 10.4 | See section 6.1 |
| **AppFooter.vue** | `footer bg-base-200` | Themed footer | See section 6.2 |
| **Mobile menu** | None (links hidden on mobile) | Add hamburger drawer | See section 6.3 |

### 5.3 Phase 3: Page Migrations

| Page | Current State | Work Required |
|------|---------------|---------------|
| **HomePage** | DaisyUI `card bg-base-200` | Replace cards with `stats-card` or `ma-card`; restyle with themed colors |
| **LoginPage** | DaisyUI `card` + `form-control` + `btn-primary` | Themed form per 10.6, themed card, themed button per 10.3 |
| **RegisterPage** | Same as Login | Same migration |
| **ForgotPasswordPage** | Same as Login | Same migration |
| **ResetPasswordPage** | Same as Login | Same migration |
| **ProfilePage** | DaisyUI `card` + forms + badges | Themed card, form inputs, buttons |
| **BlizzardOAuthCallbackPage** | DaisyUI `card` + `alert-error` | Themed card, themed error state per 10.8 |
| **GuildSearchPage** | DaisyUI `card` + forms | Themed card, form inputs |
| **GuildDetailPage** | DaisyUI forms + filter | Themed form inputs per 10.6 |
| **CharacterSearchPage** | `stats-card` + hardcoded hex `text-[#aa8855]` | Replace inline hex with `stats-label`/`stats-muted` classes |
| **CharacterDetailLayout** | `ma-*` classes (auto-fixed by Phase 1) | Fix `text-white` → `text-ma-text` in CharacterHeader |
| **Collection subtabs** | DaisyUI `card card-compact` + `badge` | Replace with `ma-card-inner` + themed badges |
| **TalentTree** | DaisyUI `card bg-base-200` + `btn btn-sm` | Replace with `ma-card` + themed buttons |

### 5.4 Phase 4: Shared Component Cleanup

| Component | Issue | Fix |
|-----------|-------|-----|
| **CharacterHeader.vue** | `text-white` throughout | → `text-[#e0d0b0]` or `text-ma-text` |
| **TalentNode.vue** | `hsl(var(--bc))` DaisyUI ref, `color: white` | → leather palette equivalents |
| **TalentEdges.vue** | `rgb(255 255 255 / 0.4)` | → `rgba(var(--ma-text) / 0.4)` |
| **ClassIcon.vue** | `text-white` fallback | → `text-[#ffcc88]` |
| **RaceIcon.vue** | `text-white` fallback | → `text-[#ffcc88]` |
| **ErrorState.vue** | DaisyUI `alert alert-error` | → Themed error card per 10.8 |
| **PollingState.vue** | DaisyUI `card loading-spinner` | → Themed loading per 10.9 |
| **StaleBadge.vue** | DaisyUI `badge badge-warning` | → Themed pill |
| **SyncingBadge.vue** | DaisyUI `badge badge-info` | → Themed pill |
| **MythicPlusAllRuns.vue** | `text-emerald-300`, `text-red-300` | → Keep (semantic on-time/over-time colors) |
| **RaidInstanceCard.vue** | `ring-orange-500` etc. | → Keep (difficulty indicators) |
| **EquipmentList.vue** | DaisyUI `card bg-base-200 shadow-sm` | → `ma-card` |
| **RaidProgressionSection.vue** | DaisyUI `card card-body` | → `ma-card` |
| **GuildSummaryCard.vue** | DaisyUI `card badge divide-base-300` | → Themed card + leather dividers |
| **GuildHeader.vue** | DaisyUI `card bg-base-100` | → Themed card |
| **RegionBreakdownTable.vue** | DaisyUI `table table-sm` | → Themed table per 10.5 |
| **RosterTable.vue** | DaisyUI `table-zebra` + `join` pagination | → Themed table + pagination per 10.5/10.7 |
| **LookupForm.vue** | DaisyUI `btn btn-primary btn-sm` | → Themed button per 10.3 |
| **NameAutocomplete.vue** | DaisyUI `input input-bordered badge` | → Themed input per 10.6 |
| **RealmCombobox.vue** | DaisyUI `input badge` | → Themed input per 10.6 |
| **RegionSelect.vue** | DaisyUI `select select-bordered` | → Themed select per 10.6 |

### 5.5 Phase 5: Hardcoded Color Cleanup

After Phases 1-4, grep for remaining hardcoded hex values in templates and replace with Tailwind utility classes using the `ma.*` palette:

| Hardcoded | Replace with |
|-----------|-------------|
| `text-[#e0d0b0]` | `text-ma-text` |
| `text-[#ffcc88]` | `text-ma-heading` or `text-ma-gold` |
| `text-[#aa8855]` | `text-ma-muted` |
| `text-[#665533]` | `text-ma-disabled` |
| `border-[#5c4a32]` | `border-ma-border` |
| `bg-[#1a1410]` | `bg-ma-bg` |
| `bg-[rgba(0,0,0,0.25)]` | `bg-black/25` (already fine) |
| `bg-[rgba(170,136,85,0.15)]` | `bg-ma-muted/15` |

This makes future palette tweaks a single-file change.

---

## 6. New Component Designs

### 6.1 AppNav (themed)

```html
<nav class="border-b-2 border-ma-border bg-gradient-to-r from-[rgb(var(--ma-card-2))] to-[rgb(var(--ma-card))]
            flex items-center justify-between px-4 py-2
            shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
  <div class="flex items-center gap-1">
    <router-link to="/" class="text-lg font-bold text-ma-heading hover:brightness-110 transition-all">
      WoW Service
    </router-link>
    <!-- Desktop links -->
    <div class="ml-4 hidden gap-1 md:flex">
      <router-link
        v-for="link in navLinks"
        :to="link.to"
        class="text-sm px-3 py-1.5 rounded transition-colors"
        :class="isActive(link) 
          ? 'text-ma-heading bg-ma-muted/15 border border-ma-border' 
          : 'text-ma-muted hover:text-ma-heading'"
      >
        {{ link.label }}
      </router-link>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <!-- Auth area -->
    <!-- Mobile hamburger button (md:hidden) -->
    <button class="md:hidden text-ma-muted hover:text-ma-heading p-1" @click="mobileMenuOpen = !mobileMenuOpen">
      <MenuIcon class="w-5 h-5" />
    </button>
  </div>
</nav>
<!-- Mobile drawer (slide-down, transition) -->
<div v-show="mobileMenuOpen" class="md:hidden border-b-2 border-ma-border bg-ma-bg px-4 py-3 flex flex-col gap-2">
  <router-link v-for="link in navLinks" ...>{{ link.label }}</router-link>
</div>
```

### 6.2 AppFooter (themed)

```html
<footer class="border-t-2 border-ma-border bg-gradient-to-r from-[rgb(var(--ma-card-2))] to-[rgb(var(--ma-card))] 
               px-4 py-3 text-center">
  <p class="text-xs text-ma-disabled">&copy; WoW Service</p>
</footer>
```

### 6.3 Themed Form Inputs

Create a reusable class or keep inline per design guide 10.6:

```css
.ma-input {
  width: 100%;
  border-radius: 0.375rem;
  border: 2px solid rgb(var(--ma-border));
  background-color: rgb(var(--ma-bg));
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: rgb(var(--ma-text));
}
.ma-input::placeholder {
  color: rgb(var(--ma-text-disabled));
}
.ma-input:focus {
  border-color: rgb(var(--ma-text-muted));
  outline: none;
}
```

### 6.4 Themed Button Variants

```css
.ma-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid rgb(var(--ma-border));
  color: rgb(var(--ma-text-muted));
  transition: all 150ms ease;
  cursor: pointer;
}
.ma-btn:hover {
  color: rgb(var(--ma-heading));
  border-color: rgb(var(--ma-text-muted));
}
.ma-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.ma-btn--primary {
  border-color: rgb(var(--ma-text-muted));
  color: rgb(var(--ma-heading));
  background-color: rgba(var(--ma-text-muted) / 0.15);
}
```

### 6.5 Themed Spinner (replaces DaisyUI loading-spinner)

```css
.ma-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid rgb(var(--ma-border));
  border-top-color: rgb(var(--ma-heading));
  border-radius: 9999px;
  animation: spin 0.8s linear infinite;
}
```

### 6.6 Themed Badge/Pill (replaces DaisyUI badge)

```css
.ma-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  border: 1px solid rgba(var(--ma-border) / 0.3);
  background-color: rgba(var(--ma-card) / 0.5);
  color: rgb(var(--ma-text-muted));
}
```

---

## 7. UX Fixes (integrated into migration)

### 7.1 Contrast Improvements

The design guide's muted text (`#665533`) has ~2:1 contrast on `#1a1410` — below WCAG AA. Bump it:

| Token | Current | Proposed | Contrast on #1a1410 |
|-------|---------|----------|-------------------|
| `--ma-text-disabled` (muted) | `102 85 51` (#665533) | `128 107 64` (#806B40) | ~3.5:1 (improved) |

This preserves the "muted" feel while being readable. Apply to empty states, secondary labels, pagination text.

### 7.2 Rank Color Differentiation

Current: positions 1-3 all use `#aa8855` in PerformanceByClassCard. Fix per design guide section 2.5:
- 1st: `#ffcc88` (gold)
- 2nd: `#c0c0c0` (silver)  
- 3rd: `#cd7f32` (bronze)
- 4th+: `#665533` → new `#806B40` (muted)

Components to update: `PerformanceByClassCard`, `TopRunsLeaderboard`, `TopPerformersCard`.

### 7.3 Mobile Responsiveness

| Issue | Fix |
|-------|-----|
| No mobile nav menu | Add hamburger + slide-down drawer (section 6.1) |
| RosterTable hides iLvl/M+ on mobile | Show iLvl+M+ always; hide Race+Side instead (less critical) |
| MythicPlusBestPerDungeon hides time on mobile | Show time always; it's a core M+ metric |
| Fixed 288px chart on StatsHeroCard | Add `max-w-full` and responsive sizing |
| 6-column KPI grid → 2-col on mobile is very tall | Use 3-col minimum: `grid-cols-3 lg:grid-cols-6` |

### 7.4 Truncation Affordance

Add `title` attribute to all truncated text fields for hover tooltip:
- Dungeon names in leaderboards
- Boss names in heatmap
- Character names in roster
- Guild names in header

### 7.5 Stats Card Visibility Improvements

| Component | Issue | Fix |
|-----------|-------|-----|
| **SpecPopularityCard** | 6px bars too thin to read | Increase to 10px; add percentage label at bar end |
| **RaidHeatmapCard** | No scale legend | Add 3-dot legend showing min/mid/max size |
| **RaidHeatmapCard** | Class order arbitrary | Sort by total kills descending |
| **GuildStatsSection** | Tanks/Healers without denominator | Show as "8 / 45" (count/total) |
| **TopRunsLeaderboard** | No page size indicator | Add "showing X-Y of Z" text |

### 7.6 Loading & Error States

Standardize all loading/error/empty states:

```html
<!-- Loading -->
<div class="ma-card flex flex-col items-center gap-3 py-8">
  <div class="ma-spinner" />
  <p class="text-sm text-ma-text">Loading...</p>
</div>

<!-- Error -->
<div class="ma-card border-red-800/50">
  <h3 class="text-sm font-semibold text-[#ff4444]">Something went wrong</h3>
  <p class="text-xs text-[#aa6666] mt-1">{{ errorMessage }}</p>
  <button class="ma-btn mt-3" @click="retry">Try again</button>
</div>

<!-- Empty -->
<div class="ma-card py-6 text-center">
  <p class="text-sm text-ma-disabled italic">No data available</p>
</div>
```

---

## 8. Character Page Minification Notes

These are **not in scope** for this design pass but should be kept in mind:

| Area | Current | Future Opportunity |
|------|---------|-------------------|
| Equipment layout gaps | `gap-6` between columns | Could reduce to `gap-4` |
| Character render frame | Full aspect-ratio 3:4 | Could cap height on smaller viewports |
| Empty collection states | `p-8` padding | Reduce to `p-4` |
| Root tab gaps | `gap-6` between sections | Could reduce to `gap-4` |
| Raid card headers | `py-5` | Could reduce to `py-3` |
| Stats card grid | `gap-x-6` | Could reduce to `gap-x-4` |

**Why not now:** Minification is a separate concern from theming. Doing both simultaneously doubles review surface. The design migration already changes the visual identity significantly — spacing changes on top of that would make it hard to evaluate the new palette in isolation.

---

## 9. Doc Updates

### 9.1 Update design-guide.md

- Remove migration guide section (10.x) — it'll be complete
- Add section documenting the `ma-*` CSS variable system as the canonical token source
- Add `ma-btn`, `ma-input`, `ma-spinner`, `ma-badge` class documentation
- Update Do's/Don'ts: replace "Don't use DaisyUI semantic classes" with "DaisyUI's base-* tokens are fine for page background; avoid component classes"

### 9.2 Update frontend/CLAUDE.md

- Remove "Prefer DaisyUI semantic classes" guidance
- Add "Use `ma-*` component classes and `text-ma-*` / `bg-ma-*` Tailwind utilities"
- Document new component classes (`ma-btn`, `ma-input`, `ma-spinner`, `ma-badge`)

### 9.3 Tailwind safelist

Update to remove violet-specific patterns, add leather/gold patterns if needed for dynamic class generation.

---

## 10. Implementation Order

```
Phase 1: Foundation (~1 session)
├── Recolor CSS variables
├── Recolor DaisyUI theme
├── Merge stats-theme.css
├── Update ma-card, ma-tab, ma-hero-banner
├── Add new component classes (ma-btn, ma-input, ma-spinner, ma-badge)
└── Visual verification: all existing pages auto-recolored

Phase 2: App Shell (~1 session)
├── AppNav → themed with mobile hamburger
├── AppFooter → themed
└── Visual verification

Phase 3: Page Migrations (~2 sessions)
├── HomePage
├── Auth pages (Login, Register, Forgot, Reset)
├── ProfilePage + BlizzardOAuthCallbackPage
├── GuildSearchPage + GuildDetailPage (forms, tables, roster pagination)
├── CharacterSearchPage (fix hardcoded hex)
├── Collection subtabs (card + badge migration)
└── TalentTree (card + button migration)

Phase 4: Component Cleanup (~1 session)
├── CharacterHeader (text-white → text-ma-text)
├── TalentNode + TalentEdges (remove DaisyUI/white refs)
├── ErrorState, PollingState, StaleBadge, SyncingBadge
├── Form components (LookupForm, NameAutocomplete, RealmCombobox, RegionSelect)
├── Guild components (GuildHeader, GuildSummaryCard, RegionBreakdownTable, RosterTable)
└── Icon fallbacks (ClassIcon, RaceIcon)

Phase 5: UX Fixes (~1 session)
├── Contrast improvements (muted text bump)
├── Rank color differentiation
├── Mobile responsiveness fixes
├── Truncation title attributes
├── Stats card visibility improvements
├── Loading/error/empty state standardization
└── Hardcoded hex → Tailwind ma-* utility sweep

Phase 6: Documentation (~0.5 session)
├── Update design-guide.md
├── Update frontend/CLAUDE.md
└── Final grep audit for remaining DaisyUI/violet/hardcoded colors
```

**Estimated total: ~6 sessions**

---

## 11. Risk & Decisions

### Decisions Needed

1. **Cinzel font:** Keep the decorative display font for headings? **Recommendation: Yes** — it reinforces the fantasy medieval identity.

2. **`ma-` prefix vs rename:** The variable prefix `ma-` (Masked Armory) no longer matches the theme name (Dark Leather & Gold). Rename to something like `dl-` or `wow-`? **Recommendation: Keep `ma-`** — it's short, already used in ~80 components, and the prefix is just a namespace. Not worth the churn.

3. **DaisyUI removal:** Should we remove DaisyUI entirely after migration? **Recommendation: Keep it** — the `data-theme` system and base-* tokens are still useful for page-level dark mode. We just stop using component classes (btn, card, badge, etc.).

### Risks

- **Hero banner visual regression:** The character hero banner with blurred render currently has a cool violet tint. Switching to warm leather tones may look muddy with certain character renders. Mitigation: test with multiple character classes/races.
- **Spec/talent glows:** Some components use violet glow effects (`box-shadow: ... rgba(violet)`) that will become warm brown glows. May look less "magical." Mitigation: consider keeping glow effects using class colors instead of the accent color.
- **Third-party styles:** Wowhead `power.js` injects tooltips with its own styling. These won't match the leather theme. Not something we control.

---

## 12. Files Touched (complete list)

### Config/Infrastructure
- `src/style.css` — recolor vars, absorb stats-theme, add new classes
- `src/assets/stats-theme.css` — **DELETE**
- `tailwind.config.js` — recolor DaisyUI theme, update safelist
- `index.html` — no change needed (data-theme stays `masked-armory`)

### Layout
- `src/App.vue` — likely no template change (DaisyUI recolor handles it)
- `src/components/layout/AppNav.vue` — full rewrite
- `src/components/layout/AppFooter.vue` — full rewrite

### Pages (13 files)
- `src/pages/HomePage.vue`
- `src/pages/LoginPage.vue`
- `src/pages/RegisterPage.vue`
- `src/pages/ForgotPasswordPage.vue`
- `src/pages/ResetPasswordPage.vue`
- `src/pages/ProfilePage.vue`
- `src/pages/BlizzardOAuthCallbackPage.vue`
- `src/pages/GuildSearchPage.vue`
- `src/pages/GuildDetailPage.vue`
- `src/pages/CharacterSearchPage.vue`
- `src/pages/character/collections/MountsSubtab.vue`
- `src/pages/character/collections/PetsSubtab.vue`
- `src/pages/character/collections/ToysSubtab.vue`

### Components (~20 files)
- `src/components/character/CharacterHeader.vue`
- `src/components/character/talents/TalentTree.vue`
- `src/components/character/talents/TalentNode.vue`
- `src/components/character/talents/TalentEdges.vue`
- `src/components/character/EquipmentList.vue`
- `src/components/character/pve/RaidProgressionSection.vue`
- `src/components/character/pve/MythicPlusAllRuns.vue`
- `src/components/feedback/ErrorState.vue`
- `src/components/feedback/PollingState.vue`
- `src/components/feedback/StaleBadge.vue`
- `src/components/feedback/SyncingBadge.vue`
- `src/components/form/LookupForm.vue`
- `src/components/form/NameAutocomplete.vue`
- `src/components/form/RealmCombobox.vue`
- `src/components/form/RegionSelect.vue`
- `src/components/guild/GuildHeader.vue`
- `src/components/guild/GuildSummaryCard.vue`
- `src/components/guild/RegionBreakdownTable.vue`
- `src/components/guild/RosterTable.vue`
- `src/components/wow/ClassIcon.vue`
- `src/components/wow/RaceIcon.vue`

### Stats components (UX fixes only — no theme migration needed)
- `src/components/stats/PerformanceByClassCard.vue`
- `src/components/stats/SpecPopularityCard.vue`
- `src/components/stats/RaidHeatmapCard.vue`
- `src/components/stats/TopRunsLeaderboard.vue`
- `src/components/stats/TopPerformersCard.vue`

### Docs
- `frontend/docs/design-guide.md`
- `frontend/CLAUDE.md`
