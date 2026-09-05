# UI/UX audit — 2026-09-05

Scope: deployed FE on :8092, visual pass at 1440px and 390px (home, character detail ×5 tabs, guild detail, guilds, characters, mythic+, meta, raids, leaderboards, login, 404) plus a code-level audit of `src/` across three dimensions (flows/states, design-system drift, accessibility). Severity: **H** high / **M** medium / **L** low. File refs are relative to `frontend/src`.

## Verdict

The visual language is coherent and the data pages (Meta, Characters, Guilds index) are strong. The weak spots are **state handling** (errors and loading blow away rendered content, empty states missing or mislabeled), **the character header telling two stories about M+ rating**, **mobile tables hiding the columns people came for**, and a set of **accessibility gaps** concentrated in the custom widgets (talent tree, equipment bar, comboboxes, tab strip). Design-system drift is real but shallow: tokens are sound, components just work around three missing sizes.

## Top 12 (fix these first)

| # | Sev | Finding | Where |
|---|-----|---------|-------|
| 1 | H | Character header shows last season's rating as the hero number ("M+ RATING 2,723") and repeats it in the stat pill, while the sub-line says "not yet rated this season" and the Dungeons tab shows S2 = "—" / 0-0-0. Prior-season rating is dressed as current. | `components/character/ScoreHeader.vue:46`, `CharacterStatPills.vue` |
| 2 | H | A transient error (429, network blip) on a background refetch **replaces an already-rendered profile** with the error card because the `ErrorState` branch precedes `v-else-if="character"`. Same in guild detail. | `pages/CharacterDetailLayout.vue:3-7`, `pages/GuildDetailPage.vue:68-72` |
| 3 | H | Character→character navigation blanks header + tabs and shows "Fetching from Blizzard for the first time…" for a cached 200; `usePollingLookup` lacks `keepPreviousData` (guild lookup has it). | `composables/usePollingLookup.ts:63-84`, `CharacterDetailLayout.vue:50-55` |
| 4 | H | No router `scrollBehavior`: tab switches, leaderboard drilldowns and back-nav keep the old scroll offset. | `router/index.ts:188-191` |
| 5 | H | Three stats cards render **errors as empty states** ("No run data yet"), and `RaidsPage` has no error/empty handling at all. | `stats/TopRunsLeaderboard.vue:40`, `HighestKeysCard.vue:26`, `RaidHeatmapCard.vue:176`, `pages/RaidsPage.vue:6-11` |
| 6 | H | Mobile tables hide the payload: leaderboard rating column is off-screen (`min-w-[520px]`, no scroll hint); guild roster hides iLvl + M+ below `sm`; Mythic+ team column clipped. Meta already ships a "Scroll sideways for more →" hint — reuse it. | `leaderboards/LeaderboardTable.vue:21`, `guild/RosterTable.vue:164,171`, `stats/TopRunsTable.vue:43` |
| 7 | H | Dungeons tab for an unrated character renders a **table header with zero rows** and no empty-state copy; raids tab stacks five zero-kill instance cards at full height. | `character/pve/MythicPlusBestPerDungeon.vue:86-99`, `CharacterRaidsTab.vue` |
| 8 | H | `.wsa-input:focus { outline: none }` (components layer) beats the global focus ring (base layer); the only focus cue on every text field is a ~1.9:1 border shift. | `style.css:186-189` vs `:38-41` |
| 9 | H | No `aria-live` anywhere: polling, syncing, freshness and refresh-cooldown text mutate silently. Two `role="alert"` total in the app. | `feedback/PollingState.vue:13-17`, `SyncingBadge.vue`, `FreshnessSummary.vue:7-11`, `RefreshButton.vue:11` |
| 10 | H | Talent nodes and compact-equipment icons are unnamed links (icon injected by Wowhead, no text/aria-label); compact bar is `tabindex="-1"`, so keyboard users can't reach any item. | `character/talents/TalentNode.vue:2-17`, `character/CompactEquipmentIcon.vue:11-19` |
| 11 | H | Disabled button state is `opacity: .3` → ≈1.6:1; `RefreshButton` uses it for essential copy ("Refresh in 5m"). Home/Characters "Find character" also looks disabled with no hint that a realm must be picked. | `style.css:163-166`, `feedback/RefreshButton.vue:41`, `form/LookupForm.vue:54` |
| 12 | H | Filter/page/tab state lost on refresh and not shareable on five surfaces: roster page+filter, Meta week/region/spec, dungeons view+season, archive pagination, top-runs pagination. (Leaderboards does this right — copy its `go()` pattern.) | `pages/GuildDetailPage.vue:23,25`, `pages/MetaPage.vue:12-15`, `pages/character/CharacterDungeonsTab.vue:98,125`, `pages/MythicPlusArchivePage.vue:17`, `stats/TopRunsLeaderboard.vue:9` |

