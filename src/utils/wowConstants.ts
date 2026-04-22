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
  27: 'Nighborne',
  28: 'Highmountain Tauren',
  29: 'Void Elf',
  30: 'Lightforged Draenei',
}

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
