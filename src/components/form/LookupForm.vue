<script setup lang="ts">
import { ref, computed } from 'vue'
import RegionSelect from '@/components/form/RegionSelect.vue'
import { slugify } from '@/utils/slugify'
import type { Region } from '@/types/api'

defineProps<{ kind: 'character' | 'guild' }>()
const emit = defineEmits<{ submit: [payload: { region: Region; realm: string; name: string }] }>()

const region = ref<Region>('eu')
const realm = ref('')
const name = ref('')

const canSubmit = computed(() => !!realm.value.trim() && !!name.value.trim())

function onSubmit() {
  if (!canSubmit.value) return
  emit('submit', { region: region.value, realm: slugify(realm.value), name: name.value.trim().toLocaleLowerCase() })
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
    <div class="flex gap-2">
      <RegionSelect v-model="region" class="select-sm w-20 shrink-0" aria-label="Region" />
      <input
        v-model="name"
        type="text"
        class="input input-bordered input-sm w-32 shrink-0"
        :placeholder="kind === 'guild' ? 'Guild name' : 'Character name'"
        :aria-label="kind === 'guild' ? 'Guild name' : 'Character name'"
      />
      <input
        v-model="realm"
        type="text"
        class="input input-bordered input-sm flex-1 min-w-0"
        placeholder="Realm"
        aria-label="Realm"
      />
    </div>
    <button type="submit" class="btn btn-primary btn-sm" :disabled="!canSubmit">
      {{ kind === 'guild' ? 'Find guild' : 'Find character' }}
    </button>
  </form>
</template>
