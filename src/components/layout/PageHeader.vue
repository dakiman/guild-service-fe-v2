<template>
  <header class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-3">
      <img
        :src="icon"
        alt=""
        aria-hidden="true"
        class="h-11 w-11 flex-none rounded-lg border border-wsa-border/50 object-cover"
      />
      <h1 class="truncate text-3xl font-bold text-wsa-heading">{{ title }}</h1>
    </div>
    <div v-if="$slots.right" class="flex items-center gap-2">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ icon: string; title: string }>()
</script>
