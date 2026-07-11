import { describe, it, expect, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import MythicPlusPage from '@/pages/MythicPlusPage.vue'
import TopRunsLeaderboard from '@/components/stats/TopRunsLeaderboard.vue'
import HighestKeysCard from '@/components/stats/HighestKeysCard.vue'
import TopPerformersCard from '@/components/stats/TopPerformersCard.vue'
import PerformanceByClassCard from '@/components/stats/PerformanceByClassCard.vue'

// useCharacterStats imports all four fetchers — the mock must export them all.
vi.mock('@/api/stats', () => ({
  fetchCharacterStats: vi.fn().mockResolvedValue({
    total_characters: 1,
    class_distribution: [],
    spec_distribution: [],
    faction_distribution: { horde: 0, alliance: 0 },
    race_distribution: [],
    top_performers: { mythic_plus: [], item_level: [], achievement_points: [] },
    avg_achievement_points: 0,
    most_popular_spec: null,
  }),
  fetchRaidKillStats: vi.fn().mockResolvedValue(null),
  fetchTopKeys: vi.fn().mockResolvedValue(null),
  fetchTopRuns: vi.fn().mockResolvedValue(null),
}))

function mountPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return shallowMount(MythicPlusPage, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
}

describe('MythicPlusPage', () => {
  it('renders the four M+ widgets', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.findComponent(TopRunsLeaderboard).exists()).toBe(true)
    expect(wrapper.findComponent(HighestKeysCard).exists()).toBe(true)
    const performers = wrapper.findComponent(TopPerformersCard)
    expect(performers.exists()).toBe(true)
    expect(performers.props('title')).toBe('Top M+ Rating')
    expect(wrapper.findComponent(PerformanceByClassCard).exists()).toBe(true)
  })
})
