<template>
  <div class="flex flex-col gap-4">
    <CharacterTabStrip :tabs="subTabs" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Castle, Swords } from 'lucide-vue-next'
import CharacterTabStrip, {
  type TabDescriptor,
} from '@/components/character/CharacterTabStrip.vue'

const route = useRoute()

const subTabs = computed<TabDescriptor[]>(() => {
  const params = route.params
  return [
    { label: 'Raids',     to: { name: 'character-pve-raids', params },  icon: Castle },
    { label: 'Mythic+',   to: { name: 'character-pve-mythic', params }, icon: Swords },
  ]
})
</script>
