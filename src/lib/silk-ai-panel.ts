export const SILK_AI_OPEN_EVENT = 'silk:open-ai-panel'

export type SilkAiOpenDetail = {
  fieldId?: string | null
  mode?: 'ask' | 'sources' | 'analysis'
}

export function openSilkAiPanel(detail: SilkAiOpenDetail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SILK_AI_OPEN_EVENT, { detail }))
}
