import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FreshnessSummary from '../FreshnessSummary.vue'

const freshness = {
  profile: 'fresh',
  mythic_plus: 'fresh',
  raids: 'stale',
  collections: 'never_synced',
} as never

describe('FreshnessSummary', () => {
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
