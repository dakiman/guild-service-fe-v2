import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LeaderboardTable from '../LeaderboardTable.vue'

const RouterLinkStub = { props: ['to'], template: '<a :data-to="JSON.stringify(to)"><slot /></a>' }

const rows = [
  { rank: 1, rating: 3412, color: '#ff8000', character: { name: 'top', display_name: 'Top', realm: 'draenor', display_realm: 'Draenor', region: 'eu', class_id: 12, spec_id: 581, faction: 'Horde' } },
  { rank: 2, rating: 3000, color: '#a335ee', character: { name: 'two', display_name: null, realm: 'kazzak', display_realm: 'Kazzak', region: 'eu', class_id: 9, spec_id: null, faction: null } },
]

describe('LeaderboardTable', () => {
  it('renders rank, name link, realm, spec and coloured rating', () => {
    const w = mount(LeaderboardTable, {
      props: { rows: rows as never },
      global: { stubs: { RouterLink: RouterLinkStub, ClassIcon: true, SpecIcon: true } },
    })
    const text = w.text()
    expect(text).toContain('Top')
    expect(text).toContain('Draenor')
    expect(text).toContain('Vengeance')
    expect(text).toContain('3,412')
    const first = JSON.parse(w.find('a').attributes('data-to')!)
    expect(first).toEqual({ name: 'character-detail', params: { region: 'eu', realm: 'draenor', name: 'top' } })
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect(w.find('[data-testid="rating-1"]').attributes('style')).toContain('rgb(255, 128, 0)')
  })

  it('shows the empty state when there are no rows', () => {
    const w = mount(LeaderboardTable, { props: { rows: [] }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(w.text()).toContain('No ranked characters yet this season')
  })

  it('keeps rating visible on mobile and folds realm/spec under the name', () => {
    const w = mount(LeaderboardTable, { props: { rows: rows as never }, global: { stubs: { RouterLink: RouterLinkStub, ClassIcon: true, SpecIcon: true } } })
    expect(w.find('table').classes().join(' ')).not.toMatch(/min-w-\[/)
    const realmTh = w.findAll('th').find((t) => t.text() === 'Realm')!
    expect(realmTh.classes()).toContain('hidden'); expect(realmTh.classes()).toContain('sm:table-cell')
    const ratingTh = w.findAll('th').find((t) => t.text() === 'Rating')!
    expect(ratingTh.classes()).not.toContain('hidden')
    expect(w.find('[data-testid="mobile-meta"]').text()).toContain('Draenor · Vengeance')
  })
})
