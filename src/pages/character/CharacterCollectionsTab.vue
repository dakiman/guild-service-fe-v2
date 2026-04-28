<template>
  <div class="flex flex-col gap-4">
    <CharacterTabStrip :tabs="subTabs" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Mountain, Cat, Sparkles } from 'lucide-vue-next'
import CharacterTabStrip, {
  type TabDescriptor,
} from '@/components/character/CharacterTabStrip.vue'

const route = useRoute()

const subTabs = computed<TabDescriptor[]>(() => {
  const params = route.params
  return [
    { label: 'Mounts', to: { name: 'character-collections-mounts', params }, icon: Mountain },
    { label: 'Pets',   to: { name: 'character-collections-pets', params },   icon: Cat },
    { label: 'Toys',   to: { name: 'character-collections-toys', params },   icon: Sparkles },
  ]
})
</script>
