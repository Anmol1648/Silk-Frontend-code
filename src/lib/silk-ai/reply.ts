import { CATEGORIES, fieldHasValue } from '@/app/(app)/readiness/readiness-data'
import {
  companyItems,
  draftField,
  emptyFillableItems,
  findItem,
  improveField,
  itemsForCategory,
  proposalFor,
} from './suggest'
import type {
  FieldProposal,
  SilkAiIntent,
  SilkAiMessage,
  SilkAiReply,
  SilkAiWorkspace,
  SuggestContext,
} from './types'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()
}

function lastAssistant(history: SilkAiMessage[]): SilkAiMessage | undefined {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') return history[i]
  }
  return undefined
}

function pendingProposals(history: SilkAiMessage[]): FieldProposal[] {
  const last = lastAssistant(history)
  return (last?.proposals ?? []).filter(p => p.status === 'proposed')
}

function matchField(text: string, workspace: SilkAiWorkspace) {
  const q = normalize(text)
  const pool = [
    ...companyItems(),
    ...itemsForCategory(workspace.categoryId),
    ...(workspace.focusedFieldId ? [findItem(workspace.focusedFieldId)] : []),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

  const seen = new Set<string>()
  let best: ReturnType<typeof findItem>
  let bestLen = 0
  for (const item of pool) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    const name = normalize(item.name)
    if (name.length >= 4 && q.includes(name) && name.length > bestLen) {
      best = item
      bestLen = name.length
    }
  }
  return best
}

