<!-- src/components/layout/NavSearch.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import NameAutocomplete from '@/components/form/NameAutocomplete.vue'
import type { Region } from '@/types/api'

/**
 * Character quick-search for the nav. Known characters resolve through the suggest
 * endpoint; an unmatched name is handed to the home page (`/?q=`) where the full
 * form with a realm picker takes over.
 */
const props = defineProps<{
  /** Desktop mode: fixed width + "/" key hint. Default is a full-width row (mobile menu). */
  compact?: boolean
}>()

const emit = defineEmits<{
  /** Fired after any navigation triggered from the search (lets the mobile menu close). */
  navigated: []
}>()

const router = useRouter()
const value = ref('')
const focused = ref(false)
const auto = ref<{ focus: () => void } | null>(null)

async function onPick(payload: { region: Region; realm: string; name: string }) {
  await router.push({ name: 'character-detail', params: payload })
  value.value = ''
  emit('navigated')
}

async function onSubmit(text: string) {
  await router.push({ name: 'home', query: { q: text } })
  value.value = ''
  emit('navigated')
}

function focus() {
  auto.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div
    class="relative"
    :class="props.compact ? 'w-56' : 'w-full'"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <Search
      class="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-wsa-disabled"
      aria-hidden="true"
    />
    <NameAutocomplete
      ref="auto"
      v-model="value"
      kind="character"
      placeholder="Find a character…"
      :input-class="props.compact ? 'pl-8 pr-7' : 'pl-8'"
      :dropdown-class="props.compact ? 'right-0 w-96' : 'left-0 right-0'"
      @pick="onPick"
      @submit="onSubmit"
    />
    <kbd
      v-if="props.compact && !focused && !value"
      class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-wsa-border/60 px-1 font-sans text-[10px] leading-4 text-wsa-disabled"
      aria-hidden="true"
    >/</kbd>
  </div>
</template>
