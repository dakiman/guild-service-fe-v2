<template>
  <img
    v-if="src && !imgError"
    :src="src"
    :width="size"
    :height="size"
    :title="name"
    :alt="name"
    class="inline-block align-middle rounded-sm"
    loading="lazy"
    @error="imgError = true"
  />
  <span
    v-else
    class="inline-flex items-center justify-center rounded text-white font-bold align-middle bg-neutral"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.floor(size * 0.55))}px`,
    }"
    :title="name"
  >
    {{ initial }}
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RACES, RACE_WOWHEAD_SLUGS, RACE_DEFAULT_GENDERS } from '@/utils/wowConstants'

const props = withDefaults(
  defineProps<{
    raceId: number
    gender?: 'male' | 'female'
    size?: number
  }>(),
  { size: 24 },
)

const imgError = ref(false)
const name = computed(() => RACES[props.raceId] ?? 'Unknown')
const initial = computed(() => (name.value[0] ?? '?').toUpperCase())

const slug = computed(() => RACE_WOWHEAD_SLUGS[props.raceId])
const resolvedGender = computed(
  () => props.gender ?? RACE_DEFAULT_GENDERS[props.raceId] ?? 'male',
)

const src = computed(() => {
  if (!slug.value) return null
  return `https://wow.zamimg.com/images/wow/icons/medium/race_${slug.value}_${resolvedGender.value}.jpg`
})
</script>
