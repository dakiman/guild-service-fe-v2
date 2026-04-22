<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold">Search Characters</h1>
    <LookupForm kind="character" @submit="onSubmit" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import LookupForm from '@/components/form/LookupForm.vue'
import type { Region } from '@/types/api'

const router = useRouter()

function onSubmit(payload: { region: Region; realm: string; name: string }) {
  router.push({
    name: 'character-detail',
    params: { region: payload.region, realm: payload.realm, name: payload.name },
  })
}
</script>
