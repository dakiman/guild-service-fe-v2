import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTableSort } from './useTableSort'

interface Row {
  id: number
  name: string
  ilvl: number | null
}

const rows: Row[] = [
  { id: 1, name: 'Bob',   ilvl: 480 },
  { id: 2, name: 'Alice', ilvl: 510 },
  { id: 3, name: 'Carol', ilvl: null },
  { id: 4, name: 'Dave',  ilvl: 480 },
]

describe('useTableSort', () => {
  it('returns rows in original order with no sort key', () => {
    const source = ref(rows)
    const { sortedRows } = useTableSort<Row>(source, null)
    expect(sortedRows.value.map((r) => r.id)).toEqual([1, 2, 3, 4])
  })

  it('sorts ascending by string key', () => {
    const source = ref(rows)
    const { sortedRows, toggle } = useTableSort<Row>(source, null)
    toggle('name')
    expect(sortedRows.value.map((r) => r.name)).toEqual(['Alice', 'Bob', 'Carol', 'Dave'])
  })

  it('toggles to descending on second click of same key', () => {
    const source = ref(rows)
    const { sortedRows, toggle, sortDir } = useTableSort<Row>(source, null)
    toggle('name')
    toggle('name')
    expect(sortDir.value).toBe('desc')
    expect(sortedRows.value.map((r) => r.name)).toEqual(['Dave', 'Carol', 'Bob', 'Alice'])
  })

  it('sinks null values to the bottom on ascending numeric sort', () => {
    const source = ref(rows)
    const { sortedRows, toggle } = useTableSort<Row>(source, null)
    toggle('ilvl')
    const ids = sortedRows.value.map((r) => r.id)
    expect(ids[ids.length - 1]).toBe(3) // Carol (null) at the bottom
  })

  it('preserves original order on ties (stable sort)', () => {
    const source = ref(rows)
    const { sortedRows, toggle } = useTableSort<Row>(source, null)
    toggle('ilvl')
    // Bob (id 1) and Dave (id 4) both have ilvl 480 — Bob first by insertion order.
    const bobIdx = sortedRows.value.findIndex((r) => r.id === 1)
    const daveIdx = sortedRows.value.findIndex((r) => r.id === 4)
    expect(bobIdx).toBeLessThan(daveIdx)
  })
})
