import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useSeasons } from '@/composables/usePveGameData'

vi.mock('@/api/gameData', () => ({
  getRaidInstances: vi.fn(),
  getRealms: vi.fn(),
  getMythicKeystoneDungeons: vi.fn(),
  getSeasons: vi.fn().mockResolvedValue({
    seasons: [
      {
        id: 18,
        slug: 'season-mn-2',
        name: 'Midnight Season 2',
        is_current: true,
        has_archive: false,
        started_at: '2026-12-16T00:00:00+00:00',
        ended_at: null,
      },
      {
        id: 17,
        slug: 'season-mn-1',
        name: 'Midnight Season 1',
        is_current: false,
        has_archive: true,
        started_at: '2026-03-18T00:00:00+00:00',
        ended_at: '2026-12-16T00:00:00+00:00',
      },
    ],
  }),
}))

function mountWithQuery(setup: () => unknown) {
  const Comp = defineComponent({
    setup,
    render: () => h('div'),
  })
  return mount(Comp, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }]],
    },
  })
}

describe('useSeasons', () => {
  it('exposes the seasons list from the game-data endpoint', async () => {
    let result: ReturnType<typeof useSeasons> | undefined
    mountWithQuery(() => {
      result = useSeasons()
    })
    await flushPromises()

    expect(result!.data.value?.seasons).toHaveLength(2)
    expect(result!.data.value?.seasons[0].slug).toBe('season-mn-2')
    expect(result!.data.value?.seasons[1].has_archive).toBe(true)
  })
})
