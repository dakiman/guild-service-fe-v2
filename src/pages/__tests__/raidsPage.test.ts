import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import RaidsPage from '@/pages/RaidsPage.vue'
import RaidHeatmapCard from '@/components/stats/RaidHeatmapCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

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

    const header = wrapper.findComponent(PageHeader)
    expect(header.exists()).toBe(true)
    expect(header.props('title')).toBe('Raids')
    expect(header.props('icon')).toBe('/brand/icon-raids.jpg')
  })
})
