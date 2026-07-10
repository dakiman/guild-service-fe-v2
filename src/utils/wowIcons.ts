import classesSprite from '@/assets/wow/classes-sprite.png'
import specsSprite from '@/assets/wow/specs-sprite.png'

export { classesSprite, specsSprite }

export const CLASS_SPRITE_SIZE = 256 // both width and height of the source PNG
export const SPECS_SPRITE_W = 448
export const SPECS_SPRITE_H = 384
export const TILE_SIZE = 64

// id -> [x, y] in pixels at native 64px tile size (negative = sprite offset convention)
export const CLASS_ICON_POS: Record<number, readonly [number, number]> = {
  1: [0, -192],   // Warrior
  2: [-64, -128], // Paladin
  3: [-128, 0],   // Hunter
  4: [-192, 0],   // Rogue
  5: [-128, -128],// Priest
  6: [0, 0],      // Death Knight
  7: [-192, -64], // Shaman
  8: [-128, -64], // Mage
  9: [-192, -128],// Warlock
  10:[0, -128],   // Monk
  11:[0, -64],    // Druid
  12:[-64, 0],    // Demon Hunter
  13:[-64, -64],  // Evoker
}

export const SPEC_ICON_POS: Record<number, readonly [number, number]> = {
  // Warrior
  71: [-384, -128], 72: [-384, -192], 73: [-384, -256],
  // Paladin
  65: [-128, -256], 66: [-192, -256], 70: [-256, -256],
  // Hunter
  253: [-64, -192], 254: [-128, -192], 255: [-192, -192],
  // Rogue
  259: [-320, -192], 260: [0, -320], 261: [-64, -320],
  // Priest
  256: [-320, 0], 257: [-320, -64], 258: [-320, -128],
  // Death Knight
  250: [0, 0], 251: [-64, 0], 252: [0, -64],
  // Shaman
  262: [-128, -320], 263: [-192, -320], 264: [-256, -320],
  // Mage
  62: [-256, 0], 63: [-256, -64], 64: [-256, -128],
  // Warlock
  265: [-320, -320], 266: [-384, 0], 267: [-384, -64],
  // Monk
  268: [-256, -192], 269: [-64, -256], 270: [0, -256],
  // Druid
  102: [0, -128], 103: [-64, -128], 104: [-128, -128], 105: [-192, 0],
  // Demon Hunter
  577: [-128, 0], 581: [-128, -64], 1480: [-64, -64],
  // Evoker
  1467: [-192, -128], 1468: [0, -192], 1473: [-192, -64],
}

export const SPEC_NAMES: Record<number, string> = {
  71: 'Arms', 72: 'Fury', 73: 'Protection',
  65: 'Holy', 66: 'Protection', 70: 'Retribution',
  253: 'Beast Mastery', 254: 'Marksmanship', 255: 'Survival',
  259: 'Assassination', 260: 'Outlaw', 261: 'Subtlety',
  256: 'Discipline', 257: 'Holy', 258: 'Shadow',
  250: 'Blood', 251: 'Frost', 252: 'Unholy',
  262: 'Elemental', 263: 'Enhancement', 264: 'Restoration',
  62: 'Arcane', 63: 'Fire', 64: 'Frost',
  265: 'Affliction', 266: 'Demonology', 267: 'Destruction',
  268: 'Brewmaster', 269: 'Windwalker', 270: 'Mistweaver',
  102: 'Balance', 103: 'Feral', 104: 'Guardian', 105: 'Restoration',
  577: 'Havoc', 581: 'Vengeance', 1480: 'Devourer',
  1467: 'Devastation', 1468: 'Preservation', 1473: 'Augmentation',
}
