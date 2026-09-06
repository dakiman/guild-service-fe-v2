import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@/api/stats', () => ({
  fetchRaidKillStats: vi.fn().mockResolvedValue({
    current_expansion: 'Midnight',
    expansions: ['Midnight'],
    generated_at: new Date().toISOString(),
    raids: [
      {
        instance_id: 1,
        name: 'Manaforge Omega',
        bosses: [{ encounter_id: 10, name: 'Plexus Sentinel', kills_by_class: { '2': 12 } }],
      },
    ],
  }),
}))
vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn().mockResolvedValue({ instances: [] }),
}))

import RaidHeatmapCard from '@/components/stats/RaidHeatmapCard.vue'

describe('RaidHeatmapCard cell roles', () => {
  it('gives a cell with kills exactly one role="img", on the focusable wrapper', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const w = mount(RaidHeatmapCard, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { ClassIcon: true } },
    })
    await flushPromises()

    const imgs = w.findAll('[role="img"]')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].attributes('tabindex')).toBe('0')
    expect(imgs[0].attributes('aria-label')).toBe('Paladin: 12 kills')

    const dot = w.get('.heatmap-dot')
    expect(dot.attributes('role')).toBeUndefined()
    expect(dot.attributes('aria-label')).toBeUndefined()
    expect(dot.attributes('aria-hidden')).toBe('true')
  })
})
