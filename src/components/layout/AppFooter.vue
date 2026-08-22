<template>
  <footer
    class="border-t-2 border-wsa-border px-4 py-3 text-center mt-auto"
    style="background: linear-gradient(135deg, rgb(var(--wsa-card-2)), rgb(var(--wsa-card)))"
  >
    <p class="text-xs text-wsa-disabled">
      &copy; Peon · peon.pro ·
      <RouterLink :to="{ name: 'about' }" class="underline hover:text-wsa-muted">About &amp; data sources</RouterLink>
    </p>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
