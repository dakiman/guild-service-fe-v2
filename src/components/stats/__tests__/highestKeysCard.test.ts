import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import HighestKeysCard from '@/components/stats/HighestKeysCard.vue'

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
  fetchTopRuns: vi.fn(),
  fetchTopKeys: vi.fn().mockResolvedValue({
    dungeons: [
      {
        dungeon_id: 503,
        dungeon_name: 'Ara-Kara, City of Echoes',
        key_level: 18,
        // Beats all three thresholds below → three stars.
        duration: 1_000_000,
        character: { name: 'melaniya', realm: 'the-maelstrom', region: 'eu', class_id: 8 },
      },
    ],
  }),
}))

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

describe('HighestKeysCard', () => {
  it('renders the dungeon icon and upgrade stars', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(HighestKeysCard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example/arak.jpg')

    expect(wrapper.text()).toContain('+18✦✦✦')
  })

  it('renders the crawled-subset coverage stamp', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(HighestKeysCard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Among 123 characters tracked by Peon · updated 1h ago')
  })
})
