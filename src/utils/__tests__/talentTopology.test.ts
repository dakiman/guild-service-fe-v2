import { describe, it, expect } from 'vitest'
import { resolveNodeName } from '../talentTopology'
import type { TalentNode } from '@/types/talents'

function node(over: Record<string, unknown> = {}): TalentNode {
  return { id: 1, display_row: 0, display_col: 0, type: 'single', ranks: [], choice_options: null, ...over } as unknown as TalentNode
}

describe('resolveNodeName', () => {
  it('prefers the rank matching the spell id', () => {
    const n = node({ ranks: [{ spell_id: 1, name: 'A' }, { spell_id: 2, name: 'B' }] })
    expect(resolveNodeName(n, 2)).toBe('B')
  })
  it('falls back to the matching choice option', () => {
    const n = node({ type: 'choice', ranks: [{ spell_id: 1, name: 'A' }], choice_options: [{ spell_id: 9, name: 'Nine' }] })
    expect(resolveNodeName(n, 9)).toBe('Nine')
  })
  it('falls back to the first rank when nothing matches', () => {
    const n = node({ ranks: [{ spell_id: 1, name: 'A' }] })
    expect(resolveNodeName(n, 404)).toBe('A')
  })
  it('returns null when the node has no names at all', () => {
    expect(resolveNodeName(node(), 1)).toBeNull()
  })
})
