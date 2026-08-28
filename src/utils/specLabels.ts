import { CLASSES, SPEC_ROLES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'
import type { CompEntry } from '@/types/meta'

/** "Blood Death Knight" — spec name + class name, for tooltips and filter options. */
export function specFullName(specId: number): string {
  const spec = SPEC_NAMES[specId]
  const classId = SPEC_TO_CLASS[specId]
  const cls = classId != null ? CLASSES[classId] : undefined
  if (spec && cls) return `${spec} ${cls}`
  return spec ?? cls ?? `Spec ${specId}`
}

/** Native-tooltip text for a comp row: tank · healer · dps / dps / dps. */
export function compTitle(comp: CompEntry): string {
  return [
    specFullName(comp.tank_spec_id),
    specFullName(comp.healer_spec_id),
    comp.dps_spec_ids.map(specFullName).join(' / '),
  ].join(' · ')
}

export type SpecRole = 'tank' | 'healer' | 'dps'

export interface SpecFilterOption {
  specId: number
  label: string
}

export interface SpecFilterGroup {
  role: SpecRole
  label: 'Tank' | 'Healer' | 'DPS'
  options: SpecFilterOption[]
}

const ROLE_LABELS: Record<SpecRole, SpecFilterGroup['label']> = {
  tank: 'Tank',
  healer: 'Healer',
  dps: 'DPS',
}

/**
 * Static option groups for the comps spec filter. Built from SPEC_ROLES rather
 * than from the current payload so the <select> never shows a blank value when
 * the week/region changes under an active filter.
 */
export const SPEC_FILTER_GROUPS: SpecFilterGroup[] = (['tank', 'healer', 'dps'] as const).map(
  (role) => ({
    role,
    label: ROLE_LABELS[role],
    options: Object.entries(SPEC_ROLES)
      .filter(([, r]) => r === role)
      .map(([id]) => ({ specId: Number(id), label: specFullName(Number(id)) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }),
)
