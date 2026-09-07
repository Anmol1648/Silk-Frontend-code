export type {
  FieldProposal,
  FieldProposalStatus,
  SilkAiIntent,
  SilkAiMessage,
  SilkAiReply,
  SilkAiRole,
  SilkAiWorkspace,
  SuggestContext,
} from './types'
export { replyToSilkAi, thinkingDurationMs, SILK_THINK_STEP_MS } from './reply'
export { companyItems, draftField, emptyFillableItems, findItem, improveField } from './suggest'
