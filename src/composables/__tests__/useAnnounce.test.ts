import { describe, it, expect } from 'vitest'
import { watch } from 'vue'
import { useAnnounce } from '../useAnnounce'

describe('useAnnounce', () => {
  it('exposes the last announced text', async () => {
    const { announce, announcement } = useAnnounce()
    await announce('Still syncing…')
    expect(announcement.value).toBe('Still syncing…')
  })

  it('clears and re-sets when the same text is announced twice', async () => {
    const { announce, announcement } = useAnnounce()
    await announce("Job's done!")
    const seen: string[] = []
    watch(announcement, (v) => seen.push(v), { flush: 'sync' })
    await announce("Job's done!")
    expect(seen).toEqual(['', "Job's done!"])
  })

  it('does not clear first when the text differs', async () => {
    const { announce, announcement } = useAnnounce()
    await announce('a')
    const seen: string[] = []
    watch(announcement, (v) => seen.push(v), { flush: 'sync' })
    await announce('b')
    expect(seen).toEqual(['b'])
  })
})
