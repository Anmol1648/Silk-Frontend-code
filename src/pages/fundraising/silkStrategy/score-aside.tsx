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
import { FormattedMarkdown } from '@/components/formatted-markdown'
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
import { BAND_COLORS } from './score-tree'

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
    <div className="flex items-center gap-2.5 px-1" aria-live="polite" aria-label={label}>
      <div className="w-[18px] h-[18px] rounded-[4px] bg-[#030712]/[0.08] flex items-center justify-center text-[10px] font-semibold text-[#030712] silk-think-mark shrink-0 leading-none">
        ✳
      </div>
      <p key={label} className="silk-think-text text-[13px] font-normal leading-none">
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
  const scoreMark = leaf.score == null ? '—' : formatScore(leaf.score)
  const rubricBands = leaf.anchor?.bands || (leaf.rubric && 'labels' in leaf.rubric ? leaf.rubric.labels : null)

  return (
    <div className="px-0.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 font-heading text-[18px] font-normal leading-tight tracking-[-0.02em] text-popover-foreground">
          {printName(leaf)}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {leaf.band && BAND_COLORS[leaf.band] && (
            <span
              className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
              style={{
                backgroundColor: BAND_COLORS[leaf.band].bg,
                color: BAND_COLORS[leaf.band].text,
              }}
            >
              {leaf.band}
            </span>
          )}
          <span className="font-heading text-[18px] font-normal leading-none tracking-[-0.02em] text-popover-foreground tabular-nums">
            {scoreMark}
          </span>
        </div>
      </div>

      {(() => {
        const rubricTexts = rubricBands
          ? Object.values(rubricBands).map(t =>
            String(t).toLowerCase().replace(/[^a-z0-9]/g, '')
          )
          : []

        const paragraphBeats = Array.isArray(beats)
          ? beats
          : [beats?.why, beats?.wrong, beats?.raise]
            .filter((b): b is string => Boolean(b && typeof b === 'string' && b.trim()))
            .filter(b => !/lands unscored|not enough is in the profile|^\s*(months?|years?|days?|%)\.?\s*$/i.test(b))
            .filter((b, index, self) => self.indexOf(b) === index)
            .filter(b => {
              const normalized = b.toLowerCase().replace(/[^a-z0-9]/g, '')
              if (rubricTexts.some(r => r.length > 20 && (normalized.includes(r) || r.includes(normalized)))) {
                return false
              }
              return true
            })

        if (!paragraphBeats.length) return null

        return (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {paragraphBeats.map((beat, index) => (
              <p
                key={index}
                className="text-[12.5px] leading-relaxed text-popover-foreground"
              >
                {beat}
              </p>
            ))}
          </div>
        )
      })()}

      {leaf.diligenceAsk && (
        <div className="mt-2.5 rounded-lg bg-muted/60 p-2.5 text-[11.5px] text-muted-foreground">
          <p className="mb-0.5 font-semibold uppercase tracking-wide text-foreground">
            Diligence ask
          </p>
          <p className="leading-relaxed">{leaf.diligenceAsk}</p>
        </div>
      )}

      {rubricBands && Object.keys(rubricBands).length > 0 && (
        <div className="mt-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
              Scoring Criteria
            </p>
            {leaf.anchor?.scoring_basis && (
              <span className="text-[10.5px] font-medium text-muted-foreground">
                {leaf.anchor.scoring_basis}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-col gap-1.5 rounded-lg border border-border/40 bg-secondary/50 p-2 text-[11.5px]">
            {Object.entries(rubricBands).map(([bandKey, desc]) => {
              const isCurrent = leaf.band === bandKey || leaf.effectiveBand === bandKey
              const colorConfig = BAND_COLORS[bandKey]
              return (
                <div
                  key={bandKey}
                  className={cn(
                    'rounded-md p-2 transition-colors',
                    isCurrent
                      ? 'border border-primary/20 bg-primary/5 font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    {colorConfig ? (
                      <span
                        className="inline-flex min-w-[65px] items-center justify-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-wide"
                        style={{
                          backgroundColor: colorConfig.bg,
                          color: colorConfig.text,
                        }}
                      >
                        {bandKey}
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-semibold text-foreground/80">
                        {bandKey}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wider text-primary uppercase">
                        Current Band
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-foreground/80">{desc}</p>
                </div>
              )
            })}

            {leaf.anchor?.evidence_required && (
              <div className="mt-1 border-t border-border/40 pt-2 text-[11.5px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground/80">Evidence Required: </span>
                {leaf.anchor.evidence_required}
              </div>
            )}
          </div>
        </div>
      )}

      {(!rubricBands || Object.keys(rubricBands).length === 0) && leaf.anchor?.evidence_required && (
        <div className="mt-3.5 rounded-lg border border-border/40 bg-secondary/50 p-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/80">Evidence Required: </span>
          {leaf.anchor.evidence_required}
        </div>
      )}

      {leaf.rubric && 'stages' in leaf.rubric && leaf.rubric.stages && Object.keys(leaf.rubric.stages).length > 0 && (() => {
        const stages = (leaf.rubric as any).stages || {}
        const stageEntries = Object.entries(stages)
        const firstStageCuts = (stageEntries[0]?.[1] || {}) as any

        const isRangeRubric =
          leaf.rubric?.kind === 'range' ||
          (leaf as any)?.type === 'range' ||
          firstStageCuts?.ideal_min !== undefined ||
          firstStageCuts?.ideal_max !== undefined ||
          firstStageCuts?.min !== undefined ||
          firstStageCuts?.max !== undefined ||
          Array.isArray(firstStageCuts?.ideal)

        const formatCutNum = (num: any): string => {
          if (num == null) return '—'
          if (typeof num === 'string' && isNaN(Number(num))) return num
          const val = Number(num)
          if (isNaN(val)) return '—'
          if (val % 1 === 0) return String(val)
          const abs = Math.abs(val)
          if (abs >= 10) return val.toFixed(1).replace(/\.0$/, '')
          return val.toFixed(2).replace(/\.?0+$/, '')
        }

        const activeStage = leaf.trace?.stage || report.mandate?.stage || report.company?.stage || ''
        const isHigher = (leaf.rubric && 'direction' in leaf.rubric && leaf.rubric.direction === 'Lower') ? false : true
        const currentBand = (leaf.band || leaf.effectiveBand || '').toLowerCase()

        return (
          <div className="mt-3.5">
            <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
              Stage Thresholds
            </p>
            <div className="mt-1.5 text-[12.5px]">
              <p className="mb-1.5 text-[11.5px] text-muted-foreground">
                {isRangeRubric
                  ? `${leaf.rubric.direction ? `${leaf.rubric.direction} is better` : 'Target ideal range'}${leaf.rubric.unit ? `, in ${leaf.rubric.unit}` : ''}.`
                  : `${leaf.rubric.direction ? `${leaf.rubric.direction} is better` : 'Higher is better'}${leaf.rubric.unit ? `, in ${leaf.rubric.unit}` : ''}. Cut-points are inclusive.`}
              </p>

              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed border-separate border-spacing-y-0.5 text-left">
                  {isRangeRubric ? (
                    <>
                      <thead>
                        <tr className="text-[11.5px] font-bold text-foreground">
                          <th className="w-[40%] py-1 pl-1 text-left font-bold">Stage</th>
                          <th className="w-[30%] py-1 px-1 text-right font-bold">Ideal Min</th>
                          <th className="w-[30%] py-1 pr-1 text-right font-bold">Ideal Max</th>
                        </tr>
                      </thead>
                      <tbody className="text-[11.5px] tabular-nums">
                        {stageEntries.map(([stageName, cuts]) => {
                          const isCompanyStage = activeStage
                            ? activeStage.toLowerCase() === stageName.toLowerCase()
                            : stageName.toLowerCase() === 'series a'
                          const cutsAny = cuts as any
                          const idealMin = cutsAny?.ideal_min ?? (Array.isArray(cutsAny?.ideal) ? cutsAny.ideal[0] : cutsAny?.min)
                          const idealMax = cutsAny?.ideal_max ?? (Array.isArray(cutsAny?.ideal) ? cutsAny.ideal[1] : cutsAny?.max)

                          return (
                            <tr
                              key={stageName}
                              className={cn(
                                'transition-colors',
                                isCompanyStage ? 'bg-neutral-100/90 font-normal' : 'hover:bg-neutral-50/50',
                              )}
                            >
                              <td className={cn('py-1 pl-1 text-foreground', isCompanyStage && 'first:rounded-l-md')}>
                                {isCompanyStage ? (
                                  <span className="inline-flex items-center rounded-md bg-black px-2 py-0.5 text-[10.5px] font-medium text-white shadow-xs">
                                    {stageName}
                                  </span>
                                ) : (
                                  <span className="inline-block px-1 py-0.5 text-[11px] font-normal text-foreground">
                                    {stageName}
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-1 text-right text-foreground">
                                {formatCutNum(idealMin)}
                              </td>
                              <td className={cn('py-1 pr-1 text-right text-foreground', isCompanyStage && 'last:rounded-r-md')}>
                                {formatCutNum(idealMax)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead>
                        <tr className="text-[11.5px] font-bold text-foreground">
                          <th className="w-[28%] py-1 pl-1 text-left font-bold">Stage</th>
                          <th className="w-[18%] py-1 px-1 text-right font-bold">Excellent</th>
                          <th className="w-[18%] py-1 px-1 text-right font-bold">Good</th>
                          <th className="w-[16%] py-1 px-1 text-right font-bold">Fair</th>
                          <th className="w-[20%] py-1 pr-1 text-right font-bold">Poor</th>
                        </tr>
                      </thead>
                      <tbody className="text-[11.5px] tabular-nums">
                        {stageEntries.map(([stageName, cuts]) => {
                          const isCompanyStage = activeStage
                            ? activeStage.toLowerCase() === stageName.toLowerCase()
                            : stageName.toLowerCase() === 'series a'
                          const cutsAny = cuts as any
                          const excVal = cutsAny?.excellent != null ? formatCutNum(cutsAny.excellent) : '—'
                          const goodVal = cutsAny?.good != null ? formatCutNum(cutsAny.good) : '—'
                          const fairVal = cutsAny?.fair != null ? formatCutNum(cutsAny.fair) : '—'
                          const poorVal = cutsAny?.fair != null ? `${isHigher ? '<' : '>'} ${formatCutNum(cutsAny.fair)}` : '—'

                          return (
                            <tr
                              key={stageName}
                              className={cn(
                                'transition-colors',
                                isCompanyStage ? 'bg-neutral-100/90 font-normal' : 'hover:bg-neutral-50/50',
                              )}
                            >
                              <td className={cn('py-1 pl-1 text-foreground', isCompanyStage && 'first:rounded-l-md')}>
                                {isCompanyStage ? (
                                  <span className="inline-flex items-center rounded-md bg-black px-2 py-0.5 text-[10.5px] font-medium text-white shadow-xs">
                                    {stageName}
                                  </span>
                                ) : (
                                  <span className="inline-block px-1 py-0.5 text-[11px] font-normal text-foreground">
                                    {stageName}
                                  </span>
                                )}
                              </td>
                              <td
                                className={cn(
                                  'py-1 px-1 text-right',
                                  isCompanyStage && currentBand === 'excellent'
                                    ? 'bg-blue-50/90 font-medium text-blue-600'
                                    : 'text-foreground',
                                )}
                              >
                                {excVal}
                              </td>
                              <td
                                className={cn(
                                  'py-1 px-1 text-right',
                                  isCompanyStage && currentBand === 'good'
                                    ? 'bg-blue-50/90 font-medium text-blue-600'
                                    : 'text-foreground',
                                )}
                              >
                                {goodVal}
                              </td>
                              <td
                                className={cn(
                                  'py-1 px-1 text-right',
                                  isCompanyStage && currentBand === 'fair'
                                    ? 'bg-blue-50/90 font-medium text-blue-600'
                                    : 'text-foreground',
                                )}
                              >
                                {fairVal}
                              </td>
                              <td
                                className={cn(
                                  'py-1 pr-1 text-right',
                                  isCompanyStage && 'last:rounded-r-md',
                                  isCompanyStage && currentBand === 'poor'
                                    ? 'bg-blue-50/90 font-medium text-blue-600'
                                    : 'text-foreground',
                                )}
                              >
                                {poorVal}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
              {leaf.rubric.rationale && (
                <p className="mt-2 border-t border-border/40 pt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Rationale: </span>
                  {leaf.rubric.rationale}
                </p>
              )}
            </div>
          </div>
        )
      })()}

      {leaf.trace && leaf.trace.method !== 'excluded' && (leaf.trace.explanation || leaf.trace.thresholds || leaf.trace.rationale) && (
        <div className="mt-3.5">
          <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            Scoring Trace
          </p>
          <div className="mt-1.5 rounded-lg border border-border/40 bg-secondary/40 p-2.5 text-[11.5px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary capitalize">
                {leaf.trace.method}
              </span>
              {leaf.trace.stage && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {leaf.trace.stage}
                </span>
              )}
              {leaf.trace.direction && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {leaf.trace.direction === 'Higher' ? 'Higher is better' : leaf.trace.direction === 'Lower' ? 'Lower is better' : leaf.trace.direction}
                </span>
              )}
              {leaf.trace.unit && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Unit: {leaf.trace.unit}
                </span>
              )}
            </div>

            {leaf.trace.explanation && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-popover-foreground">
                {leaf.trace.explanation}
              </p>
            )}

            {leaf.trace.thresholds && typeof leaf.trace.thresholds === 'object' && Object.keys(leaf.trace.thresholds).length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {Object.entries(leaf.trace.thresholds).map(([bandKey, val]) => {
                  const formattedKey = bandKey.charAt(0).toUpperCase() + bandKey.slice(1)
                  const colorConfig = BAND_COLORS[formattedKey] || BAND_COLORS[bandKey]
                  const dirSymbol = leaf.trace?.direction === 'Lower' ? '≤' : (leaf.trace?.direction === 'Higher' ? '≥' : '')
                  const unit = leaf.trace?.unit ? ` ${leaf.trace.unit}` : ''
                  return (
                    <div
                      key={bandKey}
                      className="flex flex-col items-center rounded-md border border-border/40 bg-background/60 p-1.5 text-center"
                    >
                      <span
                        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9.5px] font-semibold tracking-wide"
                        style={{
                          backgroundColor: colorConfig?.bg ?? '#EDEBE8',
                          color: colorConfig?.text ?? '#787571',
                        }}
                      >
                        {formattedKey}
                      </span>
                      <span className="mt-0.5 font-mono text-[10.5px] font-medium text-foreground">
                        {dirSymbol} {val}{unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {leaf.trace.rationale && leaf.trace.rationale !== leaf.trace.explanation && (
              <p className="mt-2 border-t border-border/40 pt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground/80">Rationale: </span>
                {leaf.trace.rationale}
              </p>
            )}
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
    <div className="mt-3.5">
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
        {source.quote && (
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground italic">
            "{source.quote}"
          </p>
        )}
      </span>
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
      inner = window.requestAnimationFrame(() => {
        setEntered(true)
        if (scrollerRef.current) {
          scrollerRef.current.scrollTop = 0
        }
      })
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
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0
    }
  }, [leafId])

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
                      <FormattedMarkdown content={message.content} />
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
