<template>
  <div class="flex flex-col gap-6">
    <RaidsHeadline :raid-progress="character.raid_progress ?? null" />
    <RaidProgressionSection :raid-progress="character.raid_progress ?? null" />
  </div>
</template>

<script setup lang="ts">
import { useCharacterContext } from '@/composables/useCharacterContext'
import RaidsHeadline from '@/components/character/pve/RaidsHeadline.vue'
import RaidProgressionSection from '@/components/character/pve/RaidProgressionSection.vue'

const { character } = useCharacterContext()
</script>
