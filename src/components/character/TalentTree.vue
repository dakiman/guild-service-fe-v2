<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="card-title">Talents</h2>
        <button
          v-if="loadoutCode"
          type="button"
          class="btn btn-sm btn-outline"
          @click="copyLoadout"
        >
          {{ justCopied ? 'Copied!' : 'Copy loadout' }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Class
          </h3>
          <p v-if="!talents.class.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.class" :key="`class-${t.id}`">
              <WowheadLink :spell-id="t.spell_id" :classic="props.classic">{{ rankLabel(t) }}</WowheadLink>
            </li>
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Spec
          </h3>
          <p v-if="!talents.spec.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.spec" :key="`spec-${t.id}`">
              <WowheadLink :spell-id="t.spell_id" :classic="props.classic">{{ rankLabel(t) }}</WowheadLink>
            </li>
          </ul>
        </section>

        <section>
          <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
            Hero
          </h3>
          <p v-if="!talents.hero.length" class="text-base-content/60 text-sm">None</p>
          <ul v-else class="flex flex-col gap-1">
            <li v-for="t in talents.hero" :key="`hero-${t.id}`">
              <WowheadLink :spell-id="t.spell_id" :classic="props.classic">{{ rankLabel(t) }}</WowheadLink>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="talents.pvp && talents.pvp.length" class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-base-content/70 mb-2">
          PvP
        </h3>
        <ul class="flex flex-wrap gap-2">
          <li v-for="p in talents.pvp" :key="`pvp-${p.slot}`">
            <WowheadLink :spell-id="p.spell_id" :classic="props.classic">Slot {{ p.slot + 1 }}</WowheadLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import WowheadLink from '@/components/wow/WowheadLink.vue'
import type { CharacterTalents, TalentEntry } from '@/types/character'

const props = defineProps<{
  talents: CharacterTalents
  loadoutCode?: string | null
  classic?: boolean
}>()

const justCopied = ref(false)

function rankLabel(t: TalentEntry): string {
  return `${t.rank}/${t.max_rank}`
}

async function copyLoadout() {
  if (!props.loadoutCode) return
  try {
    await navigator.clipboard.writeText(props.loadoutCode)
    justCopied.value = true
    toast.success('Loadout code copied — paste it into WoW\'s Import Loadout box')
    setTimeout(() => (justCopied.value = false), 2000)
  } catch {
    toast.error('Could not copy to clipboard')
  }
}
</script>
