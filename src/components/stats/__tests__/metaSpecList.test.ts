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

  it('emits select-spec on click and on Enter', async () => {
    const wrapper = mount(MetaSpecList, { props: { entries } })
    const rows = wrapper.findAll('li')

    await rows[0].trigger('click')
    await rows[1].trigger('keydown.enter')

    expect(wrapper.emitted('select-spec')).toEqual([[268], [104]])
    expect(rows[0].attributes('role')).toBe('button')
    expect(rows[0].attributes('tabindex')).toBe('0')
    expect(rows[0].attributes('title')).toBe('Show comps with Brewmaster Monk')
  })

  it('highlights the active spec and offers to clear it', () => {
    const wrapper = mount(MetaSpecList, { props: { entries, activeSpecId: 104 } })
    const rows = wrapper.findAll('li')

    expect(rows[1].classes()).toContain('bg-wsa-gold/5')
    expect(rows[1].attributes('title')).toBe('Clear comp filter')
    expect(rows[0].classes()).not.toContain('bg-wsa-gold/5')
  })

  it('explains the movement glyph via a title', () => {
    const wrapper = mount(MetaSpecList, {
      props: { entries, prevShares: { 268: 0.4, 104: 0.3 } },
    })
    const glyphs = wrapper.findAll('[data-testid="movement"]')

    expect(glyphs[0].attributes('title')).toBe('Share up vs previous week')
    expect(glyphs[1].attributes('title')).toBe('Share down vs previous week')
  })
})
