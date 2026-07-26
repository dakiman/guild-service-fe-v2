import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ExternalProfileLinks from '../ExternalProfileLinks.vue'

describe('ExternalProfileLinks', () => {
  it('renders character links to Raider.io and Warcraft Logs', () => {
    const wrapper = mount(ExternalProfileLinks, {
      props: { kind: 'character', region: 'eu', realm: 'the-maelstrom', name: 'melaniya' },
    })
    const anchors = wrapper.findAll('a')
    expect(anchors).toHaveLength(2)
    expect(anchors[0].attributes('href')).toBe(
      'https://raider.io/characters/eu/the-maelstrom/melaniya',
    )
    expect(anchors[1].attributes('href')).toBe(
      'https://www.warcraftlogs.com/character/eu/the-maelstrom/melaniya',
    )
  })

  it('opens in a new tab safely with accessible labels', () => {
    const wrapper = mount(ExternalProfileLinks, {
      props: { kind: 'character', region: 'eu', realm: 'the-maelstrom', name: 'melaniya' },
    })
    const anchors = wrapper.findAll('a')
    expect(anchors[0].attributes('target')).toBe('_blank')
    expect(anchors[0].attributes('rel')).toBe('noopener')
    expect(anchors[0].attributes('aria-label')).toBe('View on Raider.io')
    expect(anchors[1].attributes('target')).toBe('_blank')
    expect(anchors[1].attributes('rel')).toBe('noopener')
    expect(anchors[1].attributes('aria-label')).toBe('View on Warcraft Logs')
  })

  it('renders guild links preferring the display name', () => {
    const wrapper = mount(ExternalProfileLinks, {
      props: {
        kind: 'guild',
        region: 'eu',
        realm: 'twisting-nether',
        name: 'nerd-crew',
        displayName: 'Nerd Crew',
      },
    })
    const anchors = wrapper.findAll('a')
    expect(anchors[0].attributes('href')).toBe(
      'https://raider.io/guilds/eu/twisting-nether/Nerd%20Crew',
    )
    expect(anchors[1].attributes('href')).toBe(
      'https://www.warcraftlogs.com/guild/eu/twisting-nether/Nerd%20Crew',
    )
  })

  it('falls back to a monogram badge when an icon image fails to load', async () => {
    const wrapper = mount(ExternalProfileLinks, {
      props: { kind: 'character', region: 'eu', realm: 'the-maelstrom', name: 'melaniya' },
    })
    expect(wrapper.text()).not.toContain('RIO')
    await wrapper.findAll('img')[0].trigger('error')
    expect(wrapper.text()).toContain('RIO')
    await wrapper.findAll('img')[0].trigger('error') // remaining img is now WCL's
    expect(wrapper.text()).toContain('WCL')
  })
})
