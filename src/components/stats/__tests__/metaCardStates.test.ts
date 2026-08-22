import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { AxiosError, type AxiosResponse } from 'axios'
import type { Component } from 'vue'
import MetaSpecCard from '@/components/stats/MetaSpecCard.vue'
import MetaCompsCard from '@/components/stats/MetaCompsCard.vue'
import MetaDungeonCard from '@/components/stats/MetaDungeonCard.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import { fetchMetaComps, fetchMetaDungeons, fetchMetaSpecs } from '@/api/meta'

vi.mock('@/api/meta', () => ({
  fetchMetaPeriods: vi.fn(),
  fetchMetaSpecs: vi.fn(),
  fetchMetaDungeons: vi.fn(),
  fetchMetaComps: vi.fn(),
}))

function httpError(status: number): AxiosError {
  const err = new AxiosError('boom')
  err.response = { status, data: {}, statusText: '', headers: {}, config: {} } as AxiosResponse
  return err
}

function emptyRoles() {
  return { roles: { tank: [], healer: [], dps: [] }, total_runs: 0 }
}

async function mountCard(component: Component) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(component, {
    props: { period: 'current', region: 'eu' },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('MetaSpecCard bracket pills', () => {
  it('renders numeric brackets ascending, labeled by affix, with All keys last', async () => {
    // Object literal order mimics the JSON payload; JS hoists integer-like keys.
    vi.mocked(fetchMetaSpecs).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      brackets: { all: emptyRoles(), 5: emptyRoles(), 7: emptyRoles(), 10: emptyRoles(), 12: emptyRoles() },
    } as never)

    const wrapper = await mountCard(MetaSpecCard)
    const pills = wrapper.findAll('.flex.gap-1.mb-3 button').map((b) => b.text())

    expect(pills).toEqual(['+5 Bargain', '+7 Fort/Tyr', '+10 Both', '+12 Guile', 'All keys'])
  })

  it('labels unknown floors as "+N and up"', async () => {
    vi.mocked(fetchMetaSpecs).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      brackets: { all: emptyRoles(), 7: emptyRoles(), 17: emptyRoles() },
    } as never)

    const wrapper = await mountCard(MetaSpecCard)
    const pills = wrapper.findAll('.flex.gap-1.mb-3 button').map((b) => b.text())

    expect(pills).toEqual(['+7 Fort/Tyr', '+17 and up', 'All keys'])
  })

  it('defaults to the +7 bracket', async () => {
    vi.mocked(fetchMetaSpecs).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      brackets: {
        all: { ...emptyRoles(), total_runs: 111 },
        7: { ...emptyRoles(), total_runs: 777 },
        12: { ...emptyRoles(), total_runs: 999 },
      },
    } as never)

    const wrapper = await mountCard(MetaSpecCard)
    expect(wrapper.text()).toContain('777 runs in bracket')
  })

  it('falls back to the first numeric bracket when +7 is absent', async () => {
    vi.mocked(fetchMetaSpecs).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      brackets: {
        all: { ...emptyRoles(), total_runs: 111 },
        12: { ...emptyRoles(), total_runs: 999 },
      },
    } as never)

    const wrapper = await mountCard(MetaSpecCard)
    expect(wrapper.text()).toContain('999 runs in bracket')
  })
})

describe('meta card error states', () => {
  it('shows the not-warmed note on 404 and no ErrorState', async () => {
    vi.mocked(fetchMetaSpecs).mockRejectedValue(httpError(404))

    const wrapper = await mountCard(MetaSpecCard)

    expect(wrapper.text()).toContain("isn't warmed yet")
    expect(wrapper.findComponent(ErrorState).exists()).toBe(false)
  })

  it.each([
    ['MetaSpecCard', MetaSpecCard, fetchMetaSpecs],
    ['MetaDungeonCard', MetaDungeonCard, fetchMetaDungeons],
    ['MetaCompsCard', MetaCompsCard, fetchMetaComps],
  ])('%s renders ErrorState on a real failure', async (_name, component, fetcher) => {
    // A real (non-404) failure now retries up to 3x via retryUnlessNotWarmed,
    // so fast-forward past the exponential backoff delays before asserting.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(fetcher).mockRejectedValue(httpError(500))

    const wrapper = await mountCard(component)
    await vi.advanceTimersByTimeAsync(10000)
    await flushPromises()

    expect(wrapper.findComponent(ErrorState).exists()).toBe(true)
    expect(wrapper.text()).not.toContain("isn't warmed yet")

    vi.useRealTimers()
  })
})

describe('meta card coverage stamps', () => {
  it('MetaSpecCard renders the official stamp under the runs line', async () => {
    vi.mocked(fetchMetaSpecs).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      // 42 on both keys so the assertion holds whatever the default bracket is
      // ('all' today, '7' after Task 3).
      brackets: { all: { ...emptyRoles(), total_runs: 42 }, 7: { ...emptyRoles(), total_runs: 42 } },
      computed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    } as never)
    const wrapper = await mountCard(MetaSpecCard)
    expect(wrapper.text()).toContain('42 runs in bracket')
    expect(wrapper.text()).toContain('Updated 2h ago · top-500 per shard, official Blizzard leaderboards · EU+US')
  })

  it('MetaDungeonCard renders the official stamp', async () => {
    vi.mocked(fetchMetaDungeons).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      dungeons: [],
      dungeon_of_the_week: null,
      trends: {},
      computed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    } as never)
    const wrapper = await mountCard(MetaDungeonCard)
    expect(wrapper.text()).toContain('Updated 1h ago · top-500 per shard')
  })

  it('MetaCompsCard renders the official stamp', async () => {
    vi.mocked(fetchMetaComps).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      comps: [],
      pairings: [],
      min_sample: 20,
      computed_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    } as never)
    const wrapper = await mountCard(MetaCompsCard)
    expect(wrapper.text()).toContain('Updated 1h ago · top-500 per shard')
  })

  it('renders no stamp when computed_at is absent', async () => {
    vi.mocked(fetchMetaComps).mockResolvedValue({
      period_id: 1002, region: 'eu', comps: [], pairings: [], min_sample: 20,
    } as never)
    const wrapper = await mountCard(MetaCompsCard)
    expect(wrapper.text()).not.toContain('official Blizzard leaderboards')
  })
})
