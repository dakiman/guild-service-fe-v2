import { describe, it, expect } from 'vitest'
import { computed } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import MountsSubtab from '@/pages/character/collections/MountsSubtab.vue'
import { CharacterContextKey, type CharacterContext } from '@/composables/useCharacterContext'

// P2.5: collections can carry 1-2k rows. They must be virtualized so only a
// small window renders into the DOM rather than every item at once.
function contextWith(mountCount: number): CharacterContext {
  const mounts = Array.from({ length: mountCount }, (_, i) => ({
    mount_id: i + 1,
    name: `Mount ${i + 1}`,
    is_useable: true,
    game_data: null,
  }))

  const character = computed(() => ({ mounts }) as never)
  return {
    character,
    meta: computed(() => ({}) as never),
    freshness: computed(() => ({}) as never),
    isStale: computed(() => false),
    isSyncing: computed(() => false),
    isClassic: computed(() => false),
    refetch: async () => undefined,
  }
}

describe('collections virtualization (P2.5)', () => {
  it('renders only a window of mounts, not all 300', async () => {
    const wrapper = mount(MountsSubtab, {
      global: { provide: { [CharacterContextKey as symbol]: contextWith(300) } },
    })

    await flushPromises()

    // The header proves all 300 mounts are in the data set…
    expect(wrapper.text()).toContain('Mounts (300)')

    // …but the DOM only holds a window. A plain v-for would render all 300
    // nodes regardless of layout — virtualization renders far fewer.
    const rendered = wrapper.findAll('[data-collection-item]').length
    expect(rendered).toBeLessThan(300)
  })
})
