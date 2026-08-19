import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { retryUnlessNotWarmed } from './useMetaStats'

function axios404(): AxiosError {
  return new AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 404, statusText: 'Not Found', headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() }, data: { status: 'not_warmed' },
  })
}

describe('retryUnlessNotWarmed', () => {
  it('never retries the deliberate not_warmed 404', () => {
    expect(retryUnlessNotWarmed(0, axios404())).toBe(false)
  })

  it('retries real failures up to 3 times', () => {
    expect(retryUnlessNotWarmed(0, new Error('network down'))).toBe(true)
    expect(retryUnlessNotWarmed(2, new Error('network down'))).toBe(true)
    expect(retryUnlessNotWarmed(3, new Error('network down'))).toBe(false)
  })
})
