'use client'

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type Key } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUp02Icon, ArrowUpRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { AiMark } from '@/components/ai-mark'
import {
  beatsForValuationPointer,
  parseValuationPointer,
  valuationSuggestions,
  type ValuationReport,
} from '@/lib/deal-score'
import { PeerJourney } from './peer-journey'
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
      setIndex(i => Math.min(i + 1, steps.length - 1))
    }, SILK_THINK_STEP_MS)
    return () => window.clearInterval(id)
  }, [steps.length])
  return (
    <div className="flex items-center gap-2.5">
      <AiMark size={14} className="silk-think-mark shrink-0" />
      <p className="silk-think-text text-[13px] leading-snug">{steps[index]}</p>
    </div>
  )
}

function trailForPointer(report: ValuationReport, pointerId: string | null) {
  if (!pointerId) return 'Raise and Valuation'
  const pointer = parseValuationPointer(pointerId)
  switch (pointer.kind) {
    case 'raise':
      return 'Raise'
    case 'range':
      return 'Ideal valuation'
    case 'dilution':
      return 'Dilution'
    case 'runway':
      return 'Runway after'
    case 'peer': {
      const peer = report.peers.find(p => p.id === pointer.peerId)
      return peer ? `Peers · ${peer.name}` : 'Peers'
    }
    case 'funds':
      return 'Use of funds'
    case 'clock':
      return 'Clock'
    case 'phase': {
      const phase = report.clock.phases.find(p => p.id === pointer.phaseId)
      return phase ? `Clock · ${phase.name}` : 'Clock'
    }
    default:
      return 'Raise and Valuation'
  }
}

function replyToValuationAsk(args: {
  text: string
  report: ValuationReport
  pointerId: string | null
}): SilkAiReply {
  const beats = beatsForValuationPointer(args.report, args.pointerId ?? 'profile')
  return {
    intent: 'explain',
    thinking: ['Reading the raise…', 'Checking the peer set…'],
    content: [
      beats.why,
      beats.wrong,
      beats.next,
      '',
      `You asked: “${args.text.trim()}”`,
      'Ask intents for valuation what-ifs land next. For now this stays on the written reading.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    proposals: [],
    followUps: valuationSuggestions(args.pointerId).slice(0, 2),
  }
}

function Reading({
  report,
  pointerId,
}: {
  report: ValuationReport
  pointerId: string | null
}) {
  const beats = beatsForValuationPointer(report, pointerId ?? 'profile')
  const pointer = parseValuationPointer(pointerId ?? 'profile')
  const peer =
    pointer.kind === 'peer'
      ? report.peers.find(item => item.id === pointer.peerId) ?? null
      : null
  return (
    <div className="px-1">
      <h3 className="font-heading text-[22px] font-normal leading-snug tracking-[-0.03em] text-popover-foreground">
        {beats.title}
      </h3>
      {beats.lede && (
        <p className="mt-1 font-heading text-[22px] font-normal leading-snug tracking-[-0.03em] text-popover-foreground tabular-nums">
          {beats.lede}
        </p>
      )}
      {peer && <PeerJourney peer={peer} />}
      <div className="mt-5 flex flex-col gap-4">
        <p className="text-[13px] leading-relaxed text-popover-foreground">{beats.why}</p>
        {beats.wrong && (
          <p className="text-[13px] leading-relaxed text-popover-foreground">{beats.wrong}</p>
        )}
        {beats.next && (
          <p className="text-[13px] leading-relaxed text-popover-foreground">{beats.next}</p>
        )}
      </div>
    </div>
  )
}

export function ValuationAside({
  report,
  pointerId,
  leaving,
  onClose,
}: {
  report: ValuationReport
  pointerId: string | null
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
  }, [pointerId])

  useEffect(() => {
    if (messages.length === 0 && !thinking) return
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
    const reply = replyToValuationAsk({ text, report, pointerId })
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
  const chips = valuationSuggestions(pointerId)

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
            {trailForPointer(report, pointerId)}
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
            <Reading report={report} pointerId={pointerId} />
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
          ) : (
            <div className="mt-auto px-5 pb-3 pt-8">
              <SuggestionList items={chips} onSelect={send} />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl bg-secondary px-3 py-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            rows={1}
            placeholder="Ask about the raise…"
            className="max-h-28 min-h-[24px] w-full resize-none bg-transparent py-1 text-[13px] leading-snug text-foreground outline-none placeholder:text-foreground-subtle"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!draft.trim() || Boolean(pending)}
            aria-label="Send"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background transition-opacity disabled:opacity-30"
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}
