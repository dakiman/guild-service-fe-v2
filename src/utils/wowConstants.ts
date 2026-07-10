export const CLASSES: Record<number, string> = {
  1: 'Warrior',
  2: 'Paladin',
  3: 'Hunter',
  4: 'Rogue',
  5: 'Priest',
  6: 'Death Knight',
  7: 'Shaman',
  8: 'Mage',
  9: 'Warlock',
  10: 'Monk',
  11: 'Druid',
  12: 'Demon Hunter',
  13: 'Evoker',
}

export const CLASS_COLORS: Record<number, string> = {
  1: '#C79C6E',
  2: '#F58CBA',
  3: '#ABD473',
  4: '#FFF569',
  5: '#FFFFFF',
  6: '#C41F3B',
  7: '#0070DE',
  8: '#69CCF0',
  9: '#9482C9',
  10: '#00FF96',
  11: '#FF7D0A',
  12: '#A330C9',
  13: '#33937F',
}

export const SPEC_TO_CLASS: Record<number, number> = {
  // Warrior
  71: 1, 72: 1, 73: 1,
  // Paladin
  65: 2, 66: 2, 70: 2,
  // Hunter
  253: 3, 254: 3, 255: 3,
  // Rogue
  259: 4, 260: 4, 261: 4,
  // Priest
  256: 5, 257: 5, 258: 5,
  // Death Knight
  250: 6, 251: 6, 252: 6,
  // Shaman
  262: 7, 263: 7, 264: 7,
  // Mage
  62: 8, 63: 8, 64: 8,
  // Warlock
  265: 9, 266: 9, 267: 9,
  // Monk
  268: 10, 269: 10, 270: 10,
  // Druid
  102: 11, 103: 11, 104: 11, 105: 11,
  // Demon Hunter
  577: 12, 581: 12, 1480: 12,
  // Evoker
  1467: 13, 1468: 13, 1473: 13,
}

export const RACES: Record<number, string> = {
  1: 'Human',
  2: 'Orc',
  3: 'Dwarf',
  4: 'Night Elf',
  5: 'Undead',
  6: 'Tauren',
  7: 'Gnome',
  8: 'Troll',
  9: 'Goblin',
  10: 'Blood Elf',
  11: 'Draenei',
  22: 'Worgen',
  24: 'Pandaren',
  25: 'Pandaren',
  26: 'Pandaren',
  27: 'Nightborne',
  28: 'Highmountain Tauren',
  29: 'Void Elf',
  30: 'Lightforged Draenei',
  31: 'Zandalari Troll',
  32: 'Kul Tiran',
  34: 'Dark Iron Dwarf',
  35: 'Vulpera',
  36: "Mag'har Orc",
  37: 'Mechagnome',
  52: 'Dracthyr',
  70: 'Dracthyr',
  84: 'Earthen',
  85: 'Earthen',
}

// Wowhead zamimg URL slug per race_id (lowercase, no separators).
// Source: https://wow.zamimg.com/images/wow/icons/{size}/race_{slug}_{gender}.jpg
export const RACE_WOWHEAD_SLUGS: Record<number, string> = {
  1: 'human',
  2: 'orc',
  3: 'dwarf',
  4: 'nightelf',
  5: 'scourge',           // Wowhead spells Forsaken as 'scourge'
  6: 'tauren',
  7: 'gnome',
  8: 'troll',
  9: 'goblin',
  10: 'bloodelf',
  11: 'draenei',
  22: 'worgen',
  24: 'pandaren',
  25: 'pandaren',
  26: 'pandaren',
  27: 'nightborne',
  28: 'highmountaintauren',
  29: 'voidelf',
  30: 'lightforgeddraenei',
  31: 'zandalaritroll',
  32: 'kultiran',
  34: 'darkirondwarf',
  35: 'vulpera',
  36: 'magharorc',
  37: 'mechagnome',
  52: 'dracthyr',
  70: 'dracthyr',
  84: 'earthendwarf',
  85: 'earthendwarf',
}

