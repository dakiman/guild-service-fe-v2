# Nav Fundamentals + Quick Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the nav's four defects (tablet overflow, lost active state, redundant Home link, no search off the home page) by adding a character quick-search to `AppNav.vue`, backed by the existing autocomplete.

**Architecture:** Pull the link list and active-state rule out of `AppNav.vue` into a pure module (`navLinks.ts`). Wrap the existing `NameAutocomplete` in a new `NavSearch.vue` that owns navigation and clearing. A tiny `useSlashShortcut` composable focuses the search on `/`. The "Enter with no match" case hands off to the home page via `?q=`, which prefills the existing `LookupForm`.

**Tech Stack:** Vue 3 `<script setup>` + TS, vue-router 4, Pinia, TanStack Vue Query, Tailwind + `wsa-*` classes, Vitest + @vue/test-utils (jsdom), lucide-vue-next icons, Playwright MCP for browser checks.

**Spec:** `frontend/docs/superpowers/specs/2026-09-03-nav-quick-search-design.md`

## Global Constraints

- All work is under `frontend/`. **Do not touch `backend/`** — another session may be working there. Stage files by explicit path, never `git add -A` at the repo root.
- Run every command from `/home/dakiman/dev/guild-service-v2/frontend` unless stated otherwise.
- **Commit messages: no Claude/Anthropic attribution of any kind** — no `Co-Authored-By: Claude`, no "Generated with Claude Code" lines, no session links. This is an absolute rule from the user's global CLAUDE.md and overrides any harness default. Commit with `git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit …`. Prefix messages `FE:`.
- Use `wsa-*` classes and Tailwind utilities only; **never** DaisyUI component classes (`btn`, `navbar`, `input`, …) — see `frontend/docs/design-guide.md`.
- Collapse breakpoint is **`lg` (1024px)** everywhere in the nav. Any `md:` left in `AppNav.vue` is a bug.
- Nav link set after this plan is exactly: Guilds, Characters, Mythic+, Leaderboards, Meta, Raids (no Home).
- Route names are fixed: `home`, `guild-search`, `guild-detail`, `character-search`, `character-detail` (params `region`, `realm`, `name`), `mythic-plus`, `mythic-plus-archive`, `leaderboards*`, `meta`, `raids`. Never invent new route names.
- Tests live next to code in `__tests__/*.test.ts` (Vitest `include` is `src/**/*.test.ts`). Run a single file with `npx vitest run <path>`; the full suite is `npm test` (~50 s, 434 tests before this plan).
- `npm run build` runs `vue-tsc -b` first; type errors block the build. **Building writes into `frontend/dist`, which nginx serves live on :8092** — so a build is a deploy. Only the final task builds.
- Playwright screenshots land in the repo root as stray `.png` files plus a `.playwright-mcp/` dir. Delete both before any commit.
- Task order: Tasks 1, 2, 3, 5 are **parallel-safe** (disjoint files). Task 4 needs Task 3. Task 6 needs Task 2. Task 7 needs Tasks 1, 5, 6. Task 8 needs everything and is **orchestrator + human — never a subagent** (it deploys).

---

### Task 1: Nav link registry + active-state rule

**Files:**
- Create: `src/components/layout/navLinks.ts`
- Test: `src/components/layout/__tests__/navLinks.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `NAV_LINKS: readonly NavLink[]`, `interface NavLink { name: string; label: string; prefixes: readonly string[] }`, `isNavActive(link: NavLink, routeName: unknown): boolean`. Task 7 imports all three.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/layout/__tests__/navLinks.test.ts
import { describe, it, expect } from 'vitest'
import { NAV_LINKS, isNavActive } from '../navLinks'

function link(name: string) {
  const l = NAV_LINKS.find((l) => l.name === name)
  if (!l) throw new Error(`no nav link ${name}`)
  return l
}

describe('NAV_LINKS', () => {
  it('has exactly the six links, in order, with no Home', () => {
    expect(NAV_LINKS.map((l) => l.label)).toEqual([
      'Guilds',
      'Characters',
      'Mythic+',
      'Leaderboards',
      'Meta',
      'Raids',
    ])
  })
})

describe('isNavActive', () => {
  it.each([
    ['guild-search', 'guild-search'],
    ['guild-search', 'guild-detail'],
    ['character-search', 'character-search'],
    ['character-search', 'character-detail'],
    ['character-search', 'character-talents'],
    ['character-search', 'character-collections-mounts'],
    ['mythic-plus', 'mythic-plus'],
    ['mythic-plus', 'mythic-plus-archive'],
    ['leaderboards', 'leaderboards'],
    ['leaderboards', 'leaderboards-region'],
    ['leaderboards', 'leaderboards-season-spec'],
    ['meta', 'meta'],
    ['raids', 'raids'],
  ])('%s is active on route %s', (navName, routeName) => {
    expect(isNavActive(link(navName), routeName)).toBe(true)
  })

  it.each([
    ['guild-search', 'character-detail'],
    ['character-search', 'guild-detail'],
    ['mythic-plus', 'meta'],
    ['meta', 'mythic-plus'],
    ['raids', 'character-raids'],
    ['leaderboards', 'home'],
  ])('%s is NOT active on route %s', (navName, routeName) => {
    expect(isNavActive(link(navName), routeName)).toBe(false)
  })

  it('is never active for a missing or non-string route name', () => {
    expect(isNavActive(link('meta'), undefined)).toBe(false)
    expect(isNavActive(link('meta'), null)).toBe(false)
    expect(isNavActive(link('meta'), Symbol('x'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/__tests__/navLinks.test.ts`
Expected: FAIL — `Failed to resolve import "../navLinks"`.

- [ ] **Step 3: Write the module**

