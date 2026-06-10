# Design Guide: Dark Leather & Gold Theme

## 1. Philosophy

The visual language draws from medieval fantasy RPG interfaces: dark leather textures, warm gold accents, and weathered parchment tones. Cards feel like panels in an ancient war-room command table, with inset shadows simulating depth and gold borders evoking hand-crafted metalwork. The palette is warm and low-contrast by design -- nothing should feel clinical or modern-SaaS; everything should feel like it belongs in Azeroth.

---

## 2. Color Palette

### 2.1 Backgrounds

| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| Page background | `#1a1410` | `--wsa-bg` | Darkest brown-black, used as the gradient start in cards and as the implied page fill |
| Card gradient start | `#1a1410` | `--wsa-card-2` | Left/top of `.wsa-card` diagonal gradient |
| Card gradient end | `#2a2018` | `--wsa-card` | Right/bottom of `.wsa-card` diagonal gradient |
| Card CSS | `linear-gradient(135deg, ...)` | — | Full card background declaration |
| Row background | `rgba(0, 0, 0, 0.25)` | List items inside cards (legend rows, performer rows) |
| Row background (darker) | `rgba(0, 0, 0, 0.3)` | Progress bar track backgrounds |
| Button active bg | `rgba(170, 136, 85, 0.15)` | Active filter/tab pill fill |
| Tooltip background | `#1a1410` | Chart.js tooltip background, reuses card start color |

### 2.2 Text Colors

| Token | Hex | Tailwind / CSS class | Usage |
|---|---|---|---|
| **Primary text** | `#e0d0b0` | `text-wsa-text` / `.stats-value` | Main data values, table cell text, stat numbers |
| **Card title** | `#ffcc88` | `text-wsa-heading` / `text-wsa-gold` / `.stats-card-title` | Card headings, key-level badges, gold accent text |
| **Label text** | `#aa8855` | `text-wsa-muted` / `.stats-label` | Uppercase field labels, secondary stats, percentage labels, table headers, pagination text |
| **Muted text** | `#806B40` | `text-wsa-disabled` / `.stats-muted` | Empty states, rank numbers beyond top 3, loading text, chevron icons, metadata counts |
| **M+ rating accent** | `#ff8844` | `text-[#ff8844]` | Mythic+ rating numbers |
| **iLvl accent** | `#88ccff` | `text-[#88ccff]` | Item-level numbers in performance tables |
| Character names | Per-class color | `:style="{ color: CLASS_COLORS[classId] }"` | Always use the WoW class color for character/class names |

Prefer Tailwind `text-wsa-*` utilities over inline `style="color: ..."` or arbitrary `text-[#hex]` values. The hex values above are the resolved values from CSS variables in `style.css`.

### 2.3 Border Colors

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| **Card border** | `#5c4a32` | `border-wsa-border` | Primary border for all `.wsa-card` / `.stats-card` elements (2px solid) |
| **Separator / row border** | `rgba(92, 74, 50, 0.2)` | `border-wsa-border/20` | Table row bottom borders |
| **Bar track border** | `rgba(92, 74, 50, 0.3)` | `border-wsa-border/30` | Progress bar outer container border |
| **Active pill border** | `#aa8855` | `border-wsa-muted` | Border of the selected filter tab |
| **Inactive pill border** | `#5c4a32` | `border-wsa-border` | Border of unselected filter tabs |
| **Accent left border** | `var(--stats-accent, ...)` | — | Dynamic accent border via `.stats-border-accent` |
| **Section marker** | — | `border-l-3 border-wsa-border` | Left border on raid section names |

### 2.4 Faction Colors

| | Primary | Secondary/Label | Background gradient | Border |
|---|---|---|---|---|
| **Horde** | `#ff4444` | `#aa6666` | `linear-gradient(135deg, #4a0a0a, #7a1515, #5a0e0e)` | `#6b2020` |
| **Alliance** | `#3399ff` | `#6688aa` | `linear-gradient(135deg, #0a2244, #153a6a, #0e2a55)` | `#2255aa` |

Faction emblem circles:
- Horde: `background: radial-gradient(circle, #4a1010, #1a0505)`
- Alliance: `background: radial-gradient(circle, #0a2244, #050f1a)`

### 2.5 Rank Colors (Leaderboards)

