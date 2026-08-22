/**
 * Human-readable label for a meta period row/option, shared between MetaPage's
 * week picker and CurrentAffixStrip (which must describe whatever week it's
 * showing, not always "This week").
 */
export function periodLabel(startAt: string | null, isCurrent: boolean): string {
  if (isCurrent) return 'This week'
  if (!startAt) return 'Earlier week'
  return `Week of ${new Date(startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}
