import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import TopRunsLeaderboard from '@/components/stats/TopRunsLeaderboard.vue'

// useCharacterStats imports all four fetchers — the mock must export them all.
vi.mock('@/api/stats', () => ({
  fetchCharacterStats: vi.fn().mockResolvedValue({
    total_characters: 123,
    class_distribution: [],
    spec_distribution: [],
    faction_distribution: { horde: 0, alliance: 0 },
    race_distribution: [],
    top_performers: { mythic_plus: [], item_level: [], achievement_points: [] },
    avg_achievement_points: 0,
    most_popular_spec: null,
    generated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  }),
  fetchRaidKillStats: vi.fn(),
  fetchTopKeys: vi.fn(),
  fetchTopRuns: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        dungeon_id: 503,
        dungeon_name: 'Ara-Kara, City of Echoes',
        keystone_level: 20,
        // Beats the +1 and +2 thresholds below, not +3 → exactly two stars.
        duration: 1_200_000,
        is_completed_on_time: true,
        affixes: [],
        completed_at: '2026-07-01T00:00:00Z',
        members: [],
      },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 1,
  }),
}))

// usePveGameData imports all three game-data fetchers.
vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn(),
  getRealms: vi.fn(),
  getMythicKeystoneDungeons: vi.fn().mockResolvedValue({
    dungeons: [
      {
        id: 503,
        name: 'Ara-Kara, City of Echoes',
        media_url: 'https://example/arak.jpg',
        keystone_upgrades: [
          { upgrade_level: 1, qualifying_duration: 1_800_000 },
          { upgrade_level: 2, qualifying_duration: 1_440_000 },
          { upgrade_level: 3, qualifying_duration: 1_080_000 },
        ],
        journal_instance_id: null,
      },
    ],
    affixes: {},
    season: null,
  }),
}))

function mountCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(TopRunsLeaderboard, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('TopRunsLeaderboard', () => {
  it('renders the dungeon icon and upgrade stars', async () => {
    const wrapper = mountCard()
    await flushPromises()

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example/arak.jpg')

    expect(wrapper.text()).toContain('+20✦✦')
    expect(wrapper.text()).not.toContain('✦✦✦')
  })

  it('renders the crawled-subset coverage stamp', async () => {
    const wrapper = mountCard()
    await flushPromises()
    expect(wrapper.text()).toContain('Among 123 characters tracked by Peon · updated 1h ago')
  })
})