| Rank | Text color | Badge background |
|---|---|---|
| **1st (Gold)** | `#ffcc88` | `rgba(255, 204, 136, 0.2)` |
| **2nd (Silver)** | `#c0c0c0` | `rgba(192, 192, 192, 0.2)` |
| **3rd (Bronze)** | `#cd7f32` | `rgba(205, 127, 50, 0.2)` |
| **4th+** | `#806B40` (`text-wsa-disabled`) | `rgba(0, 0, 0, 0.3)` |

### 2.6 Battle Line / Gold Accent

The animated gold divider used in the faction bar:
- Gradient: `linear-gradient(180deg, #cc7700, #ffaa00, #cc7700)`
- Glow: `box-shadow: 0 0 6px rgba(255, 170, 0, 0.7)`

### 2.7 WoW Class Colors

Always use `CLASS_COLORS` from `@/utils/wowConstants` for class-specific coloring. Never hard-code class colors in components. These are applied via inline `:style` bindings.

---

## 3. Typography

### Font Sizes

| Size | Tailwind | Usage |
|---|---|---|
| 10px | `text-[10px]` | Filter pill labels, sample counts, heatmap class abbreviations, spec percentages |
| 11px | `text-[11px]` / `.stats-label` | Labels (via style.css), class-group headers in spec popularity |
| 12px | `text-xs` | Table cells, boss names, dungeon names, empty states, pagination, loading text |
| 14px | `text-sm` | Leaderboard values, class names in legends, performer names |
| 15px | `.stats-card-title` | Card titles (defined in style.css) |
| 18px | `text-lg` | Card titles when combined with stats-card-title for emphasis |
| 20px | `text-xl` | Faction counts, mini-card stat values |
| 24px | `text-2xl` | Primary stat value in StatMiniCard |
| 30px | `text-3xl` | Hero card center number (total count in doughnut) |

### Font Weights

| Weight | Tailwind | Usage |
|---|---|---|
| 500 | `font-medium` | Labels, character names in lists, class names |
| 600 | `font-semibold` / `.stats-card-title` | Card titles, stat values in legends, class abbreviations, pagination controls |
| 700 | `font-bold` / `.stats-value` | Primary values, rank numbers, key levels, hero numbers |

### Special Text Treatments

- **`tabular-nums`**: Always use on numeric columns (ratings, percentages, counts, durations, ranks) to prevent layout shift as digits change.
- **`uppercase tracking-wide`**: Used on field labels (e.g., "Total Characters", "Avg iLvl") for the small-caps effect.
- **`truncate`**: Apply to character/dungeon names that may overflow their container. Pair with a fixed width (`w-24`, `w-28`, `max-w-[100px]`).
- **`text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6)`**: On card titles for depth against the dark gradient.

---

## 4. Shared CSS Classes (style.css)

All classes below are defined in `src/style.css` under `@layer components`. They are backed by `--wsa-*` CSS custom properties (see section 10.1), so palette changes propagate automatically. The hex values shown below are the resolved defaults for reference.

### `.wsa-card` / `.stats-card`

The foundational card container. Both classes are identical — `.stats-card` is a legacy alias. Apply to any section-level wrapper.

```css
background: linear-gradient(135deg, rgb(var(--wsa-card-2)), rgb(var(--wsa-card)));
border: 2px solid rgb(var(--wsa-border));
border-radius: 0.5rem;
box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
padding: 1.25rem;
```

Usage: `<div class="wsa-card">` (preferred) or `<div class="stats-card">`. Combine with `p-2` or `p-4` inside for content padding variations.

### `.wsa-card-inner`

Inner row card for nested elements (equipment slots, list rows, render frames).

```css
background: rgba(0, 0, 0, 0.25);
border: 1px solid rgba(var(--wsa-border) / 0.2);
border-radius: 8px;
```

### `.stats-card-title`

Card heading style.

```css
color: rgb(var(--wsa-heading));   /* #ffcc88 */
font-size: 15px;
font-weight: 600;
text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
```

Usage: `<h2 class="stats-card-title">` or `<h3 class="stats-card-title">`. Commonly paired with `text-lg` for larger cards, and `mb-3` or `mb-4` for spacing. For non-stats contexts, `.wsa-text-heading` provides a similar gold heading with Cinzel display font.

### `.stats-label`

Small uppercase field labels.

