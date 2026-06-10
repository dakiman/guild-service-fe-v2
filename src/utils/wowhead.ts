export interface WowheadHrefOptions {
  itemId?: number
  spellId?: number
  itemLevel?: number
  bonus?: number[]
  gems?: number[]
  enchantments?: number[]
  pcs?: number[]
  classic?: boolean
}

export function buildWowheadHref(opts: WowheadHrefOptions): string {
  let h = ''
  if (opts.itemId) h += `item=${opts.itemId}`
  else if (opts.spellId) h += `spell=${opts.spellId}`

  if (opts.itemLevel) h += `&ilvl=${opts.itemLevel}`
  if (opts.bonus && opts.bonus.length) h += `&bonus=${opts.bonus.join(':')}`
  if (opts.gems && opts.gems.length) h += `&gems=${opts.gems.join(':')}`
  if (opts.enchantments && opts.enchantments.length) h += `&ench=${opts.enchantments.join(':')}`
  if (opts.pcs && opts.pcs.length) h += `&pcs=${opts.pcs.join(':')}`
  if (opts.classic) h += `&domain=classic`

  return h
}
