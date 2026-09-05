import { watchEffect } from 'vue'
import { formatTitle } from '@/router/documentTitle'
/** Data-driven pages call this once; writes only when the source is non-null. */
export function useDocumentTitle(source: () => string | null): void {
  watchEffect(() => {
    const t = source()
    if (t) document.title = formatTitle(t)
  })
}
