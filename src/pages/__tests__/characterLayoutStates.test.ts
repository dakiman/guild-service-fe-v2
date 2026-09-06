import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { CharacterResource, MetaBlock } from '@/types/character'
import { NotFoundError } from '@/types/api'

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/characters/eu/the-maelstrom/cirna' }),
}))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: null }),
}))
vi.mock('@/api/characters', () => ({
  toggleRecruitment: vi.fn(),
  fetchCharacter: vi.fn().mockResolvedValue(null),
}))

function makeCharacter(overrides: Partial<CharacterResource> = {}): CharacterResource {
  return {
    id: 42,
    name: 'cirna',
    realm: 'the-maelstrom',
    region: 'eu',
    game_version: 'retail',
    gender: 'male',
    faction: 'Alliance',
    race_id: 1,
    class_id: 1,
    level: 80,
    achievement_points: 0,
    average_item_level: 600,
    equipped_item_level: 600,
    active_specialization: null,
    active_specialization_id: null,
    talent_tree_id: null,
    talent_loadout_code: null,
    mythic_plus_rating: null,
    rank: null,
    previous_rank: null,
    media: null,
    talents: { class: [], spec: [], hero: [], pvp: [] },
    equipment: [],
    stats: null,
    active_title_id: null,
    recruitment: false,
    guild: null,
    last_searched_at: null,
    mythics_synced_at: null,
    stats_synced_at: null,
    synced_at: null,
    ...overrides,
  }
}

function makeMeta(overrides: Partial<MetaBlock> = {}): MetaBlock {
  return {
    game_version: 'retail',
    forced_refresh: false,
    sync_status: 'complete',
    profile_tier: 'full',
    queue_depth: 0,
    freshness: { profile: 'fresh' },
    feature_flags: { achievements: true, pets: true, mounts: true, toys: true },
    ...overrides,
  }
}

// ESM named exports can't be spied on — mock the module and swap the return value per test.
const { lookupState } = vi.hoisted(() => ({ lookupState: { current: null as unknown } }))
vi.mock('@/composables/usePollingLookup', () => ({ useCharacterLookup: () => lookupState.current }))

import CharacterDetailLayout from '@/pages/CharacterDetailLayout.vue'

function fakeLookup(over: Partial<Record<'data' | 'error' | 'isFetching' | 'syncPendingSince', unknown>>) {
  return {
    data: ref(over.data ?? undefined),
    error: ref(over.error ?? null),
    isFetching: ref(over.isFetching ?? false),
    syncPendingSince: ref(over.syncPendingSince ?? null),
    refetch: vi.fn(), restartPolling: vi.fn(), forceRefresh: vi.fn(),
  }
}

function mountLayout(lookup: ReturnType<typeof fakeLookup>) {
  lookupState.current = lookup
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return shallowMount(CharacterDetailLayout, {
    props: { region: 'eu', realm: 'the-maelstrom', name: 'cirna' },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      // shallowMount auto-stubs every child regardless of `stubs`, which
      // would swallow the skeleton's own data-testid/h1 markup — opt it out
      // so this test can assert on its real rendered output.
      stubs: { RouterView: true, 'router-view': true, CharacterLayoutSkeleton: false },
    },
  })
}

describe('CharacterDetailLayout states', () => {
  it('shows the skeleton (not PollingState) while pending with no 202 seen', () => {
    const w = mountLayout(fakeLookup({}))
    expect(w.find('[data-testid="character-skeleton"]').exists()).toBe(true)
    expect(w.findComponent({ name: 'PollingState' }).exists()).toBe(false)
  })

  it('shows PollingState once a 202 has been observed', () => {
    const w = mountLayout(fakeLookup({ syncPendingSince: Date.now() }))
    expect(w.findComponent({ name: 'PollingState' }).exists()).toBe(true)
    const h1s = w.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0].text()).toBe('Character lookup')
  })

  it('keeps rendered content and shows a compact error banner on a refetch error', () => {
    const w = mountLayout(fakeLookup({
      data: { data: makeCharacter(), meta: makeMeta(), isStale: false, isSyncing: false },
      error: new Error('429'),
    }))
    expect(w.findComponent({ name: 'CharacterHeader' }).exists()).toBe(true)
    const err = w.findComponent({ name: 'ErrorState' })
    expect(err.exists()).toBe(true)
    expect(err.props('compact')).toBe(true)
  })

  it('shows the full ErrorState with kind=character when there is no data', () => {
    const w = mountLayout(fakeLookup({ error: new NotFoundError() }))
    const err = w.findComponent({ name: 'ErrorState' })
    expect(err.props('compact')).toBeFalsy()
    expect(err.props('kind')).toBe('character')
    expect(w.findComponent({ name: 'CharacterHeader' }).exists()).toBe(false)
    const h1s = w.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0].text()).toBe('Character lookup')
  })

  it('titles the tab from the route params before data and "Not found" on a 404', () => {
    document.title = 'Raids · Peon'
    mountLayout(fakeLookup({}))
    expect(document.title).toBe('Cirna – The Maelstrom · Peon')
    mountLayout(fakeLookup({ data: { data: makeCharacter({ display_name: 'Cirna', display_realm: 'The Maelstrom' }), meta: makeMeta(), isStale: false, isSyncing: false } }))
    expect(document.title).toBe('Cirna – The Maelstrom · Peon')
    mountLayout(fakeLookup({ error: new NotFoundError() }))
    expect(document.title).toBe('Not found · Peon')
  })
})
