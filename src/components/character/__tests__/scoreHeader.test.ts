import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreHeader from '../ScoreHeader.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
}

function mountWith(character: Record<string, unknown>) {
  return mount(ScoreHeader, {
    props: { character: character as never },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

const base = {
  name: 'melaniya', realm: 'the-maelstrom', display_realm: 'The Maelstrom', region: 'eu',
  class_id: 9, active_specialization_id: 267,
}

describe('ScoreHeader', () => {
  it('renders nothing for an unrated character', () => {
    const w = mountWith({ ...base, mythic_plus_rating: null, rank: null })
    expect(w.html()).toBe('<!--v-if-->')
  })

  it('renders the coloured rating and "not yet ranked" when rated but unranked', () => {
    const w = mountWith({ ...base, mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {} }, rank: null })
    expect(w.text()).toContain('2,847')
    expect(w.find('[data-testid="score-value"]').attributes('style')).toContain('rgb(255, 128, 0)')
    expect(w.text()).toContain('not yet ranked this season')
  })

  it('renders rank lines with leaderboard links and the nightly stamp', () => {
    const w = mountWith({
      ...base,
      mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {} },
      rank: {
        season_id: 18, rating: 2847, world: 18940, region: 9871, realm: 312, class: 1402, spec: 640,
        population: { world: 152560, region: 82297, realm: 1900, class: 14000, spec: 6100 },
        percentile: 4, connected_realm_id: 1090, computed_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),
      },
    })
    const text = w.text()
    expect(text).toContain('#312 on The Maelstrom')
    expect(text).toContain('#9,871 EU')
    expect(text).toContain('top 4% of tracked characters')
    expect(text).toContain('#1,402 Warlock')
    expect(text).toContain('#640 Destruction')
    expect(text).toContain('ranks computed nightly · 5h ago')
    const links = w.findAll('a').map((a) => JSON.parse(a.attributes('data-to')!))
    expect(links).toContainEqual({ name: 'leaderboards-realm', params: { region: 'eu', realm: 'the-maelstrom' } })
    expect(links).toContainEqual({ name: 'leaderboards-spec', params: { region: 'eu', specSlug: 'destruction-warlock' } })
  })

  it('omits realm and spec lines when those ranks are null', () => {
    const w = mountWith({
      ...base, active_specialization_id: null,
      mythic_plus_rating: { rating: 2000, color: null, per_spec: {} },
      rank: {
        season_id: 18, rating: 2000, world: 5, region: 3, realm: null, class: 2, spec: null,
        population: { world: 10, region: 6, realm: null, class: 4, spec: null },
        percentile: 50, connected_realm_id: null, computed_at: new Date().toISOString(),
      },
    })
    expect(w.text()).not.toContain(' on ')
    expect(w.text()).toContain('#3 EU')
    expect(w.text()).not.toContain('Destruction')
  })
})
