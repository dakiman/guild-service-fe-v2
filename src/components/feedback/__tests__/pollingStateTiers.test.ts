import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PollingState from '../PollingState.vue'

describe('PollingState tiers', () => {
  it('shows first-fetch copy when pendingSince is fresh or absent', () => {
    const w = mount(PollingState)
    expect(w.text()).toContain('Fetching from Blizzard for the first time')
    expect(w.find('button').exists()).toBe(false)
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
})
