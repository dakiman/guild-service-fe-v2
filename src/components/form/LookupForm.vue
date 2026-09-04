<script setup lang="ts">
import { ref, computed } from 'vue'
import RealmCombobox, { type RealmPick } from '@/components/form/RealmCombobox.vue'
import NameAutocomplete from '@/components/form/NameAutocomplete.vue'
import type { Region } from '@/types/api'

const props = defineProps<{
  kind: 'character' | 'guild'
  /** Seeds the name field once at mount (nav quick-search hand-off). */
  initialName?: string
}>()
const emit = defineEmits<{
  submit: [payload: { region: Region; realm: string; name: string }]
  pick: [payload: { region: Region; realm: string; name: string }]
}>()

const selectedRealm = ref<RealmPick | null>(null)
const name = ref(props.initialName ?? '')
const realmEl = ref<InstanceType<typeof RealmCombobox> | null>(null)

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

function focusRealm() {
  realmEl.value?.focus()
}

defineExpose({ focusRealm })
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
    <div class="flex gap-2 relative">
      <NameAutocomplete
        v-model="name"
        :kind="kind"
        class="w-40 shrink-0"
        @pick="onPick"
      />
      <RealmCombobox ref="realmEl" v-model="selectedRealm" class="flex-1 min-w-0" />
    </div>
    <button type="submit" class="wsa-btn wsa-btn--primary py-1.5 text-sm" :disabled="!canSubmit">
      {{ kind === 'guild' ? 'Find guild' : 'Find character' }}
    </button>
  </form>
</template>
