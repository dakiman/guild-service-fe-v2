import type { ClassicStanding } from '@/types/character'

const CLASSIC_ORDER: Record<ClassicStanding, number> = {
  hated: 1,
  hostile: 2,
  unfriendly: 3,
  neutral: 4,
  friendly: 5,
  honored: 6,
  revered: 7,
  exalted: 8,
}

const CLASSIC_COLORS: Record<ClassicStanding, string> = {
  hated: 'red-700',
  hostile: 'red-500',
  unfriendly: 'orange-500',
  neutral: 'gray-400',
  friendly: 'emerald-500',
  honored: 'blue-400',
  revered: 'violet-400',
  exalted: 'amber-400',
}

function isClassic(standing: string): standing is ClassicStanding {
  return standing in CLASSIC_ORDER
}

export function parseRenown(standing: string): number | null {
  const m = standing.match(/^renown (\d+)$/i)
  return m ? parseInt(m[1], 10) : null
}

export function parseLevel(standing: string): number | null {
  const m = standing.match(/^level (\d+)$/i)
  return m ? parseInt(m[1], 10) : null
}

export function standingColor(standing: string): string {
  if (isClassic(standing)) return CLASSIC_COLORS[standing]

  const renown = parseRenown(standing)
  if (renown !== null) {
    if (renown >= 20) return 'amber-400'
    if (renown >= 10) return 'violet-400'
    if (renown >= 5) return 'blue-400'
    return 'emerald-500'
  }

  const level = parseLevel(standing)
  if (level !== null) {
    if (level >= 40) return 'amber-400'
    if (level >= 20) return 'violet-400'
    return 'blue-400'
  }

  return 'gray-400'
}

export function standingLabel(standing: string): string {
  return standing.charAt(0).toUpperCase() + standing.slice(1)
}

export function standingSortKey(standing: string): number {
  if (isClassic(standing)) return CLASSIC_ORDER[standing]

  const renown = parseRenown(standing)
  if (renown !== null) return 100 + renown

  const level = parseLevel(standing)
  if (level !== null) return 100 + level

  return 50
}

export function compareByStanding(a: string, b: string): number {
  return standingSortKey(b) - standingSortKey(a)
}

export function isRenownBased(standings: string[]): boolean {
  return standings.some((s) => parseRenown(s) !== null || parseLevel(s) !== null)
}

export function highestRenown(standings: string[]): number {
  let max = 0
  for (const s of standings) {
    const r = parseRenown(s)
    if (r !== null && r > max) max = r
  }
  return max
}
