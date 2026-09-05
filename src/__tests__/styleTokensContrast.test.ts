// @vitest-environment node
// (Vite's `new URL('literal', import.meta.url)` asset-URL rewrite only
// resolves to a real file:// path outside jsdom — see brief Step 1.)
/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const css = readFileSync(fileURLToPath(new URL('../style.css', import.meta.url)), 'utf8')
function token(name: string): [number, number, number] {
  const m = css.match(new RegExp(`--${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`))
  if (!m) throw new Error(`token --${name} not found`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
describe('style.css tokens', () => {
  it('disabled text meets 4.5:1 on the page background and 4:1 on cards', () => {
    expect(contrast(token('wsa-text-disabled'), token('wsa-bg'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(token('wsa-text-disabled'), token('wsa-card'))).toBeGreaterThanOrEqual(4.0)
  })
  it('defines an error token with 4.5:1 on the page background', () => {
    expect(contrast(token('wsa-error'), token('wsa-bg'))).toBeGreaterThanOrEqual(4.5)
  })
  it('does not kill the focus ring on inputs', () => {
    expect(css).not.toMatch(/\.wsa-input:focus\s*\{[^}]*outline:\s*none/)
    expect(css).toMatch(/\.wsa-input:focus:not\(:focus-visible\)\s*\{[^}]*outline:\s*none/)
  })
  it('respects prefers-reduced-motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
