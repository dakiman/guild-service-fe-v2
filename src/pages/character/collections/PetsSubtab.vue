<template>
  <div v-if="!hasPets" class="card bg-base-200 p-8 text-center text-base-content/60">
    <Cat class="mx-auto mb-2 h-10 w-10 opacity-60" />
    <p>No pets collected yet.</p>
  </div>
  <div v-else class="flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Pets ({{ pets.length }})</h3>
    </header>
    <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="p in pets"
        :key="p.pet_id"
        class="card card-compact flex flex-row items-center gap-3 bg-base-200 px-3 py-2"
      >
        <Cat class="h-5 w-5 shrink-0 opacity-70" />
        <a
          v-if="p.creature_display_id"
          :data-wowhead="`npc=${p.creature_display_id}`"
          href="#"
          @click.prevent
          class="truncate hover:underline"
        >
          {{ p.name }}
        </a>
        <span v-else class="truncate">{{ p.name }}</span>
        <span class="badge badge-ghost badge-sm ml-auto">L{{ p.level }}</span>
        <span v-if="p.is_favorite" class="badge badge-warning badge-sm">★</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Cat } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'

const { character } = useCharacterContext()

const pets = computed(() => character.value.pets ?? [])
const hasPets = computed(() => pets.value.length > 0)
</script>
