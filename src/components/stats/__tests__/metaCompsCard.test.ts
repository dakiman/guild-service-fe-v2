import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import MetaCompsCard from '@/components/stats/MetaCompsCard.vue'
import MetaCompsList from '@/components/stats/MetaCompsList.vue'
import { fetchMetaComps } from '@/api/meta'

vi.mock('@/api/meta', () => ({
  fetchMetaPeriods: vi.fn(),
  fetchMetaSpecs: vi.fn(),
  fetchMetaDungeons: vi.fn(),
  fetchMetaComps: vi.fn(),
}))

async function mountCard(specFilter: number | null = null) {
  vi.mocked(fetchMetaComps).mockResolvedValue({
    period_id: 1002,
    region: 'eu',
    comps: [
      {
        signature: '250:65:62,253,262',
        tank_spec_id: 250,
        healer_spec_id: 65,
        dps_spec_ids: [62, 253, 262],
        count: 100,
        timed_rate: 0.9,
      },
    ],
    pairings: [],
    min_sample: 25,
    computed_at: '2026-08-28T04:30:00Z',
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(MetaCompsCard, {
    props: { period: 'current', region: 'eu', specFilter },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('MetaCompsCard spec filter', () => {
  it('renders a grouped select with All specs first', async () => {
    const wrapper = await mountCard()
    const select = wrapper.find('select[aria-label="Filter by spec"]')

    expect(select.exists()).toBe(true)
    expect(select.findAll('option')[0].text()).toBe('All specs')
    expect(select.findAll('optgroup').map((g) => g.attributes('label'))).toEqual([
      'Tank',
      'Healer',
      'DPS',
    ])
    expect((select.element as HTMLSelectElement).value).toBe('')
  })

  it('emits update:specFilter on change and passes the filter to the list', async () => {
    const wrapper = await mountCard(65)
    expect(wrapper.findComponent(MetaCompsList).props('specFilter')).toBe(65)

    const select = wrapper.find('select[aria-label="Filter by spec"]')
    await select.setValue('250')
    await select.setValue('')

    expect(wrapper.emitted('update:specFilter')).toEqual([[250], [null]])
  })
})
