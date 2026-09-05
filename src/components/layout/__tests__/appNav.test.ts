import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

const originalMatchMedia = window.matchMedia

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

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    })
  })

  it('renders six links with no Home entry', async () => {
    const { w } = await mountAt('/')
    expect(desktopLinks(w).map((a) => a.text())).toEqual(['Characters', 'Guilds', 'Mythic+', 'Leaderboards', 'Meta', 'Raids'])
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
