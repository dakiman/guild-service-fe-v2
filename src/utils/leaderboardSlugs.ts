import { CLASSES, SPEC_TO_CLASS } from '@/utils/wowConstants'
import { SPEC_NAMES } from '@/utils/wowIcons'

export function kebab(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const CLASS_BY_SLUG = new Map<string, number>(
  Object.entries(CLASSES).map(([id, name]) => [kebab(name), Number(id)]),
)

export function classSlug(classId: number): string | null {
  const name = CLASSES[classId]
  return name ? kebab(name) : null
}

export function classIdFromSlug(slug: string): number | null {
  return CLASS_BY_SLUG.get(slug) ?? null
}

/** Class-qualified so "holy-paladin" and "holy-priest" stay distinct URLs. */
export function specSlug(specId: number): string | null {
  const spec = SPEC_NAMES[specId]
  const classId = SPEC_TO_CLASS[specId]
  const cls = classId !== undefined ? CLASSES[classId] : undefined
  if (!spec || !cls) return null
  return `${kebab(spec)}-${kebab(cls)}`
}

const SPEC_BY_SLUG = new Map<string, number>(
  Object.keys(SPEC_TO_CLASS)
    .map(Number)
    .map((id) => [specSlug(id), id] as const)
    .filter((pair): pair is readonly [string, number] => pair[0] !== null),
)

export function specIdFromSlug(slug: string): number | null {
  return SPEC_BY_SLUG.get(slug) ?? null
}
