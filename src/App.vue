<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 wsa-btn wsa-btn--primary"
      >Skip to content</a
    >
    <AppNav />
    <main id="main" tabindex="-1" class="container mx-auto p-4 flex-1 outline-none">
      <router-view />
    </main>
    <AppFooter />
    <LiveAnnouncer />
    <Toaster position="top-right" />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import AppNav from '@/components/layout/AppNav.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LiveAnnouncer from '@/components/feedback/LiveAnnouncer.vue'
</script>
