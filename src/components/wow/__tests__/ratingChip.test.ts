import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RatingChip from '../RatingChip.vue'

describe('RatingChip', () => {
  it('renders nothing without a rating', () => {
    const w = mount(RatingChip, { props: { rating: null, regionRank: null } })
    expect(w.html()).toBe('<!--v-if-->')
  })

  it('renders the coloured rating and the region rank when present', () => {
    const w = mount(RatingChip, { props: { rating: { rating: 2847, color: '#ff8000' }, regionRank: 9871 } })
    expect(w.text()).toContain('2,847')
    expect(w.text()).toContain('#9,871')
    expect(w.find('[data-testid="rating-chip-value"]').attributes('style')).toContain('rgb(255, 128, 0)')
  })

  it('labels the rank suffix', () => {
    const w = mount(RatingChip, { props: { rating: { rating: 2847, color: '#ff8000' }, regionRank: 6 } })
    const rank = w.find('[aria-label="rank #6"]')
    expect(rank.exists()).toBe(true)
    expect(rank.attributes('title')).toBe('rank #6')
  })

  it('omits the rank when null', () => {
    const w = mount(RatingChip, { props: { rating: { rating: 1500, color: null }, regionRank: null } })
    expect(w.text()).toContain('1,500')
    expect(w.text()).not.toContain('#')
  })

  it('greys out a rating from an earlier season and drops the rank', () => {
    const w = mount(RatingChip, {
      props: { rating: { rating: 2723, color: '#a335ee' }, regionRank: 12, isCurrent: false, seasonName: 'Midnight Season 1' },
    })
    expect(w.text()).toContain('2,723')
    expect(w.text()).not.toContain('#')
    expect(w.find('[data-testid="rating-chip-value"]').attributes('style') ?? '').not.toContain('rgb(163, 53, 238)')
    expect(w.find('[data-testid="rating-chip-value"]').classes()).toContain('text-wsa-disabled')
    expect(w.attributes('title')).toBe('M+ rating from Midnight Season 1 — not yet rated this season')
  })
})
