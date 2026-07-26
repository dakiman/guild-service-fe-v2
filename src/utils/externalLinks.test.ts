import { describe, expect, it } from 'vitest'
import {
  raiderIoCharacterUrl,
  raiderIoGuildUrl,
  warcraftLogsCharacterUrl,
  warcraftLogsGuildUrl,
} from './externalLinks'

describe('externalLinks', () => {
  it('builds character URLs from canonical slugs', () => {
    expect(raiderIoCharacterUrl('eu', 'the-maelstrom', 'melaniya')).toBe(
      'https://raider.io/characters/eu/the-maelstrom/melaniya',
    )
    expect(warcraftLogsCharacterUrl('eu', 'the-maelstrom', 'melaniya')).toBe(
      'https://www.warcraftlogs.com/character/eu/the-maelstrom/melaniya',
    )
  })

  it('URL-encodes non-ASCII (Cyrillic) character names', () => {
    expect(raiderIoCharacterUrl('eu', 'howling-fjord', 'пёсик')).toBe(
      'https://raider.io/characters/eu/howling-fjord/%D0%BF%D1%91%D1%81%D0%B8%D0%BA',
    )
    expect(warcraftLogsCharacterUrl('eu', 'howling-fjord', 'пёсик')).toBe(
      'https://www.warcraftlogs.com/character/eu/howling-fjord/%D0%BF%D1%91%D1%81%D0%B8%D0%BA',
    )
  })

  it('prefers the guild display name when present', () => {
    expect(raiderIoGuildUrl('eu', 'twisting-nether', 'nerd-crew', 'Nerd Crew')).toBe(
      'https://raider.io/guilds/eu/twisting-nether/Nerd%20Crew',
    )
    expect(warcraftLogsGuildUrl('eu', 'twisting-nether', 'nerd-crew', 'Nerd Crew')).toBe(
      'https://www.warcraftlogs.com/guild/eu/twisting-nether/Nerd%20Crew',
    )
  })

  it('de-slugs the guild name when no display name exists', () => {
    expect(raiderIoGuildUrl('eu', 'twisting-nether', 'nerd-crew')).toBe(
      'https://raider.io/guilds/eu/twisting-nether/nerd%20crew',
    )
    expect(raiderIoGuildUrl('eu', 'twisting-nether', 'nerd-crew', null)).toBe(
      'https://raider.io/guilds/eu/twisting-nether/nerd%20crew',
    )
  })
})
