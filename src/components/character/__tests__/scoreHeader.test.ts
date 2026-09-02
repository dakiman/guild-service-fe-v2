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
  class_id: 9, active_specialization_id: 267, previous_rank: null,
}
const thisSeason = { season_id: 18, season_slug: 'season-mn-2', season_name: 'Midnight Season 2', is_current: true }
const lastSeason = { season_id: 17, season_slug: 'season-mn-1', season_name: 'Midnight Season 1', is_current: false }
const rankBase = {
  population: { world: 152560, region: 82297, realm: 1900, class: 14000, spec: 6100 },
  percentile: 4, connected_realm_id: 1090, computed_at: new Date(Date.now() - 5 * 3_600_000).toISOString(),
}

describe('ScoreHeader', () => {
  it('renders nothing for an unrated character', () => {
    const w = mountWith({ ...base, mythic_plus_rating: null, rank: null })
    expect(w.html()).toBe('<!--v-if-->')
  })

  it('renders the coloured rating and "not yet ranked" when rated this season but unranked', () => {
    const w = mountWith({ ...base, mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {}, ...thisSeason }, rank: null })
    expect(w.text()).toContain('2,847')
    expect(w.find('[data-testid="score-value"]').attributes('style')).toContain('rgb(255, 128, 0)')
    expect(w.text()).toContain('not yet ranked this season')
    expect(w.find('[data-testid="score-season"]').exists()).toBe(false)
  })

  it('labels a rating from an earlier season instead of calling it unranked', () => {
    const w = mountWith({ ...base, mythic_plus_rating: { rating: 2723, color: '#a335ee', per_spec: {}, ...lastSeason }, rank: null })
    expect(w.text()).toContain('2,723')
    expect(w.find('[data-testid="score-season"]').text()).toBe('Midnight Season 1 rating · not yet rated this season')
    expect(w.text()).not.toContain('not yet ranked this season')
  })

  it('renders rank lines with leaderboard links and the nightly stamp', () => {
    const w = mountWith({
      ...base,
      mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {}, ...thisSeason },
      rank: { ...thisSeason, rating: 2847, world: 18940, region: 9871, realm: 312, class: 1402, spec: 640, ...rankBase },
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
      mythic_plus_rating: { rating: 2000, color: null, per_spec: {}, ...thisSeason },
      rank: {
        ...thisSeason, rating: 2000, world: 5, region: 3, realm: null, class: 2, spec: null,
        population: { world: 10, region: 6, realm: null, class: 4, spec: null },
        percentile: 50, connected_realm_id: null, computed_at: new Date().toISOString(),
      },
    })
    expect(w.text()).not.toContain(' on ')
    expect(w.text()).toContain('#3 EU')
    expect(w.text()).not.toContain('Destruction')
  })

  it('shows last season standings from previous_rank with season-prefixed links', () => {
    const w = mountWith({
      ...base,
      mythic_plus_rating: { rating: 2723, color: '#a335ee', per_spec: {}, ...lastSeason },
      rank: null,
      previous_rank: { ...lastSeason, rating: 2723, world: 900, region: 40, realm: 2, class: 9, spec: 4, ...rankBase },
    })
    const prev = w.find('[data-testid="score-previous"]')
    expect(prev.text()).toContain('Midnight Season 1')
    expect(prev.text()).toContain('#40 EU')
    expect(prev.text()).toContain('#2 on The Maelstrom')
    const links = w.findAll('a').map((a) => JSON.parse(a.attributes('data-to')!))
    expect(links).toContainEqual({ name: 'leaderboards-season-region', params: { season: 'mn-1', region: 'eu' } })
    expect(links).toContainEqual({ name: 'leaderboards-season-realm', params: { season: 'mn-1', region: 'eu', realm: 'the-maelstrom' } })
  })
})
