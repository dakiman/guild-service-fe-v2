import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const suggestCharacters = vi.fn().mockResolvedValue([])
vi.mock('@/api/characters', () => ({
  suggestCharacters: (...args: unknown[]) => suggestCharacters(...args),
}))
vi.mock('@/api/guilds', () => ({
  suggestGuilds: vi.fn().mockResolvedValue([]),
}))

import NameAutocomplete from '@/components/form/NameAutocomplete.vue'

function mountIt(props: Record<string, unknown> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(NameAutocomplete, {
    props: { kind: 'character', modelValue: '', ...props },
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: { ClassIcon: true, FactionBadge: true, RatingChip: true },
    },
    attachTo: document.body,
  })
}

describe('NameAutocomplete submit / focus / styling', () => {
  it('emits submit with the trimmed value on Enter when nothing is highlighted', async () => {
    const w = mountIt({ modelValue: '  Arthas ' })
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('submit')).toEqual([['Arthas']])
    expect(w.emitted('pick')).toBeUndefined()
    w.unmount()
  })

  it('does not emit submit when the value is empty', async () => {
    const w = mountIt({ modelValue: '   ' })
    await w.get('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('submit')).toBeUndefined()
    w.unmount()
  })

  it('exposes focus() that focuses the input', () => {
    const w = mountIt()
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.get('input').element)
    w.unmount()
  })

  it('applies placeholder and inputClass overrides', () => {
    const w = mountIt({ placeholder: 'Find a character…', inputClass: 'pl-8' })
    const input = w.get('input')
    expect(input.attributes('placeholder')).toBe('Find a character…')
    expect(input.attributes('aria-label')).toBe('Find a character…')
    expect(input.classes()).toContain('pl-8')
    w.unmount()
  })

  it('keeps the default placeholder per kind', () => {
    const w = mountIt({ kind: 'guild' })
    expect(w.get('input').attributes('placeholder')).toBe('Guild name')
    w.unmount()
  })

  it('Escape with the dropdown closed blurs the input', async () => {
    const w = mountIt({ modelValue: '' })
    const input = w.get('input')
    ;(input.element as HTMLInputElement).focus()
    expect(document.activeElement).toBe(input.element)
    await input.trigger('keydown', { key: 'Escape' })
    expect(document.activeElement).not.toBe(input.element)
    w.unmount()
  })

  describe('Enter with a pre-highlighted match (regression: R6)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      suggestCharacters.mockClear()
      suggestCharacters.mockResolvedValue([
        {
          region: 'eu',
          realm: 'the-maelstrom',
          display_realm: null,
          name: 'melaniya',
          display_name: null,
          class_id: 1,
          level: 80,
          faction: 'Alliance',
          mythic_plus_rating: null,
          region_rank: null,
        },
      ])
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('emits pick (not submit) on Enter with no arrow key pressed', async () => {
      const w = mountIt({ modelValue: '' })
      const input = w.get('input')
      await w.setProps({ modelValue: 'mel' })
      await input.trigger('focus')
      vi.advanceTimersByTime(250)
      await flushPromises()

      await input.trigger('keydown', { key: 'Enter' })

      expect(w.emitted('pick')).toEqual([[{ region: 'eu', realm: 'the-maelstrom', name: 'melaniya' }]])
      expect(w.emitted('submit')).toBeUndefined()
      w.unmount()
    })
  })
})
