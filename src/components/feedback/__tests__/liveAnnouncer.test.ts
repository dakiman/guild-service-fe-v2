import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import LiveAnnouncer from '../LiveAnnouncer.vue'
import { useAnnounce } from '@/composables/useAnnounce'

describe('LiveAnnouncer', () => {
  it('is an always-mounted polite status region that renders announcements', async () => {
    const w = mount(LiveAnnouncer)
    const region = w.get('[role="status"]')
    expect(region.attributes('aria-live')).toBe('polite')
    expect(region.attributes('aria-atomic')).toBe('true')
    expect(region.classes()).toContain('sr-only')
    expect(region.text()).toBe('')
    await useAnnounce().announce('Fetching from Blizzard for the first time…')
    await nextTick()
    expect(region.text()).toBe('Fetching from Blizzard for the first time…')
  })
})
