import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { CharacterResource, MetaBlock } from '@/types/character'

// Task 1: tabs + per-slice empty states must render immediately during sync
// instead of being hidden behind the full-card PollingState. A slim
// SyncingBadge banner communicates the mid-sync state instead.

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

const { lookupData } = vi.hoisted(() => ({ lookupData: { value: null as unknown } }))

vi.mock('@/composables/usePollingLookup', () => ({
  useCharacterLookup: () => ({
    data: { value: lookupData.value },
    error: ref(null),
    isFetching: ref(false),
    syncPendingSince: ref(null),
    refetch: vi.fn(),
    restartPolling: vi.fn(),
    forceRefresh: vi.fn().mockResolvedValue({ data: null }),
  }),
}))

import CharacterDetailLayout from '@/pages/CharacterDetailLayout.vue'
import CharacterTabStrip from '@/components/character/CharacterTabStrip.vue'
import SyncingBadge from '@/components/feedback/SyncingBadge.vue'

function mountLayout() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return shallowMount(CharacterDetailLayout, {
    props: { region: 'eu', realm: 'the-maelstrom', name: 'cirna' },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
}

describe('CharacterDetailLayout tabs during sync', () => {
  it('renders the tab strip and a slim sync banner while isSyncing is true', () => {
    lookupData.value = {
      data: makeCharacter(),
      meta: makeMeta({ sync_status: 'syncing' }),
      isStale: false,
      isSyncing: true,
    }

    const wrapper = mountLayout()

    expect(wrapper.findComponent(CharacterTabStrip).exists()).toBe(true)
    expect(wrapper.find('[data-testid="sync-banner"]').exists()).toBe(true)
    expect(wrapper.findComponent(SyncingBadge).exists()).toBe(true)
  })

  it('renders the tab strip without the sync banner once syncing is done', () => {
    lookupData.value = {
      data: makeCharacter(),
      meta: makeMeta(),
      isStale: false,
      isSyncing: false,
    }

    const wrapper = mountLayout()

    expect(wrapper.findComponent(CharacterTabStrip).exists()).toBe(true)
    expect(wrapper.find('[data-testid="sync-banner"]').exists()).toBe(false)
    expect(wrapper.findComponent(SyncingBadge).exists()).toBe(false)
  })
})
