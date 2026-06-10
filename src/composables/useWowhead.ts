import { nextTick, watch, type WatchSource } from 'vue'

declare global {
  interface Window {
    $WowheadPower?: { refreshLinks: () => void }
  }
}

async function waitForWowhead(timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (!window.$WowheadPower) {
    if (Date.now() > deadline) return false
    await new Promise((r) => setTimeout(r, 100))
  }
  return true
}

export function useWowheadRefresh(deps: WatchSource | WatchSource[]) {
  watch(
    deps as WatchSource,
    async () => {
      await nextTick()
      if (await waitForWowhead()) window.$WowheadPower!.refreshLinks()
    },
    { flush: 'post', immediate: true },
  )
}
