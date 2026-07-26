// External profile URLs for characters/guilds. Both sites are case-insensitive
// and accept our canonical lowercase name/realm slugs directly for characters.
// Guild URLs want the human-readable guild name ("Nerd Crew"), NOT the
// hyphen-slug ("nerd-crew") — prefer display_name, fall back to de-slugging.

const RAIDER_IO = 'https://raider.io'
const WARCRAFT_LOGS = 'https://www.warcraftlogs.com'

function guildUrlName(name: string, displayName?: string | null): string {
  const readable = displayName && displayName.length > 0 ? displayName : name.split('-').join(' ')
  return encodeURIComponent(readable)
}

export function raiderIoCharacterUrl(region: string, realm: string, name: string): string {
  return `${RAIDER_IO}/characters/${region}/${realm}/${encodeURIComponent(name)}`
}

export function warcraftLogsCharacterUrl(region: string, realm: string, name: string): string {
  return `${WARCRAFT_LOGS}/character/${region}/${realm}/${encodeURIComponent(name)}`
}

export function raiderIoGuildUrl(
  region: string,
  realm: string,
  name: string,
  displayName?: string | null,
): string {
  return `${RAIDER_IO}/guilds/${region}/${realm}/${guildUrlName(name, displayName)}`
}

export function warcraftLogsGuildUrl(
  region: string,
  realm: string,
  name: string,
  displayName?: string | null,
): string {
  return `${WARCRAFT_LOGS}/guild/${region}/${realm}/${guildUrlName(name, displayName)}`
}
