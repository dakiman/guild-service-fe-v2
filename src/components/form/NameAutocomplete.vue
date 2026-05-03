<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { suggestCharacters } from '@/api/characters'
import { suggestGuilds } from '@/api/guilds'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import { displayName as fmtName, displayRealm as fmtRealm } from '@/utils/display'
import type { CharacterSuggestion, GuildSuggestion, Region } from '@/types/api'

type Suggestion =
  | (CharacterSuggestion & { _kind: 'character' })
  | (GuildSuggestion & { _kind: 'guild' })

const props = defineProps<{
  kind: 'character' | 'guild'
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  pick: [payload: { region: Region; realm: string; name: string }]
}>()

const open = ref(false)
const highlightIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const debounced = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (value) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounced.value = value.trim().toLowerCase()
    }, 200)
  },
)

const enabled = computed(() => debounced.value.length >= 2)

const query = useQuery({
  queryKey: computed(() => ['suggest', props.kind, debounced.value] as const),
  queryFn: async (): Promise<Suggestion[]> => {
    const q = debounced.value
    if (props.kind === 'character') {
      const rows = await suggestCharacters(q)
      return rows.map((r) => ({ ...r, _kind: 'character' as const }))
    }
    const rows = await suggestGuilds(q)
    return rows.map((r) => ({ ...r, _kind: 'guild' as const }))
  },
  enabled,
  placeholderData: keepPreviousData,
  staleTime: 30_000,
  retry: false,
})

const suggestions = computed<Suggestion[]>(() => query.data.value ?? [])

watch(suggestions, () => {
  highlightIndex.value = 0
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  open.value = true
}

function onFocus() {
  if (props.modelValue.trim()) open.value = true
}

function onBlur() {
  // Defer so click-on-suggestion (mousedown → blur → click) registers.
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

function pick(s: Suggestion) {
  emit('pick', { region: s.region, realm: s.realm, name: s.name })
  open.value = false
  inputEl.value?.blur()
}

const placeholder = computed(() =>
  props.kind === 'guild' ? 'Guild name' : 'Character name',
)

const showLoading = computed(() => enabled.value && query.isFetching.value && suggestions.value.length === 0)
const showEmpty = computed(
  () => enabled.value && !query.isFetching.value && suggestions.value.length === 0,
)
</script>

<template>
  <div class="relative">
    <input
      ref="inputEl"
      type="text"
      class="input input-bordered input-sm w-full"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="placeholder"
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
      <div v-if="showLoading" class="p-3 space-y-2">
        <div class="skeleton h-5 w-full"></div>
        <div class="skeleton h-5 w-full"></div>
        <div class="skeleton h-5 w-full"></div>
      </div>

      <ul v-else-if="suggestions.length" class="py-1">
        <li
          v-for="(s, i) in suggestions"
          :key="`${s.region}:${s.realm}:${s.name}`"
          role="option"
          :aria-selected="i === highlightIndex"
          class="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm"
          :class="i === highlightIndex ? 'bg-primary text-primary-content' : 'hover:bg-base-200'"
          @mousedown.prevent="pick(s)"
          @mouseenter="highlightIndex = i"
        >
          <FactionBadge
            v-if="s.faction === 'Alliance' || s.faction === 'Horde'"
            :faction="s.faction"
            :size="16"
            class="shrink-0"
          />
          <ClassIcon v-if="s._kind === 'character'" :class-id="s.class_id" />
          <span class="font-bold truncate">{{ fmtName(s.name, s.display_name) }}</span>
          <span class="opacity-70 truncate">
            · {{ fmtRealm(s.realm, s.display_realm) }} ({{ s.region.toUpperCase() }})<template
              v-if="s._kind === 'character'"
            >
              · L{{ s.level }}</template>
          </span>
        </li>
      </ul>

      <div v-else-if="showEmpty" class="p-3 text-sm text-base-content/60">
        No matches — pick a realm and submit to search Blizzard.
      </div>
    </div>
  </div>
</template>
