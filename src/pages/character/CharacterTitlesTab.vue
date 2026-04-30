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

    <div v-else class="ma-card p-6 flex flex-col gap-3">
      <div v-if="selectedTitle" class="flex items-center gap-2 text-ma-accent">
        <Crown class="w-5 h-5" />
        <span class="ma-text-heading text-lg">{{ selectedTitle.rendered }}</span>
        <span class="badge badge-primary badge-sm ml-auto">Equipped</span>
      </div>

      <div v-if="selectedTitle && otherTitles.length > 0" class="divider my-0" />

      <ul v-if="otherTitles.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <li
          v-for="title in otherTitles"
          :key="title.id"
          class="flex items-center gap-2 px-3 py-2 rounded bg-base-200/40 text-sm text-ma-muted"
        >
          {{ title.rendered }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Crown } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'
import EmptyTab from '@/components/character/EmptyTab.vue'
import type { CharacterTitle } from '@/types/character'

const { character, freshness } = useCharacterContext()

function variantFor(title: CharacterTitle): string {
  if (title.game_data) {
    const isFemale = character.value.gender?.toLowerCase() === 'female'
    return isFemale ? title.game_data.name_female : title.game_data.name_male
  }

  return title.display_string
}

const selectedTitle = computed(() => {
  const t = character.value.titles.find((x) => x.is_selected)
  return t ? { ...t, rendered: variantFor(t) } : null
})

const otherTitles = computed(() =>
  [...character.value.titles]
    .filter((t) => !t.is_selected)
    .map((t) => ({ ...t, rendered: variantFor(t) }))
    .sort((a, b) => a.rendered.localeCompare(b.rendered)),
)
</script>
