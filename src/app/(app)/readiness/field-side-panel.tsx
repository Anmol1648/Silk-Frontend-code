'use client'

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  LinkSquare02Icon,
  Linkedin02Icon,
  Globe02Icon,
  ArrowUpRight01Icon,
  ArrowUp02Icon,
  File01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import {
  replyToSilkAi,
  thinkingDurationMs,
  SILK_THINK_STEP_MS,
  type SilkAiMessage,
  type SilkAiReply,
  type SilkAiWorkspace,
} from '@/lib/silk-ai'
import type { FieldConflict, UploadedDocument } from '@/lib/documents'
import { AiMark } from '@/components/ai-mark'
import type { FieldSource } from './readiness-data'
import { DocumentAnalysisContent } from './document-analysis-panel'

export type PanelMode = 'ask' | 'sources' | 'analysis'

function sourceKindIcon(kind: FieldSource['kind']) {
  if (kind === 'linkedin') return Linkedin02Icon
  if (kind === 'website') return Globe02Icon
  if (kind === 'document') return File01Icon
  return LinkSquare02Icon
}

function SuggestionList({
  items,
  onSelect,
  disabled,
}: {
  items: string[]
  onSelect: (item: string) => void
  disabled?: boolean
}) {
  if (!items.length) return null
  return (
    <div className="overflow-hidden rounded-xl bg-secondary">
      {items.map(chip => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className={cn(
            'group/chip flex w-full items-center gap-3 px-3 py-3 text-left',
            'transition-colors hover:bg-muted',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          <span className="min-w-0 flex-1 text-[13px] text-secondary-foreground leading-snug group-hover/chip:text-foreground">
            {chip}
          </span>
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={13}
            strokeWidth={2}
            className="shrink-0 text-foreground/20 transition-colors group-hover/chip:text-primary"
          />
        </button>
      ))}
    </div>
  )
}

function ThinkingBlock({ steps }: { steps: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (steps.length <= 1) return
    const id = window.setInterval(() => {
      setIndex(n => Math.min(n + 1, steps.length - 1))
    }, SILK_THINK_STEP_MS)
    return () => window.clearInterval(id)
  }, [steps])

  const label = steps[index] ?? 'Thinking…'

  return (
    <div
      className="flex items-center gap-2 px-1"
      aria-live="polite"
      aria-label={label}
    >
      <AiMark size={14} className="silk-think-mark shrink-0" />
      <p key={label} className="silk-think-text text-[13px] leading-snug">
        {label}
      </p>
    </div>
  )
}

