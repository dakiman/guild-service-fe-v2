import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RaceIcon from '../RaceIcon.vue'

describe('RaceIcon', () => {
  it('renders a Wowhead img URL using the slug + default gender', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 4 } }) // Night Elf, default female
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(
      'https://wow.zamimg.com/images/wow/icons/medium/race_nightelf_female.jpg',
    )
    expect(img.attributes('title')).toBe('Night Elf')
  })

  it('respects an explicit gender prop', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 1, gender: 'female' } })
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://wow.zamimg.com/images/wow/icons/medium/race_human_female.jpg',
    )
  })

  it('falls back to the initial-badge when slug is unknown', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 99999 } })
    expect(wrapper.find('img').exists()).toBe(false)
    // Initial-badge fallback retains the old visual (single letter)
    expect(wrapper.text()).toBe('U') // 'Unknown' -> 'U'
  })

  it('honors the size prop', () => {
    const wrapper = mount(RaceIcon, { props: { raceId: 1, size: 18 } })
    const img = wrapper.find('img')
    expect(img.attributes('width')).toBe('18')
    expect(img.attributes('height')).toBe('18')
  })
})
