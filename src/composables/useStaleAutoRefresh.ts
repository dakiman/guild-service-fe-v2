import { watch, type ComputedRef, type Ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

const DEFAULT_FIRST_DELAY_SECONDS = 10
const REPEAT_DELAY_SECONDS = 30
const MAX_ATTEMPTS = 6

export interface UseStaleAutoRefreshOptions {
  /** Server-supplied hint (seconds) for the first poll delay; falls back to 10s. */
  pollAfterSeconds?: () => number | undefined
}

/**
 * While `isStale` is true, invalidates `queryKey` on a capped polling
 * schedule: first attempt after `poll_after` seconds (default 10), then
 * every 30s, up to 6 attempts total (~2m40s worst case). Stops immediately
 * when `isStale` clears, and cleans up its pending timer on unmount.
 *
 * Caveat: the poll cycle only resets on an observable `isStale` transition.
 * If the underlying identity changes while `isStale` stays `true` the whole
 * time (e.g. navigating character A → B → A within `gcTime`, with B also
 * stale), no transition fires, so the in-flight cadence/attempt count from
 * the original stale episode keeps running rather than restarting with the
 * new `poll_after`. `queryKey` is still re-evaluated at each fire, so this
 * never targets the wrong query — only the timing can lag.
 */
export function useStaleAutoRefresh(
  isStale: ComputedRef<boolean> | Ref<boolean>,
  queryKey: () => readonly unknown[],
  opts: UseStaleAutoRefreshOptions = {},
) {
  const qc = useQueryClient()

  watch(
    isStale,
    (stale, _prevStale, onCleanup) => {
      if (!stale) return

      let timer: ReturnType<typeof setTimeout> | null = null
      let attempts = 0

      const scheduleNext = (delayMs: number) => {
        timer = setTimeout(() => {
          qc.invalidateQueries({ queryKey: queryKey() })
          attempts += 1
          if (attempts < MAX_ATTEMPTS) {
            scheduleNext(REPEAT_DELAY_SECONDS * 1000)
          }
        }, delayMs)
      }

      const firstDelaySeconds = opts.pollAfterSeconds?.() ?? DEFAULT_FIRST_DELAY_SECONDS
      scheduleNext(firstDelaySeconds * 1000)

      onCleanup(() => {
        if (timer) clearTimeout(timer)
      })
    },
    { immediate: true },
  )
}
