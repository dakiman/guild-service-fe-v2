import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MetaCompsList from '@/components/stats/MetaCompsList.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import type { CompEntry, PairingEntry } from '@/types/meta'

const comps: CompEntry[] = [
  {
    signature: '268:65:102,253,577',
    tank_spec_id: 268,
    healer_spec_id: 65,
    dps_spec_ids: [102, 253, 577],
    count: 420,
    timed_rate: 0.8,
  },
]
const pairings: PairingEntry[] = [
  { tank_spec_id: 268, healer_spec_id: 65, count: 900, timed_rate: 0.7 },
]

describe('MetaCompsList', () => {
  it('renders five spec icons per comp plus pairing rows', () => {
    const wrapper = mount(MetaCompsList, { props: { comps, pairings } })

    expect(wrapper.findAllComponents(SpecIcon)).toHaveLength(7) // 5 comp + 2 pairing
    expect(wrapper.text()).toContain('420')
    expect(wrapper.text()).toContain('80%')
    expect(wrapper.text()).toContain('Tank–Healer Pairings')
  })

  it('renders an empty state without comps', () => {
    const wrapper = mount(MetaCompsList, { props: { comps: [], pairings: [] } })
    expect(wrapper.text()).toContain('No comp data')
  })
})