function detectIntent(text: string, workspace: SilkAiWorkspace, history: SilkAiMessage[]): SilkAiIntent {
  const q = normalize(text)
  const pending = pendingProposals(history)

  if (
    pending.length &&
    (/^(yes|yep|yeah|ok|okay|sure|do it)\b/.test(q) ||
      /\b(apply|add (them|these|it)|use (them|these|this)|insert|put (them|it) in|looks good)\b/.test(q))
  ) {
    return 'apply'
  }

  if (/\b(improv|rewrit|wording|tighten|better|shorter|punchier|stronger)\b/.test(q)) {
    return 'improve'
  }

  if (/\b(missing|gap|what'?s left|incomplete|empty|not filled|should i fill|fill first)\b/.test(q)) {
    return 'gaps'
  }

  if (/\b(how ready|readiness|score|fundable|investor-ready)\b/.test(q)) {
    return 'ready'
  }

  if (
    /\b(fill|draft|complet|popul|suggest|research|write|help me (with|fill)|generate)\b/.test(q)
  ) {
    const mentioned = matchField(text, workspace)
    if (mentioned || /\b(this field|this one|here)\b/.test(q)) return 'fill_field'
    return 'fill_section'
  }

  if (/\b(investor|expect|what (should|does)|explain|mean|why)\b/.test(q)) {
    return 'explain'
  }

  if (workspace.focusedFieldId && q.length < 48) return 'fill_field'
  return 'general'
}

export const SILK_THINK_STEP_MS = 900

function thinkSteps(kind: SilkAiIntent, subject?: string): string[] {
  const focus = subject?.trim()
  switch (kind) {
    case 'fill_section':
      return [
        'Searching the web…',
        'Reading company site and public filings…',
        'Finding the answer…',
        'Drafting empty Company fields…',
      ]
    case 'fill_field':
      return [
        'Searching the web…',
        focus ? `Looking up “${focus}”…` : 'Reading public sources…',
        'Finding the answer…',
        focus ? `Writing a draft for ${focus}…` : 'Writing the draft…',
      ]
    case 'improve':
      return [
        focus ? `Re-reading “${focus}”…` : 'Re-reading this field…',
        'Searching comparable investor language…',
        'Finding a tighter phrasing…',
        'Rewriting the draft…',
      ]
    case 'gaps':
      return [
        'Scanning the knowledge base…',
        'Checking what’s still empty…',
        'Ranking what investors notice first…',
        'Finding the answer…',
      ]
    case 'ready':
      return [
        'Scoring the knowledge base…',
        'Searching comparable fundraises…',
        'Checking Company completeness…',
        'Finding the answer…',
      ]
    case 'apply':
      return [
        'Checking the last draft…',
        'Matching fields on the form…',
        'Writing values into the knowledge base…',
        'Marking them as AI drafts…',
      ]
    case 'explain':
      return [
        'Searching investor expectations…',
        focus ? `Reading what “${focus}” needs to cover…` : 'Reading this section…',
        'Finding the answer…',
        'Putting it in plain language…',
      ]
    default:
      return [
        'Searching the web…',
        'Reading your knowledge base…',
        'Finding the answer…',
        'Putting a reply together…',
      ]
  }
}

function ctxFrom(workspace: SilkAiWorkspace): SuggestContext {
  return {
    companyName: workspace.companyName,
    website: workspace.website,
    values: workspace.values,
  }
}

function sectionLabel(categoryId: string): string {
  return CATEGORIES.find(c => c.id === categoryId)?.label ?? 'this section'
}

function gapsIn(items: ReturnType<typeof companyItems>, values: Record<string, string>) {
  return items.filter(item => {
    if (item.kind === 'upload') return false
    return !fieldHasValue(item, values[item.id] ?? '')
  })
}

function fillSection(workspace: SilkAiWorkspace): SilkAiReply {
  const items = companyItems()
  const empty = emptyFillableItems(items, workspace.values)
  const proposals: FieldProposal[] = []
  const suggestCtx = ctxFrom(workspace)

  for (const item of empty) {
    const value = draftField(item.id, { ...suggestCtx, item })
    if (!value) continue
    if (workspace.confirmed[item.id]) continue
    proposals.push(
      proposalFor(
        item,
        value,
        item.hint ?? 'Drafted from your company profile and filled knowledge-base fields.',
      ),
    )
  }

  const remaining = gapsIn(items, workspace.values).filter(
    item => !proposals.some(p => p.fieldId === item.id),
  )

  if (!proposals.length) {
    return {
      intent: 'fill_section',
      thinking: thinkSteps('fill_section'),
      content: remaining.length
        ? `Company is mostly drafted. Still open: ${remaining.map(i => i.name).join(', ')}. Ask me about a specific field and I’ll write it.`
        : 'Company looks complete. I can tighten wording on any field — try “Improve company description”.',
      proposals: [],
      followUps: remaining.length
        ? remaining.slice(0, 3).map(i => `Draft ${i.name}`)
        : ['Improve company description', 'How ready are we?'],
    }
  }

  const who = workspace.companyName || 'your company'
  return {
    intent: 'fill_section',
    thinking: thinkSteps('fill_section'),
    content:
      `I drafted ${proposals.length} empty field${proposals.length === 1 ? '' : 's'} in Company from ${who}’s site, team, and what’s already in the knowledge base. They’ll land as AI drafts — confirm anything that feels right.`,
    proposals,
    followUps: ['Apply these drafts', 'What’s still missing?', 'Improve company description'],
  }
}

function fillField(text: string, workspace: SilkAiWorkspace): SilkAiReply {
  const mentioned = matchField(text, workspace)
  const item = mentioned ?? (workspace.focusedFieldId ? findItem(workspace.focusedFieldId) : undefined)
  if (!item) return fillSection(workspace)

  if (item.kind === 'founders' || item.kind === 'upload') {
    return {
      intent: 'fill_field',
      thinking: thinkSteps('fill_field', item.name),
      content:
        item.kind === 'founders'
          ? 'Leadership is synced with the founding team in your workspace — edit it on the form rather than through chat.'
          : 'Upload the file on the form and I’ll analyse it in this panel.',
      proposals: [],
      followUps: ['Fill the Company section', 'What’s missing for investors?'],
    }
  }

  const suggestCtx = ctxFrom(workspace)
  const existing = (workspace.values[item.id] ?? '').trim()
  const value = existing
    ? improveField(item.id, { ...suggestCtx, item })
    : draftField(item.id, { ...suggestCtx, item })

  if (!value) {
    return {
      intent: 'fill_field',
      thinking: thinkSteps('fill_field', item.name),
      content: `I don’t have enough signal yet to draft “${item.name}”. Fill company description, problem, or solution first — or tell me what you want it to say.`,
      proposals: [],
      followUps: ['Fill the Company section', 'What’s missing for investors?'],
    }
  }

  if (existing && value === existing) {
    return {
      intent: 'fill_field',
      thinking: thinkSteps('fill_field', item.name),
      content: `“${item.name}” already looks solid. Want a tighter investor rewrite, or should I fill the rest of Company?`,
      proposals: [],
      followUps: ['Improve wording', 'Fill the Company section'],
    }
  }

  return {
    intent: 'fill_field',
    thinking: thinkSteps('fill_field', item.name),
    content: existing
      ? `Here’s a tighter version of “${item.name}”. Apply it and it stays an AI draft until you confirm.`
      : `Draft for “${item.name}”, grounded in what’s already in the knowledge base.`,
    proposals: [proposalFor(item, value, item.hint)],
    followUps: ['Apply this draft', 'Fill the rest of Company', 'What’s missing for investors?'],
  }
}

function improve(text: string, workspace: SilkAiWorkspace): SilkAiReply {
  const mentioned = matchField(text, workspace)
  const item = mentioned ?? (workspace.focusedFieldId ? findItem(workspace.focusedFieldId) : undefined)
  if (!item) {
    const desc = findItem('company-description')
    if (desc) return fillField('improve company description', workspace)
    return fillSection(workspace)
  }

  const current = (workspace.values[item.id] ?? '').trim()
  if (!current) return fillField(text, workspace)

  const value = improveField(item.id, { ...ctxFrom(workspace), item })
  if (!value || value === current) {
    return {
      intent: 'improve',
      thinking: thinkSteps('improve', item.name),
      content: `I wouldn’t change “${item.name}” much. Ask me to fill empty Company fields instead.`,
      proposals: [],
      followUps: ['Fill the Company section', 'What’s missing for investors?'],
    }
  }

  return {
    intent: 'improve',
    thinking: thinkSteps('improve', item.name),
    content: `Rewrote “${item.name}” for a first-pass investor read. Apply to replace the current draft — you’ll still need to confirm it.`,
    proposals: [proposalFor(item, value, 'Tighter wording from adjacent knowledge-base fields.')],
    followUps: ['Apply this draft', 'Fill the Company section'],
  }
}

function gaps(workspace: SilkAiWorkspace): SilkAiReply {
  const items = companyItems()
  const missing = gapsIn(items, workspace.values)
  const high = missing.filter(i => i.impact === 'high')
  const rest = missing.filter(i => i.impact !== 'high')
  const { categoryScore, score } = workspace

  if (!missing.length) {
    return {
      intent: 'gaps',
      thinking: thinkSteps('gaps'),
      content: `Company has no empty fields. Overall knowledge base is ${score.percent}% complete (${score.done}/${score.total}). I can still tighten wording.`,
      proposals: [],
      followUps: ['Improve company description', 'How ready are we?'],
    }
  }

  const list = (rows: typeof missing) =>
    rows.map(i => `• ${i.name}${i.hint ? ` — ${i.hint}` : ''}`).join('\n')

  const body = [
    `Company is ${categoryScore.done}/${categoryScore.total} confirmed.`,
    high.length ? `Investors will notice these first:\n${list(high)}` : null,
    rest.length ? `Also open:\n${list(rest)}` : null,
    'I can draft the empty ones from your profile and filled fields.',
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    intent: 'gaps',
    thinking: thinkSteps('gaps'),
    content: body,
    proposals: [],
    followUps: ['Fill the Company section', high[0] ? `Draft ${high[0].name}` : 'How ready are we?'],
  }
}

function ready(workspace: SilkAiWorkspace): SilkAiReply {
  const { score, categoryScore } = workspace
  const missing = gapsIn(companyItems(), workspace.values)
  const headline =
    score.percent < 25
      ? 'Not ready yet — the knowledge base still has large holes.'
      : score.percent < 50
        ? 'Getting there. Company needs to be tight before the rest will land.'
        : score.percent < 75
          ? 'Fundable on paper, but empty Company fields still leak credibility.'
          : 'Investor-ready range — confirm AI drafts so nothing looks inferred.'

  return {
    intent: 'ready',
    thinking: thinkSteps('ready'),
    content: [
      headline,
      `Overall ${score.percent}% (${score.done}/${score.total}). ${sectionLabel(workspace.categoryId)} ${categoryScore.done}/${categoryScore.total}.`,
      missing.length
        ? `Still empty in Company: ${missing.map(i => i.name).join(', ')}.`
        : 'Company is filled. Confirm any remaining AI drafts.',
    ].join('\n\n'),
    proposals: [],
    followUps: missing.length
      ? ['Fill the Company section', 'What’s missing for investors?']
      : ['Improve company description', 'What’s missing for investors?'],
  }
}

function applyPending(history: SilkAiMessage[]): SilkAiReply {
  const proposals = pendingProposals(history)
  if (!proposals.length) {
    return {
      intent: 'apply',
      thinking: thinkSteps('apply'),
      content: 'Nothing pending to apply. Ask me to fill Company or improve a field first.',
      proposals: [],
      followUps: ['Fill the Company section', 'What’s missing for investors?'],
    }
  }
  return {
    intent: 'apply',
    thinking: thinkSteps('apply'),
    content: `Applying ${proposals.length} draft${proposals.length === 1 ? '' : 's'} to the form. They’ll show as AI drafts until you confirm.`,
    proposals: proposals.map(p => ({ ...p, status: 'proposed' })),
    followUps: ['What’s still missing?', 'Improve company description'],
  }
}

function explain(text: string, workspace: SilkAiWorkspace): SilkAiReply {
  const item =
    matchField(text, workspace) ??
    (workspace.focusedFieldId ? findItem(workspace.focusedFieldId) : undefined)

  if (item) {
    const filled = fieldHasValue(item, workspace.values[item.id] ?? '')
    return {
      intent: 'explain',
      thinking: thinkSteps('explain', item.name),
      content: [
        `“${item.name}” is ${item.impact} impact.`,
        item.hint ?? item.placeholder ?? 'Be specific, current, and founder-owned.',
        filled
          ? 'You already have a value. I can tighten the wording or leave it.'
          : 'It’s empty. I can draft it from the rest of Company.',
      ].join('\n\n'),
      proposals: [],
      followUps: filled
        ? [`Improve ${item.name}`, 'Fill the Company section']
        : [`Draft ${item.name}`, 'Fill the Company section'],
    }
  }

  return {
    intent: 'explain',
    thinking: thinkSteps('explain'),
    content:
      'Investors skim Company in this order: description, problem, solution, then vision and mission. Empty vision/mission reads as “still figuring it out.” I can draft those from what’s already filled.',
    proposals: [],
    followUps: ['Fill the Company section', 'What’s missing for investors?'],
  }
}

function general(workspace: SilkAiWorkspace): SilkAiReply {
  const missing = emptyFillableItems(companyItems(), workspace.values)
  const focused = workspace.focusedFieldId ? findItem(workspace.focusedFieldId) : undefined
  if (focused && !fieldHasValue(focused, workspace.values[focused.id] ?? '')) {
    return fillField(focused.name, workspace)
  }
  if (missing.length) {
    return {
      intent: 'general',
      thinking: thinkSteps('general'),
      content: `I can help fill Company for ${workspace.companyName || 'your company'}. ${missing.length} field${missing.length === 1 ? '' : 's'} still empty — vision, mission, and team details are the usual gaps.`,
      proposals: [],
      followUps: ['Fill the Company section', 'What’s missing for investors?'],
    }
  }
  return {
    intent: 'general',
    thinking: thinkSteps('general'),
    content: 'Company is filled. I can tighten wording, or we can look at what’s blocking the readiness score.',
    proposals: [],
    followUps: ['Improve company description', 'How ready are we?'],
  }
}

export function replyToSilkAi(args: {
  text: string
  history: SilkAiMessage[]
  workspace: SilkAiWorkspace
}): SilkAiReply {
  const intent = detectIntent(args.text, args.workspace, args.history)
  switch (intent) {
    case 'apply':
      return applyPending(args.history)
    case 'fill_section':
      return fillSection(args.workspace)
    case 'fill_field':
      return fillField(args.text, args.workspace)
    case 'improve':
      return improve(args.text, args.workspace)
    case 'gaps':
      return gaps(args.workspace)
    case 'ready':
      return ready(args.workspace)
    case 'explain':
      return explain(args.text, args.workspace)
    default:
      return general(args.workspace)
  }
}

export function thinkingDurationMs(reply: SilkAiReply): number {
  const n = Math.max(4, reply.thinking.length)
  return Math.min(4000, Math.max(3500, n * SILK_THINK_STEP_MS))
}
