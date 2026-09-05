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

function mountTab(char: unknown = character) {
  const ctx = {
    character: computed(() => char as never),
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

describe('CharacterDungeonsTab empty states', () => {
  it('renders EmptyTab with the season name instead of an empty table', async () => {
    const w = mountTab({ ...character, dungeon_runs: [] })
    await flushPromises()
    const empty = w.findComponent({ name: 'EmptyTab' })
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('No Midnight Season 2 runs recorded yet')
    expect(w.findComponent({ name: 'MythicPlusBestPerDungeon' }).exists()).toBe(false)
  })
  it('mentions the season switcher only when older seasons exist', async () => {
    const w = mountTab({ ...character, dungeon_runs: [character.dungeon_runs[1]] }) // only an S17 run
    await flushPromises()
    expect(w.findComponent({ name: 'EmptyTab' }).text()).toContain('Pick an earlier season')
  })
})
