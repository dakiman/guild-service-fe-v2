import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TalentNode from '../TalentNode.vue'
describe('TalentNode accessible name', () => {
  it('renders the talent name and rank as visually-hidden text', () => {
    const w = mount(TalentNode, { props: { spellId: 123, isPicked: true, isChoice: false, rankLabel: '2/2', name: 'Shadowstep' } })
    const sr = w.get('.sr-only')
    expect(sr.text()).toBe('Shadowstep, 2/2')
  })
  it('falls back to the spell id when no name is known', () => {
    const w = mount(TalentNode, { props: { spellId: 123, isPicked: false, isChoice: false } })
    expect(w.get('.sr-only').text()).toBe('Talent 123')
  })
})
