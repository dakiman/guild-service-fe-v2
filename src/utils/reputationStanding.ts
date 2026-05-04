import type { ReputationStanding } from '@/types/character'

export const STANDING_ORDER: Record<ReputationStanding, number> = {
  hated: 1,
  hostile: 2,
  unfriendly: 3,
  neutral: 4,
  friendly: 5,
  honored: 6,
  revered: 7,
  exalted: 8,
}

const COLOR_MAP: Record<ReputationStanding, string> = {
  hated: 'red-700',
  hostile: 'red-500',
  unfriendly: 'orange-500',
  neutral: 'gray-400',
  friendly: 'emerald-500',
  honored: 'blue-400',
  revered: 'violet-400',
  exalted: 'amber-400',
}

export function standingColor(standing: ReputationStanding): string {
  return COLOR_MAP[standing]
}

export function standingLabel(standing: ReputationStanding): string {
  return standing.charAt(0).toUpperCase() + standing.slice(1)
}

export function compareByStanding(a: ReputationStanding, b: ReputationStanding): number {
  return STANDING_ORDER[b] - STANDING_ORDER[a]
}
