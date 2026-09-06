import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { GuildResource, GuildMetaBlock, GuildMember } from '@/types/guild'
import type { Paginated } from '@/types/api'
import { NotFoundError } from '@/types/api'

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/api/guilds', () => ({
  fetchGuild: vi.fn().mockResolvedValue(null),
}))

function makeGuild(overrides: Partial<GuildResource> = {}): GuildResource {
  return {
    id: 7,
    name: 'starfall',
    realm: 'the-maelstrom',
    region: 'eu',
    faction: 'Alliance',
    achievement_points: 0,
    member_count: 0,
    created_timestamp: 0,
    num_of_searches: 0,
    roster_synced_at: null,
    ...overrides,
  }
}

function makeMembers(overrides: Partial<Paginated<GuildMember>> = {}): Paginated<GuildMember> {
  return {
    current_page: 1,
    data: [],
    first_page_url: '',
    from: null,
    last_page: 1,
    last_page_url: '',
    links: [],
    next_page_url: null,
    path: '',
    per_page: 50,
    prev_page_url: null,
    to: null,
    total: 0,
    ...overrides,
  } as Paginated<GuildMember>
}

function makeMeta(overrides: Partial<GuildMetaBlock> = {}): GuildMetaBlock {
  return {
    forced_refresh: false,
    refresh: { available: true, available_at: null, cooldown_seconds: 0 },
    ...overrides,
  } as GuildMetaBlock
}

// ESM named exports can't be spied on — mock the module and swap the return value per test.
const { lookupState } = vi.hoisted(() => ({ lookupState: { current: null as unknown } }))
vi.mock('@/composables/usePollingLookup', () => ({ useGuildLookup: () => lookupState.current }))

import GuildDetailPage from '@/pages/GuildDetailPage.vue'

function fakeLookup(over: Partial<Record<'data' | 'error' | 'isFetching' | 'syncPendingSince', unknown>>) {
  return {
    data: ref(over.data ?? undefined),
    error: ref(over.error ?? null),
    isFetching: ref(over.isFetching ?? false),
    syncPendingSince: ref(over.syncPendingSince ?? null),
    refetch: vi.fn(), restartPolling: vi.fn(), forceRefresh: vi.fn(),
  }
}

function mountPage(lookup: ReturnType<typeof fakeLookup>) {
  lookupState.current = lookup
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return shallowMount(GuildDetailPage, {
    props: { region: 'eu', realm: 'the-maelstrom', name: 'starfall' },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      // shallowMount auto-stubs every child regardless of `stubs`, which
      // would swallow the skeleton's own data-testid/h1 markup — opt it out
      // so this test can assert on its real rendered output.
      stubs: { GuildStatsSection: true, GuildLayoutSkeleton: false },
    },
  })
}

describe('GuildDetailPage states', () => {
  it('shows the skeleton (not PollingState) while pending with no 202 seen', () => {
    const w = mountPage(fakeLookup({}))
    expect(w.find('[data-testid="guild-skeleton"]').exists()).toBe(true)
    expect(w.findComponent({ name: 'PollingState' }).exists()).toBe(false)
  })

  it('shows PollingState once a 202 has been observed', () => {
    const w = mountPage(fakeLookup({ syncPendingSince: Date.now() }))
    expect(w.findComponent({ name: 'PollingState' }).exists()).toBe(true)
    const h1s = w.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0].text()).toBe('Guild lookup')
  })

  it('keeps rendered content and shows a compact error banner on a refetch error', () => {
    const w = mountPage(fakeLookup({
      data: { guild: makeGuild(), members: makeMembers(), meta: makeMeta(), isStale: false, isSyncing: false },
      error: new Error('429'),
    }))
    expect(w.findComponent({ name: 'GuildHeader' }).exists()).toBe(true)
    const err = w.findComponent({ name: 'ErrorState' })
    expect(err.exists()).toBe(true)
    expect(err.props('compact')).toBe(true)
  })

  it('shows the full ErrorState with kind=guild when there is no data', () => {
    const w = mountPage(fakeLookup({ error: new NotFoundError() }))
    const err = w.findComponent({ name: 'ErrorState' })
    expect(err.props('compact')).toBeFalsy()
    expect(err.props('kind')).toBe('guild')
    expect(w.findComponent({ name: 'GuildHeader' }).exists()).toBe(false)
    const h1s = w.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0].text()).toBe('Guild lookup')
  })

  it('titles the tab from the route params before data and "Not found" on a 404', () => {
    document.title = 'Raids · Peon'
    mountPage(fakeLookup({}))
    expect(document.title).toBe('Starfall – The Maelstrom · Peon')
    document.title = 'Raids · Peon'
    mountPage(fakeLookup({
      data: {
        guild: makeGuild({ display_name: 'StarFall', display_realm: 'The Maelstrom' }),
        members: makeMembers(),
        meta: makeMeta(),
        isStale: false,
        isSyncing: false,
      },
    }))
    expect(document.title).toBe('StarFall – The Maelstrom · Peon')
    document.title = 'Raids · Peon'
    mountPage(fakeLookup({ error: new NotFoundError() }))
    expect(document.title).toBe('Not found · Peon')
  })
})
