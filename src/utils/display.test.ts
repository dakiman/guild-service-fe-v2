import { describe, it, expect } from 'vitest'
import { capitalizeName } from './display'

describe('capitalizeName', () => {
  it('uppercases the first letter only', () => {
    expect(capitalizeName('melaniya')).toBe('Melaniya')
    expect(capitalizeName('')).toBe('')
  })
})
