import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MetaDungeonTable from '@/components/stats/MetaDungeonTable.vue'
import type { DungeonReportEntry } from '@/types/meta'

const dungeons: DungeonReportEntry[] = [
  {
    dungeon_id: 504,
    name: 'Skyreach',
    runs: 900,
    timed_rate: 0.75,
    avg_key: 14.2,
    avg_duration_ms: 1650000,
    timer_ms: 1800000,
    avg_margin_ms: 150000,
    highest_key: 22,
  },
  {
    dungeon_id: 505,
    name: 'Pit of Saron',
    runs: 1200,
    timed_rate: 0.55,
    avg_key: 13.1,
    avg_duration_ms: 2100000,
    timer_ms: 2000000,
    avg_margin_ms: -100000,
    highest_key: 20,
  },
]

describe('MetaDungeonTable', () => {
  it('renders rows sorted by runs desc with formatted margins', () => {
    const wrapper = mount(MetaDungeonTable, { props: { dungeons, trends: {} } })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Pit of Saron') // 1200 runs first
    expect(rows[0].text()).toContain('-1:40')
    expect(rows[1].text()).toContain('+2:30')
    expect(rows[1].text()).toContain('75%')
  })

  it('re-sorts when a header is clicked', async () => {
    const wrapper = mount(MetaDungeonTable, { props: { dungeons, trends: {} } })

    await wrapper
      .findAll('th')
      .find((th) => th.text().includes('Timed'))!
      .trigger('click')

    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Skyreach')
  })
})