```ts
// src/components/layout/navLinks.ts
/**
 * Top-level navigation entries and the route-name prefixes each one "owns".
 *
 * | Nav entry     | Active when route.name is / starts with                     |
 * |---------------|-------------------------------------------------------------|
 * | Guilds        | guild-search, guild-detail                                  |
 * | Characters    | character-  (character-search + every character-* detail)   |
 * | Mythic+       | mythic-plus (also mythic-plus-archive)                      |
 * | Leaderboards  | leaderboards (region/realm/class/spec + leaderboards-season)|
 * | Meta          | meta                                                        |
 * | Raids         | raids  (NOT character-raids — that belongs to Characters)   |
 */
export interface NavLink {
  /** Route name the link navigates to. */
  name: string
  label: string
  /** Route-name prefixes that count as "on this section". */
  prefixes: readonly string[]
}

export const NAV_LINKS: readonly NavLink[] = [
  { name: 'guild-search', label: 'Guilds', prefixes: ['guild-'] },
  { name: 'character-search', label: 'Characters', prefixes: ['character-'] },
  { name: 'mythic-plus', label: 'Mythic+', prefixes: ['mythic-plus'] },
  { name: 'leaderboards', label: 'Leaderboards', prefixes: ['leaderboards'] },
  { name: 'meta', label: 'Meta', prefixes: ['meta'] },
  { name: 'raids', label: 'Raids', prefixes: ['raids'] },
]

export function isNavActive(link: NavLink, routeName: unknown): boolean {
  if (typeof routeName !== 'string') return false
  return link.prefixes.some((p) => routeName === p || routeName.startsWith(p))
}
```

Note the `raids` prefix: `'character-raids'.startsWith('raids')` is false, so the negative test passes without special-casing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/layout/__tests__/navLinks.test.ts`
Expected: PASS, 3 test groups, all green.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/navLinks.ts src/components/layout/__tests__/navLinks.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: nav link registry with prefix-based active state"
```

---

### Task 2: `NameAutocomplete` — `submit` emit, `focus()` expose, styling props

**Files:**
- Modify: `src/components/form/NameAutocomplete.vue` (props block ~line 16, emits ~line 21, `onKeydown` Enter branch ~line 96, `placeholder` computed ~line 119, template input ~line 130 and dropdown div ~line 148)
- Test: `src/components/form/__tests__/nameAutocompleteSubmit.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces (used by Task 6):
  - new optional props `placeholder?: string`, `inputClass?: string`, `dropdownClass?: string`
  - new emit `submit: [value: string]` — fired on Enter when no suggestion is highlighted/open; value is `modelValue.trim()`
  - `defineExpose({ focus })` where `focus(): void` focuses the input
- Existing consumer `LookupForm.vue` is unaffected: it ignores `submit`, and the native form submit on Enter still fires because the new branch does not call `preventDefault()`.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/form/__tests__/nameAutocompleteSubmit.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/characters', () => ({
  suggestCharacters: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/api/guilds', () => ({
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))

import NameAutocomplete from '@/components/form/NameAutocomplete.vue'

function mountIt(props: Record<string, unknown> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(NameAutocomplete, {
    props: { kind: 'character', modelValue: '', ...props },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { ClassIcon: true, FactionBadge: true, RatingChip: true },
    },
    attachTo: document.body,
  })
}

describe('NameAutocomplete submit / focus / styling', () => {
  it('emits submit with the trimmed value on Enter when nothing is highlighted', async () => {
    const w = mountIt({ modelValue: '  Arthas ' })
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('submit')).toEqual([['Arthas']])
    expect(w.emitted('pick')).toBeUndefined()
    w.unmount()
  })

  it('does not emit submit when the value is empty', async () => {
    const w = mountIt({ modelValue: '   ' })
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('submit')).toBeUndefined()
    w.unmount()
  })

  it('exposes focus() that focuses the input', () => {
    const w = mountIt()
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.get('input').element)
    w.unmount()
  })

  it('applies placeholder and inputClass overrides', () => {
    const w = mountIt({ placeholder: 'Find a character…', inputClass: 'pl-8' })
    const input = w.get('input')
    expect(input.attributes('placeholder')).toBe('Find a character…')
    expect(input.attributes('aria-label')).toBe('Find a character…')
    expect(input.classes()).toContain('pl-8')
    w.unmount()
  })

  it('keeps the default placeholder per kind', () => {
    const w = mountIt({ kind: 'guild' })
    expect(w.get('input').attributes('placeholder')).toBe('Guild name')
    w.unmount()
  })

  it('Escape with the dropdown closed blurs the input', async () => {
    const w = mountIt({ modelValue: '' })
    const input = w.get('input')
    ;(input.element as HTMLInputElement).focus()
    expect(document.activeElement).toBe(input.element)
    await input.trigger('keydown', { key: 'Escape' })
    expect(document.activeElement).not.toBe(input.element)
    w.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/form/__tests__/nameAutocompleteSubmit.test.ts`
Expected: FAIL — the `submit` emit assertions and `focus` expose fail (`w.vm.focus is not a function`), and the placeholder override test fails.

- [ ] **Step 3: Implement**

Edit `src/components/form/NameAutocomplete.vue`:

Props (replace the existing `defineProps` block):

```ts
const props = defineProps<{
  kind: 'character' | 'guild'
  modelValue: string
  /** Overrides the per-kind default placeholder (also used as aria-label). */
  placeholder?: string
  /** Extra classes on the <input> (e.g. padding for an icon). */
  inputClass?: string
  /** Positioning classes for the dropdown; default anchors it to both edges of the wrapper. */
  dropdownClass?: string
}>()
```

Emits (replace the existing `defineEmits` block):