```css
color: rgb(var(--wsa-text-muted));   /* #aa8855 */
font-size: 11px;
```

Usage: `<p class="stats-label font-medium uppercase tracking-wide">`. Used in StatMiniCard for the metric name. Equivalent Tailwind: `text-wsa-muted text-[11px]`.

### `.stats-value`

Primary data value display.

```css
color: rgb(var(--wsa-text));   /* #e0d0b0 */
font-weight: 700;
```

Usage: `<p class="stats-value mt-1 text-2xl">`. Size the text externally via Tailwind (`text-2xl`, `text-xl`, etc.). Equivalent Tailwind: `text-wsa-text font-bold`.

### `.stats-muted`

De-emphasized text for metadata and empty states.

```css
color: rgb(var(--wsa-text-disabled));   /* #806B40 */
```

Usage: `<p class="mt-0.5 text-xs stats-muted">` for subtitles. Equivalent Tailwind: `text-wsa-disabled`.

### `.stats-border-accent`

Dynamic left-border accent. Set `--stats-accent` via inline style to control the color.

```css
border-left: 3px solid var(--stats-accent, rgb(var(--wsa-border)));
```

Usage:
```html
<div
  class="wsa-card stats-border-accent"
  :style="{ '--stats-accent': '#ff4444' }"
>
```

### Additional `wsa-*` Component Classes

| Class | Purpose |
|-------|---------|
| `.wsa-hero-banner` (+ `__bg`, `__accent`, `__content`) | Character hero banner with blurred backdrop |
| `.wsa-stat-pill` | Compact stat badge (rounded-full, border, subtle bg) |
| `.wsa-tab` / `.wsa-tab--active` | Tab strip buttons |
| `.wsa-text-heading` | Gold heading with Cinzel font + text-shadow |
| `.wsa-btn` / `.wsa-btn--primary` | Themed buttons (replaces DaisyUI `btn`) |
| `.wsa-input` | Themed form input (replaces DaisyUI `input`) |
| `.wsa-spinner` | CSS-only loading spinner (replaces DaisyUI `loading-spinner`) |
| `.wsa-badge` | Inline pill/badge (replaces DaisyUI `badge`) |
| `.wsa-wordmark` | Gold gradient text effect |

See `src/style.css` for full definitions.

---

## 5. Card Patterns

### 5.1 StatMiniCard (KPI Card)

A compact single-metric card. Structure:

```html
<div class="wsa-card p-4 transition-all hover:brightness-110">
  <p class="stats-label font-medium uppercase tracking-wide">LABEL</p>
  <p class="stats-value mt-1 text-2xl">VALUE</p>
  <p class="mt-0.5 text-xs stats-muted">optional subtitle</p>
</div>
```

Features:
- Optional `stats-border-accent` with dynamic `--stats-accent` color
- `hover:brightness-110` for subtle hover feedback
- Native `title` attribute for tooltip

### 5.2 Full Content Card

Standard card with title and body content. Used by most stat components.

```html
<div class="wsa-card">
  <div class="p-2">
    <h2 class="stats-card-title text-lg mb-4">Card Title</h2>
    <!-- Content here -->
  </div>
</div>
```

The outer `.wsa-card` provides the frame; an inner `<div class="p-2">` adds breathing room. Title uses `mb-3` or `mb-4` depending on content density.

### 5.3 Card with Filter Tabs

Cards like PerformanceByClassCard and SpecPopularityCard place filter buttons in the header row:

```html
<div class="wsa-card">
  <div class="flex items-center justify-between mb-3">
    <h2 class="stats-card-title">Title</h2>
    <div class="flex gap-1">
      <button
        v-for="option in options"
        class="text-[10px] px-2 py-0.5 rounded border"
        :class="
          active === option
            ? 'border-wsa-muted text-wsa-heading bg-wsa-accent/15'
            : 'border-wsa-border text-wsa-disabled'
        "
      >
        {{ option }}
      </button>
    </div>
  </div>
  <!-- Body -->
</div>
```

### 5.4 Leaderboard / Table Card

For tabular data with pagination (TopRunsLeaderboard):

```html
<div class="wsa-card">
  <h3 class="stats-card-title mb-4">Title</h3>
  <div class="overflow-x-auto">
    <table class="w-full text-xs">
      <thead>
        <tr class="text-wsa-muted text-left">
          <th class="py-1.5">Column</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-wsa-border/20">
          <td class="py-2 text-wsa-text">data</td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- Pagination footer -->
</div>
```

