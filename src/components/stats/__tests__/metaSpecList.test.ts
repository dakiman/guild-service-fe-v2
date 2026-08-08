import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MetaSpecList from '@/components/stats/MetaSpecList.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'
import type { SpecMetaEntry } from '@/types/meta'

const entries: SpecMetaEntry[] = [
  { spec_id: 268, count: 900, share: 0.45, timed_rate: 0.71 },
  { spec_id: 104, count: 500, share: 0.25, timed_rate: 0.64 },
]

describe('MetaSpecList', () => {
  it('renders a row per spec with share and timed rate', () => {
    const wrapper = mount(MetaSpecList, { props: { entries } })

    expect(wrapper.findAllComponents(SpecIcon)).toHaveLength(2)
    expect(wrapper.text()).toContain('45.0%')
    expect(wrapper.text()).toContain('71%')
  })

  it('shows movement arrows against previous shares', () => {
    const wrapper = mount(MetaSpecList, {
      props: { entries, prevShares: { 268: 0.4, 104: 0.25 } },
    })

    expect(wrapper.text()).toContain('▲') // 268 rose 0.45 vs 0.40
    expect(wrapper.text()).not.toContain('▼') // 104 unchanged (delta < 0.005)
  })

  it('renders an empty state without entries', () => {
    const wrapper = mount(MetaSpecList, { props: { entries: [] } })
    expect(wrapper.text()).toContain('No run data')
  })
})
