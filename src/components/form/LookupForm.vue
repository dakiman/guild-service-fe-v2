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
  <form class="flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="onSubmit">
    <div class="form-control">
      <label class="label"><span class="label-text">Region</span></label>
      <RegionSelect v-model="region" />
    </div>
    <div class="form-control flex-1">
      <label class="label"><span class="label-text">Realm</span></label>
      <input v-model="realm" type="text" class="input input-bordered" placeholder="e.g. Tarren Mill" />
    </div>
    <div class="form-control flex-1">
      <label class="label"><span class="label-text">{{ kind === 'guild' ? 'Guild name' : 'Character name' }}</span></label>
      <input v-model="name" type="text" class="input input-bordered" :placeholder="kind === 'guild' ? 'e.g. Method' : 'e.g. Arthas'" />
    </div>
    <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
      {{ kind === 'guild' ? 'Find Guild' : 'Find Character' }}
    </button>
  </form>
</template>
