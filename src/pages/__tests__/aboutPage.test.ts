import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutPage from '@/pages/AboutPage.vue'

describe('AboutPage', () => {
  it('names both data sources and the coverage caveat', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.text()).toContain('official Blizzard Mythic+ leaderboards')
    expect(wrapper.text()).toContain('top-500 runs per dungeon')
    expect(wrapper.text()).toContain('not a global census')
    expect(wrapper.text()).toContain('raider.io')
  })
})
