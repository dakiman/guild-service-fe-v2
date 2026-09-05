import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import HighestKeysCard from '@/components/stats/HighestKeysCard.vue'
vi.mock('@/api/stats', () => ({
  fetchCharacterStats: vi.fn().mockResolvedValue(null),
  fetchRaidKillStats: vi.fn(),
  fetchTopRuns: vi.fn(),
  fetchTopKeys: vi.fn().mockRejectedValue(new Error('500')),
}))
vi.mock('@/api/gameData', () => ({ getMythicKeystoneDungeons: vi.fn().mockResolvedValue({ dungeons: [], affixes: {}, season: null }) }))
describe('HighestKeysCard error state', () => {
  it('renders ErrorState with retry instead of the empty copy', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const w = mount(HighestKeysCard, { global: { plugins: [[VueQueryPlugin, { queryClient }]] } })
    await flushPromises()
    expect(w.text()).not.toContain('No key data yet')
    const err = w.findComponent({ name: 'ErrorState' })
    expect(err.exists()).toBe(true)
    expect(err.find('button').exists()).toBe(true)
  })
})
