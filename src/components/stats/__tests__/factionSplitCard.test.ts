import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FactionSplitCard from '@/components/stats/FactionSplitCard.vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'

const RACES_FIXTURE = [
  { race_id: 10, count: 93664 }, // Blood Elf
  { race_id: 1, count: 61102 }, // Human
  { race_id: 6, count: 38547 }, // Tauren
  { race_id: 5, count: 31208 }, // Undead
  { race_id: 4, count: 24914 }, // Night Elf
  { race_id: 2, count: 20000 }, // Orc
  { race_id: 3, count: 10000 }, // Dwarf (7th — must not render)
]

function mountCard() {
  return mount(FactionSplitCard, {
    props: { horde: 289353, alliance: 264577, races: RACES_FIXTURE },
  })
}

describe('FactionSplitCard top races', () => {
  it('renders at most 6 races, highest count first', () => {
    const wrapper = mountCard()
    const icons = wrapper.findAllComponents(RaceIcon)
    expect(icons).toHaveLength(6)
    expect(wrapper.text()).toContain('Blood Elf')
    expect(wrapper.text()).not.toContain('Dwarf')
  })

  it('sorts unsorted input by count descending', () => {
    const wrapper = mount(FactionSplitCard, {
      props: {
        horde: 1,
        alliance: 1,
        races: [
          { race_id: 1, count: 5 },
          { race_id: 10, count: 50 },
        ],
      },
    })
    const names = wrapper.findAll('[data-test="race-name"]').map((n) => n.text())
    expect(names).toEqual(['Blood Elf', 'Human'])
  })

  it('still renders faction counts', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('289,353')
    expect(wrapper.text()).toContain('264,577')
  })
})
