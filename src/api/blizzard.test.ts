import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('./client', () => ({ api: { post } }))

import { mintOAuthState, exchangeOAuthCode } from './blizzard'

describe('mintOAuthState', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('POSTs to /{region}/blizzard-oauth/state with the redirectUri', async () => {
    post.mockResolvedValueOnce({ data: { state: 'abc', expires_in: 600 } })
    const result = await mintOAuthState('eu', 'http://localhost:8092/blizzard-oauth')
    expect(post).toHaveBeenCalledWith('/eu/blizzard-oauth/state', {
      redirectUri: 'http://localhost:8092/blizzard-oauth',
    })
    expect(result).toEqual({ state: 'abc', expires_in: 600 })
  })
})

describe('exchangeOAuthCode', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('POSTs code, redirectUri, and state and accepts only 202', async () => {
    post.mockResolvedValueOnce({ status: 202 })
    await exchangeOAuthCode('eu', 'thecode', 'http://localhost:8092/blizzard-oauth', 'thestate')
    expect(post).toHaveBeenCalledTimes(1)
    const [path, body, config] = post.mock.calls[0] as [
      string,
      Record<string, unknown>,
      { validateStatus?: (s: number) => boolean },
    ]
    expect(path).toBe('/eu/blizzard-oauth')
    expect(body).toEqual({
      code: 'thecode',
      redirectUri: 'http://localhost:8092/blizzard-oauth',
      state: 'thestate',
    })
    expect(config.validateStatus?.(202)).toBe(true)
    expect(config.validateStatus?.(200)).toBe(false)
    expect(config.validateStatus?.(422)).toBe(false)
  })
})
