import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RaidInstanceCard from '../RaidInstanceCard.vue'

const instance = {
  id: 1,
  name: 'Sporefall',
  media_url: null,
  expansion: { name: 'Midnight' },
  encounters: [{ id: 10, name: 'Rotmire', display_order: 1 }],
} as never

function activeTabText(w: ReturnType<typeof mount>): string {
  return w.findAll('button.wsa-tab').find((b) => b.classes('wsa-tab--active'))!.text()
}

describe('RaidInstanceCard default difficulty', () => {
  it('defaults to Normal when the character has no kills in the instance', () => {
    const w = mount(RaidInstanceCard, {
      props: { instance, progress: [] },
      global: { stubs: { BossRow: true } },
    })
    expect(activeTabText(w)).toContain('Normal')
  })

  it('still defaults to the highest difficulty with a kill', () => {
    const w = mount(RaidInstanceCard, {
      props: {
        instance,
        progress: [
          { instance_id: 1, encounter_id: 10, difficulty: 'Heroic', kills: 3 } as never,
        ],
      },
      global: { stubs: { BossRow: true } },
    })
    expect(activeTabText(w)).toContain('Heroic')
  })
})

describe('RaidInstanceCard collapsed', () => {
  it('renders a one-line row with 0/N and expands on click', async () => {
    const w = mount(RaidInstanceCard, { props: { instance, progress: [], collapsed: true }, global: { stubs: { BossRow: true } } })
    expect(w.find('[data-testid="raid-collapsed"]').exists()).toBe(true)
    expect(w.text()).toContain('Sporefall')
    expect(w.text()).toContain('0/1')
    expect(w.findAll('button.wsa-tab')).toHaveLength(0)
    const toggle = w.get('[data-testid="raid-expand"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(w.find('[data-testid="raid-collapsed"]').exists()).toBe(false)
    expect(w.findAll('button.wsa-tab').length).toBeGreaterThan(0)
  })
  it('is expanded by default when not collapsed', () => {
    const w = mount(RaidInstanceCard, { props: { instance, progress: [] }, global: { stubs: { BossRow: true } } })
    expect(w.find('[data-testid="raid-collapsed"]').exists()).toBe(false)
  })
})
