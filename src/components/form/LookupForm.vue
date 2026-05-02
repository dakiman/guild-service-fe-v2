<script setup lang="ts">
import { ref, computed } from 'vue'
import RealmCombobox, { type RealmPick } from '@/components/form/RealmCombobox.vue'
import type { Region } from '@/types/api'

defineProps<{ kind: 'character' | 'guild' }>()
const emit = defineEmits<{ submit: [payload: { region: Region; realm: string; name: string }] }>()

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
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
    <div class="flex gap-2">
      <input
        v-model="name"
        type="text"
        class="input input-bordered input-sm w-40 shrink-0"
        :placeholder="kind === 'guild' ? 'Guild name' : 'Character name'"
        :aria-label="kind === 'guild' ? 'Guild name' : 'Character name'"
      />
      <RealmCombobox v-model="selectedRealm" class="flex-1 min-w-0" />
    </div>
    <button type="submit" class="btn btn-primary btn-sm" :disabled="!canSubmit">
      {{ kind === 'guild' ? 'Find guild' : 'Find character' }}
    </button>
  </form>
</template>
