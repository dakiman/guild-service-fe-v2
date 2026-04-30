<template>
  <div v-if="!hasToys" class="card bg-base-200 p-8 text-center text-base-content/60">
    <Sparkles class="mx-auto mb-2 h-10 w-10 opacity-60" />
    <p>No toys collected yet.</p>
  </div>
  <div v-else class="flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Toys ({{ toys.length }})</h3>
    </header>
    <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="t in toys"
        :key="t.toy_id"
        class="card card-compact flex flex-row items-center gap-3 bg-base-200 px-3 py-2"
      >
        <Sparkles class="h-5 w-5 shrink-0 opacity-70" />
        <a
          :data-wowhead="`item=${t.toy_id}`"
          href="#"
          @click.prevent
          class="truncate hover:underline"
        >
          {{ t.name }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'

const { character } = useCharacterContext()

const toys = computed(() => character.value.toys ?? [])
const hasToys = computed(() => toys.value.length > 0)
</script>
