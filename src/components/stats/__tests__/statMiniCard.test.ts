import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatMiniCard from '@/components/stats/StatMiniCard.vue'

describe('StatMiniCard', () => {
  it('renders an #icon slot before the value', () => {
    const wrapper = mount(StatMiniCard, {
      props: { label: 'Most Popular Spec', value: 'Retribution' },
      slots: { icon: '<span data-test="spec-icon" />' },
    })
    expect(wrapper.find('[data-test="spec-icon"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Retribution')
  })

  it('applies valueColor to the value text', () => {
    const wrapper = mount(StatMiniCard, {
      props: { label: 'X', value: 'Y', valueColor: '#F48CBA' },
    })
    const value = wrapper.find('[data-test="stat-value"]')
    expect(value.attributes('style')).toContain('color: rgb(244, 140, 186)')
  })

  it('renders without slot or valueColor as before', () => {
    const wrapper = mount(StatMiniCard, {
      props: { label: 'Total', value: '553,930', subtitle: 'chars' },
    })
    expect(wrapper.text()).toContain('553,930')
    expect(wrapper.text()).toContain('chars')
  })
})
