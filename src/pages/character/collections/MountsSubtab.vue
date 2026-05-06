<template>
  <div v-if="!hasMounts" class="wsa-card p-4 text-center text-wsa-disabled">
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
        class="wsa-card-inner px-3 py-2 flex flex-row items-center gap-3"
        :class="{ 'opacity-50': !m.is_useable }"
      >
        <Mountain class="h-5 w-5 shrink-0 opacity-70" />
        <div class="flex min-w-0 flex-1 flex-col">
          <component
            :is="wowheadHrefFor(m) ? 'a' : 'span'"
            v-bind="wowheadAttrsFor(m)"
            class="truncate"
          >
            {{ m.name }}
          </component>
          <span
            v-if="m.game_data?.source_text"
            class="truncate text-xs opacity-60"
          >
            {{ m.game_data.source_text }}
          </span>
        </div>
        <span v-if="!m.is_useable" class="wsa-badge">unusable</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Mountain } from 'lucide-vue-next'
import type { Mount } from '@/types/character'
import { useCharacterContext } from '@/composables/useCharacterContext'

const { character } = useCharacterContext()

const mounts = computed(() => character.value.mounts ?? [])
const hasMounts = computed(() => mounts.value.length > 0)

function wowheadHrefFor(m: Mount): string | null {
  const id = m.game_data?.summon_spell_id
  return typeof id === 'number' ? `https://www.wowhead.com/spell=${id}` : null
}

function wowheadAttrsFor(m: Mount): Record<string, string> {
  const href = wowheadHrefFor(m)
  if (!href) return {}
  const id = m.game_data!.summon_spell_id!
  return {
    href,
    'data-wowhead': `spell=${id}`,
    target: '_blank',
    rel: 'noopener',
  }
}
</script>