Table header row uses `text-wsa-muted`. Row borders use `border-wsa-border/20`. Cell text defaults to `text-wsa-text`.

### 5.5 Hero Card (StatsHeroCard)

A large card combining a Chart.js doughnut with a scrollable legend. Uses flex layout with responsive stacking:

```html
<div class="wsa-card">
  <div class="p-2">
    <h2 class="stats-card-title text-lg mb-4">Title</h2>
    <div class="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <div class="relative h-72 w-72 flex-shrink-0">
        <!-- Chart -->
        <!-- Center overlay with absolute positioning -->
      </div>
      <div class="flex flex-col gap-1.5 w-full">
        <!-- Legend rows -->
      </div>
    </div>
  </div>
</div>
```

### 5.6 Collapsible Section Card

Used in CharacterSearchPage for the search form:

```html
<div class="wsa-card">
  <button class="flex w-full items-center justify-between text-left">
    <span class="text-sm font-medium text-wsa-muted">Section Title</span>
    <ChevronIcon class="h-4 w-4 text-wsa-disabled" />
  </button>
  <div v-show="open" class="mt-3">
    <!-- Expandable content -->
  </div>
</div>
```

---

## 6. Interactive Elements

### 6.1 Filter Tab Pills

The repeated pattern for role/difficulty selectors:

```
Active:   border-wsa-muted text-wsa-heading bg-wsa-accent/15
Inactive: border-wsa-border text-wsa-disabled
Shared:   text-[10px] px-2 py-0.5 rounded border
```

These are `<button>` elements, not links. Text is 10px, padding is minimal. The active state has a warm gold border with a very subtle warm fill.

### 6.2 Pagination Buttons

Use `.wsa-btn` class for pagination controls:

```html
<button class="wsa-btn disabled:opacity-30" :disabled="page === 1">Prev</button>
<span class="text-xs text-wsa-disabled flex items-center">1 / 5</span>
<button class="wsa-btn disabled:opacity-30" :disabled="page === maxPage">Next</button>
```

Disabled state uses `disabled:opacity-30`. Text is `text-wsa-muted` (label gold). Border matches the standard card border.

### 6.3 Hover Effects

| Element | Effect |
|---|---|
| StatMiniCard | `hover:brightness-110` on the card |
| Character name links | `hover:underline` with class-colored text |
| Heatmap dots | `transform: scale(1.4)` on hover, with `transition: transform 0.2s ease, box-shadow 0.2s ease` |
| Row items | No hover bg change in current implementation (rows use static `rgba(0,0,0,0.25)`) |

### 6.4 Links

Character name links are `<RouterLink>` elements styled with the WoW class color and `hover:underline`. They do NOT use underline by default:

```html
<RouterLink
  class="flex-1 truncate text-sm font-medium hover:underline"
  :style="{ color: CLASS_COLORS[entry.class_id] }"
>
```

---

## 7. Layout Patterns

### 7.1 Grid Layouts

The stats page uses a progression of grid layouts:

| Row | Grid | Responsive |
|---|---|---|
| Hero + Faction | `grid-cols-1 lg:grid-cols-[1fr_350px]` | Full width stacks on mobile, fixed 350px sidebar on desktop |
| KPI mini cards | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` | 2-col mobile, 3-col tablet, 5-col desktop |
| Guild mini cards | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` | 2-col mobile through 6-col desktop |
| Dual content | `grid-cols-1 lg:grid-cols-2` | Stacked on mobile, side-by-side on desktop |
| Sidebar + content | `grid-cols-1 lg:grid-cols-[300px_1fr]` | Fixed sidebar width on desktop |
| 3-column cards | `grid-cols-1 md:grid-cols-3` | For top-performer triplet |

### 7.2 Gap Sizes

| Gap | Usage |
|---|---|
| `gap-0.5` | Tight lists (performance bars) |
| `gap-1` | Filter pill groups, very dense rows |
| `gap-1.5` | Standard list rows (legend items, performer entries) |
| `gap-2` | Spec bars within class groups, horizontal spacing |
| `gap-3` | Section spacing within cards, mini-card grids, performer row internals |
| `gap-4` | Between major grid sections, between cards |
| `gap-6` | Between page-level sections (the flex-col of the main page) |

