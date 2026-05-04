<template>
  <a
    :href="`https://www.wowhead.com/affix=${affixId}`"
    :data-wowhead="`affix=${affixId}`"
    class="inline-flex items-center"
    target="_blank"
    rel="noopener"
  />
</template>

<script setup lang="ts">
defineProps<{
  affixId: number
}>()
</script>
