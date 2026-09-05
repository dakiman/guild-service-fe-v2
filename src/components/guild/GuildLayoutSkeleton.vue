<template>
  <div class="flex flex-col gap-4" data-testid="guild-skeleton" aria-busy="true">
    <h1 class="sr-only">Guild lookup</h1>
    <div class="wsa-card flex flex-col gap-4">
      <div class="wsa-skeleton h-9 w-56" />
      <div class="wsa-skeleton h-4 w-40" />
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div v-for="i in 3" :key="i" class="wsa-skeleton h-14" />
      </div>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <div v-for="i in 6" :key="i" class="wsa-skeleton h-20" />
    </div>
    <div class="wsa-skeleton h-64" />
  </div>
</template>