### 7.3 Page Container

The stats page uses no explicit container -- it renders in the `<main class="container mx-auto p-4">` from App.vue. The page content is a `<div class="flex flex-col gap-6">` holding the grid rows.

The guild detail page adds its own `<div class="flex flex-col gap-4 p-4">`.

### 7.4 Spacing Conventions

- Card internal padding: `p-4` to `p-5` (the `.wsa-card` base is `padding: 1.25rem`)
- Inner content wrapper: `p-2` inside `.wsa-card` for cards with charts/lists
- Title to content: `mb-3` (compact cards) or `mb-4` (spacious cards)
- Between list items: `gap-1.5` (standard) or `gap-0.5` (dense)

---

## 8. Animations & Effects

### 8.1 Bar Shimmer

A one-shot highlight sweep on performance bars:

```css
.perf-bar {
  position: relative;
  overflow: hidden;
}
.perf-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%);
  animation: bar-shimmer 1.2s ease-out 0.3s forwards;
}
@keyframes bar-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
```

Use on progress/stat bars after they mount to draw the eye. The 0.3s delay lets the bar width animate in first.

### 8.2 Battle Pulse

A slow opacity pulse on the faction split gold divider:

```css
@keyframes battle-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.6; }
}
```

Duration: 3s, `ease-in-out`, `infinite`. Use on prominent accent elements that should feel "alive."

### 8.3 Emblem Glow

A breathing box-shadow glow on faction emblem circles:

```css
@keyframes emblem-glow {
  0%, 100% { box-shadow: 0 0 14px var(--glow-color); }
  50%      { box-shadow: 0 0 22px var(--glow-color); }
}
```

Duration: 4s, `ease-in-out`, `infinite`. Uses CSS variable `--glow-color` so the same keyframe works for both Horde (red) and Alliance (blue) emblems.

### 8.4 Heatmap Dot Hover

```css
.heatmap-dot {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.heatmap-dot:hover {
  transform: scale(1.4);
}
```

Use on small interactive data points. The scale-up provides a magnifying-glass effect.

### 8.5 Inset Shadow

The `.wsa-card` / `.stats-card` uses `box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5)` to create a vignette / leather indentation effect. This is central to the visual identity and should not be omitted from themed containers.

---

## 9. Data Display Patterns

### 9.1 Rankings / Leaderboards

Rank numbers get medal colors for positions 1-3, muted for the rest:

```html
<span
  class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
  :style="{
    backgroundColor: index === 0 ? 'rgba(255, 204, 136, 0.2)'
      : index === 1 ? 'rgba(192, 192, 192, 0.2)'
      : index === 2 ? 'rgba(205, 127, 50, 0.2)'
      : 'rgba(0, 0, 0, 0.3)',
    color: index === 0 ? '#ffcc88'
      : index === 1 ? '#c0c0c0'
      : index === 2 ? '#cd7f32'
      : '#806B40',
  }"
>
  {{ index + 1 }}
</span>
```

For table-style ranks (PerformanceByClassCard), top-3 get distinct medal colors (gold/silver/bronze), 4+ get `text-wsa-disabled` without prefix.

### 9.2 Progress Bars

Outer track:
```html
<div class="flex-1 h-[10px] rounded bg-[rgba(0,0,0,0.3)] border border-[rgba(92,74,50,0.3)] overflow-hidden flex items-center">
```

Inner bar with class-colored glow:
```js
{
  width: `${percent}%`,
  background: `linear-gradient(180deg, ${color}dd, ${color}, ${color}dd)`,
  boxShadow: `0 0 8px ${color}4d`,
  borderRadius: '3px',
  height: '8px',
}
```

The vertical gradient (lighter center, darker edges) creates a rounded/beveled appearance. The box-shadow adds a class-colored glow.

For simpler bars (SpecPopularityCard), use:
```html
<div class="flex-1 h-[6px] rounded bg-[rgba(0,0,0,0.3)] overflow-hidden">
  <div class="h-full rounded" :style="{ width, backgroundColor: color, opacity: 0.8 }" />
</div>
```

### 9.3 Stat Values with Labels

The StatMiniCard pattern:
```
LABEL          (stats-label, uppercase, tracking-wide, 11px, text-wsa-muted)
1,234          (stats-value, bold, text-2xl, text-wsa-text)
optional note  (text-xs, stats-muted, text-wsa-disabled)
```

