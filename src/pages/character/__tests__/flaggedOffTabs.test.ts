import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, defineComponent, h } from 'vue'
import CharacterAchievementsTab from '../CharacterAchievementsTab.vue'
import { provideCharacterContext } from '@/composables/useCharacterContext'

function mountWithContext(featureFlags: Record<string, boolean>) {
  const character = computed(
    () => ({ region: 'eu', realm: 'the-maelstrom', name: 'melaniya' }) as never,
  )
  const meta = computed(() => ({ feature_flags: featureFlags, freshness: {} }) as never)
  const Host = defineComponent({
    setup() {
      provideCharacterContext({
        character,
        meta,
        freshness: computed(() => ({}) as never),
        isStale: computed(() => false),
        isSyncing: computed(() => false),
        isClassic: computed(() => false),
        refetch: () => Promise.resolve(),
      } as never)
      return () => h(CharacterAchievementsTab)
    },
  })
  return mount(Host, { global: { stubs: { AchievementsList: true } } })
}

describe('CharacterAchievementsTab', () => {
  it('renders a not-tracked notice when the achievements flag is off', () => {
    const w = mountWithContext({ achievements: false })
    expect(w.text()).toContain('Achievements aren\'t tracked')
    expect(w.findComponent({ name: 'AchievementsList' }).exists()).toBe(false)
  })

  it('renders the list when the flag is on', () => {
    const w = mountWithContext({ achievements: true })
    expect(w.findComponent({ name: 'AchievementsList' }).exists()).toBe(true)
  })
})
