<template>
  <div class="flex flex-col gap-4" data-testid="character-skeleton" aria-busy="true">
    <h1 class="sr-only">Character lookup</h1>
    <div class="wsa-hero-banner p-6 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="wsa-skeleton w-14 h-14 sm:w-24 sm:h-24 rounded-lg shrink-0" />
      <div class="flex flex-col gap-3 flex-1">
        <div class="wsa-skeleton h-8 w-48" />
        <div class="wsa-skeleton h-4 w-64" />
        <div class="flex gap-2">
          <div v-for="i in 3" :key="i" class="wsa-skeleton h-8 w-24 rounded-full" />
        </div>
      </div>
      <div class="wsa-skeleton h-12 w-28 self-start" />
    </div>
    <div class="flex gap-1">
      <div v-for="i in 6" :key="i" class="wsa-skeleton h-10 w-28" />
    </div>
    <div class="wsa-skeleton h-48" />
  </div>
</template>