For inline key-value pairs in lists:
```html
<span class="text-xs tabular-nums text-wsa-muted">630 ilvl</span>
<span class="text-xs tabular-nums text-wsa-muted">2,100 m+</span>
```

### 9.4 Tables with Pagination

Table headers: `text-wsa-muted text-left`, `text-xs`, `py-1.5`.
Table cells: `text-wsa-text`, `py-2`, `text-xs`.
Row borders: `border-b border-wsa-border/20`.

Pagination footer centered below the table:
```html
<div class="flex justify-center gap-2 mt-4">
  <button class="wsa-btn disabled:opacity-30">Prev</button>
  <span class="text-xs text-wsa-disabled flex items-center">1 / 5</span>
  <button class="wsa-btn disabled:opacity-30">Next</button>
</div>
```

### 9.5 Heatmap / Dot Matrix

Each dot is a `rounded-full` div with size and color computed dynamically:
```js
{
  width: `${size}px`,       // 3-16px scaled by value/max
  height: `${size}px`,
  background: `radial-gradient(circle, ${classColor}, ${classColor}88)`,
  boxShadow: `0 0 4px ${classColor}66`,
}
```

Dots sit in fixed-width cells (`w-[28px]`) for grid alignment. Class abbreviation headers use the same cell width.

### 9.6 Chart.js Tooltip Theme

When using Chart.js (doughnut, bar, etc.), configure tooltips to match:

```js
tooltip: {
  backgroundColor: '#1a1410',
  titleColor: '#ffcc88',
  bodyColor: '#e0d0b0',
  borderColor: '#5c4a32',
  borderWidth: 1,
  cornerRadius: 8,
  padding: 10,
  titleFont: { weight: 'bold' },
}
```

Chart borders (between segments) use `borderColor: '#5c4a32'`.

### 9.7 Empty / Loading / Error States

```html
<!-- Loading -->
<div class="wsa-card flex flex-col items-center gap-3 py-8">
  <div class="wsa-spinner" />
  <p class="text-sm text-wsa-text">Loading...</p>
</div>

<!-- Empty -->
<div class="wsa-card py-6 text-center">
  <p class="text-sm text-wsa-disabled italic">No data available</p>
</div>

<!-- Error -->
<div class="wsa-card border-red-800/50">
  <h3 class="text-sm font-semibold text-[#ff4444]">Something went wrong</h3>
  <p class="text-xs text-[#aa6666] mt-1">Error details here</p>
  <button class="wsa-btn mt-3">Try again</button>
</div>
```

Loading uses `.wsa-spinner` (CSS-only spinner). Empty states use `text-wsa-disabled`. Errors use Horde-red accents with a tinted card border.

---

## 10. CSS Token System

The design system is implemented via CSS custom properties in `src/style.css`. All colors are defined once in `:root` and consumed by component classes and Tailwind utilities.

### 10.1 CSS Variables (`--wsa-*`)

| Variable | Value | Hex | Usage |
|----------|-------|-----|-------|
| `--wsa-bg` | `26 20 16` | `#1a1410` | Page background |
| `--wsa-card` | `42 32 24` | `#2a2018` | Card gradient end |
| `--wsa-card-2` | `26 20 16` | `#1a1410` | Card gradient start |
| `--wsa-card-inner` | `35 27 19` | — | Inner row cards |
| `--wsa-border` | `92 74 50` | `#5c4a32` | Card borders |
| `--wsa-text` | `224 208 176` | `#e0d0b0` | Primary text |
| `--wsa-text-muted` | `170 136 85` | `#aa8855` | Labels, secondary text |
| `--wsa-text-disabled` | `128 107 64` | `#806B40` | Muted/empty text |
| `--wsa-heading` | `255 204 136` | `#ffcc88` | Card titles, gold accent |
| `--wsa-gold` | `255 204 136` | `#ffcc88` | Gold accent (alias) |
| `--wsa-accent` | `170 136 85` | `#aa8855` | Interactive accent |

### 10.2 Tailwind Utilities

All variables are exposed as Tailwind color utilities via `tailwind.config.js`:

```
text-wsa-text, text-wsa-muted, text-wsa-disabled, text-wsa-heading, text-wsa-gold
bg-wsa-bg, bg-wsa-card, bg-wsa-card-inner
border-wsa-border
```

