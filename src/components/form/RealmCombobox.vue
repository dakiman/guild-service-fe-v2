<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRealmIndex } from '@/composables/usePveGameData'
import type { RealmGameData } from '@/types/gameData'
import type { Region } from '@/types/api'

export interface RealmPick {
  slug: string
  region: Region
}

const props = defineProps<{
  modelValue: RealmPick | null
  placeholder?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RealmPick | null]
}>()

const realmsQuery = useRealmIndex()

const query = ref('')
const open = ref(false)
const highlightIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

// When the parent supplies an initial pick, hydrate the input text once the
// realm list arrives so we can resolve the slug to a display name.
watch(
  [() => props.modelValue, () => realmsQuery.data.value],
  ([pick, data]) => {
    if (!pick) {
      // Parent cleared selection — reset only if the input is currently
      // showing the previously-picked realm (don't stomp user typing).
      return
    }
    const match = data?.realms.find(
      (r) => r.slug === pick.slug && r.region === pick.region,
    )
    if (match && query.value === '') {
      query.value = formatLabel(match)
    }
  },
  { immediate: true },
)

function formatLabel(realm: RealmGameData): string {
  return realm.name
}

const MAX_RESULTS = 8

function scoreMatch(realm: RealmGameData, q: string): number {
  // Lower = better. -1 means no match.
  const name = realm.name.toLowerCase()
  const slug = realm.slug.toLowerCase()
  if (name === q || slug === q) return 0
  if (name.startsWith(q) || slug.startsWith(q)) return 1
  if (name.includes(q) || slug.includes(q)) return 2
  return -1
}

const REGION_ORDER: Record<Region, number> = { eu: 0, us: 1, kr: 2, tw: 3 }

const suggestions = computed<RealmGameData[]>(() => {
  const all = realmsQuery.data.value?.realms ?? []
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const scored: { realm: RealmGameData; score: number }[] = []
  for (const r of all) {
    const score = scoreMatch(r, q)
    if (score >= 0) scored.push({ realm: r, score })
  }
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    const regionDiff = REGION_ORDER[a.realm.region] - REGION_ORDER[b.realm.region]
    if (regionDiff !== 0) return regionDiff
    return a.realm.name.localeCompare(b.realm.name)
  })
  return scored.slice(0, MAX_RESULTS).map((s) => s.realm)
})

watch(suggestions, () => {
  highlightIndex.value = 0
})

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
  // Editing after a pick clears the model — caller must re-pick.
  if (props.modelValue) {
    emit('update:modelValue', null)
  }
}

function onFocus() {
  if (query.value.trim()) open.value = true
}

function onBlur() {
  // Defer so a click on a suggestion (mousedown → blur → click) still registers.
  setTimeout(() => {
    open.value = false
  }, 120)
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    open.value = true
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      highlightIndex.value = (highlightIndex.value + 1) % suggestions.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      highlightIndex.value =
        (highlightIndex.value - 1 + suggestions.value.length) % suggestions.value.length
    }
  } else if (e.key === 'Enter') {
    if (open.value && suggestions.value[highlightIndex.value]) {
      e.preventDefault()
      pick(suggestions.value[highlightIndex.value])
    }
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function pick(realm: RealmGameData) {
  emit('update:modelValue', { slug: realm.slug, region: realm.region })
  query.value = formatLabel(realm)
  open.value = false
  inputEl.value?.blur()
}
</script>

<template>
  <div class="relative">
    <input
      ref="inputEl"
      type="text"
      class="input input-bordered input-sm w-full"
      :value="query"
      :placeholder="placeholder ?? 'Realm'"
      :aria-label="ariaLabel ?? 'Realm'"
      autocomplete="off"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    />

    <div
      v-if="open"
      class="absolute left-0 right-0 mt-1 z-20 rounded-md bg-base-100 border border-base-300 shadow-lg max-h-72 overflow-auto"
      role="listbox"
    >
      <div v-if="realmsQuery.isPending.value" class="p-3 text-sm text-base-content/60">
        Loading realms…
      </div>

      <div v-else-if="realmsQuery.isError.value" class="p-3 text-sm text-error">
        Couldn't load realms.
      </div>

      <ul v-else-if="suggestions.length" class="py-1">
        <li
          v-for="(r, i) in suggestions"
          :key="`${r.region}:${r.slug}`"
          role="option"
          :aria-selected="i === highlightIndex"
          class="flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm"
          :class="i === highlightIndex ? 'bg-primary text-primary-content' : 'hover:bg-base-200'"
          @mousedown.prevent="pick(r)"
          @mouseenter="highlightIndex = i"
        >
          <span>{{ r.name }}</span>
          <span
            class="badge badge-sm ml-2 shrink-0"
            :class="i === highlightIndex ? 'badge-ghost' : 'badge-outline'"
          >
            {{ r.region.toUpperCase() }}
          </span>
        </li>
      </ul>

      <div v-else-if="query.trim()" class="p-3 text-sm text-base-content/60">
        No matching realm.
      </div>
    </div>
  </div>
</template>
