import type { Slot } from '@/types/wow'

export const LEFT_COLUMN_SLOTS: Slot[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'shirt',
  'tabard',
  'wrist',
]

export const RIGHT_COLUMN_SLOTS: Slot[] = [
  'hands',
  'waist',
  'legs',
  'feet',
  'finger_1',
  'finger_2',
  'trinket_1',
  'trinket_2',
]

export const WEAPON_SLOTS: Slot[] = ['main_hand', 'off_hand']

export function formatSlotLabel(slot: Slot): string {
  return slot.replace(/_/g, ' ')
}
