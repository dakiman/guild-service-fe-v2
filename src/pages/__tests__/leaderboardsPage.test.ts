import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import LeaderboardsPage from '../LeaderboardsPage.vue'

const fetchCharacterLeaderboard = vi.fn()
const fetchRealmRuns = vi.fn()
vi.mock('@/api/leaderboards', () => ({
  fetchCharacterLeaderboard: (...a: unknown[]) => fetchCharacterLeaderboard(...a),
  fetchRealmRuns: (...a: unknown[]) => fetchRealmRuns(...a),
}))
vi.mock('@/composables/usePveGameData', () => ({
  useMythicDungeons: () => ({ data: { value: { dungeons: [] } } }),
  useSeasons: () => ({
    data: {
      value: {
        seasons: [
          { id: 18, slug: 'season-mn-2', name: 'Midnight Season 2', is_current: true, has_archive: false, started_at: '2026-08-22T00:00:00+00:00', ended_at: null },
          { id: 17, slug: 'season-mn-1', name: 'Midnight Season 1', is_current: false, has_archive: true, started_at: '2026-03-18T00:00:00+00:00', ended_at: '2026-08-22T00:00:00+00:00' },
        ],
      },
    },
  }),
}))

const page = LeaderboardsPage
const routes = [
  { path: '/leaderboards/world', name: 'leaderboards-world', component: page },
  { path: '/leaderboards/:region(eu|us)', name: 'leaderboards-region', component: page },
  { path: '/leaderboards/:region(eu|us)/realm/:realm', name: 'leaderboards-realm', component: page },
  { path: '/leaderboards/:region(eu|us)/class/:classSlug', name: 'leaderboards-class', component: page },
  { path: '/leaderboards/:region(eu|us)/spec/:specSlug', name: 'leaderboards-spec', component: page },
  { path: '/leaderboards/:season([a-z]+-\\d+)/world', name: 'leaderboards-season-world', component: page },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)', name: 'leaderboards-season-region', component: page },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)/realm/:realm', name: 'leaderboards-season-realm', component: page },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)/class/:classSlug', name: 'leaderboards-season-class', component: page },
  { path: '/leaderboards/:season([a-z]+-\\d+)/:region(eu|us)/spec/:specSlug', name: 'leaderboards-season-spec', component: page },
  { path: '/characters/:region/:realm/:name', name: 'character-detail', component: { template: '<div />' } },
]

async function mountAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  const w = mount(LeaderboardsPage, {
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }]],
      stubs: { RealmCombobox: true, TopRunsTable: true, PageHeader: { template: '<div><slot /><slot name="right" /></div>' }, ClassIcon: true, SpecIcon: true },
    },
  })
  await flushPromises()
  return { w, router }
}

const currentSeason = { id: 18, slug: 'season-mn-2', name: 'Midnight Season 2', is_current: true }
const lastSeason = { id: 17, slug: 'season-mn-1', name: 'Midnight Season 1', is_current: false }
const emptyResponse = (scope: string, season = currentSeason, extra: Record<string, unknown> = {}) => ({
  data: [],
  meta: {
    scope, region: 'eu', realm: null, connected_realm_id: null, class_id: null, spec_id: null,
    season, season_id: season.id, population: 0, computed_at: '2026-09-01T04:00:00Z', ...extra,
  },
})

beforeEach(() => {
  fetchCharacterLeaderboard.mockReset()
  fetchRealmRuns.mockReset()
})

