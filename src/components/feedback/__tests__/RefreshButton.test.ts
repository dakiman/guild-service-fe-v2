import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RefreshButton from '../RefreshButton.vue'

describe('RefreshButton', () => {
  it('is enabled and emits refresh on click when available and not syncing', async () => {
    const w = mount(RefreshButton, {
      props: {
        refresh: { available: true, available_at: null, cooldown_seconds: 300 },
        syncing: false,
      },
    })
    const btn = w.find('button')
    expect(btn.attributes('disabled')).toBeUndefined()
    expect(w.text()).toContain('Refresh')
    expect(w.text()).not.toContain('Refresh in')

    await btn.trigger('click')
    expect(w.emitted('refresh')).toHaveLength(1)
  })

  it('is disabled with an "Refresh in Xm" countdown derived from available_at when on cooldown', () => {
    const availableAt = new Date(Date.now() + 3 * 60_000).toISOString()
    const w = mount(RefreshButton, {
      props: {
        refresh: { available: false, available_at: availableAt, cooldown_seconds: 300 },
        syncing: false,
      },
    })
    const btn = w.find('button')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Refresh in 3m')
  })

  it('does not emit refresh when clicked while on cooldown', async () => {
    const availableAt = new Date(Date.now() + 3 * 60_000).toISOString()
    const w = mount(RefreshButton, {
      props: {
        refresh: { available: false, available_at: availableAt, cooldown_seconds: 300 },
        syncing: false,
      },
    })
    await w.find('button').trigger('click')
    expect(w.emitted('refresh')).toBeUndefined()
  })

  it('is disabled while syncing even when refresh.available is true', () => {
    const w = mount(RefreshButton, {
      props: {
        refresh: { available: true, available_at: null, cooldown_seconds: 300 },
        syncing: true,
      },
    })
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })
})