Alpha modifiers work: `text-wsa-muted/70`, `border-wsa-border/20`, `bg-wsa-card/50`.

### 10.3 DaisyUI Theme Tokens (still valid)

The DaisyUI `dark-leather` theme is configured with matching colors. These semantic tokens are acceptable for page-level usage:

- `bg-base-100` = `#1a1410` (page bg)
- `bg-base-200` = mid leather
- `bg-base-300` = `#2a2018`
- `text-base-content` = `#e0d0b0`
- `text-success`, `text-warning`, `text-error` (semantic feedback colors)

**Do NOT use** DaisyUI component classes: `btn`, `card`, `badge`, `alert`, `table`, `navbar`, `skeleton`, `loading`, `join`, `form-control`, `input`, `select`.

---

## 11. Do's and Don'ts

### Do

- **Do** use `.wsa-card` (or `.stats-card` alias) for every container that holds content -- it is the foundational building block.
- **Do** use `text-wsa-text` (`#e0d0b0`) as the default text color for data values. It reads clearly against the dark leather background without being harsh.
- **Do** use `text-wsa-heading` / `text-wsa-gold` (`#ffcc88`) sparingly for headings and emphasis -- it is the "gold" accent.
- **Do** prefer Tailwind `text-wsa-*` / `border-wsa-*` / `bg-wsa-*` utilities over hardcoded hex values. The CSS variables allow palette changes in one place.
- **Do** use `tabular-nums` on all numeric displays to prevent layout jitter.
- **Do** use class colors from `CLASS_COLORS` for character names and class-related data -- never override these.
- **Do** apply `inset 0 0 20px rgba(0, 0, 0, 0.5)` box-shadow on containers to maintain the recessed leather feel (built into `.wsa-card`).
- **Do** use `border: 2px solid` with `border-wsa-border` on card-level containers. This is the signature frame.
- **Do** keep text small (`text-xs` to `text-sm`) for data tables and lists. The theme is information-dense.
- **Do** use `rgba(0, 0, 0, 0.25)` background for list rows inside cards to create subtle depth (built into `.wsa-card-inner`).
- **Do** use the 135deg gradient direction consistently (`linear-gradient(135deg, ...)`) -- this is the canonical light direction across all cards and bars.

### Don't

- **Don't** use pure white (`#ffffff` / `text-white`). The brightest text in the palette is `#e0d0b0` (warm parchment). Pure white looks alien against the warm tones.
- **Don't** use DaisyUI component classes (`btn`, `card`, `badge`, `alert`, `table`, `navbar`, `skeleton`, `loading`, `join`, `form-control`, `input`, `select`). Use `wsa-*` classes instead. DaisyUI base tokens (`bg-base-100`, `text-base-content`) are acceptable for page-level usage since the `dark-leather` theme has matching colors.
- **Don't** use `bg-base-*` or `text-base-content` inside card components. Prefer `wsa-*` utilities (`bg-wsa-card`, `text-wsa-text`). The base tokens are only for page-level backgrounds (App.vue) where the DaisyUI `dark-leather` theme provides correct leather values.
- **Don't** use cold blues or grays for generic UI (borders, backgrounds, muted text). Keep everything in the warm brown/gold family. The only blues allowed are Alliance faction blue (`#3399ff`) and iLvl accent (`#88ccff`).
- **Don't** use `shadow-sm` or Tailwind's default box shadows. Use the inset shadow from `.wsa-card` instead. External drop shadows feel flat against this aesthetic.
- **Don't** put interactive elements (buttons, links) inside other interactive elements (a common ARIA issue with `<button>` wrappers in collapsible cards).
- **Don't** hard-code WoW class colors. Always use `CLASS_COLORS[classId]` from `@/utils/wowConstants`.
- **Don't** use high-contrast hover states like `hover:bg-white/10`. Use `hover:brightness-110` or `hover:underline` for subtlety.
- **Don't** use rounded corners larger than `rounded-md` (`8px`) on cards. The `.wsa-card` uses `border-radius: 0.5rem` (8px). Larger radii look too modern/bubbly.
- **Don't** add excessive animations. The theme uses animations sparingly (bar shimmer on mount, gentle glow pulses). Avoid bounce, slide-in, or attention-seeking motion.
