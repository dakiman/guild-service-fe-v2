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
}))

const routes = [
  { path: '/leaderboards/world', name: 'leaderboards-world', component: LeaderboardsPage },
  { path: '/leaderboards/:region', name: 'leaderboards-region', component: LeaderboardsPage },
  { path: '/leaderboards/:region/realm/:realm', name: 'leaderboards-realm', component: LeaderboardsPage },
  { path: '/leaderboards/:region/class/:classSlug', name: 'leaderboards-class', component: LeaderboardsPage },
  { path: '/leaderboards/:region/spec/:specSlug', name: 'leaderboards-spec', component: LeaderboardsPage },
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

const emptyResponse = (scope: string) => ({
  data: [],
  meta: { scope, region: 'eu', realm: null, connected_realm_id: null, class_id: null, spec_id: null, season_id: 18, population: 0, computed_at: '2026-09-01T04:00:00Z' },
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
})
