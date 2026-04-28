import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { CharacterResource, MetaBlock } from '@/types/character'

export interface CharacterContext {
  character: ComputedRef<CharacterResource>
  meta: ComputedRef<MetaBlock>
  freshness: ComputedRef<MetaBlock['freshness']>
  isStale: ComputedRef<boolean>
  isClassic: ComputedRef<boolean>
  refetch: () => Promise<unknown>
}

export const CharacterContextKey: InjectionKey<CharacterContext> = Symbol('CharacterContext')

export function provideCharacterContext(ctx: CharacterContext) {
  provide(CharacterContextKey, ctx)
}

export function useCharacterContext(): CharacterContext {
  const ctx = inject(CharacterContextKey)
  if (!ctx) {
    throw new Error('useCharacterContext must be called inside <CharacterDetailLayout>')
  }
  return ctx
}
