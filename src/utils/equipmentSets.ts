import type { EquipmentItem } from '@/types/character'

export function groupEquipmentBySetId(equipment: EquipmentItem[]): Map<number, number[]> {
  const groups = new Map<number, number[]>()
  for (const it of equipment) {
    if (it.set_id == null) continue
    const list = groups.get(it.set_id)
    if (list) list.push(it.id)
    else groups.set(it.set_id, [it.id])
  }
  return groups
}

export function getPcsFor(
  item: EquipmentItem,
  groups: Map<number, number[]>,
): number[] | undefined {
  if (item.set_id == null) return undefined
  return groups.get(item.set_id)
}
