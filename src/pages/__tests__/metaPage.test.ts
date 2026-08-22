import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import MetaPage from '@/pages/MetaPage.vue'
import CurrentAffixStrip from '@/components/stats/CurrentAffixStrip.vue'
import MetaSpecCard from '@/components/stats/MetaSpecCard.vue'
import MetaDungeonCard from '@/components/stats/MetaDungeonCard.vue'
import MetaCompsCard from '@/components/stats/MetaCompsCard.vue'
import PageHeader from '@/components/layout/PageHeader.vue'

// useMetaPeriods imports all four fetchers — the mock must export them all
vi.mock('@/api/meta', () => ({
  fetchMetaPeriods: vi.fn().mockResolvedValue([
    { period_id: 1002, start_at: '2026-08-04T00:00:00Z', end_at: '2026-08-11T00:00:00Z', is_current: true },
    { period_id: 1001, start_at: '2026-07-28T00:00:00Z', end_at: '2026-08-04T00:00:00Z', is_current: false },
  ]),
  fetchMetaSpecs: vi.fn(),
  fetchMetaDungeons: vi.fn(),
  fetchMetaComps: vi.fn(),
}))

function mountPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return shallowMount(MetaPage, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
}

describe('MetaPage', () => {
  it('renders header and all three meta cards', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.findComponent(PageHeader).props('title')).toBe('M+ Meta')
    expect(wrapper.findComponent(MetaSpecCard).exists()).toBe(true)
    expect(wrapper.findComponent(MetaDungeonCard).exists()).toBe(true)
    expect(wrapper.findComponent(MetaCompsCard).exists()).toBe(true)
  })

  it('passes previous period id to the spec card', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.findComponent(MetaSpecCard).props('prevPeriodId')).toBe(1001)
  })

  it('mounts the affix strip bound to the selected region and period', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.findComponent(CurrentAffixStrip).props('region')).toBe('all')
    expect(wrapper.findComponent(CurrentAffixStrip).props('period')).toBe('current')
  })
})
