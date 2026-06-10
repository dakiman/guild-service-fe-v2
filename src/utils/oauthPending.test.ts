import { describe, it, expect, beforeEach } from 'vitest'
import {
  setOAuthPending,
  takeOAuthPending,
  clearOAuthPending,
  type OAuthPending,
} from './oauthPending'

const sample: OAuthPending = {
  region: 'eu',
  state: 'a'.repeat(64),
  redirectUri: 'http://localhost:8092/blizzard-oauth',
}

describe('oauthPending', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips a value via set + take', () => {
    setOAuthPending(sample)
    expect(takeOAuthPending()).toEqual(sample)
  })

  it('take consumes the value (subsequent reads return null)', () => {
    setOAuthPending(sample)
    takeOAuthPending()
    expect(takeOAuthPending()).toBeNull()
  })

  it('returns null when nothing is stored', () => {
    expect(takeOAuthPending()).toBeNull()
  })

  it('returns null and clears storage when payload is not valid JSON', () => {
    sessionStorage.setItem('blizzard.oauth.pending', '{not json')
    expect(takeOAuthPending()).toBeNull()
    expect(sessionStorage.getItem('blizzard.oauth.pending')).toBeNull()
  })

  it('returns null when payload is missing fields', () => {
    sessionStorage.setItem(
      'blizzard.oauth.pending',
      JSON.stringify({ region: 'eu', state: 'x' }),
    )
    expect(takeOAuthPending()).toBeNull()
  })

  it('returns null when fields have wrong types', () => {
    sessionStorage.setItem(
      'blizzard.oauth.pending',
      JSON.stringify({ region: 1, state: 2, redirectUri: 3 }),
    )
    expect(takeOAuthPending()).toBeNull()
  })

  it('clearOAuthPending removes the key', () => {
    setOAuthPending(sample)
    clearOAuthPending()
    expect(sessionStorage.getItem('blizzard.oauth.pending')).toBeNull()
  })
})
