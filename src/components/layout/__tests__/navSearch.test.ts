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
