import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MetaCompsList from '@/components/stats/MetaCompsList.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import type { CompEntry, PairingEntry } from '@/types/meta'

function comp(i: number, count: number, over: Partial<CompEntry> = {}): CompEntry {
  return {
    signature: `sig-${i}`,
    tank_spec_id: 250,
    healer_spec_id: 65,
    dps_spec_ids: [62, 253, 262],
    count,
    timed_rate: 0.9,
    ...over,
  }
}

// 12 comps, counts 1200, 1100, … 100 — #1 = 1200. #12 is the only Prot-Paladin comp.
const comps: CompEntry[] = Array.from({ length: 12 }, (_, i) =>
  comp(i + 1, 1200 - i * 100, i === 11 ? { tank_spec_id: 66 } : {}),
)
// 9 pairings, counts 900 … 100 — last one is the only Resto-Druid pairing.
const pairings: PairingEntry[] = Array.from({ length: 9 }, (_, i) => ({
  tank_spec_id: 250,
  healer_spec_id: i === 8 ? 105 : 65,
  count: 900 - i * 100,
  timed_rate: 0.8,
}))

describe('MetaCompsList rows', () => {
  it('renders rank, five icons, a divider, count and timed % per comp', () => {
    const wrapper = mount(MetaCompsList, { props: { comps: comps.slice(0, 1), pairings: [] } })
    const row = wrapper.find('li')

    expect(row.text()).toContain('#1')
    expect(row.findAllComponents(SpecIcon)).toHaveLength(5)
    expect(row.find('[data-testid="role-divider"]').exists()).toBe(true)
    expect(row.text()).toContain('1,200')
    expect(row.text()).toContain('90% timed')
  })

  it('titles each comp row with the spelled-out specs', () => {
    const wrapper = mount(MetaCompsList, { props: { comps: comps.slice(0, 1), pairings: [] } })
    expect(wrapper.find('li').attributes('title')).toBe(
      'Blood Death Knight · Holy Paladin · Arcane Mage / Beast Mastery Hunter / Elemental Shaman',
    )
  })

  it('scales the bar against the top comp', () => {
    const wrapper = mount(MetaCompsList, { props: { comps: comps.slice(0, 2), pairings: [] } })
    const bars = wrapper.findAll('[data-testid="comp-bar"]')
    expect(bars[0].attributes('style')).toContain('width: 100%')
    expect(bars[1].attributes('style')).toContain('width: 91.66')
  })

  it('renders an empty state without comps', () => {
    const wrapper = mount(MetaCompsList, { props: { comps: [], pairings: [] } })
    expect(wrapper.text()).toContain('No comp data yet')
  })
})

describe('MetaCompsList collapse/expand', () => {
  it('shows the top 10 comps and top 8 pairings collapsed, all when expanded', async () => {
    const wrapper = mount(MetaCompsList, { props: { comps, pairings } })

    expect(wrapper.findAll('[data-testid="comp-row"]')).toHaveLength(10)
    expect(wrapper.findAll('[data-testid="pairing-row"]')).toHaveLength(8)
    expect(wrapper.text()).toContain('Tank–Healer Pairings')

    const toggle = wrapper.find('[data-testid="comps-toggle"]')
    expect(toggle.text()).toBe('Show all 12')
    await toggle.trigger('click')

    expect(wrapper.findAll('[data-testid="comp-row"]')).toHaveLength(12)
    expect(wrapper.findAll('[data-testid="pairing-row"]')).toHaveLength(9)
    expect(wrapper.find('[data-testid="comps-toggle"]').text()).toBe('Show top 10')
  })

  it('hides the toggle when there are 10 or fewer comps', () => {
    const wrapper = mount(MetaCompsList, { props: { comps: comps.slice(0, 10), pairings } })
    expect(wrapper.find('[data-testid="comps-toggle"]').exists()).toBe(false)
  })
})

describe('MetaCompsList spec filter', () => {
  it('narrows comps to those containing the spec and keeps the overall rank', () => {
    const wrapper = mount(MetaCompsList, { props: { comps, pairings, specFilter: 66 } })
    const rows = wrapper.findAll('[data-testid="comp-row"]')

    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('#12')
    // Bar still scales against the unfiltered #1 (1200), so 100/1200 ≈ 8.33%.
    expect(rows[0].find('[data-testid="comp-bar"]').attributes('style')).toContain('width: 8.33')
  })

  it('matches dps specs too', () => {
    const only = [comp(1, 500, { dps_spec_ids: [71, 72, 73] }), comp(2, 400)]
    const wrapper = mount(MetaCompsList, { props: { comps: only, pairings: [], specFilter: 72 } })
    expect(wrapper.findAll('[data-testid="comp-row"]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="comp-row"]').text()).toContain('500')
  })

  it('filters pairings for a healer spec but not for a dps spec', () => {
    const healer = mount(MetaCompsList, { props: { comps, pairings, specFilter: 105 } })
    expect(healer.findAll('[data-testid="pairing-row"]')).toHaveLength(1)

    const dps = mount(MetaCompsList, { props: { comps, pairings, specFilter: 62 } })
    expect(dps.findAll('[data-testid="pairing-row"]')).toHaveLength(8)
  })

  it('shows a named empty state when no comp contains the spec', () => {
    const wrapper = mount(MetaCompsList, { props: { comps, pairings, specFilter: 104 } })
    expect(wrapper.text()).toContain('No top comps include Guardian Druid')
    expect(wrapper.findAll('[data-testid="comp-row"]')).toHaveLength(0)
  })
})
