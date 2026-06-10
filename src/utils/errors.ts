/**
 * Extract a human-readable error message from an unknown error value.
 *
 * Prefers Laravel's `response.data.message` when present (the BE's standard
 * shape), then falls back to the JS `Error.message`, then to the provided
 * default string.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const maybe = err as {
      response?: { data?: { message?: unknown } }
      message?: unknown
    }
    const apiMessage = maybe.response?.data?.message
    if (typeof apiMessage === 'string' && apiMessage.length > 0) return apiMessage
    if (typeof maybe.message === 'string' && maybe.message.length > 0) return maybe.message
  }
  return fallback
}
