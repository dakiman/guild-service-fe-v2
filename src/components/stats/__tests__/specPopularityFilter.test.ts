import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecPopularityCard from '@/components/stats/SpecPopularityCard.vue'
import SpecIcon from '@/components/wow/SpecIcon.vue'

const SPECS = [
  { spec_id: 268, class_id: 10, count: 100 }, // Brewmaster (tank)
  { spec_id: 269, class_id: 10, count: 80 }, // Windwalker (dps)
  { spec_id: 270, class_id: 10, count: 60 }, // Mistweaver (healer)
  { spec_id: 264, class_id: 10, count: 1 }, // dirty: Resto Shaman under Monk
  { spec_id: 1480, class_id: 12, count: 90 }, // Devourer (dps)
]

function mountCard() {
  return mount(SpecPopularityCard, { props: { specs: SPECS, total: 331 } })
}

describe('SpecPopularityCard mismatch filter', () => {
  it('drops rows whose spec does not belong to the row class', () => {
    const wrapper = mountCard()
    // 3 valid monk specs + devourer; the 264-under-monk row is gone
    expect(wrapper.findAllComponents(SpecIcon)).toHaveLength(4)
  })

  it('excludes dropped rows from the sample count and percentages', () => {
    const wrapper = mountCard()
    // 100+80+60+90 = 330, not 331
    expect(wrapper.text()).toContain('330 characters')
    // Brewmaster: 100/330 = 30.3%
    expect(wrapper.text()).toContain('30.3%')
  })

  it('counts Devourer under the Dps role filter', async () => {
    const wrapper = mountCard()
    const dpsButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Dps')!
    await dpsButton.trigger('click')
    // Windwalker 80 + Devourer 90
    expect(wrapper.text()).toContain('170 characters')
    expect(wrapper.findAllComponents(SpecIcon)).toHaveLength(2)
  })
})
