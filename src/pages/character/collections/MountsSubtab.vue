<template>
  <div v-if="!hasMounts" class="card bg-base-200 p-8 text-center text-base-content/60">
    <Mountain class="mx-auto mb-2 h-10 w-10 opacity-60" />
    <p>No mounts collected yet.</p>
  </div>
  <div v-else class="flex flex-col gap-3">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Mounts ({{ mounts.length }})</h3>
    </header>
    <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="m in mounts"
        :key="m.mount_id"
        class="card card-compact flex flex-row items-center gap-3 bg-base-200 px-3 py-2"
        :class="{ 'opacity-50': !m.is_useable }"
      >
        <Mountain class="h-5 w-5 shrink-0 opacity-70" />
        <span class="truncate">{{ m.name }}</span>
        <span v-if="!m.is_useable" class="badge badge-ghost badge-sm">unusable</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Mountain } from 'lucide-vue-next'
import { useCharacterContext } from '@/composables/useCharacterContext'

const { character } = useCharacterContext()

const mounts = computed(() => character.value.mounts ?? [])
const hasMounts = computed(() => mounts.value.length > 0)
</script>
