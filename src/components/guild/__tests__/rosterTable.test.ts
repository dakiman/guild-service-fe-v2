import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RosterTable from '../RosterTable.vue'
const members = { data: [], current_page: 1, last_page: 1, per_page: 50, total: 0 } as never
const stubs = { RouterLink: true, 'router-link': true, ClassIcon: true, RaceIcon: true, SpecIcon: true, FactionBadge: true, RatingChip: true }
describe('RosterTable empty copy', () => {
  it('says nothing is synced when no filter is active', () => {
    const w = mount(RosterTable, { props: { members, page: 1, region: 'eu' }, global: { stubs } })
    expect(w.text()).toContain('No members synced yet.')
  })
  it('says nothing matches when a filter is active', () => {
    const w = mount(RosterTable, { props: { members, page: 1, region: 'eu', filterActive: true }, global: { stubs } })
    expect(w.text()).toContain('No members match your filter.')
  })
})
