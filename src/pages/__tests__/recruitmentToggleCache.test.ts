import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// P0.4: toggling recruitment must merge only the changed field into the cached
// lookup. The PATCH returns a relation-less CharacterResource; replacing the
// whole cached `data` with it wipes raid_progress / reputations / dungeon_runs /
// etc. and blanks every tab until a refetch.

const { toggleMock } = vi.hoisted(() => ({ toggleMock: vi.fn() }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/characters/eu/the-maelstrom/cirna' }),
}))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { characters: [{ id: 42 }] } }),
}))
vi.mock('@/api/characters', () => ({
  toggleRecruitment: toggleMock,
  fetchCharacter: vi.fn().mockResolvedValue(null),
}))

import CharacterDetailLayout from '@/pages/CharacterDetailLayout.vue'

const KEY = ['character', 'eu', 'the-maelstrom', 'cirna']

function fullResult() {
  return {
    data: {
      id: 42,
      name: 'cirna',
      realm: 'the-maelstrom',
      region: 'eu',
      recruitment: false,
      talent_loadout_code: null,
      raid_progress: [{ instance_id: 1, instance_name: 'Nerub-ar Palace' }],
      reputations: [{ faction_id: 2510 }],
      dungeon_runs: [{ id: 7 }],
      titles: [{ id: 1 }],
    },
    meta: { freshness: {}, feature_flags: {}, queue_depth: 0 },
    isStale: false,
    isSyncing: false,
  }
}

describe('recruitment toggle cache merge (P0.4)', () => {
  beforeEach(() => toggleMock.mockReset())

  it('keeps loaded relations in cache, flipping only recruitment', async () => {
    // The PATCH /recruitment response is a CharacterResource with NO relations.
    toggleMock.mockResolvedValue({
      id: 42,
      name: 'cirna',
      realm: 'the-maelstrom',
      region: 'eu',
      recruitment: true,
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(KEY, fullResult())

    const wrapper = shallowMount(CharacterDetailLayout, {
      props: { region: 'eu', realm: 'the-maelstrom', name: 'cirna' },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    })

    await flushPromises()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    const cached = queryClient.getQueryData(KEY) as ReturnType<typeof fullResult>
    expect(cached.data.recruitment).toBe(true)
    expect(cached.data.raid_progress).toEqual([
      { instance_id: 1, instance_name: 'Nerub-ar Palace' },
    ])
    expect(cached.data.reputations).toEqual([{ faction_id: 2510 }])
    expect(cached.data.dungeon_runs).toEqual([{ id: 7 }])
    expect(cached.data.titles).toEqual([{ id: 1 }])
  })
})
