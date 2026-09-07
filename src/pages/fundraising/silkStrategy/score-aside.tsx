'use client'

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type Key } from 'react'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUp02Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  File01Icon,
  Globe02Icon,
  LinkSquare02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { AiMark } from '@/components/ai-mark'
import {
  beatsForLeaf,
  findMove,
  formatMeasured,
  formatScore,
  lookSentence,
  lookWord,
  printName,
  profileSuggestions,
  replyToScoreAsk,
  scoreSuggestions,
  sourceRefs,
  trailFor,
  type DealReport,
  type ScoredLeaf,
  type SourceKind,
  type SourceRef,
} from '@/lib/deal-score'
import {
  thinkingDurationMs,
  SILK_THINK_STEP_MS,
  type SilkAiMessage,
  type SilkAiReply,
} from '@/lib/silk-ai/index'

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
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-secondary-foreground group-hover/chip:text-foreground">
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

function ThinkingBlock({ steps }: { steps: string[]; key?: Key }) {
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
    <div className="flex items-center gap-2 px-1" aria-live="polite" aria-label={label}>
      <AiMark size={14} className="silk-think-mark shrink-0" />
      <p key={label} className="silk-think-text text-[13px] leading-snug">
        {label}
      </p>
    </div>
  )
}

function Reading({
  report,
  leaf,
}: {
  report: DealReport
  leaf: ScoredLeaf | null
}) {
  if (!leaf) {
    const look = lookWord(report.score)
    return (
      <div className="px-1">
        <h3 className="font-heading text-[22px] font-normal leading-snug tracking-[-0.03em] text-popover-foreground">
          Ask about the profile
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-popover-foreground">
          {lookSentence(look)} {formatScore(report.score)} overall.
        </p>
      </div>
    )
  }

  const move = findMove(report, leaf.id)
  const beats = beatsForLeaf(leaf, move)
  const sources = sourceRefs(leaf)
  const measured = leaf.measured ? formatMeasured(leaf.measured) : null

  const scoreMark = leaf.score == null ? '—' : formatScore(leaf.score)

  return (
    <div className="px-1">
      <div
        className={cn(
          'flex justify-between gap-4',
          measured ? 'items-start' : 'items-baseline',
        )}
      >
        <div className="min-w-0">
          <h3 className="font-heading text-[22px] font-normal leading-snug tracking-[-0.03em] text-popover-foreground">
            {printName(leaf)}
          </h3>
          {measured && (
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground tabular-nums">
              {measured}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {measured ? (
            <>
              <p className="font-heading text-[22px] font-normal leading-snug tracking-[-0.03em] text-popover-foreground tabular-nums">
                {scoreMark}
              </p>
              {leaf.band && (
                <p className="mt-1 text-[11px] text-muted-foreground">{leaf.band}</p>
              )}
            </>
          ) : (
            <p className="flex items-baseline justify-end gap-1.5">
              <span className="font-heading text-[22px] font-normal leading-snug tracking-[-0.03em] text-popover-foreground tabular-nums">
                {scoreMark}
              </span>
              {leaf.band && (
                <span className="text-[11px] text-muted-foreground">{leaf.band}</span>
              )}
            </p>
          )}
        </div>
      </div>

      {(leaf.evidenceTier || leaf.confidence) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {leaf.evidenceTier && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {leaf.evidenceTier} Evidence
            </span>
          )}
          {leaf.confidence && (
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
              {leaf.confidence} Confidence
            </span>
          )}
        </div>
      )}

      {(() => {
        const paragraphBeats = [beats.why, beats.wrong, beats.raise]
          .filter((b): b is string => Boolean(b && b.trim()))
          .filter((b, index, self) => self.indexOf(b) === index);

        if (!paragraphBeats.length) return null;

        return (
          <div className="mt-5 flex flex-col gap-4">
            {paragraphBeats.map((beat, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-popover-foreground">
                {beat}
              </p>
            ))}
          </div>
        );
      })()}

      {leaf.diligenceAsk && (
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] text-amber-900 dark:text-amber-200">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Diligence Ask / Data Gap
          </p>
          <p className="leading-relaxed">{leaf.diligenceAsk}</p>
        </div>
      )}

      {leaf.rubric?.labels && Object.keys(leaf.rubric.labels).length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            Scoring Criteria
          </p>
          <div className="mt-2.5 flex flex-col gap-2 rounded-xl border border-border/40 bg-secondary/50 p-3 text-[12px]">
            {Object.entries(leaf.rubric.labels).map(([bandKey, desc]) => {
              const isCurrent = leaf.band === bandKey
              return (
                <div
                  key={bandKey}
                  className={cn(
                    'rounded-lg p-2.5 transition-colors',
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20 font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[11px] font-semibold',
                        isCurrent ? 'text-primary' : 'text-foreground/70',
                      )}
                    >
                      {bandKey}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Current Band
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sources.length > 0 && <SourceBlock sources={sources} />}
    </div>
  )
}

function scoreSourceIcon(kind: SourceKind) {
  if (kind === 'web') return Globe02Icon
  if (kind === 'field') return LinkSquare02Icon
  return File01Icon
}

function SourceBlock({ sources }: { sources: SourceRef[] }) {
  return (
    <div className="mt-5">
      <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
        Sources
      </p>
      <div className="mt-2.5 overflow-hidden rounded-xl bg-secondary">
        {sources.map((source, index) => (
          <SourceRow key={`${source.kind}-${source.name}-${index}`} source={source} />
        ))}
      </div>
    </div>
  )
}

function SourceRow({ source }: { source: SourceRef; key?: Key }) {
  const body = (
    <>
      <HugeiconsIcon
        icon={scoreSourceIcon(source.kind)}
        size={15}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-primary/70"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] leading-snug text-secondary-foreground group-hover/source:text-foreground">
            {source.name}
          </span>
          <span className="rounded bg-primary/[0.08] px-1 py-px text-[10px] font-medium text-primary">
            {source.kindLabel}
          </span>
        </span>
        {source.locator && (
          <span className="mt-0.5 block text-[12px] leading-snug text-foreground-subtle">
            {source.locator}
          </span>
        )}
      </span>
      {source.href && (
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={14}
          strokeWidth={2}
          className="mt-0.5 shrink-0 text-foreground/20 transition-colors group-hover/source:text-primary"
        />
      )}
    </>
  )

  const rowClass = cn(
    'group/source flex w-full items-start gap-3 px-3.5 py-3 text-left',
    'transition-colors',
    source.href ? 'hover:bg-muted' : 'cursor-default',
  )

  if (!source.href) {
    return <div className={rowClass}>{body}</div>
  }

  if (source.external) {
    return (
      <a
        href={source.href}
        target="_blank"
        rel="noopener noreferrer"
        className={rowClass}
      >
        {body}
      </a>
    )
  }

  return (
    <Link href={source.href} className={rowClass}>
      {body}
    </Link>
  )
}

export function ScoreAside({
  report,
  leaf,
  leaving,
  onClose,
}: {
  report: DealReport
  leaf: ScoredLeaf | null
  leaving?: boolean
  onClose: () => void
  key?: Key
}) {
  const [draft, setDraft] = useState('')
  const [entered, setEntered] = useState(false)
  const [messages, setMessages] = useState<SilkAiMessage[]>([])
  const [thinking, setThinking] = useState<string[] | null>(null)
  const [pending, setPending] = useState<SilkAiReply | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const leafId = leaf?.id ?? 'profile'

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
    setDraft('')
    setMessages([])
    setThinking(null)
    setPending(null)
  }, [leafId])

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
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply.content,
          followUps: reply.followUps,
        },
      ])
    }, thinkingDurationMs(pending))
    return () => window.clearTimeout(timer)
  }, [pending])

  const send = (raw?: string) => {
    const text = (raw ?? draft).trim()
    if (!text || pending) return
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }])
    setDraft('')
    const reply = replyToScoreAsk({ text, report, leaf })
    setThinking(reply.thinking.length ? reply.thinking : ['Thinking…'])
    setPending(reply)
  }

  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const expanded = entered && !leaving
  const inConversation = messages.length > 0 || Boolean(thinking)
  const trail = leaf ? trailFor(report, leaf.id) : 'Profile'
  const chips = leaf ? scoreSuggestions(leaf) : profileSuggestions(lookWord(report.score))

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
          <div className="truncate text-[13px] leading-none text-muted-foreground">
            {trail || 'Profile'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-lg text-foreground-subtle transition-colors hover:bg-secondary hover:text-foreground/55"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.8} />
        </button>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          <div className="px-5 pt-6">
            <Reading report={report} leaf={leaf} />
          </div>

          {inConversation ? (
            <div className="flex flex-col gap-5 px-5 py-6">
              {messages.map(message => (
                <div key={message.id} className="silk-enter">
                  {message.role === 'user' ? (
                    <div className="ml-auto w-fit max-w-[88%] rounded-xl bg-muted px-3.5 py-2.5">
                      <p className="whitespace-pre-wrap text-[13px] leading-snug text-popover-foreground">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-popover-foreground">
                        {message.content}
                      </p>
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
          ) : chips.length > 0 ? (
            <div className="mt-auto px-5 pb-2 pt-10">
              <span className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
                Suggestions
              </span>
              <div className="mt-2.5">
                <SuggestionList items={chips} onSelect={send} disabled={Boolean(pending)} />
              </div>
            </div>
          ) : null}
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
              leaf ? `Ask about “${printName(leaf)}”…` : 'Ask about the profile…'
            }
            className="min-w-0 flex-1 resize-none bg-transparent text-[13px] leading-snug text-foreground outline-none placeholder:text-foreground-subtle"
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