describe('LeaderboardsPage', () => {
  it('resolves class and spec slugs into API ids', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('spec'))
    await mountAt('/leaderboards/eu/spec/vengeance-demon-hunter')
    expect(fetchCharacterLeaderboard).toHaveBeenCalledWith({ scope: 'spec', region: 'eu', spec_id: 581 }, expect.anything())

    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('class'))
    await mountAt('/leaderboards/us/class/death-knight')
    expect(fetchCharacterLeaderboard).toHaveBeenCalledWith({ scope: 'class', region: 'us', class_id: 6 }, expect.anything())
  })

  it('realm scope also loads the realm run board', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('realm'))
    fetchRealmRuns.mockResolvedValue({ data: [], meta: { period_id: 1078, region: 'eu', realm: 'draenor', connected_realm_id: 1403, computed_at: null } })
    const { w } = await mountAt('/leaderboards/eu/realm/draenor')
    expect(fetchRealmRuns).toHaveBeenCalledWith('eu', 'draenor', expect.anything())
    expect(w.text()).toContain('Top runs this week on Draenor')
    expect(w.text()).toContain('No runs recorded yet this week')
  })

  it('switching region on a realm ladder drops the realm pick', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('realm'))
    fetchRealmRuns.mockResolvedValue({ data: [], meta: { period_id: 1078, region: 'eu', realm: 'draenor', connected_realm_id: 1403, computed_at: null } })
    const { w, router } = await mountAt('/leaderboards/eu/realm/draenor')
    await w.find('[aria-label="Region"]').setValue('us')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('leaderboards-region')
    expect(router.currentRoute.value.params.region).toBe('us')
  })

  it('unknown slug shows the not-found state and does not fetch', async () => {
    const { w } = await mountAt('/leaderboards/eu/class/bard')
    expect(fetchCharacterLeaderboard).not.toHaveBeenCalled()
    expect(w.text()).toContain('No such leaderboard')
  })

  it('changing the scope pushes a new route', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('region'))
    const { w, router } = await mountAt('/leaderboards/eu')
    await w.find('[data-testid="scope-world"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('leaderboards-world')
  })

  it('a season URL sends the registry slug and shows the frozen-season copy', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('region', lastSeason, { population: 5, computed_at: '2026-08-21T04:00:00Z' }))
    const { w } = await mountAt('/leaderboards/mn-1/eu')
    expect(fetchCharacterLeaderboard).toHaveBeenCalledWith({ scope: 'region', region: 'eu', season: 'season-mn-1' }, expect.anything())
    const stamp = w.find('[data-testid="frozen-stamp"]')
    expect(stamp.text()).toContain('Midnight Season 1')
    expect(stamp.text()).toContain('final standings as of the last nightly')
    expect(w.text()).not.toContain('Ranks computed nightly')
  })

  it('hides the weekly realm-runs card on a frozen season', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('realm', lastSeason))
    const { w } = await mountAt('/leaderboards/mn-1/eu/realm/draenor')
    expect(fetchRealmRuns).not.toHaveBeenCalled()
    expect(w.text()).not.toContain('Top runs this week')
  })

  it('the season select pushes season routes and back to the plain current-season routes', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('region'))
    const { w, router } = await mountAt('/leaderboards/eu')
    await w.find('[aria-label="Season"]').setValue('season-mn-1')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('leaderboards-season-region')
    expect(router.currentRoute.value.params).toEqual({ season: 'mn-1', region: 'eu' })

    await w.find('[aria-label="Season"]').setValue('season-mn-2')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('leaderboards-region')
    expect(router.currentRoute.value.params).toEqual({ region: 'eu' })
  })

  it('keeps the season when switching scope', async () => {
    fetchCharacterLeaderboard.mockResolvedValue(emptyResponse('region', lastSeason))
    const { w, router } = await mountAt('/leaderboards/mn-1/eu')
    await w.find('[data-testid="scope-world"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('leaderboards-season-world')
    expect(router.currentRoute.value.params.season).toBe('mn-1')
  })

  it('an unknown season shows the not-found state', async () => {
    fetchCharacterLeaderboard.mockRejectedValue(Object.assign(new Error('404'), { isAxiosError: true, response: { status: 404, data: { message: 'Unknown season' } } }))
    const { w } = await mountAt('/leaderboards/xx-9/eu')
    expect(w.text()).toContain('No such season')
  })

  it('an unknown realm on a season URL is not misattributed to the season', async () => {
    fetchCharacterLeaderboard.mockRejectedValue(Object.assign(new Error('404'), { isAxiosError: true, response: { status: 404, data: { message: 'Unknown realm' } } }))
    const { w } = await mountAt('/leaderboards/mn-1/eu/realm/not-a-realm')
    expect(w.text()).not.toContain('No such season')
    expect(w.text()).toContain("Couldn't load this leaderboard")
  })

  it('a leaderboard fetch failure shows an error state with retry', async () => {
    fetchCharacterLeaderboard.mockRejectedValue(Object.assign(new Error('boom'), { isAxiosError: true, response: { status: 404 } }))
    const { w } = await mountAt('/leaderboards/eu')
    const err = w.findComponent({ name: 'ErrorState' })
    expect(err.exists()).toBe(true)
    expect(w.text()).not.toContain("Couldn't load this leaderboard.")
  })
})
