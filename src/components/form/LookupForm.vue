<script setup lang="ts">
import { ref, computed } from 'vue'
import RealmCombobox, { type RealmPick } from '@/components/form/RealmCombobox.vue'
import NameAutocomplete from '@/components/form/NameAutocomplete.vue'
import type { Region } from '@/types/api'

defineProps<{ kind: 'character' | 'guild' }>()
const emit = defineEmits<{
  submit: [payload: { region: Region; realm: string; name: string }]
  pick: [payload: { region: Region; realm: string; name: string }]
}>()

const selectedRealm = ref<RealmPick | null>(null)
const name = ref('')

const canSubmit = computed(() => !!selectedRealm.value && !!name.value.trim())

function onSubmit() {
  if (!selectedRealm.value || !name.value.trim()) return
  emit('submit', {
    region: selectedRealm.value.region,
    realm: selectedRealm.value.slug,
    name: name.value.trim().toLocaleLowerCase(),
  })
}

function onPick(payload: { region: Region; realm: string; name: string }) {
  emit('pick', payload)
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
    <div class="flex gap-2">
      <NameAutocomplete
        v-model="name"
        :kind="kind"
        class="w-40 shrink-0"
        @pick="onPick"
      />
      <RealmCombobox v-model="selectedRealm" class="flex-1 min-w-0" />
    </div>
    <button type="submit" class="btn btn-primary btn-sm" :disabled="!canSubmit">
      {{ kind === 'guild' ? 'Find guild' : 'Find character' }}
    </button>
  </form>
</template>
