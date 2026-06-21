import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'

// P1.8: smallest display_order = newest. The section sorted expansions DESC, so
// `latestExpansion` (the main section) was actually the OLDEST expansion.
const raidData = ref<{ instances: unknown[] }>({ instances: [] })
vi.mock('@/composables/usePveGameData', () => ({
  useRaidInstances: () => ({
    data: raidData,
    isLoading: ref(false),
    isError: ref(false),
    refetch: vi.fn(),
  }),
}))
vi.mock('@/composables/useCharacterContext', () => ({
  useCharacterContext: () => ({ freshness: ref({ raids: 'ok' }) }),
}))

import RaidProgressionSection from '@/components/character/pve/RaidProgressionSection.vue'

function inst(id: number, expId: number, expDisplayOrder: number, expName: string) {
  return {
    id,
    name: `inst${id}`,
    display_order: 1,
    expansion: { id: expId, name: expName, display_order: expDisplayOrder },
    encounters: [],
  }
}

describe('RaidProgressionSection expansion ordering (P1.8)', () => {
  it('treats the smallest display_order as the latest (main) expansion', async () => {
    raidData.value = {
      instances: [
        inst(1, 1, 1, 'The War Within'), // newest
        inst(2, 2, 2, 'Dragonflight'), // legacy
      ],
    }

    const wrapper = mount(RaidProgressionSection, {
      props: { raidProgress: [] },
      global: {
        stubs: {
          RaidInstanceCard: { template: '<div class="ric" />', props: ['instance', 'progress'] },
        },
      },
    })

    // Reveal legacy raids.
    await wrapper.find('button').trigger('click')

    const headers = wrapper.findAll('h3').map((h) => h.text())
    expect(headers).toContain('Dragonflight')
    expect(headers).not.toContain('The War Within')
  })
})