```ts
const emit = defineEmits<{
  'update:modelValue': [value: string]
  pick: [payload: { region: Region; realm: string; name: string }]
  /** Enter pressed with no highlighted suggestion. Value is trimmed; never fired when empty. */
  submit: [value: string]
}>()
```

Enter branch inside `onKeydown` (replace the existing `else if (e.key === 'Enter') { … }`):

```ts
  } else if (e.key === 'Enter') {
    if (open.value && suggestions.value[highlightIndex.value]) {
      e.preventDefault()
      pick(suggestions.value[highlightIndex.value])
    } else {
      const value = props.modelValue.trim()
      if (value) emit('submit', value)
      // No preventDefault: inside LookupForm the native form submit still runs.
    }
  } else if (e.key === 'Escape') {
    // First Escape closes the dropdown; a second one (dropdown already closed) leaves the field.
    if (open.value) open.value = false
    else inputEl.value?.blur()
  }
```

(The existing `else if (e.key === 'Escape') { open.value = false }` is replaced by the branch above — it is the last branch in `onKeydown`.)

Placeholder computed (replace):

```ts
const placeholder = computed(
  () => props.placeholder ?? (props.kind === 'guild' ? 'Guild name' : 'Character name'),
)
```

Add `focus` + expose right after the `placeholder` computed:

```ts
function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus })
```

Template — the input's class binding becomes:

```html
    <input
      ref="inputEl"
      type="text"
      class="wsa-input !py-1.5 text-sm"
      :class="inputClass"
```

Template — the dropdown container loses its hard-coded `left-0 right-0` and gains a bound class:

```html
    <div
      v-if="open"
      class="absolute mt-1 z-20 rounded-md border-2 border-wsa-border shadow-lg max-h-72 overflow-auto"
      :class="dropdownClass ?? 'left-0 right-0'"
      style="background: rgb(var(--wsa-bg))"
      role="listbox"
    >
```

- [ ] **Step 4: Run the new test and the existing autocomplete test**

Run: `npx vitest run src/components/form/__tests__/`
Expected: PASS — both files green (`nameAutocompleteSignal` must still pass).

- [ ] **Step 5: Type-check**

Run: `npx vue-tsc -b --noEmit 2>&1 | head -20`
Expected: no output (no errors).

- [ ] **Step 6: Commit**

```bash
git add src/components/form/NameAutocomplete.vue src/components/form/__tests__/nameAutocompleteSubmit.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: NameAutocomplete gains submit emit, focus() and styling props for the nav search"
```

---

### Task 3: `RealmCombobox.focus()` + `LookupForm` `initialName` / `focusRealm()`

**Files:**
- Modify: `src/components/form/RealmCombobox.vue` (add expose after the last function in `<script setup>`, ~line 131)
- Modify: `src/components/form/LookupForm.vue` (whole `<script setup>` + the `RealmCombobox` element)
- Test: `src/components/form/__tests__/lookupFormPrefill.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Task 4):
  - `LookupForm` prop `initialName?: string` — applied once at setup to the local `name` ref.
  - `LookupForm` exposes `focusRealm(): void`.
  - `RealmCombobox` exposes `focus(): void`.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/form/__tests__/lookupFormPrefill.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/characters', () => ({
  suggestCharacters: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/api/guilds', () => ({
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/composables/usePveGameData', () => ({
  useRealmIndex: () => ({ data: { value: { realms: [] } }, isLoading: { value: false } }),
}))

import LookupForm from '@/components/form/LookupForm.vue'

function mountIt(props: Record<string, unknown> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(LookupForm, {
    props: { kind: 'character', ...props },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { ClassIcon: true, FactionBadge: true, RatingChip: true },
    },
    attachTo: document.body,
  })
}

describe('LookupForm prefill', () => {
  it('seeds the name input from initialName', () => {
    const w = mountIt({ initialName: 'arthas' })
    const nameInput = w.get('input[aria-label="Character name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('arthas')
    w.unmount()
  })

  it('leaves the name empty without initialName', () => {
    const w = mountIt()
    const nameInput = w.get('input[aria-label="Character name"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('')
    w.unmount()
  })

  it('exposes focusRealm() that focuses the realm input', () => {
    const w = mountIt({ initialName: 'arthas' })
    ;(w.vm as unknown as { focusRealm: () => void }).focusRealm()
    expect(document.activeElement).toBe(w.get('input[aria-label="Realm"]').element)
    w.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/form/__tests__/lookupFormPrefill.test.ts`
Expected: FAIL — first test gets `''` instead of `'arthas'`; third test `focusRealm is not a function`.

If the `useRealmIndex` mock shape mismatches what `RealmCombobox` reads (check `src/components/form/RealmCombobox.vue` lines ~22-45 and `src/composables/usePveGameData.ts`), extend the mock with the extra fields it destructures — keep `data.value.realms` as an empty array.

- [ ] **Step 3: Implement `RealmCombobox.focus()`**

Append to the end of `<script setup>` in `src/components/form/RealmCombobox.vue` (after the last function, before `</script>`):

```ts
function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus })
```

- [ ] **Step 4: Implement `LookupForm` changes**

Replace the `<script setup>` of `src/components/form/LookupForm.vue` with:

```ts
<script setup lang="ts">
import { ref, computed } from 'vue'
import RealmCombobox, { type RealmPick } from '@/components/form/RealmCombobox.vue'
import NameAutocomplete from '@/components/form/NameAutocomplete.vue'
import type { Region } from '@/types/api'

const props = defineProps<{
  kind: 'character' | 'guild'
  /** Seeds the name field once at mount (nav quick-search hand-off). */
  initialName?: string
}>()
const emit = defineEmits<{
  submit: [payload: { region: Region; realm: string; name: string }]
  pick: [payload: { region: Region; realm: string; name: string }]
}>()

const selectedRealm = ref<RealmPick | null>(null)
const name = ref(props.initialName ?? '')
const realmEl = ref<InstanceType<typeof RealmCombobox> | null>(null)

const canSubmit = computed(() => !!selectedRealm.value && !!name.value.trim())

function onSubmit() {
  if (!selectedRealm.value || !name.value.trim()) return
  emit('submit', {
    region: selectedRealm.value.region,
    realm: selectedRealm.value.slug,
    name: name.value.trim().toLocaleLowerCase(),
  })
}

function onPick(payload: { region: Region; realm: string; name: string }) {
  emit('pick', payload)
}

function focusRealm() {
  realmEl.value?.focus()
}

defineExpose({ focusRealm })
</script>
```

In the template, add `ref="realmEl"` to the realm combobox:

```html
      <RealmCombobox ref="realmEl" v-model="selectedRealm" class="flex-1 min-w-0" />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/form/__tests__/lookupFormPrefill.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Type-check and commit**

Run: `npx vue-tsc -b --noEmit 2>&1 | head -20` — expect no output.

```bash
git add src/components/form/RealmCombobox.vue src/components/form/LookupForm.vue src/components/form/__tests__/lookupFormPrefill.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: LookupForm initialName prop + focusRealm(), RealmCombobox focus()"
```

---

### Task 4: Home page consumes `?q=` (prefill + focus realm + strip param)

**Files:**
- Modify: `src/pages/HomePage.vue` (template line 12 — the character `LookupForm`; `<script setup>` imports ~line 94-108 and the `useRouter()` line)
- Test: `src/pages/__tests__/homePagePrefill.test.ts`

**Interfaces:**
- Consumes: `LookupForm` prop `initialName` and exposed `focusRealm()` (Task 3).
- Produces: the contract Task 6 relies on — navigating to `{ name: 'home', query: { q } }` prefills the character form. Nothing else exported.

- [ ] **Step 1: Write the failing test**

```ts
// src/pages/__tests__/homePagePrefill.test.ts
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/guilds', () => ({
  fetchPopularGuilds: vi.fn().mockResolvedValue([]),
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/api/characters', () => ({
  fetchPopularCharacters: vi.fn().mockResolvedValue([]),
  suggestCharacters: vi.fn().mockResolvedValue([]),
}))

import HomePage from '@/pages/HomePage.vue'

const focusRealm = vi.fn()
const LookupFormStub = defineComponent({
  name: 'LookupForm',
  props: { kind: { type: String, required: true }, initialName: { type: String, default: undefined } },
  setup(props, { expose }) {
    expose({ focusRealm })
    return () => h('div', { 'data-testid': `lookup-${props.kind}`, 'data-initial': props.initialName ?? '' })
  },
})

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomePage },
      { path: '/characters/:region/:realm/:name', name: 'character-detail', component: { template: '<div />' } },
      { path: '/guilds/:region/:realm/:name', name: 'guild-detail', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const w = mount(HomePage, {
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient }]],
      stubs: { LookupForm: LookupFormStub, ClassIcon: true, RatingChip: true, GuildSummaryCard: true, ErrorState: true },
    },
  })
  await flushPromises()
  return { w, router }
}

