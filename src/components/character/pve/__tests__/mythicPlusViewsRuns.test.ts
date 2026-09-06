import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/composables/useWowhead', () => ({ useWowheadRefresh: vi.fn() }))

import MythicPlusAllRuns from '../MythicPlusAllRuns.vue'
import MythicPlusBestPerDungeon from '../MythicPlusBestPerDungeon.vue'

const run = (id: number, season: number, dungeon_id: number) => ({
  id, season, dungeon_id, dungeon_name: `Dungeon ${dungeon_id}`, keystone_level: 10 + id, duration: 1_000_000,
  is_completed_on_time: true, completed_timestamp: 1_780_000_000_000 + id, affixes: [], members: [],
})
const runs = [run(1, 18, 503), run(2, 17, 400)] as never
const dungeons = [
  { id: 503, name: 'Ara-Kara', media_url: null },
  { id: 400, name: 'Old Dungeon', media_url: null },
] as never
const stubs = { RouterLink: true, AffixIcon: true }

describe('M+ views render exactly the runs they are given', () => {
  it('AllRuns lists every run and has no season prop or empty branch', () => {
    const w = mount(MythicPlusAllRuns, { props: { runs, dungeons }, global: { stubs } })
    expect(w.findAll('button.wsa-card')).toHaveLength(2)
    expect(w.text()).not.toContain('No mythic+ runs recorded')
    expect(w.text()).not.toContain('Syncing dungeon data')
    expect((MythicPlusAllRuns as { props?: Record<string, unknown> }).props).not.toHaveProperty('currentSeason')
  })

  it('BestPerDungeon shows one row per dungeon with a run and has no season prop', () => {
    const w = mount(MythicPlusBestPerDungeon, { props: { runs, dungeons }, global: { stubs } })
    expect(w.findAll('tbody tr')).toHaveLength(2)
    expect((MythicPlusBestPerDungeon as { props?: Record<string, unknown> }).props).not.toHaveProperty('currentSeason')
  })
})
