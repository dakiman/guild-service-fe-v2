<script setup lang="ts">
import { useRouter } from 'vue-router'
import LookupForm from '@/components/form/LookupForm.vue'
import type { Region } from '@/types/api'

const router = useRouter()

function onSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'guild-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold">Search Guilds</h1>
    <LookupForm kind="guild" @submit="onSubmit" />
  </div>
</template>
