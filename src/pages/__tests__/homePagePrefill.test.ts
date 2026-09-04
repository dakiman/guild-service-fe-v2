import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/guilds', () => ({
  fetchPopularGuilds: vi.fn().mockResolvedValue({ recently_searched: [] }),
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/api/characters', () => ({
  fetchPopularCharacters: vi.fn().mockResolvedValue({ recently_searched: [] }),
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
      { path: '/characters', name: 'character-search', component: { template: '<div />' } },
      { path: '/characters/:region/:realm/:name', name: 'character-detail', component: { template: '<div />' } },
      { path: '/guilds', name: 'guild-search', component: { template: '<div />' } },
      { path: '/guilds/:region/:realm/:name', name: 'guild-detail', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Mount through a real <router-view> (not HomePage directly) so onBeforeRouteUpdate
  // guards registered inside HomePage are associated with the matched route record —
  // an in-place `/` -> `/?q=...` navigation reuses the component instance, matching prod.
  const w = mount(RouterView, {
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

  it('prefills when the ?q= hand-off arrives via an in-place route update (already on /)', async () => {
    focusRealm.mockClear()
    const { w, router } = await mountAt('/')
    expect(w.get('[data-testid="lookup-character"]').attributes('data-initial')).toBe('')

    await router.push('/?q=arthas')
    await flushPromises()

    expect(w.get('[data-testid="lookup-character"]').attributes('data-initial')).toBe('arthas')
    expect(focusRealm).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query.q).toBeUndefined()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('strips a whitespace-only q without prefilling or focusing', async () => {
    focusRealm.mockClear()
    const { w, router } = await mountAt('/?q=%20%20')
    expect(w.get('[data-testid="lookup-character"]').attributes('data-initial')).toBe('')
    expect(focusRealm).not.toHaveBeenCalled()
    expect(router.currentRoute.value.query.q).toBeUndefined()
  })
})
