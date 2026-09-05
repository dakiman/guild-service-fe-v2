/**
 * Top-level navigation entries and the route-name prefixes each one "owns".
 *
 * | Nav entry     | Active when route.name is / starts with                     |
 * |---------------|-------------------------------------------------------------|
 * | Characters    | character-  (character-search + every character-* detail)   |
 * | Guilds        | guild-search, guild-detail                                  |
 * | Mythic+       | mythic-plus (also mythic-plus-archive)                      |
 * | Leaderboards  | leaderboards (region/realm/class/spec + leaderboards-season)|
 * | Meta          | meta                                                        |
 * | Raids         | raids  (NOT character-raids — that belongs to Characters)   |
 */
export interface NavLink {
  /** Route name the link navigates to. */
  name: string
  label: string
  /** Route-name prefixes that count as "on this section". */
  prefixes: readonly string[]
}

export const NAV_LINKS: readonly NavLink[] = [
  { name: 'character-search', label: 'Characters', prefixes: ['character-'] },
  { name: 'guild-search', label: 'Guilds', prefixes: ['guild-'] },
  { name: 'mythic-plus', label: 'Mythic+', prefixes: ['mythic-plus'] },
  { name: 'leaderboards', label: 'Leaderboards', prefixes: ['leaderboards'] },
  { name: 'meta', label: 'Meta', prefixes: ['meta'] },
  { name: 'raids', label: 'Raids', prefixes: ['raids'] },
]

export function isNavActive(link: NavLink, routeName: unknown): boolean {
  if (typeof routeName !== 'string') return false
  return link.prefixes.some((p) => routeName === p || routeName.startsWith(p))
}
