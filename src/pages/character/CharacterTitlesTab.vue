<template>
  <div class="flex flex-col gap-4">
    <EmptyTab
      v-if="character.titles.length === 0"
      slice="titles"
      :freshness="freshness.titles"
      title="No titles yet"
      message="Titles will appear here once the next sync completes."
      :icon="Crown"
    />

    <div
      v-else
      class="wsa-card p-6 flex flex-col gap-6"
      @click="clearPreview"
    >
      <div class="flex items-start justify-between gap-4">
        <span class="text-xs uppercase tracking-widest text-wsa-muted/80">
          {{ heroLabel }}
        </span>
        <span class="text-xs text-wsa-muted/70">
          {{ character.titles.length }} {{ character.titles.length === 1 ? 'title' : 'titles' }} earned
        </span>
      </div>

      <div v-if="heroName" class="flex flex-col items-center gap-3">
        <div class="w-full flex items-center gap-3">
          <div class="flex-1 border-t border-wsa-gold/30" />
          <Crown class="w-4 h-4 text-wsa-gold/60" />
          <div class="flex-1 border-t border-wsa-gold/30" />
        </div>

        <Transition name="hero-fade" mode="out-in">
          <p
            :key="heroName"
            class="wsa-text-heading text-wsa-gold text-2xl sm:text-3xl font-semibold text-center px-2"
          >
            {{ heroName }}
          </p>
        </Transition>

        <div class="w-full flex items-center gap-3">
          <div class="flex-1 border-t border-wsa-gold/30" />
          <div class="flex-1 border-t border-wsa-gold/30" />
        </div>
      </div>

      <ul
        v-if="otherTitles.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        <li
          v-for="title in otherTitles"
          :key="title.id"
          class="group relative overflow-hidden rounded-md border px-3 py-2 pl-4 text-sm cursor-pointer transition-colors"
          :class="
            previewedTitleId === title.id
              ? 'border-wsa-gold/70 bg-base-200/40 wsa-text-heading'
              : 'border-base-300/60 hover:border-wsa-gold/60 text-wsa-muted hover:wsa-text-heading'
          "
          @click.stop="onChipClick(title.id)"
        >
          <span
            class="absolute left-0 top-0 bottom-0 w-[2px] transition-colors"
            :class="
              previewedTitleId === title.id
                ? 'bg-wsa-gold'
                : 'bg-wsa-gold/40 group-hover:bg-wsa-gold'
            "
          />
          {{ title.bare }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Crown } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import EmptyTab from '@/components/character/EmptyTab.vue'
import type { CharacterTitle } from '@/types/character'

const { character, freshness } = useCharacterContext()

const previewedTitleId = ref<number | null>(null)

const displayName = computed(() => {
  const n = character.value.name
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : n
})

function rawFor(title: CharacterTitle): string {
  if (title.game_data) {
    return character.value.gender?.toLowerCase() === 'female'
      ? title.game_data.name_female
      : title.game_data.name_male
  }
  return title.display_string
}

function stripName(raw: string): string {
  return raw
    .replace(/\{name\}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:.!?-]+|[\s,;:.!?-]+$/g, '')
}

function renderWithName(raw: string, name: string): string {
  const hasPlaceholder = /\{name\}/.test(raw)
  const substituted = hasPlaceholder
    ? raw.replace(/\{name\}/g, name)
    : `${name}, ${raw}`
  return substituted
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:.!?-]+|[\s,;:.!?-]+$/g, '')
}

const equippedTitle = computed(() =>
  character.value.titles.find((t) => t.is_selected) ?? null,
)

const previewedTitle = computed(() => {
  const id = previewedTitleId.value
  if (id == null) return null
  return character.value.titles.find((t) => t.id === id) ?? null
})

const otherTitles = computed(() =>
  [...character.value.titles]
    .filter((t) => !t.is_selected)
    .map((t) => ({ ...t, bare: stripName(rawFor(t)) }))
    .sort((a, b) => a.bare.localeCompare(b.bare)),
)

const heroTitle = computed(() => previewedTitle.value ?? equippedTitle.value)

const heroLabel = computed(() => {
  if (previewedTitle.value) return 'Preview'
  if (equippedTitle.value) return 'Equipped'
  return 'Select a title to preview'
})

const heroName = computed(() => {
  const t = heroTitle.value
  if (!t) return null
  return renderWithName(rawFor(t), displayName.value)
})

function onChipClick(id: number) {
  previewedTitleId.value = previewedTitleId.value === id ? null : id
}

function clearPreview() {
  previewedTitleId.value = null
}
</script>

<style scoped>
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 150ms ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}
</style>
