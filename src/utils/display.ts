// Display helpers for WoW identity strings.
//
// Backend stores canonical lowercased/slug forms in `name`/`realm` columns
// (used as routing/lookup keys) AND now denormalizes Blizzard's original
// raw casing in `display_name`/`display_realm`. Prefer the raw display value
// when present; fall back to title-casing the slug for legacy rows.

export function displayName(slug: string, raw?: string | null): string {
  if (raw && raw.length > 0) return raw
  return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : slug
}

export function displayRealm(slug: string, raw?: string | null): string {
  if (raw && raw.length > 0) return raw
  return slug
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function displayGuildName(slug: string, raw?: string | null): string {
  if (raw && raw.length > 0) return raw
  return slug
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}
