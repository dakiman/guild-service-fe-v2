import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { computed } from 'vue'
import CharacterDungeonsTab from '@/pages/character/CharacterDungeonsTab.vue'
import { CharacterContextKey, type CharacterContext } from '@/composables/useCharacterContext'

vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn(),
  getRealms: vi.fn(),
  getMythicKeystoneDungeons: vi.fn().mockResolvedValue({
    dungeons: [],
    affixes: {},
    season: { id: 18, name: 'Midnight Season 2' },
  }),
  getSeasons: vi.fn().mockResolvedValue({
    seasons: [
      { id: 18, slug: 'season-mn-2', name: 'Midnight Season 2', is_current: true, has_archive: false, started_at: null, ended_at: null },
      { id: 17, slug: 'season-mn-1', name: 'Midnight Season 1', is_current: false, has_archive: true, started_at: null, ended_at: null },
    ],
  }),
}))

// Character with runs in two seasons; rating belongs to the current one.
const character = {
  name: 'melaniya',
  realm: 'the-maelstrom',
  region: 'eu',
  mythic_plus_rating: { rating: 2800, color: '#ff8000' },
  dungeon_runs: [
    { id: 1, season: 18, dungeon_id: 503, dungeon_name: 'Ara-Kara', keystone_level: 12, duration: 1000000, is_completed_on_time: true, completed_timestamp: 1780000000000, affixes: [], members: [] },
    { id: 2, season: 17, dungeon_id: 400, dungeon_name: 'Old Dungeon', keystone_level: 20, duration: 1000000, is_completed_on_time: true, completed_timestamp: 1750000000000, affixes: [], members: [] },
  ],
}

function mountTab() {
  const ctx = {
    character: computed(() => character as never),
  } as unknown as CharacterContext

  return mount(CharacterDungeonsTab, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }]],
      provide: {
        [CharacterContextKey as symbol]: ctx,
      },
      stubs: {
        DungeonsHeadline: true,
        MythicPlusBestPerDungeon: true,
        MythicPlusAllRuns: true,
      },
    },
  })
}

describe('CharacterDungeonsTab season switcher', () => {
  it('lists both seasons with registry names, current selected', async () => {
    const wrapper = mountTab()
    await flushPromises()

    const select = wrapper.find('select[aria-label="Season"]')
    expect(select.exists()).toBe(true)
    const options = select.findAll('option')
    expect(options.map((o) => o.text())).toEqual(['Midnight Season 2', 'Midnight Season 1'])
    expect((select.element as HTMLSelectElement).value).toBe('18')
  })

  it('passes the selected season down and suppresses rating on past seasons', async () => {
    const wrapper = mountTab()
    await flushPromises()

    await wrapper.find('select[aria-label="Season"]').setValue('17')

    const headline = wrapper.findComponent({ name: 'DungeonsHeadline' })
    expect(headline.props('currentSeason')).toBe(17)
    expect(headline.props('rating')).toBeNull()
    expect(headline.props('seasonName')).toBe('Midnight Season 1')
  })
})
