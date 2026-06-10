<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content">
    <AppNav />
    <main class="container mx-auto p-4 flex-1">
      <router-view />
    </main>
    <AppFooter />
    <Toaster rich-colors position="top-right" />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import AppNav from '@/components/layout/AppNav.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>
