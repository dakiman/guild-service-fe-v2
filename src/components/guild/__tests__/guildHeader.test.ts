import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuildHeader from '../GuildHeader.vue'

const guild = {
  name: 'balkanika',
  display_name: 'Balkanika',
  realm: 'the-maelstrom',
  display_realm: 'The Maelstrom',
  region: 'eu',
  faction: 'Alliance',
  member_count: 967,
  achievement_points: 2375,
  created_timestamp: Date.UTC(2022, 3, 28), // Apr 28 2022
} as never

describe('GuildHeader', () => {
  it('renders the created date as a locale-independent "Apr 28, 2022"', () => {
    const w = mount(GuildHeader, { props: { guild } })
    expect(w.text()).toContain('Apr 28, 2022')
  })
})
