import { describe, it, expect } from 'vitest'
import { CLASSES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import { classIdFromSlug, classSlug, specIdFromSlug, specSlug } from './leaderboardSlugs'

describe('leaderboardSlugs', () => {
  it('kebab-cases class names and round-trips every class', () => {
    expect(classSlug(6)).toBe('death-knight')
    expect(classIdFromSlug('demon-hunter')).toBe(12)
    for (const id of Object.keys(CLASSES).map(Number)) {
      expect(classIdFromSlug(classSlug(id)!)).toBe(id)
    }
  })

  it('qualifies spec slugs with the class so Holy/Frost/Protection do not collide', () => {
    expect(specSlug(65)).toBe('holy-paladin')
    expect(specSlug(257)).toBe('holy-priest')
    expect(specSlug(581)).toBe('vengeance-demon-hunter')
    expect(specSlug(253)).toBe('beast-mastery-hunter')
    for (const id of Object.keys(SPEC_TO_CLASS).map(Number)) {
      if (!(id in SPEC_NAMES)) continue
      expect(specIdFromSlug(specSlug(id)!)).toBe(id)
    }
  })

  it('returns null for unknown ids and slugs', () => {
    expect(classSlug(99)).toBeNull()
    expect(classIdFromSlug('bard')).toBeNull()
    expect(specSlug(1)).toBeNull()
    expect(specIdFromSlug('holy')).toBeNull()
  })
})