export const RACE_DEFAULT_GENDERS: Record<number, 'male' | 'female'> = {
  1: 'male', 2: 'male', 3: 'male', 4: 'female', 5: 'male', 6: 'male', 7: 'male',
  8: 'male', 9: 'male', 10: 'female', 11: 'male', 22: 'male', 24: 'male',
  25: 'male', 26: 'male', 27: 'female', 28: 'male', 29: 'male', 30: 'male',
  31: 'male', 32: 'male', 34: 'male', 35: 'male', 36: 'male', 37: 'male',
  52: 'male', 70: 'male', 84: 'male', 85: 'male',
}

// Mirrors backend RaceFaction map. Server is the authority; this map is only
// used for client-only contexts (e.g. test fixtures) — at runtime, faction
// comes from the API response.
export const RACE_FACTIONS: Record<number, 'Alliance' | 'Horde' | null> = {
  1: 'Alliance', 3: 'Alliance', 4: 'Alliance', 7: 'Alliance', 11: 'Alliance',
  22: 'Alliance', 25: 'Alliance', 29: 'Alliance', 30: 'Alliance', 32: 'Alliance',
  34: 'Alliance', 37: 'Alliance', 52: 'Alliance', 85: 'Alliance',
  2: 'Horde', 5: 'Horde', 6: 'Horde', 8: 'Horde', 9: 'Horde', 10: 'Horde',
  26: 'Horde', 27: 'Horde', 28: 'Horde', 31: 'Horde', 35: 'Horde', 36: 'Horde',
  70: 'Horde', 84: 'Horde',
  24: null, // Neutral Pandaren
}

// Days after which character-derived data (iLvl, M+) is rendered as stale.
export const STALE_DATA_DAYS = 7

export const FACTION_COLORS: Record<'Alliance' | 'Horde', string> = {
  Alliance: '#0078FF',
  Horde: '#B30000',
}

export const ITEM_QUALITY: Record<string, number> = {
  poor: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  artifact: 6,
}

export const ITEM_QUALITY_COLORS: Record<string, string> = {
  poor: '#9d9d9d',
  common: '#ffffff',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
  artifact: '#e6cc80',
}

export const TALENT_ROW_LEVELS: Record<number, number> = {
  0: 15,
  1: 25,
  2: 30,
  3: 35,
  4: 40,
  5: 45,
  6: 50,
}

export function itemQualityToId(quality: string): number {
  return ITEM_QUALITY[quality.toLowerCase()] ?? 0
}

export function itemQualityColor(quality: string): string | undefined {
  return ITEM_QUALITY_COLORS[quality.toLowerCase()]
}

export function getClassName(classId: number): string | undefined {
  return CLASSES[classId]
}

export function getClassColor(classId: number): string | undefined {
  return CLASS_COLORS[classId]
}

export function getRaceName(raceId: number): string | undefined {
  return RACES[raceId]
}

export function getTalentRowLevel(row: number): number | undefined {
  return TALENT_ROW_LEVELS[row]
}

export const SPEC_ROLES: Record<number, 'tank' | 'healer' | 'dps'> = {
  // Death Knight
  250: 'tank', 251: 'dps', 252: 'dps',
  // Demon Hunter
  577: 'dps', 581: 'tank', 1480: 'dps',
  // Druid
  102: 'dps', 103: 'dps', 104: 'tank', 105: 'healer',
  // Evoker
  1467: 'dps', 1468: 'healer', 1473: 'dps',
  // Hunter
  253: 'dps', 254: 'dps', 255: 'dps',
  // Mage
  62: 'dps', 63: 'dps', 64: 'dps',
  // Monk
  268: 'tank', 269: 'dps', 270: 'healer',
  // Paladin
  65: 'healer', 66: 'tank', 70: 'dps',
  // Priest
  256: 'healer', 257: 'healer', 258: 'dps',
  // Rogue
  259: 'dps', 260: 'dps', 261: 'dps',
  // Shaman
  262: 'dps', 263: 'dps', 264: 'healer',
  // Warlock
  265: 'dps', 266: 'dps', 267: 'dps',
  // Warrior
  71: 'dps', 72: 'dps', 73: 'tank',
}
