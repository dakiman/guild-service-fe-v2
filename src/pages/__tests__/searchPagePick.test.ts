import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Component } from 'vue'
import LookupForm from '@/components/form/LookupForm.vue'
import CharacterSearchPage from '@/pages/CharacterSearchPage.vue'
import GuildSearchPage from '@/pages/GuildSearchPage.vue'

// P0.5: clicking / Enter on an autocomplete suggestion emits `pick` from
// NameAutocomplete → LookupForm. The search pages must forward `pick` to the
// same navigation handler as `submit`, otherwise picking a suggestion is dead.

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  RouterLink: { template: '<a><slot /></a>' },
}))
vi.mock('@/api/stats', () => ({
  fetchCharacterStats: vi.fn().mockResolvedValue(null),
  fetchRaidKillStats: vi.fn().mockResolvedValue(null),
  fetchTopKeys: vi.fn().mockResolvedValue(null),
  fetchTopRuns: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/api/guilds', () => ({
  fetchDiscoverGuilds: vi.fn().mockResolvedValue(null),
  fetchPopularGuilds: vi.fn().mockResolvedValue(null),
}))

function mountPage(page: Component) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return shallowMount(page, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
}

describe('search page autocomplete pick wiring (P0.5)', () => {
  beforeEach(() => pushMock.mockClear())

  it('CharacterSearchPage navigates to character-detail on autocomplete pick', async () => {
    const wrapper = mountPage(CharacterSearchPage)
    const payload = { region: 'eu', realm: 'the-maelstrom', name: 'cirna' }

    await wrapper.findComponent(LookupForm).vm.$emit('pick', payload)

    expect(pushMock).toHaveBeenCalledWith({ name: 'character-detail', params: payload })
  })

  it('GuildSearchPage navigates to guild-detail on autocomplete pick', async () => {
    const wrapper = mountPage(GuildSearchPage)
    const payload = { region: 'eu', realm: 'twisting-nether', name: 'liquid' }

    await wrapper.findComponent(LookupForm).vm.$emit('pick', payload)

    expect(pushMock).toHaveBeenCalledWith({ name: 'guild-detail', params: payload })
  })
})
