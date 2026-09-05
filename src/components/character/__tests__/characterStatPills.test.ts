import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'

// CharacterStatPills renders a raid-progress pill via useBestRaidProgression,
// which pulls raid instance data through vue-query — mock it directly so this
// test doesn't need a QueryClient/network round-trip for an unrelated pill.
vi.mock('@/composables/usePveGameData', () => ({
  useRaidInstances: () => ({ data: ref({ instances: [] }) }),
}))

import CharacterStatPills from '../CharacterStatPills.vue'
const RouterLinkStub = { props: ['to'], template: '<a><slot /></a>' }
describe('CharacterStatPills', () => {
  it('renders iLvl, raid and achievements pills but no M+ pill', () => {
    const w = mount(CharacterStatPills, {
      props: { character: { region: 'eu', realm: 'r', name: 'n', equipped_item_level: 276, achievement_points: 8415, raid_progress: null, mythic_plus_rating: { rating: 2723, color: '#a335ee' } } as never },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(w.text()).toContain('276')
    expect(w.text()).toContain('8,415')
    expect(w.text()).not.toContain('2,723')
    expect(w.text()).not.toMatch(/M\+/)
  })
})