function ProposalList({
  message,
  onApply,
}: {
  message: SilkAiMessage
  onApply: (messageId: string, fieldIds?: string[]) => void
}) {
  const proposals = message.proposals ?? []
  if (!proposals.length) return null
  const pending = proposals.filter(p => p.status === 'proposed')

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
          Drafts
        </span>
        {pending.length > 1 && (
          <button
            type="button"
            onClick={() => onApply(message.id)}
            className="text-[11px] font-medium text-primary/80 hover:text-primary transition-colors"
          >
            Apply {pending.length}
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {proposals.map(p => {
          const applied = p.status === 'applied'
          return (
            <div key={p.fieldId} className="overflow-hidden rounded-xl bg-secondary">
              <div className="px-3.5 py-2 text-[12px] font-medium text-muted-foreground">
                {p.fieldName}
              </div>
              <div className="h-px w-full bg-foreground/3" />
              <div className="px-3.5 py-3">
                <p className="text-[13px] text-popover-foreground leading-snug">{p.value}</p>
                {applied ? (
                  <span className="mt-3 inline-flex h-8 items-center gap-1 text-[12.5px] font-medium text-primary/70">
                    <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.4} />
                    Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApply(message.id, [p.fieldId])}
                    className={cn(
                      'mt-3 inline-flex h-8 items-center rounded-lg bg-background px-3',
                      'text-[12.5px] font-medium text-popover-foreground',
                      'ring-1 ring-foreground/6',
                      'transition-colors hover:bg-muted hover:text-foreground',
                    )}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FieldSidePanel({
  fieldName,
  mode,
  sources,
  analysisDocument,
  conflict,
  leaving,
  workspace,
  onApplyDrafts,
  onClose,
}: {
  fieldName?: string
  mode: PanelMode
  sources: FieldSource[]
  analysisDocument?: UploadedDocument | null
  conflict?: FieldConflict
  leaving?: boolean
  workspace: SilkAiWorkspace
  onApplyDrafts: (patches: Record<string, string>) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState('')
  const [entered, setEntered] = useState(false)
  const [messages, setMessages] = useState<SilkAiMessage[]>([])
  const [thinking, setThinking] = useState<string[] | null>(null)
  const [pending, setPending] = useState<SilkAiReply | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => {
      const reply = pending
      setPending(null)
      setThinking(null)

      if (reply.intent === 'apply' && reply.proposals.length) {
        onApplyDrafts(Object.fromEntries(reply.proposals.map(p => [p.fieldId, p.value])))
        setMessages(prev => [
          ...prev.map(m => {
            if (m.role !== 'assistant' || !m.proposals?.some(p => p.status === 'proposed')) return m
            return {
              ...m,
              proposals: m.proposals.map(p => ({ ...p, status: 'applied' as const })),
            }
          }),
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: reply.content,
            proposals: reply.proposals.map(p => ({ ...p, status: 'applied' as const })),
            followUps: reply.followUps,
          },
        ])
        return
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply.content,
          proposals: reply.proposals,
          followUps: reply.followUps,
        },
      ])
    }, thinkingDurationMs(pending))
    return () => window.clearTimeout(timer)
  }, [pending, onApplyDrafts])

  const expanded = entered && !leaving
  const inConversation = messages.length > 0 || Boolean(thinking)
  const showSources = mode === 'sources' && !inConversation
  const showAnalysis = mode === 'analysis' && !inConversation
  const showAsk = !showSources && !showAnalysis

  const chips = fieldName
    ? ['Improve wording', 'What’s missing for investors?', 'Fill the Company section']
    : ['Fill the Company section', 'What’s missing for investors?', 'How ready are we?']

  const heading = fieldName
    ? showAnalysis
      ? `Analysis – ${fieldName}`
      : showSources
        ? `Sources for ${fieldName}`
        : `Ask about ${fieldName}`
    : 'Ask Silk AI'

  const subtitle = showAnalysis
    ? null
    : showSources
      ? conflict
        ? 'Public research and uploaded document disagree on this field.'
        : 'Signals Silk used for this field — including uploaded documents.'
      : fieldName
        ? 'Wording, gaps, or what investors expect to see here.'
        : 'I can draft empty Company fields from your profile and what’s already filled.'

  const sectionLabel = showAnalysis ? 'Analysis' : showSources ? 'Sources' : 'Suggestions'
  const analysisPrompts = [
    'What’s missing for investors?',
    'Summarise the key risks',
    'Which readiness fields should I confirm first?',
  ]

  const applyFromMessage = (messageId: string, fieldIds?: string[]) => {
    const msg = messages.find(m => m.id === messageId)
    const targets = (msg?.proposals ?? []).filter(
      p => p.status === 'proposed' && (!fieldIds || fieldIds.includes(p.fieldId)),
    )
    if (!targets.length) return
    onApplyDrafts(Object.fromEntries(targets.map(p => [p.fieldId, p.value])))
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId || !m.proposals) return m
        return {
          ...m,
          proposals: m.proposals.map(p =>
            targets.some(t => t.fieldId === p.fieldId) ? { ...p, status: 'applied' as const } : p,
          ),
        }
      }),
    )
  }

  const send = (raw?: string) => {
    const text = (raw ?? draft).trim()
    if (!text || pending) return

    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: text },
    ])
    setDraft('')

    const reply = replyToSilkAi({ text, history: messages, workspace })
    setThinking(reply.thinking.length ? reply.thinking : ['Thinking…'])
    setPending(reply)
  }

  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <aside
      className={cn(
        'absolute inset-y-0 right-0 z-30 flex h-full w-(--silk-aside) min-h-0 flex-col border-l border-border bg-background',
        'transition-transform duration-(--silk-aside-shift) ease-(--silk-aside-ease)',
        'motion-reduce:translate-x-0 motion-reduce:transition-none',
        expanded ? 'translate-x-0' : 'translate-x-full',
        !expanded && 'pointer-events-none',
      )}
    >
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-5 py-2">
          <div className="flex h-8 min-w-0 flex-1 items-center">
            <div className="text-[13px] text-muted-foreground leading-none">Ask Silk AI</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-foreground-subtle hover:bg-secondary hover:text-foreground/55 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.8} />
          </button>
        </div>

        <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col">
            {showAsk && inConversation ? (
              <div className="flex flex-col gap-5 px-5 py-5">
                {messages.map(message => (
                  <div key={message.id} className="silk-enter">
                    {message.role === 'user' ? (
                      <div className="ml-auto w-fit max-w-[88%] rounded-xl bg-muted px-3.5 py-2.5">
                        <p className="text-[13px] text-popover-foreground leading-snug whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[13px] text-popover-foreground leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <ProposalList message={message} onApply={applyFromMessage} />
                        {message.followUps && message.followUps.length > 0 && (
                          <div className="mt-3">
                            <span className="px-1 text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
                              Suggestions
                            </span>
                            <div className="mt-2">
                              <SuggestionList
                                items={message.followUps}
                                onSelect={send}
                                disabled={Boolean(pending)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {thinking && (
                  <div className="silk-enter">
                    <ThinkingBlock key={thinking.join('|')} steps={thinking} />
                  </div>
                )}
              </div>
            ) : (
              <div className={cn('mt-auto', showAnalysis ? 'px-5 py-4' : 'px-5 py-6')}>
                {!showAnalysis && (
                  <div className="px-1">
                    <h3 className="font-heading text-[22px] font-normal text-popover-foreground tracking-[-0.03em] leading-snug">
                      {heading}
                    </h3>
                    {subtitle && (
                      <p className="mt-2.5 text-[13px] text-muted-foreground leading-relaxed">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {showAnalysis && (
                  <div className="mb-4 px-1">
                    <h3 className="font-heading text-[22px] font-normal text-popover-foreground tracking-[-0.03em] leading-snug">
                      {heading}
                    </h3>
                  </div>
                )}

                <div className={cn(showAnalysis ? 'mt-0' : 'mt-10')}>
                  {!showAnalysis && (
                    <span className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
                      {sectionLabel}
                    </span>
                  )}

                  {conflict && showSources && (
                    <div className="mt-2.5 rounded-xl bg-amber-50 ring-1 ring-amber-100 px-3.5 py-3 text-left">
                      <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-amber-800/70">
                        Conflict
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-amber-950/80 leading-snug">
                        <span className="font-medium">Current:</span> {conflict.existingValue}
                      </p>
                      <p className="mt-1 text-[12.5px] text-amber-950/80 leading-snug">
                        <span className="font-medium">From {conflict.documentName}:</span>{' '}
                        {conflict.documentValue}
                      </p>
                    </div>
                  )}

                  {showAnalysis ? (
                    analysisDocument ? (
                      <DocumentAnalysisContent
                        document={analysisDocument}
                        prompts={analysisPrompts}
                        onPrompt={setDraft}
                      />
                    ) : (
                      <p className="mt-2 px-1 text-[13px] text-foreground-subtle leading-snug">
                        Upload a document to see analysis here.
                      </p>
                    )
                  ) : (
                    <div className="mt-2.5">
                      {showSources ? (
                        sources.length === 0 ? (
                          <p className="px-3.5 py-3 text-[13px] text-foreground-subtle leading-snug">
                            No sources are linked to this field yet.
                          </p>
                        ) : (
                          sources.map(source => (
                            <a
                              key={source.id}
                              href={source.url}
                              target={source.kind === 'document' && source.url.startsWith('#') ? undefined : '_blank'}
                              rel="noopener noreferrer"
                              className={cn(
                                'group/chip flex w-full items-start gap-3 px-3.5 py-3 text-left',
                                'rounded-xl',
                                'transition-colors hover:bg-secondary',
                              )}
                            >
                              <HugeiconsIcon
                                icon={sourceKindIcon(source.kind)}
                                size={15}
                                strokeWidth={2}
                                className="mt-0.5 shrink-0 text-primary/70"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="block text-[13px] text-popover-foreground leading-snug group-hover/chip:text-foreground">
                                    {source.title}
                                  </span>
                                  {source.kind === 'document' && (
                                    <span className="rounded bg-primary/[0.08] px-1 py-px text-[10px] font-medium text-primary">
                                      Document
                                    </span>
                                  )}
                                </span>
                                {source.excerpt && (
                                  <span className="mt-0.5 block text-[12px] text-foreground-subtle leading-snug">
                                    {source.excerpt}
                                  </span>
                                )}
                              </span>
                              <HugeiconsIcon
                                icon={ArrowUpRight01Icon}
                                size={14}
                                strokeWidth={2}
                                className="mt-0.5 shrink-0 text-foreground/20 transition-colors group-hover/chip:text-primary"
                              />
                            </a>
                          ))
                        )
                      ) : (
                        <SuggestionList
                          items={chips}
                          onSelect={send}
                          disabled={Boolean(pending)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 p-4">
          <div className="flex items-end gap-2 rounded-lg bg-secondary px-3.5 py-3">
            <textarea
              rows={3}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder={
                showAnalysis && analysisDocument
                  ? `Ask about “${analysisDocument.name}”…`
                  : fieldName
                    ? `Ask about “${fieldName}”…`
                    : 'Ask Silk AI…'
              }
              className="flex-1 min-w-0 resize-none bg-transparent text-[13px] text-foreground placeholder:text-foreground-subtle outline-none leading-snug"
            />
            <button
              type="button"
              disabled={!draft.trim() || Boolean(pending)}
              onClick={() => send()}
              className="silk-ai-btn silk-ai-btn--icon mb-0.5"
              aria-label="Send"
            >
              <span className="silk-ai-btn__inner">
                <HugeiconsIcon
                  icon={ArrowUp02Icon}
                  size={15}
                  strokeWidth={2}
                  className="silk-ai-btn__mark"
                />
              </span>
            </button>
          </div>
        </div>
    </aside>
  )
}
