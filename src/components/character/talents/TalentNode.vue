<template>
  <a
    :href="fullHref"
    :data-wowhead="dataWowhead"
    data-wh-icon-size="large"
    target="_blank"
    rel="noopener"
    class="talent-node"
    :class="[
      isChoice ? 'talent-node--choice' : 'talent-node--regular',
      isPicked ? 'talent-node--picked' : 'talent-node--unpicked',
    ]"
    :style="nodeStyle"
  >
    <span class="talent-node__icon" />
    <span v-if="rankLabel" class="talent-node__rank">{{ rankLabel }}</span>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildWowheadHref } from '@/utils/wowhead'

const props = defineProps<{
  spellId: number
  isPicked: boolean
  isChoice: boolean
  rankLabel?: string | null
  classColor?: string | null
  /** Optional positional layout (consumed by TalentTreeColumn). */
  row?: number
  col?: number
  cellSize?: number
}>()

const dataWowhead = computed(() => buildWowheadHref({ spellId: props.spellId }))
const fullHref = computed(() => `https://www.wowhead.com/${dataWowhead.value}`)

const nodeStyle = computed(() => {
  const out: Record<string, string> = {}
  if (props.row !== undefined && props.col !== undefined && props.cellSize !== undefined) {
    out.position = 'absolute'
    out.top = `${props.row * props.cellSize}px`
    out.left = `${props.col * props.cellSize}px`
    out.width = `${props.cellSize - 8}px`
    out.height = `${props.cellSize - 8}px`
  } else if (props.cellSize !== undefined) {
    out.width = `${props.cellSize}px`
    out.height = `${props.cellSize}px`
  }
  if (props.isPicked && props.classColor) {
    out['--talent-glow'] = props.classColor
  }
  return out
})
</script>

<style scoped>
.talent-node {
  display: inline-block;
  position: relative;
  background-color: hsl(var(--bc) / 0.15);
  background-size: cover;
  background-position: center;
  transition: opacity 0.15s ease;
}
.talent-node--regular {
  border-radius: 4px;
}
.talent-node--choice {
  clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
}
.talent-node--picked {
  opacity: 1;
}
.talent-node--unpicked {
  opacity: 0.4;
}
.talent-node__icon {
  display: block;
  width: 100%;
  height: 100%;
}
/* Wowhead's power.js swaps in a fixed-size .iconmedium (36px). Nodes are
   sized by cellSize, so force the injected markup to fill the node instead
   of overflowing the highlight ring. background-size is needed because the
   icon jpg otherwise renders at its natural 36px inside the shrunk box. */
.talent-node :deep(span[class*='icon']),
.talent-node :deep(span[class*='icon'] ins) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  background-size: cover !important;
}
/* power.js also injects a <del> frame overlay — we render frameless icons. */
.talent-node :deep(span[class*='icon'] del) {
  display: none !important;
}
.talent-node--regular :deep(span[class*='icon']),
.talent-node--regular :deep(span[class*='icon'] ins) {
  border-radius: 4px;
}
.talent-node__rank {
  position: absolute;
  right: -2px;
  bottom: -2px;
  font-size: 10px;
  line-height: 1;
  padding: 1px 3px;
  background: rgb(0 0 0 / 0.85);
  color: white;
  border-radius: 3px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
</style>
