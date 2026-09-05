import { computed, ref, type Ref, type WritableComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface QueryParamOptions<T> {
  default: T
  parse?: (raw: string) => T | null
  serialize?: (value: T) => string
}

export const intParam = (raw: string): number | null => {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * A writable ref mirrored into `?name=` via router.replace. The key is removed
 * when the value equals `default` (or is null) so canonical URLs stay short.
 * Without an installed router it degrades to a plain ref (isolated tests).
 */
export function useQueryParam<T extends string | number | null>(
  name: string,
  opts: QueryParamOptions<T>,
): WritableComputedRef<T> {
  const router = useRouter()
  const route = useRoute()
  const parse = opts.parse ?? ((raw: string) => raw as unknown as T)
  const serialize = opts.serialize ?? ((v: T) => String(v))

  if (!router || !route) {
    const local = ref(opts.default) as Ref<T>
    return computed<T>({ get: () => local.value, set: (v) => { local.value = v } })
  }

  return computed<T>({
    get() {
      const raw = route.query[name]
      if (typeof raw !== 'string' || raw === '') return opts.default
      const parsed = parse(raw)
      return parsed === null || parsed === undefined ? opts.default : parsed
    },
    set(value) {
      const query = { ...route.query }
      if (value === null || value === opts.default) delete query[name]
      else query[name] = serialize(value)
      void router.replace({ query })
    },
  })
}