## Flows, states, copy (M/L)

- **M** `document.title` never changes per route — every tab reads "Peon — WoW Character & Guild Lookup". Add a `useTitle` in each page / the character layout.
- **M** Stats pages pass `hide-retry`; the only recovery from a failed fetch is a browser reload. `pages/CharacterSearchPage.vue:105-110`, `pages/MythicPlusPage.vue:60-65`.
- **M** 404 on a character shows "Try again", which deterministically re-404s; needs a "Search another character" path. `feedback/ErrorState.vue:23-33`.
- **M** Leaderboards error is a bare red sentence, no retry. `pages/LeaderboardsPage.vue:248`.
- **M** Nav search silently treats guild names as characters (unmatched → `/?q=` → character form only). `layout/NavSearch.vue:35-39`.
- **M** OAuth callback lands on Profile before `fetchMe` completes, so the first thing a freshly connected user sees is "No characters yet". `pages/BlizzardOAuthCallbackPage.vue:63-68`, `ProfilePage.vue:76-90`. Profile also renders blank when `user` is null (`ProfilePage.vue:2`), and its recruitment button never reflects state (`:144-155`).
- **M** Forgot-password reports success on transport failure. `pages/ForgotPasswordPage.vue:55-61`.
- **M** `LookupForm`: no remembered region/realm, no autofocus, no reason for the disabled submit.
- **L** Auth errors shown twice (inline card + identical toast). `LoginPage.vue:75-77`, `RegisterPage.vue:86-88`, `ResetPasswordPage.vue:92-94`.
- **L** Copy: "M+ Score" vs "M+ Rating" vs "M+"; "Avg Item Level" / "iLvl" / "ilvl"; "Mythic+" page vs "M+ Meta" page; "This endpoint is rate-limited." (`ErrorState.vue:109`); roster always says "No members match your filter" even unfiltered (`RosterTable.vue:130`). Guild stats card shows the raw canonical name (`mokuren`) instead of display-cased (`guild/GuildStatsSection.vue:49`) — violates the identity-casing rule in CLAUDE.md.
- **L** Unlabeled numbers on data pages: home recents "328 #6" (rank?), PvP "855 9–19" (W–L), Performance-by-class two bare columns (2699 / 283.7) and an unexplained colored bar, "+20✦" star, "Top M+ Rating" shows `4260.0` while everywhere else formats `4,260`.
- **L** Nav IA: Mythic+ / Leaderboards / Meta are three doors into the same M+ world, split by Raids in between. Consider grouping (M+ → Overview · Leaderboards · Meta) or at least ordering them adjacently.
- **L** Home hero is decoration only: no h1, no one-line "what is Peon". First-time visitors get two forms and no framing.

## Mobile (390px)

- Character tab strip `flex-wrap`s into three rows (`character/CharacterTabStrip.vue:2`); header external-link icons wrap to a second line; stat pills wrap 2+1+1.
- Guild detail: three header KPI boxes + six stat cards + Best Keys = ~1,300px of scroll before the roster.
- Home recents: "· The Maelstrom (EU) · L90" wraps with a leading separator.
- Tables: see #6. Only `MetaDungeonTable` has the sideways-scroll hint.

## Design-system drift (M/L)