describe('HomePage ?q= prefill', () => {
  it('prefills the character form, focuses the realm picker and strips q from the URL', async () => {
    focusRealm.mockClear()
    const { w, router } = await mountAt('/?q=arthas')
    expect(w.get('[data-testid="lookup-character"]').attributes('data-initial')).toBe('arthas')
    expect(w.get('[data-testid="lookup-guild"]').attributes('data-initial')).toBe('')
    expect(focusRealm).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query.q).toBeUndefined()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('does nothing special without q', async () => {
    focusRealm.mockClear()
    const { w } = await mountAt('/')
    expect(w.get('[data-testid="lookup-character"]').attributes('data-initial')).toBe('')
    expect(focusRealm).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/__tests__/homePagePrefill.test.ts`
Expected: FAIL — `data-initial` is `''` for the character form and `focusRealm` not called.

If mounting fails because `HomePage.vue` imports something else from `@/api/*` not covered by the mocks, add that export to the relevant `vi.mock` as `vi.fn().mockResolvedValue([])` — do not change `HomePage.vue` to work around the test.

- [ ] **Step 3: Implement**

In `src/pages/HomePage.vue` `<script setup>`:

Change the vue-router import and add `ref`, `onMounted`, `nextTick`:

```ts
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
```

Right after `const router = useRouter()` add:

```ts
const route = useRoute()

// Nav quick-search hand-off: `/?q=<name>` seeds the character form once, then the
// param is stripped so a refresh doesn't re-apply it.
const initialCharacterName = typeof route.query.q === 'string' ? route.query.q.trim() : ''
const characterForm = ref<{ focusRealm: () => void } | null>(null)

onMounted(async () => {
  if (!initialCharacterName) return
  await router.replace({ name: 'home' })
  await nextTick()
  characterForm.value?.focusRealm()
})
```

In the template, the character form becomes:

```html
        <LookupForm
          ref="characterForm"
          kind="character"
          :initial-name="initialCharacterName || undefined"
          @submit="onCharacterSubmit"
          @pick="onCharacterSubmit"
        />
```

The guild form is unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/__tests__/homePagePrefill.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Type-check and commit**

Run: `npx vue-tsc -b --noEmit 2>&1 | head -20` — expect no output.

```bash
git add src/pages/HomePage.vue src/pages/__tests__/homePagePrefill.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: home page prefills the character form from ?q= and focuses the realm picker"
```

---

### Task 5: `useSlashShortcut` composable

**Files:**
- Create: `src/composables/useSlashShortcut.ts`
- Test: `src/composables/__tests__/useSlashShortcut.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Task 7): `useSlashShortcut(onSlash: () => void): void` — registers a document `keydown` listener on mount, removes it on unmount. Also exports `isEditableTarget(target: EventTarget | null): boolean` for testing.

- [ ] **Step 1: Write the failing test**

```ts
// src/composables/__tests__/useSlashShortcut.test.ts
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useSlashShortcut, isEditableTarget } from '../useSlashShortcut'

function mountWith(handler: () => void) {
  const Comp = defineComponent({
    setup() {
      useSlashShortcut(handler)
      return () => h('div')
    },
  })
  return mount(Comp, { attachTo: document.body })
}

function press(key: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(ev)
  return ev
}

describe('useSlashShortcut', () => {
  it('calls the handler and prevents default on a bare "/"', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    const ev = press('/')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(ev.defaultPrevented).toBe(true)
    w.unmount()
  })

  it('ignores other keys and modified "/"', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    press('a')
    press('/', document.body, { ctrlKey: true })
    press('/', document.body, { metaKey: true })
    press('/', document.body, { altKey: true })
    expect(handler).not.toHaveBeenCalled()
    w.unmount()
  })

  it('ignores "/" typed into an input, textarea, select or contenteditable', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    for (const tag of ['input', 'textarea', 'select']) {
      const el = document.createElement(tag)
      document.body.appendChild(el)
      const ev = press('/', el)
      expect(ev.defaultPrevented).toBe(false)
      el.remove()
    }
    const ce = document.createElement('div')
    ce.setAttribute('contenteditable', 'true')
    document.body.appendChild(ce)
    press('/', ce)
    ce.remove()
    expect(handler).not.toHaveBeenCalled()
    w.unmount()
  })

  it('stops listening after unmount', () => {
    const handler = vi.fn()
    const w = mountWith(handler)
    w.unmount()
    press('/')
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('isEditableTarget', () => {
  it('is false for null and plain elements', () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget(document.createElement('div'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/composables/__tests__/useSlashShortcut.test.ts`
Expected: FAIL — `Failed to resolve import "../useSlashShortcut"`.

- [ ] **Step 3: Implement**

```ts
// src/composables/useSlashShortcut.ts
import { onMounted, onBeforeUnmount } from 'vue'

/** True when keystrokes on `target` are text input (so "/" must not be hijacked). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * GitHub-style "/" shortcut: calls `onSlash` when "/" is pressed outside an editable
 * element with no modifier held. Registered on the document for the component's lifetime.
 */
export function useSlashShortcut(onSlash: () => void): void {
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
    if (isEditableTarget(e.target)) return
    e.preventDefault()
    onSlash()
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/composables/__tests__/useSlashShortcut.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useSlashShortcut.ts src/composables/__tests__/useSlashShortcut.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: useSlashShortcut composable"
```

---

### Task 6: `NavSearch.vue`

**Files:**
- Create: `src/components/layout/NavSearch.vue`
- Test: `src/components/layout/__tests__/navSearch.test.ts`

**Interfaces:**
- Consumes: `NameAutocomplete` props `placeholder`, `inputClass`, `dropdownClass`, emit `submit`, exposed `focus()` (Task 2). Home `?q=` contract (Task 4).
- Produces (used by Task 7):
  - prop `compact?: boolean` — desktop styling (`w-56`, `/` hint) vs full-width mobile row.
  - emit `navigated: []` — fired after any router push triggered from the search.
  - `defineExpose({ focus })`, `focus(): void`.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/layout/__tests__/navSearch.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/characters', () => ({
  suggestCharacters: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/api/guilds', () => ({
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))

import NavSearch from '@/components/layout/NavSearch.vue'
import NameAutocomplete from '@/components/form/NameAutocomplete.vue'

async function mountIt(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/raids', name: 'raids', component: { template: '<div />' } },
      { path: '/characters/:region/:realm/:name', name: 'character-detail', component: { template: '<div />' } },
    ],
  })
  await router.push('/raids')
  await router.isReady()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const w = mount(NavSearch, {
    props,
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient }]],
      stubs: { ClassIcon: true, FactionBadge: true, RatingChip: true },
    },
    attachTo: document.body,
  })
  return { w, router }
}

describe('NavSearch', () => {
  it('picking a suggestion routes to the character, clears the input and emits navigated', async () => {
    const { w, router } = await mountIt()
    await w.get('input').setValue('mel')
    w.findComponent(NameAutocomplete).vm.$emit('pick', { region: 'eu', realm: 'the-maelstrom', name: 'melaniya' })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('character-detail')
    expect(router.currentRoute.value.params).toEqual({ region: 'eu', realm: 'the-maelstrom', name: 'melaniya' })
    expect((w.get('input').element as HTMLInputElement).value).toBe('')
    expect(w.emitted('navigated')).toHaveLength(1)
    w.unmount()
  })

  it('Enter with no match routes home with ?q=, clears and emits navigated', async () => {
    const { w, router } = await mountIt()
    await w.get('input').setValue('Arthas')
    await w.get('input').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.query).toEqual({ q: 'Arthas' })
    expect((w.get('input').element as HTMLInputElement).value).toBe('')
    expect(w.emitted('navigated')).toHaveLength(1)
    w.unmount()
  })

  it('shows the "/" hint only in compact mode, and hides it while focused or non-empty', async () => {
    const { w } = await mountIt({ compact: true })
    expect(w.find('kbd').exists()).toBe(true)
    await w.get('input').trigger('focusin')
    expect(w.find('kbd').exists()).toBe(false)
    await w.get('input').trigger('focusout')
    expect(w.find('kbd').exists()).toBe(true)
    await w.get('input').setValue('x')
    expect(w.find('kbd').exists()).toBe(false)
    w.unmount()
  })

  it('has no "/" hint in full-width mode', async () => {
    const { w } = await mountIt()
    expect(w.find('kbd').exists()).toBe(false)
    w.unmount()
  })

  it('exposes focus()', async () => {
    const { w } = await mountIt()
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.get('input').element)
    w.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/__tests__/navSearch.test.ts`
Expected: FAIL — `Failed to resolve import "@/components/layout/NavSearch.vue"`.

- [ ] **Step 3: Implement**

```vue
<!-- src/components/layout/NavSearch.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import NameAutocomplete from '@/components/form/NameAutocomplete.vue'
import type { Region } from '@/types/api'

/**
 * Character quick-search for the nav. Known characters resolve through the suggest
 * endpoint; an unmatched name is handed to the home page (`/?q=`) where the full
 * form with a realm picker takes over.
 */
const props = defineProps<{
  /** Desktop mode: fixed width + "/" key hint. Default is a full-width row (mobile menu). */
  compact?: boolean
}>()

const emit = defineEmits<{
  /** Fired after any navigation triggered from the search (lets the mobile menu close). */
  navigated: []
}>()

const router = useRouter()
const value = ref('')
const focused = ref(false)
const auto = ref<{ focus: () => void } | null>(null)

async function onPick(payload: { region: Region; realm: string; name: string }) {
  await router.push({ name: 'character-detail', params: payload })
  value.value = ''
  emit('navigated')
}

async function onSubmit(text: string) {
  await router.push({ name: 'home', query: { q: text } })
  value.value = ''
  emit('navigated')
}

function focus() {
  auto.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div
    class="relative"
    :class="props.compact ? 'w-56' : 'w-full'"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <Search
      class="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-wsa-disabled"
      aria-hidden="true"
    />
    <NameAutocomplete
      ref="auto"
      v-model="value"
      kind="character"
      placeholder="Find a character…"
      :input-class="props.compact ? 'pl-8 pr-7' : 'pl-8'"
      :dropdown-class="props.compact ? 'right-0 w-96' : 'left-0 right-0'"
      @pick="onPick"
      @submit="onSubmit"
    />
    <kbd
      v-if="props.compact && !focused && !value"
      class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-wsa-border/60 px-1 font-sans text-[10px] leading-4 text-wsa-disabled"
      aria-hidden="true"
    >/</kbd>
  </div>
</template>
```

Notes for the implementer:
- `NameAutocomplete`'s root is a plain `<div>` with no `relative`; the wrapper here is the positioning context, so the dropdown's `right-0 w-96` anchors to the nav box's right edge as the spec requires.
- The `Search` icon needs `z-10` because the `wsa-input` paints a background.
- Do not add `preventDefault` or key handling here; `NameAutocomplete` owns the keyboard.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/layout/__tests__/navSearch.test.ts`
Expected: PASS, 5 tests. If the `kbd` focus test fails because `focusin` doesn't bubble in jsdom from `trigger`, dispatch on the wrapper root instead: `await w.trigger('focusin')`.

- [ ] **Step 5: Type-check and commit**

Run: `npx vue-tsc -b --noEmit 2>&1 | head -20` — expect no output.

```bash
git add src/components/layout/NavSearch.vue src/components/layout/__tests__/navSearch.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: NavSearch — character quick-search with home hand-off for unmatched names"
```

---

### Task 7: Rewrite `AppNav.vue`

**Files:**
- Modify: `src/components/layout/AppNav.vue` (full rewrite, both template and script)
- Test: `src/components/layout/__tests__/appNav.test.ts`

**Interfaces:**
- Consumes: `NAV_LINKS`, `isNavActive` (Task 1); `NavSearch` with `compact`, `navigated`, `focus()` (Task 6); `useSlashShortcut` (Task 5).
- Produces: nothing exported. Behavioural contract: active link carries `aria-current="page"`; desktop links + desktop search are `hidden lg:flex` / `hidden lg:block`; hamburger and mobile menu are `lg:hidden`.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/layout/__tests__/appNav.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  fetchMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

import AppNav from '@/components/layout/AppNav.vue'

const focusSpy = vi.fn()
const NavSearchStub = defineComponent({
  name: 'NavSearch',
  props: { compact: { type: Boolean, default: false } },
  emits: ['navigated'],
  setup(props, { expose }) {
    expose({ focus: focusSpy })
    return () => h('div', { 'data-testid': props.compact ? 'search-desktop' : 'search-mobile' })
  },
})

const stub = { template: '<div />' }
const routes = [
  { path: '/', name: 'home', component: stub },
  { path: '/guilds', name: 'guild-search', component: stub },
  { path: '/guilds/:region/:realm/:name', name: 'guild-detail', component: stub },
  { path: '/characters', name: 'character-search', component: stub },
  { path: '/characters/:region/:realm/:name', name: 'character-detail', component: stub },
  { path: '/mythic-plus', name: 'mythic-plus', component: stub },
  { path: '/mythic-plus/seasons/:slug', name: 'mythic-plus-archive', component: stub },
  { path: '/leaderboards', name: 'leaderboards', component: stub },
  { path: '/leaderboards/:region', name: 'leaderboards-region', component: stub },
  { path: '/meta', name: 'meta', component: stub },
  { path: '/raids', name: 'raids', component: stub },
  { path: '/profile', name: 'profile', component: stub },
  { path: '/login', name: 'login', component: stub },
  { path: '/register', name: 'register', component: stub },
]

async function mountAt(path: string) {
  setActivePinia(createPinia())
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const w = mount(AppNav, {
    global: { plugins: [router], stubs: { NavSearch: NavSearchStub } },
    attachTo: document.body,
  })
  await flushPromises()
  return { w, router }
}

function desktopLinks(w: ReturnType<typeof mount>) {
  return w.findAll('nav a').filter((a) => ['Guilds', 'Characters', 'Mythic+', 'Leaderboards', 'Meta', 'Raids'].includes(a.text()))
}

function activeLabels(w: ReturnType<typeof mount>) {
  return desktopLinks(w).filter((a) => a.attributes('aria-current') === 'page').map((a) => a.text())
}

function setDesktop(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} }),
  })
}

describe('AppNav', () => {
  beforeEach(() => {
    focusSpy.mockClear()
  })

  it('renders six links with no Home entry', async () => {
    const { w } = await mountAt('/')
    expect(desktopLinks(w).map((a) => a.text())).toEqual(['Guilds', 'Characters', 'Mythic+', 'Leaderboards', 'Meta', 'Raids'])
    w.unmount()
  })

  it.each([
    ['/characters/eu/the-maelstrom/melaniya', ['Characters']],
    ['/guilds/eu/the-maelstrom/balkanika', ['Guilds']],
    ['/mythic-plus/seasons/mn-1', ['Mythic+']],
    ['/leaderboards/eu', ['Leaderboards']],
    ['/', []],
  ])('marks the owning section active on %s', async (path, expected) => {
    const { w } = await mountAt(path)
    expect(activeLabels(w)).toEqual(expected)
    w.unmount()
  })

  it('uses the lg breakpoint, never md', async () => {
    const { w } = await mountAt('/')
    expect(w.html()).not.toMatch(/\bmd:/)
    expect(w.html()).toMatch(/\blg:flex\b/)
    expect(w.html()).toMatch(/\blg:hidden\b/)
    w.unmount()
  })

  it('renders a compact search in the bar and a full-width one in the mobile menu', async () => {
    const { w } = await mountAt('/')
    expect(w.find('[data-testid="search-desktop"]').exists()).toBe(true)
    await w.get('button[aria-label="Toggle menu"]').trigger('click')
    expect(w.find('[data-testid="search-mobile"]').exists()).toBe(true)
    w.unmount()
  })

  it('closes the mobile menu when the mobile search navigates', async () => {
    const { w } = await mountAt('/')
    await w.get('button[aria-label="Toggle menu"]').trigger('click')
    const mobile = w.findAllComponents(NavSearchStub).find((c) => !c.props('compact'))!
    expect(mobile.isVisible()).toBe(true)
    mobile.vm.$emit('navigated')
    await nextTick()
    expect(mobile.isVisible()).toBe(false)
    w.unmount()
  })

  it('"/" focuses the desktop search on wide screens', async () => {
    setDesktop(true)
    const { w } = await mountAt('/raids')
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }))
    await nextTick()
    expect(focusSpy).toHaveBeenCalledTimes(1)
    expect(w.get('button[aria-label="Toggle menu"]').attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('"/" opens the mobile menu and focuses its search on narrow screens', async () => {
    setDesktop(false)
    const { w } = await mountAt('/raids')
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()
    expect(w.get('button[aria-label="Toggle menu"]').attributes('aria-expanded')).toBe('true')
    expect(focusSpy).toHaveBeenCalledTimes(1)
    w.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/__tests__/appNav.test.ts`
Expected: FAIL — "renders six links" sees `Home`, the `md:` check fails, no `search-desktop` element, `/` does nothing.

- [ ] **Step 3: Rewrite `AppNav.vue`**

Replace the entire file with:

```vue
<template>
  <nav
    class="relative z-30 border-b-2 border-wsa-border flex items-center justify-between gap-3 px-4 py-2"
    style="background: linear-gradient(135deg, rgb(var(--wsa-card-2)), rgb(var(--wsa-card))); box-shadow: inset 0 0 20px rgba(0,0,0,0.3)"
  >
    <div class="flex min-w-0 items-center gap-1">
      <router-link
        :to="{ name: 'home' }"
        class="flex items-center gap-2 text-lg font-bold text-wsa-heading hover:brightness-110 transition-all"
      >
        <img src="/favicon.svg" alt="" aria-hidden="true" class="h-6 w-6" />
        <span class="font-display tracking-[0.18em]">PEON</span>
      </router-link>
      <div class="ml-4 hidden gap-1 lg:flex">
        <router-link
          v-for="link in NAV_LINKS"
          :key="link.name"
          :to="{ name: link.name }"
          class="whitespace-nowrap text-sm px-3 py-1.5 rounded transition-colors"
          :class="isNavActive(link, route.name)
            ? 'text-wsa-heading bg-wsa-muted/15 border border-wsa-border'
            : 'text-wsa-muted hover:text-wsa-heading border border-transparent'"
          :aria-current="isNavActive(link, route.name) ? 'page' : undefined"
        >
          {{ link.label }}
        </router-link>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <NavSearch ref="desktopSearch" compact class="hidden lg:block" />

      <template v-if="auth.isAuthenticated">
        <router-link :to="{ name: 'profile' }" class="text-sm text-wsa-muted hover:text-wsa-heading transition-colors px-2 py-1">
          Profile
        </router-link>
        <button type="button" class="wsa-btn" @click="onLogout">Logout</button>
      </template>
      <template v-else>
        <router-link :to="{ name: 'login' }" class="whitespace-nowrap text-sm text-wsa-muted hover:text-wsa-heading transition-colors px-2 py-1">
          Sign in
        </router-link>
        <router-link :to="{ name: 'register' }" class="wsa-btn wsa-btn--primary whitespace-nowrap">
          Register
        </router-link>
      </template>

      <button
        type="button"
        class="lg:hidden text-wsa-muted hover:text-wsa-heading p-1 ml-1"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
        :aria-expanded="mobileOpen"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </nav>

  <div
    v-show="mobileOpen"
    class="lg:hidden relative z-20 border-b-2 border-wsa-border px-4 py-3 flex flex-col gap-1"
    style="background: rgb(var(--wsa-bg))"
  >
    <NavSearch ref="mobileSearch" class="mb-2" @navigated="mobileOpen = false" />
    <router-link
      v-for="link in NAV_LINKS"
      :key="link.name"
      :to="{ name: link.name }"
      class="text-sm px-3 py-2 rounded transition-colors"
      :class="isNavActive(link, route.name) ? 'text-wsa-heading bg-wsa-muted/15' : 'text-wsa-muted hover:text-wsa-heading'"
      :aria-current="isNavActive(link, route.name) ? 'page' : undefined"
      @click="mobileOpen = false"
    >
      {{ link.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavSearch from '@/components/layout/NavSearch.vue'
import { NAV_LINKS, isNavActive } from '@/components/layout/navLinks'
import { useSlashShortcut } from '@/composables/useSlashShortcut'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const desktopSearch = ref<{ focus: () => void } | null>(null)
const mobileSearch = ref<{ focus: () => void } | null>(null)

/** Mirrors Tailwind's `lg` breakpoint — the width at which the bar shows links + search. */
function isDesktop(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1024px)').matches
}

useSlashShortcut(async () => {
  if (isDesktop()) {
    desktopSearch.value?.focus()
    return
  }
  mobileOpen.value = true
  await nextTick()
  mobileSearch.value?.focus()
})

async function onLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>
```

- [ ] **Step 4: Run the nav tests, then the full suite**

Run: `npx vitest run src/components/layout/`
Expected: PASS — `appNav`, `navSearch`, `navLinks`, `pageHeader`, `brandLockup`, `appFooter` all green.

Run: `npm test`
Expected: all files pass (434 pre-existing + the new files). If `appNav.test.ts` "/" tests are flaky about `matchMedia`, make sure `setDesktop()` runs **before** `mountAt()` — the listener reads `matchMedia` at keypress time, not mount time, so ordering should not matter; if it does, the composable was implemented wrong.

- [ ] **Step 5: Type-check and commit**

Run: `npx vue-tsc -b --noEmit 2>&1 | head -20` — expect no output.

```bash
git add src/components/layout/AppNav.vue src/components/layout/__tests__/appNav.test.ts
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "FE: AppNav — drop Home, prefix active state, lg collapse, quick search + / shortcut"
```

---

### Task 8: Build, browser verification, docs — **orchestrator + human, never a subagent**

`npm run build` writes into the bind-mounted `dist/`, so this step **is the deploy** to :8092. Do it with the user aware.

**Files:**
- Modify: `frontend/CLAUDE.md` (Architecture → add a short "Nav" paragraph)
- No source changes expected; if a visual fix is needed, make it, re-run the affected test file, commit separately.

- [ ] **Step 1: Build (= deploy to :8092)**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in …`. No type errors.

- [ ] **Step 2: Browser checks with the Playwright MCP (headless)**

For each viewport, navigate and screenshot; read the PNG and check the listed points.

| Viewport | URL | Check |
|---|---|---|
| 1280×900 | `http://192.168.100.81:8092/characters/eu/the-maelstrom/melaniya` | "Characters" link highlighted; search box with magnifier + `/` hint visible right of the links; no Home link; nothing wraps |
| 1280×900 | same, after `browser_evaluate` `document.querySelector('input[aria-label="Find a character…"]').focus()` then `browser_type` "mel" | dropdown opens under the box, right-aligned, wider than the input, not clipped by the nav |
| 1024×768 | `http://192.168.100.81:8092/leaderboards/eu` | links + search still fit on one line; dropdown (type "mel") does not run off the right edge |
| 820×600 | same | only wordmark, Sign in, Register, hamburger — single line, no wrap |
| 390×844 | same, then click `button[aria-label="Toggle menu"]` | search row first, full width, then six links; Leaderboards highlighted |
| 390×844 | with the menu open, type "mel" into the search and click the first suggestion | lands on the character page, menu closed, input empty |
| 1280×900 | any page, press `/` via `browser_press_key` | search input focused (`document.activeElement.getAttribute('aria-label')` is `Find a character…`) |
| 1280×900 | type "Zzqqxx" (no match) + Enter | lands on `/` with the name in the character form and the realm box focused; URL has no `?q=` |

- [ ] **Step 3: Clean up screenshots**

Run from the repo root: `rm -f *.png && rm -rf .playwright-mcp && git status -s`
Expected: only the CLAUDE.md change (next step) or nothing.

- [ ] **Step 4: Document the nav in `frontend/CLAUDE.md`**

Add under `## Architecture`, after the "HTTP client + auth" subsection:

```markdown
### Nav

`components/layout/AppNav.vue` collapses at **`lg` (1024px)**. Links come from `components/layout/navLinks.ts` (`NAV_LINKS` + `isNavActive`, prefix-based — Characters owns every `character-*` route, Leaderboards every `leaderboards*` route). No Home link; the wordmark is home. `NavSearch.vue` wraps `NameAutocomplete` (characters only): a pick routes to `character-detail`; Enter with no match routes to `/?q=<name>`, which `HomePage.vue` consumes once (prefills the character `LookupForm`, focuses the realm picker, strips the param). `/` focuses the search via `composables/useSlashShortcut.ts` (opens the mobile menu first below `lg`).
```

- [ ] **Step 5: Commit and report**

```bash
git add CLAUDE.md
git -c user.email=dvancov@hotmail.com -c user.name=dakiman commit -m "docs: FE CLAUDE.md nav section"
```

Report to the user: deployed to :8092, tests count, and whether to push (`git subtree split --prefix=frontend -b fe-split && git push fe fe-split:master && git branch -D fe-split` from the repo root). **Do not push unless asked.**
