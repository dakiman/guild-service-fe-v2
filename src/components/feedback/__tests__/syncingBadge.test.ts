import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SyncingBadge from '../SyncingBadge.vue'

describe('SyncingBadge', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the syncing banner while syncing', () => {
    const w = mount(SyncingBadge, { props: { syncing: true } })
    const banner = w.get('[data-testid="sync-banner"]')
    expect(w.text()).toContain('Syncing character data')
    expect(banner.attributes('role')).toBe('status')
    expect(banner.attributes('aria-live')).toBe('polite')
  })

  it('renders nothing when mounted already-synced (no flash on page load)', () => {
    const w = mount(SyncingBadge, { props: { syncing: false } })
    expect(w.find('[data-testid="sync-banner"]').exists()).toBe(false)
    expect(w.find('[data-testid="sync-success"]').exists()).toBe(false)
  })

  it('flashes "Job\'s done!" for 4s on the syncing→done flip, then clears', async () => {
    const w = mount(SyncingBadge, { props: { syncing: true } })
    await w.setProps({ syncing: false })
    const flash = w.get('[data-testid="sync-success"]')
    expect(w.text()).toContain("Job's done!")
    expect(flash.get('img').attributes('src')).toBe('/brand/state-success.jpg')
    vi.advanceTimersByTime(4000)
    await w.vm.$nextTick()
    expect(w.find('[data-testid="sync-success"]').exists()).toBe(false)
  })

  it('cancels the flash if syncing resumes', async () => {
    const w = mount(SyncingBadge, { props: { syncing: true } })
    await w.setProps({ syncing: false })
    await w.setProps({ syncing: true })
    expect(w.find('[data-testid="sync-banner"]').exists()).toBe(true)
    expect(w.find('[data-testid="sync-success"]').exists()).toBe(false)
  })
})
