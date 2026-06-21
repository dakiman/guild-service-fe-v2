<template>
  <div v-if="!hasPets" class="wsa-card p-4 text-center text-wsa-disabled">
    <Cat class="mx-auto mb-2 h-10 w-10 opacity-60" />
    <p>No pets collected yet.</p>
  </div>
  <div v-else class="flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Pets ({{ pets.length }})</h3>
    </header>
    <VirtualGrid :items="pets" :get-key="(p: Pet) => p.pet_id">
      <template #item="{ item: p }">
        <div
          data-collection-item
          class="wsa-card-inner px-3 py-2 flex flex-row items-center gap-3"
        >
          <Cat class="h-5 w-5 shrink-0 opacity-70" />
          <a
            v-if="p.creature_display_id"
            :data-wowhead="`npc=${p.creature_display_id}`"
            href="#"
            class="truncate hover:underline"
            @click.prevent
          >
            {{ p.name }}
          </a>
          <span v-else class="truncate">{{ p.name }}</span>
          <span class="wsa-badge ml-auto">L{{ p.level }}</span>
          <span v-if="p.is_favorite" class="wsa-badge !border-amber-500/30 !text-amber-400">★</span>
        </div>
      </template>
    </VirtualGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Cat } from 'lucide-vue-next'
import type { Pet } from '@/types/character'
import { useCharacterContext } from '@/composables/useCharacterContext'
import VirtualGrid from '@/components/character/VirtualGrid.vue'

const { character } = useCharacterContext()

const pets = computed(() => character.value.pets ?? [])
const hasPets = computed(() => pets.value.length > 0)
</script>
