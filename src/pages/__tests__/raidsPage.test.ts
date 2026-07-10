import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import RaidsPage from '@/pages/RaidsPage.vue'
import RaidHeatmapCard from '@/components/stats/RaidHeatmapCard.vue'

vi.mock('@/api/stats', () => ({
  fetchCharacterStats: vi.fn().mockResolvedValue(null),
  fetchRaidKillStats: vi.fn().mockResolvedValue(null),
  fetchTopKeys: vi.fn().mockResolvedValue(null),
  fetchTopRuns: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn().mockResolvedValue({ instances: [] }),
}))

describe('RaidsPage', () => {
  it('renders the raid heatmap', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = shallowMount(RaidsPage, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    })

    expect(wrapper.findComponent(RaidHeatmapCard).exists()).toBe(true)
  })
})
