import { computed, ref, type Ref } from 'vue'

export type SortDir = 'asc' | 'desc'

export function useTableSort<T extends Record<string, unknown>>(
  source: Ref<T[]>,
  initialKey: keyof T | null,
) {
  const sortKey = ref<keyof T | null>(initialKey) as Ref<keyof T | null>
  const sortDir = ref<SortDir>('asc')

  function toggle(key: keyof T) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const sortedRows = computed<T[]>(() => {
    if (sortKey.value === null) return source.value
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1

    // Decorate-sort-undecorate for stable ordering on ties.
    return source.value
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const av = a.row[key]
        const bv = b.row[key]
        const aNull = av === null || av === undefined
        const bNull = bv === null || bv === undefined
        if (aNull && bNull) return a.index - b.index
        if (aNull) return 1 // nulls always sink (regardless of direction)
        if (bNull) return -1

        let cmp: number
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else {
          cmp = String(av).localeCompare(String(bv))
        }
        if (cmp === 0) return a.index - b.index
        return cmp * dir
      })
      .map(({ row }) => row)
  })

  return { sortKey, sortDir, sortedRows, toggle }
}
