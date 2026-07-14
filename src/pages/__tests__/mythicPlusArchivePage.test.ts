import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createRouter, createMemoryHistory } from 'vue-router'
import MythicPlusArchivePage from '@/pages/MythicPlusArchivePage.vue'

vi.mock('@/api/stats', () => ({
  fetchCharacterStats: vi.fn(),
  fetchRaidKillStats: vi.fn(),
  fetchTopRuns: vi.fn(),
  fetchTopKeys: vi.fn(),
  fetchSeasonArchive: vi.fn().mockResolvedValue({
    meta: {
      season_id: 17,
      slug: 'season-mn-1',
      name: 'Midnight Season 1',
      snapshotted_at: '2026-12-16T12:00:00+00:00',
      total_runs: 3600784,
    },
    top_runs: [
      {
        id: 1,
        dungeon_id: 503,
        dungeon_name: 'Ara-Kara, City of Echoes',
        keystone_level: 22,
        duration: 1_000_000,
        is_completed_on_time: true,
        affixes: [],
        completed_at: '1780000000000',
        members: [
          { name: 'melaniya', realm: 'the-maelstrom', region: 'eu', spec_id: 250, spec_name: 'Blood', class_id: 6, ilvl: 630 },
        ],
      },
    ],
    top_keys: {
      dungeons: [
        {
          dungeon_id: 503,
          dungeon_name: 'Ara-Kara, City of Echoes',
          key_level: 22,
          duration: 1_000_000,
          character: { name: 'melaniya', realm: 'the-maelstrom', region: 'eu', class_id: 6 },
        },
      ],
    },
    top_performers: {
      mythic_plus: [
        { name: 'melaniya', realm: 'the-maelstrom', region: 'eu', class_id: 6, spec_id: 250, value: 3200.5 },
      ],
    },
    class_distribution: [{ class_id: 6, count: 10, avg_ilvl: 630, avg_mythic_plus_rating: 2500 }],
    dungeons: [
      { id: 503, name: 'Ara-Kara, City of Echoes', media_url: '/dungeons/503.jpg', keystone_upgrades: null },
    ],
  }),
}))

vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn(),
  getRealms: vi.fn(),
  getMythicKeystoneDungeons: vi.fn(),
  getSeasons: vi.fn().mockResolvedValue({ seasons: [] }),
}))

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/mythic-plus/seasons/:slug', name: 'mythic-plus-archive', component: MythicPlusArchivePage, props: true },
      { path: '/characters/:region/:realm/:name', name: 'character-detail', component: { template: '<div/>' } },
      { path: '/mythic-plus', name: 'mythic-plus', component: { template: '<div/>' } },
    ],
  })
  await router.push('/mythic-plus/seasons/season-mn-1')
  await router.isReady()

  const wrapper = mount(MythicPlusArchivePage, {
    props: { slug: 'season-mn-1' },
    global: {
      plugins: [
        router,
        [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }],
      ],
    },
  })
  await flushPromises()
  return wrapper
}

describe('MythicPlusArchivePage', () => {
  it('renders the frozen banner and all four cards from one payload', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Midnight Season 1')
    expect(wrapper.text()).toContain('Frozen at season end')
    // Top runs table row
    expect(wrapper.text()).toContain('Ara-Kara, City of Echoes')
    expect(wrapper.text()).toContain('+22')
    // Top performer entry
    expect(wrapper.text()).toContain('Melaniya')
  })
})
