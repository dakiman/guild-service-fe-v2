import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import ScoreHeader from '../ScoreHeader.vue'

vi.mock('@/api/gameData', () => ({
  getSeasons: vi.fn().mockResolvedValue({ seasons: [
    { id: 18, slug: 'season-mn-2', name: 'Midnight Season 2', is_current: true, has_archive: false, started_at: null, ended_at: null },
    { id: 17, slug: 'season-mn-1', name: 'Midnight Season 1', is_current: false, has_archive: true, started_at: null, ended_at: null },
  ] }),
}))

const RouterLinkStub = {
  props: ['to'],
  template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
}

function mountWith(character: Record<string, unknown>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(ScoreHeader, {
    props: { character: character as never },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { RouterLink: RouterLinkStub } },
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
const lastSeasonRank = { ...lastSeason, rating: 2723, world: 40000, region: 40, realm: 3, class: 900, spec: 400, ...rankBase }

describe('ScoreHeader', () => {
  it('renders a dash and "No M+ rating yet" for an unrated character', async () => {
    const w = mountWith({ ...base, game_version: 'retail', mythic_plus_rating: null, rank: null })
    await flushPromises()
    expect(w.find('[data-testid="score-value"]').text()).toBe('—')
    expect(w.text()).toContain('No M+ rating yet')
    expect(w.text()).toContain('Midnight Season 2')
  })

  it('renders nothing for a classic character', () => {
    const w = mountWith({ ...base, game_version: 'classic', mythic_plus_rating: null, rank: null })
    expect(w.html()).toBe('<!--v-if-->')
  })

  it('shows the current rating coloured with the season eyebrow', async () => {
    const w = mountWith({ ...base, game_version: 'retail', mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {}, ...thisSeason }, rank: null })
    await flushPromises()
    expect(w.find('[data-testid="score-value"]').text()).toBe('2,847')
    expect(w.find('[data-testid="score-value"]').attributes('style')).toContain('rgb(255, 128, 0)')
    expect(w.text()).toContain('not yet ranked this season')
  })

  it('shows a dash as hero and the earlier-season rating as a secondary line', async () => {
    const w = mountWith({ ...base, game_version: 'retail', mythic_plus_rating: { rating: 2723, color: '#a335ee', per_spec: {}, ...lastSeason }, rank: null })
    await flushPromises()
    expect(w.find('[data-testid="score-value"]').text()).toBe('—')
    expect(w.find('[data-testid="score-unrated"]').text()).toBe('Not yet rated this season')
    const prev = w.find('[data-testid="score-season"]')
    expect(prev.text()).toBe('Midnight Season 1: 2,723')
    expect(JSON.parse(prev.find('a').attributes('data-to')!)).toEqual({ name: 'leaderboards-season-region', params: { season: 'mn-1', region: 'eu' } })
  })

  it('renders rank lines with leaderboard links and the nightly stamp', async () => {
    const w = mountWith({
      ...base,
      game_version: 'retail',
      mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {}, ...thisSeason },
      rank: { ...thisSeason, rating: 2847, world: 18940, region: 9871, realm: 312, class: 1402, spec: 640, ...rankBase },
    })
    await flushPromises()
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

  it('omits realm and spec lines when those ranks are null', async () => {
    const w = mountWith({
      ...base, active_specialization_id: null,
      game_version: 'retail',
      mythic_plus_rating: { rating: 2000, color: null, per_spec: {}, ...thisSeason },
      rank: {
        ...thisSeason, rating: 2000, world: 5, region: 3, realm: null, class: 2, spec: null,
        population: { world: 10, region: 6, realm: null, class: 4, spec: null },
        percentile: 50, connected_realm_id: null, computed_at: new Date().toISOString(),
      },
    })
    await flushPromises()
    expect(w.text()).not.toContain(' on ')
    expect(w.text()).toContain('#3 EU')
    expect(w.text()).not.toContain('Destruction')
  })

  it('shows last season standings from previous_rank with season-prefixed links, merged into score-season when the seasons match', async () => {
    const w = mountWith({
      ...base,
      game_version: 'retail',
      mythic_plus_rating: { rating: 2723, color: '#a335ee', per_spec: {}, ...lastSeason },
      rank: null,
      previous_rank: { ...lastSeason, rating: 2723, world: 900, region: 40, realm: 2, class: 9, spec: 4, ...rankBase },
    })
    await flushPromises()
    const line = w.find('[data-testid="score-season"]')
    expect(line.text()).toContain('Midnight Season 1')
    expect(line.text()).toContain('#40 EU')
    expect(line.text()).toContain('#2 on The Maelstrom')
    expect(w.find('[data-testid="score-previous"]').exists()).toBe(false)
    const links = w.findAll('a').map((a) => JSON.parse(a.attributes('data-to')!))
    expect(links).toContainEqual({ name: 'leaderboards-season-region', params: { season: 'mn-1', region: 'eu' } })
    expect(links).toContainEqual({ name: 'leaderboards-season-realm', params: { season: 'mn-1', region: 'eu', realm: 'the-maelstrom' } })
  })

  it('merges the earlier-season rating and rank into one line when they share a season', async () => {
    const w = mountWith({ ...base, game_version: 'retail', mythic_plus_rating: { rating: 2723, color: '#a335ee', per_spec: {}, ...lastSeason }, rank: null, previous_rank: lastSeasonRank })
    await flushPromises()
    const line = w.find('[data-testid="score-season"]')
    const text = line.text()
    expect(text).toContain('Midnight Season 1: 2,723')
    expect(text).toContain('#40 EU')
    expect(text).toContain('#3 on The Maelstrom')
    expect(line.findAll('[aria-hidden="true"]')).toHaveLength(2)
    expect(line.findAll('a').map((a) => JSON.parse(a.attributes('data-to')!))).toEqual([
      { name: 'leaderboards-season-region', params: { season: 'mn-1', region: 'eu' } },
      { name: 'leaderboards-season-region', params: { season: 'mn-1', region: 'eu' } },
      { name: 'leaderboards-season-realm', params: { season: 'mn-1', region: 'eu', realm: 'the-maelstrom' } },
    ])
    expect(w.find('[data-testid="score-previous"]').exists()).toBe(false)
  })

  it('keeps both lines when the rating and the previous rank come from different seasons', async () => {
    const olderSeason = { season_id: 16, season_slug: 'season-tww-3', season_name: 'The War Within Season 3', is_current: false }
    const w = mountWith({ ...base, game_version: 'retail', mythic_plus_rating: { rating: 2723, color: '#a335ee', per_spec: {}, ...olderSeason }, rank: null, previous_rank: lastSeasonRank })
    await flushPromises()
    expect(w.find('[data-testid="score-season"]').text()).toBe('The War Within Season 3: 2,723')
    expect(w.find('[data-testid="score-previous"]').text()).toContain('#40 EU')
  })

  it('keeps the previous-season block under a current rating', async () => {
    const w = mountWith({ ...base, game_version: 'retail', mythic_plus_rating: { rating: 2847, color: '#ff8000', per_spec: {}, ...thisSeason }, rank: null, previous_rank: lastSeasonRank })
    await flushPromises()
    expect(w.find('[data-testid="score-value"]').text()).toBe('2,847')
    expect(w.find('[data-testid="score-previous"]').text()).toContain('Midnight Season 1')
  })
})
