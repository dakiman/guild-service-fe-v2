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
  it('renders "All keys" first, then ascending numeric brackets', async () => {
    // Object literal order mimics the JSON payload; JS hoists integer-like keys.
    vi.mocked(fetchMetaSpecs).mockResolvedValue({
      period_id: 1002,
      region: 'eu',
      brackets: {
        all: emptyRoles(),
        7: emptyRoles(),
        12: emptyRoles(),
        17: emptyRoles(),
      },
    } as never)

    const wrapper = await mountCard(MetaSpecCard)
    const pills = wrapper.findAll('.flex.gap-1.mb-3 button').map((b) => b.text())

    expect(pills).toEqual(['All keys', '+7 and up', '+12 and up', '+17 and up'])
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
