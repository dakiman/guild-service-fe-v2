import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

// P1.8: backend convention is smallest display_order = newest expansion. The
// composable selected the largest (oldest) instead.
const raidData = ref<{ instances: unknown[] }>({ instances: [] })
vi.mock('@/composables/usePveGameData', () => ({
  useRaidInstances: () => ({ data: raidData }),
}))

import { useBestRaidProgression } from '@/composables/useBestRaidProgression'

function instance(id: number, expId: number, expDisplayOrder: number, name: string, bosses: number) {
  return {
    id,
    name,
    display_order: 1,
    expansion: { id: expId, name: `exp${expId}`, display_order: expDisplayOrder },
    encounters: Array.from({ length: bosses }, (_, i) => ({ id: i })),
  }
}

describe('useBestRaidProgression newest-expansion selection (P1.8)', () => {
  it('selects the expansion with the smallest display_order (newest)', () => {
    raidData.value = {
      instances: [
        instance(10, 1, 1, 'Current Raid', 8), // display_order 1 = newest
        instance(20, 2, 2, 'Old Raid', 8), // display_order 2 = older
      ],
    }
    const progress = [
      { instance_id: 10, difficulty: 'Mythic' },
      { instance_id: 20, difficulty: 'Mythic' },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const best = useBestRaidProgression(() => progress as any)

    expect(best.value?.instanceName).toBe('Current Raid')
  })
})
