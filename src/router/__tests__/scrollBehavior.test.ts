import { describe, it, expect } from 'vitest'
import { scrollBehavior } from '../scrollBehavior'
const loc = (over: Record<string, unknown> = {}) => ({ hash: '', path: '/x', ...over }) as never
describe('scrollBehavior', () => {
  it('restores the saved position on back/forward', () => {
    expect(scrollBehavior(loc(), loc(), { left: 0, top: 420 })).toEqual({ left: 0, top: 420 })
  })
  it('scrolls to a hash target', () => {
    expect(scrollBehavior(loc({ hash: '#raids' }), loc(), null)).toEqual({ el: '#raids' })
  })
  it('scrolls to top otherwise', () => {
    expect(scrollBehavior(loc({ path: '/a' }), loc({ path: '/b' }), null)).toEqual({ top: 0 })
  })
  it('does not scroll on a query-only write to the same path', () => {
    expect(scrollBehavior(loc({ path: '/x' }), loc({ path: '/x' }), null)).toBe(false)
  })
})
