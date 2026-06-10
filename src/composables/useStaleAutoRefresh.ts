import { watch, type ComputedRef, type Ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

export function useStaleAutoRefresh(
  isStale: ComputedRef<boolean> | Ref<boolean>,
  queryKey: () => readonly unknown[],
  delayMs = 10_000,
) {
  const qc = useQueryClient()
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(
    isStale,
    (stale) => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (stale) {
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: queryKey() }), delayMs)
      }
    },
    { immediate: true },
  )
}
