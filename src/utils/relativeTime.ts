/** "just now" / "5m ago" / "7h ago" (under 48h) / "3d ago". Null when unparseable. */
export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string | null {
  if (!iso) return null
  const ms = now - new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
