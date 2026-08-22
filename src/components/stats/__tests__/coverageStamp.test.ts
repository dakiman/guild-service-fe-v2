import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CoverageStamp from '@/components/stats/CoverageStamp.vue'

describe('CoverageStamp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-22T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('renders official wording with relative age', () => {
    const wrapper = mount(CoverageStamp, {
      props: { variant: 'official', timestamp: '2026-08-22T09:00:00Z' },
    })
    expect(wrapper.text()).toBe(
      'Updated 3h ago · top-500 per shard, official Blizzard leaderboards · EU+US',
    )
  })

  it('renders crawled wording with count', () => {
    const wrapper = mount(CoverageStamp, {
      props: { variant: 'crawled', timestamp: '2026-08-22T11:30:00Z', count: 48210 },
    })
    expect(wrapper.text()).toBe(
      `Among ${(48210).toLocaleString()} characters tracked by Peon · updated 30m ago`,
    )
  })

  it('renders count-less crawled wording', () => {
    const wrapper = mount(CoverageStamp, {
      props: { variant: 'crawled', timestamp: '2026-08-22T11:30:00Z' },
    })
    expect(wrapper.text()).toBe(
      'Crawled by Peon — coverage is our tracked subset, not all of WoW · updated 30m ago',
    )
  })

  it('renders nothing without a timestamp or with an unparseable one', () => {
    expect(mount(CoverageStamp, { props: { variant: 'official', timestamp: null } }).text()).toBe('')
    expect(mount(CoverageStamp, { props: { variant: 'official', timestamp: undefined } }).text()).toBe('')
    expect(mount(CoverageStamp, { props: { variant: 'official', timestamp: 'garbage' } }).text()).toBe('')
  })

  it('uses minute, hour and day granularity', () => {
    const at = (iso: string) =>
      mount(CoverageStamp, { props: { variant: 'official', timestamp: iso } }).text()
    expect(at('2026-08-22T11:59:40Z')).toContain('Updated just now')
    expect(at('2026-08-22T11:15:00Z')).toContain('Updated 45m ago')
    expect(at('2026-08-21T00:00:00Z')).toContain('Updated 36h ago')
    expect(at('2026-08-18T12:00:00Z')).toContain('Updated 4d ago')
  })
})
