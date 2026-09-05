<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { suggestCharacters } from '@/api/characters'
import { suggestGuilds } from '@/api/guilds'
import ClassIcon from '@/components/wow/ClassIcon.vue'
import FactionBadge from '@/components/wow/FactionBadge.vue'
import RatingChip from '@/components/wow/RatingChip.vue'
import { displayName as fmtName, displayRealm as fmtRealm } from '@/utils/display'
import type { CharacterSuggestion, GuildSuggestion, Region } from '@/types/api'

type Suggestion =
  | (CharacterSuggestion & { _kind: 'character' })
  | (GuildSuggestion & { _kind: 'guild' })

const props = defineProps<{
  kind: 'character' | 'guild'
  modelValue: string
  /** Overrides the per-kind default placeholder (also used as aria-label). */
  placeholder?: string
  /** Extra classes on the <input> (e.g. padding for an icon). */
  inputClass?: string
  /** Positioning classes for the dropdown; default anchors it to both edges of the wrapper. */
  dropdownClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  pick: [payload: { region: Region; realm: string; name: string }]
  /** Enter pressed with no highlighted suggestion. Value is trimmed; never fired when empty. */
  submit: [value: string]
}>()

const listId = useId()
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
  queryFn: async ({ signal }): Promise<Suggestion[]> => {
    const q = debounced.value
    if (props.kind === 'character') {
      const rows = await suggestCharacters(q, { signal })
      return rows.map((r) => ({ ...r, _kind: 'character' as const }))
    }
    const rows = await suggestGuilds(q, { signal })
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
    } else {
      const value = props.modelValue.trim()
      if (value) emit('submit', value)
      // No preventDefault: inside LookupForm the native form submit still runs.
    }
  } else if (e.key === 'Escape') {
    // First Escape closes the dropdown; a second one (dropdown already closed) leaves the field.
    if (open.value) open.value = false
    else inputEl.value?.blur()
  }
}

function pick(s: Suggestion) {
  emit('pick', { region: s.region, realm: s.realm, name: s.name })
  open.value = false
  inputEl.value?.blur()
}

const placeholder = computed(
  () => props.placeholder ?? (props.kind === 'guild' ? 'Guild name' : 'Character name'),
)

function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus })

const showLoading = computed(() => enabled.value && query.isFetching.value && suggestions.value.length === 0)
const showEmpty = computed(
  () => enabled.value && !query.isFetching.value && suggestions.value.length === 0,
)
</script>

<template>
  <div>
    <input
      ref="inputEl"
      type="text"
      class="wsa-input !py-1.5 text-sm"
      :class="inputClass"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="placeholder"
      autocomplete="off"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="open && highlightIndex >= 0 ? `${listId}-opt-${highlightIndex}` : undefined"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    />

    <div
      v-if="open"
      class="absolute mt-1 z-20 rounded-md border-2 border-wsa-border shadow-lg max-h-72 overflow-auto"
      :class="dropdownClass ?? 'left-0 right-0'"
      style="background: rgb(var(--wsa-bg))"
    >
      <div v-if="showLoading" class="p-3 space-y-2">
        <div class="h-5 w-full rounded bg-wsa-border/20 animate-pulse"></div>
        <div class="h-5 w-full rounded bg-wsa-border/20 animate-pulse"></div>
        <div class="h-5 w-full rounded bg-wsa-border/20 animate-pulse"></div>
      </div>

      <ul v-else-if="suggestions.length" :id="listId" role="listbox" class="py-1">
        <li
          v-for="(s, i) in suggestions"
          :key="`${s.region}:${s.realm}:${s.name}`"
          :id="`${listId}-opt-${i}`"
          role="option"
          :aria-selected="i === highlightIndex"
          class="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm"
          :class="i === highlightIndex ? 'bg-wsa-muted/15 text-wsa-heading' : 'text-wsa-text hover:bg-black/20'"
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
          <span class="text-wsa-muted truncate">
            · {{ fmtRealm(s.realm, s.display_realm) }} ({{ s.region.toUpperCase() }})<template
              v-if="s._kind === 'character'"
            >
              · L{{ s.level }}</template>
          </span>
          <RatingChip
            v-if="s._kind === 'character'"
            :rating="s.mythic_plus_rating"
            :region-rank="s.region_rank"
            :is-current="s.mythic_plus_rating?.is_current ?? true"
            :season-name="s.mythic_plus_rating?.season_name"
            class="ml-auto"
          />
        </li>
      </ul>

      <div v-else-if="showEmpty" class="p-3 text-sm text-wsa-disabled">
        No matches — pick a realm and submit to search Blizzard.
      </div>
    </div>
  </div>
</template>
