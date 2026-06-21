<template>
  <div v-if="!hasToys" class="wsa-card p-4 text-center text-wsa-disabled">
    <Sparkles class="mx-auto mb-2 h-10 w-10 opacity-60" />
    <p>No toys collected yet.</p>
  </div>
  <div v-else class="flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Toys ({{ toys.length }})</h3>
    </header>
    <VirtualGrid :items="toys" :get-key="(t: Toy) => t.toy_id">
      <template #item="{ item: t }">
        <div
          data-collection-item
          class="wsa-card-inner px-3 py-2 flex flex-row items-center gap-3"
        >
          <Sparkles class="h-5 w-5 shrink-0 opacity-70" />
          <a
            :data-wowhead="`item=${t.toy_id}`"
            href="#"
            class="truncate hover:underline"
            @click.prevent
          >
            {{ t.name }}
          </a>
        </div>
      </template>
    </VirtualGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import type { Toy } from '@/types/character'
import { useCharacterContext } from '@/composables/useCharacterContext'
import VirtualGrid from '@/components/character/VirtualGrid.vue'

const { character } = useCharacterContext()

const toys = computed(() => character.value.toys ?? [])
const hasToys = computed(() => toys.value.length > 0)
</script>
