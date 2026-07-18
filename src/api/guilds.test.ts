import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundError, SyncPendingError, ThrottledError } from '@/types/api'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('./client', () => ({ api: { get } }))

import { fetchGuild } from './guilds'

// Guild lookup parity with fetchCharacter: 429 → ThrottledError, and the
// X-Sync-Status header (roster never synced) surfaces as isSyncing so the
// composable can keep polling instead of treating the guild as done.
describe('fetchGuild', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('allow-lists 200/202/404/429 via validateStatus', async () => {
    get.mockResolvedValueOnce({
      status: 200,
      data: { guild: {}, members: {} },
      headers: {},
    })
    await fetchGuild('eu', 'the-maelstrom', 'echo')
    const config = get.mock.calls[0][1] as { validateStatus: (s: number) => boolean }
    expect(config.validateStatus(200)).toBe(true)
    expect(config.validateStatus(202)).toBe(true)
    expect(config.validateStatus(404)).toBe(true)
    expect(config.validateStatus(429)).toBe(true)
    expect(config.validateStatus(500)).toBe(false)
  })

  it('throws ThrottledError on 429, using Retry-After (seconds → ms)', async () => {
    get.mockResolvedValueOnce({
      status: 429,
      data: undefined,
      headers: { 'retry-after': '20' },
    })

    await expect(fetchGuild('eu', 'the-maelstrom', 'echo')).rejects.toThrow(ThrottledError)
  })

  it('defaults ThrottledError retryAfter to 60s when the header is missing', async () => {
    get.mockResolvedValueOnce({ status: 429, data: undefined, headers: {} })

    try {
      await fetchGuild('eu', 'the-maelstrom', 'echo')
      throw new Error('expected fetchGuild to throw')
    } catch (err) {
      expect(err).toBeInstanceOf(ThrottledError)
      expect((err as ThrottledError).retryAfter).toBe(60_000)
    }
  })

  it('still throws SyncPendingError on 202 and NotFoundError on 404', async () => {
    get.mockResolvedValueOnce({
      status: 202,
      data: { queue_depth: 3 },
      headers: { 'retry-after': '5' },
    })
    await expect(fetchGuild('eu', 'the-maelstrom', 'echo')).rejects.toThrow(SyncPendingError)

    get.mockResolvedValueOnce({ status: 404, data: undefined, headers: {} })
    await expect(fetchGuild('eu', 'the-maelstrom', 'echo')).rejects.toThrow(NotFoundError)
  })

  it('marks isSyncing true when x-sync-status: syncing is present', async () => {
    get.mockResolvedValueOnce({
      status: 200,
      data: { guild: { id: 1 }, members: { data: [] } },
      headers: { 'x-sync-status': 'syncing' },
    })

    const result = await fetchGuild('eu', 'the-maelstrom', 'echo')
    expect(result.isSyncing).toBe(true)
  })

  it('marks isSyncing false when the header is absent', async () => {
    get.mockResolvedValueOnce({
      status: 200,
      data: { guild: { id: 1 }, members: { data: [] } },
      headers: {},
    })

    const result = await fetchGuild('eu', 'the-maelstrom', 'echo')
    expect(result.isSyncing).toBe(false)
  })
})
