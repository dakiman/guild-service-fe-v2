import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import CurrentAffixStrip from '@/components/stats/CurrentAffixStrip.vue'
import { fetchMetaPeriods } from '@/api/meta'
import type { MetaPeriod, MetaRegion } from '@/types/meta'

// useMetaStats imports all four meta fetchers — the mock must export them all.
vi.mock('@/api/meta', () => ({
  fetchMetaPeriods: vi.fn(),
  fetchMetaSpecs: vi.fn(),
  fetchMetaDungeons: vi.fn(),
  fetchMetaComps: vi.fn(),
}))

// usePveGameData imports all game-data fetchers — mock them all; only the
// dungeons one matters here (it carries the affix dictionary).
vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn(),
  getRealms: vi.fn(),
  getSeasons: vi.fn(),
  getMythicKeystoneDungeons: vi.fn().mockResolvedValue({
    dungeons: [],
    affixes: {
      9: { id: 9, name: 'Tyrannical', icon_url: null },
      10: { id: 10, name: 'Fortified', icon_url: null },
    },
    season: null,
  }),
}))

function period(affixes: MetaPeriod['affixes']): MetaPeriod {
  return { period_id: 1002, start_at: null, end_at: null, is_current: true, affixes }
}

async function mountStrip(region: MetaRegion, affixes: MetaPeriod['affixes']) {
  vi.mocked(fetchMetaPeriods).mockResolvedValue([
    period(affixes),
    { period_id: 1001, start_at: null, end_at: null, is_current: false, affixes: { eu: [123] } },
  ])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(CurrentAffixStrip, {
    props: { region },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  await flushPromises()
  return wrapper
}

describe('CurrentAffixStrip', () => {
  it('hides entirely when the current period has no affixes', async () => {
    const wrapper = await mountStrip('all', {})
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('shows one "This week" row when regions agree (order-insensitive)', async () => {
    const wrapper = await mountStrip('all', { eu: [9, 10], us: [10, 9] })
    expect(wrapper.text()).toContain('This week')
    expect(wrapper.text()).toContain('Tyrannical')
    expect(wrapper.text()).toContain('Fortified')
    expect(wrapper.text()).not.toMatch(/\bEU\b|\bUS\b/)
  })

  it('shows per-region rows when regions differ', async () => {
    const wrapper = await mountStrip('all', { eu: [9], us: [10] })
    expect(wrapper.text()).toMatch(/EU.*Tyrannical/s)
    expect(wrapper.text()).toMatch(/US.*Fortified/s)
  })

  it('shows only the selected region', async () => {
    const wrapper = await mountStrip('eu', { eu: [9], us: [10] })
    expect(wrapper.text()).toContain('Tyrannical')
    expect(wrapper.text()).not.toContain('Fortified')
    expect(wrapper.text()).not.toMatch(/\bEU\b/)
  })

  it('hides when the selected region has no set yet', async () => {
    const wrapper = await mountStrip('us', { eu: [9] })
    expect(wrapper.text()).toBe('')
  })

  it('falls back to "Affix N" when the dictionary lacks the id', async () => {
    const wrapper = await mountStrip('eu', { eu: [999] })
    expect(wrapper.text()).toContain('Affix 999')
  })

  it('renders a Wowhead-decorated AffixIcon per affix', async () => {
    const wrapper = await mountStrip('eu', { eu: [9, 10] })
    const anchors = wrapper.findAll('a[data-wowhead]')
    expect(anchors.map((a) => a.attributes('data-wowhead'))).toEqual(['affix=9', 'affix=10'])
  })
})
