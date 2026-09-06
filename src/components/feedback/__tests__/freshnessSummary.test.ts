import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
const { announce } = vi.hoisted(() => ({ announce: vi.fn() }))
vi.mock('@/composables/useAnnounce', () => ({ useAnnounce: () => ({ announce }) }))
import FreshnessSummary from '../FreshnessSummary.vue'

const freshness = {
  profile: 'fresh',
  mythic_plus: 'fresh',
  raids: 'stale',
  collections: 'never_synced',
} as never

describe('FreshnessSummary', () => {
  beforeEach(() => announce.mockClear())

  it('has no live region of its own, stays quiet on mount, announces aggregate changes', async () => {
    const w = mount(FreshnessSummary, { props: { freshness } })
    expect(w.find('[role="status"]').exists()).toBe(false)
    expect(announce).not.toHaveBeenCalled()
    await w.setProps({ hiddenKeys: ['collections', 'raids'] })
    expect(announce).toHaveBeenCalledTimes(1)
    expect(announce).toHaveBeenCalledWith('Data up to date')
  })

  it('shows the syncing aggregate when any visible slice is never_synced', () => {
    const w = mount(FreshnessSummary, { props: { freshness } })
    expect(w.get('button').text()).toContain('Updating 1 section')
  })

  it('ignores hidden slices when aggregating', () => {
    const w = mount(FreshnessSummary, {
      props: { freshness, hiddenKeys: ['collections'] },
    })
    // collections (never_synced) hidden → highest remaining state is stale
    expect(w.get('button').text()).toContain('1 section refreshing')
  })

  it('shows up-to-date when everything visible is fresh', () => {
    const w = mount(FreshnessSummary, {
      props: { freshness, hiddenKeys: ['collections', 'raids'] },
    })
    expect(w.get('button').text()).toContain('Data up to date')
  })

  it('toggles the chip breakdown panel on click', async () => {
    const w = mount(FreshnessSummary, { props: { freshness } })
    expect(w.find('[data-testid="freshness-panel"]').exists()).toBe(false)
    await w.get('button').trigger('click')
    expect(w.find('[data-testid="freshness-panel"]').exists()).toBe(true)
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
  })
})