- **M** No semantic tokens (`success/warning/error/info`): 57 raw Tailwind palette utilities (`text-red-300`, `text-emerald-400`, `border-red-800/50`…) and `#ff4444` hard-coded as the error color in 6 files (`LoginPage.vue:29`, `RegisterPage.vue:43`, `ResetPasswordPage.vue:8,41`, `BlizzardOAuthCallbackPage.vue:11`, `form/RealmCombobox.vue:169`).
- **M** Card-title size is `text-[15px]` ×25 with no token; 9 elements carry two conflicting size classes (`text-[15px] text-lg`) so the result depends on CSS emit order (`LoginPage.vue:4`, `GuildSearchPage.vue:66,125`, `stats/TopPerformersCard.vue:26`, `guild/GuildSummaryCard.vue:3`…). Add `.wsa-card-title`.
- **M** 136 `!important` utilities, mostly `!w-3 !h-3` spinner resizing and `!p-3` card padding — the tell for missing `.wsa-spinner--sm` and `.wsa-card--tight` modifiers. `wsa-card` padding is overridden on 34 of 93 uses across six values.
- **M** Five table implementations share no primitives (header case, padding, row-border alpha, hover all differ); sortable-`<th>` markup duplicated 6×. Extract `.wsa-table` + `SortableTh.vue`.
- **M** Eight distinct empty-state markups; `EmptyTab.vue` used 4×. Twelve hand-rolled `animate-pulse` skeletons bypass `wsa-skeleton`.
- **M** Chart.js theme re-hardcodes four palette hexes (`stats/StatsHeroCard.vue:46,63-66`); `FactionSplitCard.vue:17,77` inlines six faction hexes while `FactionSplitBar` uses `FACTION_COLORS`.
- **L** `docs/design-guide.md` §4 documents `.stats-card` / `.stats-card-title`, which don't exist in `style.css`.
- **L** Card titles are h2 ×11 / h3 ×19 / h4 ×1 / span ×1 for the same visual rank; six routes render no h1 in loading/error states.
- **L** 78 arbitrary font sizes (`text-[10px]` ×38, `text-[9px]` ×6); 7 radius values; `bg-black/20|25|30` for one "inset row" intent. Two DaisyUI leaks (`checkbox checkbox-xs`, `link` in `character/AchievementsList.vue:11,19`).

## Accessibility (beyond the top 12)

- **M** `CharacterTabStrip` declares `role="tablist"/"tab"` but has no tabpanel, `aria-controls`, roving tabindex or arrow keys. Use nav links + `aria-current` like `AppNav` does.
- **M** Comboboxes lack `aria-controls`/`aria-activedescendant`; options have no ids; `role="listbox"` wraps a `<ul>` instead of being on it. `form/RealmCombobox.vue:150-181`, `form/NameAutocomplete.vue:160-190`.
- **M** Mouse-only interactions: `CompactEquipmentBar.vue:3-6` (div `@click`), `CharacterTitlesTab.vue:52-61` (li `@click`), `RaidHeatmapCard.vue:164-171` (hover-only tooltip), `SpecPopularityCard.vue:88-99` (title-only bars). Meta comp rows are icon strips with no names at all.
- **M** Contrast: `text-wsa-disabled` (#806B40) ≈3.2–3.6:1 used for essential ≤12px text (`PollingState.vue:14-17`, `ScoreHeader.vue:78-80`, `ui/PaginationControls.vue:3,20`, `stats/CoverageStamp.vue:18`); `text-wsa-muted/50` at 10px ≈2.2:1 (`AchievementsList.vue:59`), `/70` ≈3.2:1 (`CharacterStatPills.vue`, `ProfessionsStrip.vue:18`).
- **M** Zero `prefers-reduced-motion` handling; infinite spinners, `battle-pulse`, `emblem-glow`, `bar-shimmer` keyframes.
- **M** Touch targets: `.wsa-btn` ≈28px tall (`style.css:150-157`), filter pills ≈20px, talent nodes 28×28.
- **M** `PaginationControls` page buttons have no `aria-label`/`aria-current`.
- **L** Run-detail `<dialog>` unnamed (`MythicPlusAllRuns.vue:60-64`); member pills name via `title` only; no skip-to-content link (`App.vue:2-9`).

## What's working (keep)

- Sync-pending UX: tiered messaging, live clock, queue depth, "Check now" escape hatch (`PollingState.vue:60-90`). Server-derived refresh cooldown from `available_at`.
- Leaderboard state lives entirely in the URL, with the region-switch-clears-realm guard.
- Basic-tier characters are explained, not silently degraded.
- Token layer is sound (RGB triples + `<alpha-value>`, only 14 arbitrary hexes in 112 files); DaisyUI ban effectively enforced; class colors fully centralized.
- Real `<table>` markup everywhere; `RosterTable` is a model sortable table (`aria-sort`, Enter+Space, focus-visible). `AppNav` disclosure is textbook. Decorative images consistently `alt="" aria-hidden`.
- `/` shortcut correctly guards editable targets.

## Suggested packs

1. **State & navigation correctness** (#2, #3, #4, #5, #7, stats retry, 404 path, per-route titles) — small diffs, biggest trust gain.
2. **Character header honesty + mobile tables** (#1, #6, tab strip scroll, scroll hint component, roster columns) — the two things a real user hits within 30 seconds.
3. **A11y baseline** (#8, #9, #10, #11, reduced-motion, tab-strip roles, combobox wiring, disabled/contrast tokens) — mostly `style.css` + four components.
4. **Design-system consolidation** (`.wsa-card-title`, `--tight`, spinner sizes, semantic color tokens, `.wsa-table`, `EmptyState`) — do after packs 1–3 so the new components land on stable tokens.
