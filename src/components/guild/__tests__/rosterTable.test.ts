import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RosterTable from '../RosterTable.vue'
const members = { data: [], current_page: 1, last_page: 1, per_page: 50, total: 0 } as never
const withOne = {
  data: [
    {
      id: 1,
      guild_id: 1,
      name: 'melaniya',
      realm: 'the-maelstrom',
      display_name: 'Melaniya',
      display_realm: 'The Maelstrom',
      level: 80,
      class_id: 8,
      race_id: 5,
      rank: 0,
      faction: 'Horde',
      equipped_item_level: 620,
      mythic_plus_rating: null,
      region_rank: null,
      active_specialization_id: 64,
      synced_at: null,
    },
  ],
  current_page: 1,
  last_page: 1,
  per_page: 50,
  total: 1,
} as never
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
  it('shows iLvl and M+ on mobile and hides race/side/spec/level', () => {
    const w = mount(RosterTable, { props: { members: withOne, page: 1, region: 'eu' }, global: { stubs } })
    const th = (label: string) => w.findAll('th').find((t) => t.text().startsWith(label))!
    expect(th('iLvl').classes()).not.toContain('hidden')
    expect(th('M+').classes()).not.toContain('hidden')
    for (const l of ['Race', 'Side', 'Spec', 'Lvl']) { expect(th(l).classes()).toContain('hidden'); expect(th(l).classes()).toContain('sm:table-cell') }
  })
})
