import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FactionSplitCard from '@/components/stats/FactionSplitCard.vue'
import RaceIcon from '@/components/wow/RaceIcon.vue'

const RACES_FIXTURE = [
  { race_id: 10, count: 93664 }, // Blood Elf (Horde)
  { race_id: 1, count: 61102 }, // Human (Alliance)
  { race_id: 6, count: 38547 }, // Tauren
  { race_id: 5, count: 31208 }, // Undead
  { race_id: 4, count: 24914 }, // Night Elf
  { race_id: 2, count: 20000 }, // Orc
  { race_id: 3, count: 10000 }, // Dwarf (7th — must render too now)
]

function mountCard(races = RACES_FIXTURE) {
  return mount(FactionSplitCard, {
    props: { horde: 289353, alliance: 264577, races },
  })
}

describe('FactionSplitCard races', () => {
  it('renders every race, highest count first', () => {
    const wrapper = mountCard()
    expect(wrapper.findAllComponents(RaceIcon)).toHaveLength(7)
    const names = wrapper.findAll('[data-test="race-name"]').map((n) => n.text())
    expect(names[0]).toBe('Blood Elf')
    expect(names).toContain('Dwarf')
  })

  it('sorts unsorted input by count descending', () => {
    const wrapper = mountCard([
      { race_id: 1, count: 5 },
      { race_id: 10, count: 50 },
    ])
    const names = wrapper.findAll('[data-test="race-name"]').map((n) => n.text())
    expect(names).toEqual(['Blood Elf', 'Human'])
  })

  it('merges faction-variant ids into one named row with summed counts', () => {
    const wrapper = mountCard([
      { race_id: 25, count: 300 }, // Pandaren (A)
      { race_id: 26, count: 200 }, // Pandaren (H)
      { race_id: 1, count: 100 }, // Human
    ])
    const names = wrapper.findAll('[data-test="race-name"]').map((n) => n.text())
    expect(names).toEqual(['Pandaren', 'Human'])
    expect(wrapper.text()).toContain('500')
  })

  it('tints bars by faction, gold for merged cross-faction rows', () => {
    const wrapper = mountCard([
      { race_id: 2, count: 30 }, // Orc — Horde
      { race_id: 1, count: 20 }, // Human — Alliance
      { race_id: 52, count: 5 }, // Dracthyr (A) — merges with 70 → mixed
      { race_id: 70, count: 5 }, // Dracthyr (H)
    ])
    const bars = wrapper.findAll('[data-test="race-bar"]')
    expect(bars).toHaveLength(3)
    expect(bars[0].attributes('style')).toMatch(/#7a1515|rgb\(122, 21, 21\)/)
    expect(bars[1].attributes('style')).toMatch(/#153a6a|rgb\(21, 58, 106\)/)
    expect(bars[2].attributes('style')).toMatch(/#aa8855|rgb\(170, 136, 85\)/)
  })

  it("shows each race's share of all characters", () => {
    const wrapper = mountCard([
      { race_id: 2, count: 75 },
      { race_id: 1, count: 25 },
    ])
    expect(wrapper.text()).toContain('75.0%')
    expect(wrapper.text()).toContain('25.0%')
  })

  it('still renders faction counts', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('289,353')
    expect(wrapper.text()).toContain('264,577')
  })
})
