import type { ReadinessItem } from '@/app/(app)/readiness/readiness-data'

export type SilkAiRole = 'user' | 'assistant'

export type FieldProposalStatus = 'proposed' | 'applied'

export type FieldProposal = {
  fieldId: string
  fieldName: string
  value: string
  rationale?: string
  status: FieldProposalStatus
}

export type SilkAiMessage = {
  id: string
  role: SilkAiRole
  content: string
  proposals?: FieldProposal[]
  followUps?: string[]
}

export type SilkAiIntent =
  | 'fill_section'
  | 'fill_field'
  | 'improve'
  | 'gaps'
  | 'ready'
  | 'apply'
  | 'explain'
  | 'general'

export type SilkAiWorkspace = {
  companyName: string
  website?: string
  focusedFieldId?: string | null
  categoryId: string
  values: Record<string, string>
  confirmed: Record<string, boolean>
  score: { done: number; total: number; percent: number }
  categoryScore: { done: number; total: number }
}

export type SilkAiReply = {
  intent: SilkAiIntent
  thinking: string[]
  content: string
  proposals: FieldProposal[]
  followUps: string[]
}

export type SuggestContext = {
  companyName: string
  website?: string
  values: Record<string, string>
  item?: ReadinessItem
}
