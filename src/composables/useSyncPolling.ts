import { watch, type ComputedRef, type Ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'

export function useSyncPolling(
  isSyncing: ComputedRef<boolean> | Ref<boolean>,
  queryKey: () => readonly unknown[],
  intervalMs = 5_000,
) {
  const qc = useQueryClient()
  let timer: ReturnType<typeof setInterval> | null = null

  watch(
    isSyncing,
    (syncing) => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      if (syncing) {
        timer = setInterval(() => qc.invalidateQueries({ queryKey: queryKey() }), intervalMs)
      }
    },
    { immediate: true },
  )
}
