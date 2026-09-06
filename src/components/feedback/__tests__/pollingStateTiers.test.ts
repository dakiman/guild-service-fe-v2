import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const { announce } = vi.hoisted(() => ({ announce: vi.fn() }))
vi.mock('@/composables/useAnnounce', () => ({ useAnnounce: () => ({ announce }) }))

import PollingState from '../PollingState.vue'

describe('PollingState tiers', () => {
  beforeEach(() => announce.mockClear())

  it('shows first-fetch copy when pendingSince is fresh or absent', () => {
    const w = mount(PollingState)
    expect(w.text()).toContain('Fetching from Blizzard for the first time')
    expect(w.find('button').exists()).toBe(false)
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-live')).toBeUndefined()
    expect(announce).toHaveBeenCalledWith('Fetching from Blizzard for the first time…')
  })

  it('shows the queue-busy line after 30s when the queue is deep', () => {
    const w = mount(PollingState, {
      props: { pendingSince: Date.now() - 60_000, queueDepth: 300 },
    })
    expect(w.text()).toContain('queue is busy')
    expect(w.text()).toContain('300')
  })

  it('hides the queue-busy line when the queue is shallow', () => {
    const w = mount(PollingState, {
      props: { pendingSince: Date.now() - 60_000, queueDepth: 3 },
    })
    expect(w.text()).not.toContain('queue is busy')
  })

  it('shows patient copy and a working Check now button after 3 minutes', async () => {
    const w = mount(PollingState, {
      props: { pendingSince: Date.now() - 4 * 60_000 },
    })
    expect(w.text()).toContain('Taking longer than usual')

    const btn = w.find('button')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('checkNow')).toHaveLength(1)
  })

  it('lets explicit message/subtext props override tier copy', () => {
    const w = mount(PollingState, {
      props: { message: 'Syncing character data…', subtext: 'custom' },
    })
    expect(w.text()).toContain('Syncing character data…')
    expect(w.text()).toContain('custom')
  })

  it('announces each tier change as the clock advances', async () => {
    vi.useFakeTimers()
    try {
      const w = mount(PollingState, { props: { pendingSince: Date.now() } })
      expect(announce).toHaveBeenLastCalledWith('Fetching from Blizzard for the first time…')
      vi.advanceTimersByTime(31_000)
      await w.vm.$nextTick()
      expect(announce).toHaveBeenLastCalledWith('Still syncing…')
      expect(announce).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('PollingState mascot art', () => {
  it('renders the digging plaque and work-work accent by default', () => {
    const w = mount(PollingState, { props: {} })
    expect(w.get('img').attributes('src')).toBe('/brand/state-loading.jpg')
    expect(w.text()).toContain('Work, work…')
  })

  it('keeps a caller-provided visual slot intact', () => {
    const w = mount(PollingState, { slots: { visual: '<b class="custom">X</b>' } })
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('b.custom').exists()).toBe(true)
  })
})
