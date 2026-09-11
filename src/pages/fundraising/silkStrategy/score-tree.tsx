'use client'

import { useState, type Key } from 'react'
import { cn } from '@/lib/utils'
import {
  categoryLine,
  flagHeading,
  flaggedIds,
  formatScore,
  formatWeight,
  isBranch,
  printName,
  shownFlags,
  type DealReport,
  type FlagKind,
  type ScoredRow,
} from '@/lib/deal-score'

const FLAG_TONE: Record<FlagKind, string> = {
  contradiction: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  gap: 'bg-[#DDE5F7] text-[#1E3A8A] dark:bg-[#1E293B] dark:text-[#93C5FD]',
  inferred: 'bg-[var(--status-ai)] text-[var(--status-ai-foreground)]',
}

export const BAND_COLORS: Record<string, { bg: string; text: string }> = {
  Excellent: { bg: '#568A3C', text: '#FFFFFF' },
  excellent: { bg: '#568A3C', text: '#FFFFFF' },
  Good: { bg: '#A6D96A', text: '#1F3A08' },
  good: { bg: '#A6D96A', text: '#1F3A08' },
  Fair: { bg: '#FEE08B', text: '#5C4300' },
  fair: { bg: '#FEE08B', text: '#5C4300' },
  Poor: { bg: '#F46D43', text: '#FFFFFF' },
  poor: { bg: '#F46D43', text: '#FFFFFF' },
  'Not Evidenced': { bg: '#EDEBE8', text: '#787571' },
}

const WEIGHT_COL = 'w-14'
const APPLIED_COL = 'w-14'
const SCORE_COL = 'w-8'

function ScoreMark({ score }: { score: number | null }) {
  return (
    <span className={cn(SCORE_COL, 'shrink-0 text-right text-[14px] tabular-nums text-foreground')}>
      {score == null ? '—' : formatScore(score)}
    </span>
  )
}

function WeightMarks({ row, advanced }: { row: ScoredRow; advanced: boolean }) {
  if (!advanced) return <ScoreMark score={row.score} />
  return (
    <span className="flex shrink-0 items-center gap-6">
      <span className={cn(WEIGHT_COL, 'text-right text-[13px] tabular-nums text-muted-foreground')}>
        {formatWeight(row.weight)}
      </span>
      <span className={cn(APPLIED_COL, 'text-right text-[13px] tabular-nums text-muted-foreground')}>
        {formatWeight(row.appliedWeight)}
      </span>
      <ScoreMark score={row.score} />
    </span>
  )
}

function RowMark({ flagged, kind }: { flagged: boolean; kind?: FlagKind | null }) {
  return (
    <span aria-hidden className="grid size-3.5 shrink-0 place-items-center">
      {flagged ? (
        kind === 'gap' ? <DataGapMark size={13} /> : <FlagMark size={14} />
      ) : (
        <span className="size-1.5 rounded-full bg-foreground/20" />
      )}
    </span>
  )
}

export function FlagMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      className="shrink-0 text-amber-800 dark:text-amber-500"
      aria-hidden
    >
      <rect x="2.4" y="1.4" width="1.5" height="11.2" rx="0.35" fill="currentColor" />
      <path fill="currentColor" d="M3.9 1.8h8.2L9.6 5.1l2.5 3.3H3.9z" />
    </svg>
  )
}

export function DataGapMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      className="shrink-0 text-[#2563EB]"
      fill="none"
      aria-hidden
    >
      <circle cx="7" cy="7" r="5.25" fill="#DDE5F7" stroke="#3B82F6" strokeWidth="1.2" />
      <path d="M7 4.5v3M7 9.5h.01" stroke="#1D4ED8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function ViewToggle({
  advanced,
  onToggle,
}: {
  advanced: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={e => {
        onToggle()
        e.currentTarget.blur()
      }}
      className={cn(
        'text-[13px] outline-none transition-colors hover:text-foreground',
        'focus:outline-none focus-visible:outline-none',
        advanced ? 'font-medium text-foreground' : 'text-muted-foreground',
      )}
    >
      {advanced ? 'Show simple view' : 'Show advanced view'}
    </button>
  )
}

function TreeRow({
  row,
  depth,
  expanded,
  selectedId,
  flagMap,
  advanced,
  onToggle,
  onOpenLeaf,
}: {
  row: ScoredRow
  depth: number
  expanded: Set<string>
  selectedId: string | null
  flagMap: Map<string, FlagKind>
  advanced: boolean
  onToggle: (id: string) => void
  onOpenLeaf: (id: string) => void
  key?: Key
}) {
  const branch = isBranch(row)
  const rowKind: FlagKind | null =
    flagMap.get(row.id) ||
    ((row as any).ref ? flagMap.get((row as any).ref) : null) ||
    ((row as any).key ? flagMap.get((row as any).key) : null) ||
    ((row as any).inputKey ? flagMap.get((row as any).inputKey) : null) ||
    (row.name ? flagMap.get(row.name.toLowerCase()) : null) ||
    (!branch ? (row as ScoredLeaf).flag?.kind || null : null) ||
    null

  const isFlagged = Boolean(rowKind)
  const open = expanded.has(row.id)
  const selected = selectedId === row.id
  const namePad = depth <= 1 ? '' : depth === 2 ? 'pl-4' : 'pl-8'
  const innerRow =
    'flex w-full items-center justify-between gap-4 rounded-md px-2 py-1 text-left transition-colors'

  if (branch) {
    const childList = open && row.children.length > 0 && (
      <div
        className={cn(
          'flex flex-col gap-0.5',
          depth === 0 ? 'mt-2 -mx-2' : 'mt-0.5 mb-1',
        )}
      >
        {row.children.map((child, idx) => (
          <TreeRow
            key={`${child.id || child.name || idx}-${idx}`}
            row={child}
            depth={depth + 1}
            expanded={expanded}
            selectedId={selectedId}
            flagMap={flagMap}
            advanced={advanced}
            onToggle={onToggle}
            onOpenLeaf={onOpenLeaf}
          />
        ))}
      </div>
    )

    if (depth === 0) {
      const line = categoryLine(row)
      return (
        <>
          <button
            type="button"
            onClick={() => onToggle(row.id)}
            className="flex w-full items-center justify-between gap-4 border-b border-foreground/4 bg-secondary/80 px-4 py-2 text-left transition-colors hover:bg-muted"
          >
            <span className="min-w-0 text-[13.5px] font-semibold text-foreground">
              {printName(row)}
            </span>
            <WeightMarks row={row} advanced={advanced} />
          </button>
          <div className="px-4 py-2.5">
            {line && (
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                {line}
              </p>
            )}
            {childList}
          </div>
        </>
      )
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => {
            onToggle(row.id)
            if (!open) {
              onOpenLeaf(row.id)
            }
          }}
          className={cn(innerRow, 'hover:bg-surface-hover')}
        >
          <span className={cn('flex min-w-0 items-center gap-1.5', namePad)}>
            <RowMark flagged={isFlagged} kind={rowKind} />
            <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
              {printName(row)}
            </span>
          </span>
          <WeightMarks row={row} advanced={advanced} />
        </button>
        {childList}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpenLeaf(row.id)}
      className={cn(
        innerRow,
        selected
          ? 'bg-surface-hover text-foreground font-medium'
          : 'text-secondary-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <span className={cn('flex min-w-0 items-center gap-1.5', namePad)}>
        <RowMark flagged={isFlagged} kind={rowKind} />
        <span className="min-w-0 truncate text-[13px]">{printName(row)}</span>
      </span>
      <WeightMarks row={row} advanced={advanced} />
    </button>
  )
}

export function FlagsBlock({
  report,
  advanced,
  onToggleView,
  onOpenFlag,
}: {
  report: DealReport
  advanced: boolean
  onToggleView: () => void
  onOpenFlag: (parameterId: string) => void
  key?: Key
}) {
  const { flags, preview, total, rest } = shownFlags(report)
  const [open, setOpen] = useState(false)
  if (!total) return null
  const listed = open ? flags : preview

  const redFlagsCount = report.flags.filter(f => f.kind === 'contradiction').length
  const dataGapsCount = report.flags.filter(f => f.kind === 'gap').length

  return (
    <section className="overflow-hidden rounded-lg bg-background ring-1 ring-foreground/6">
      <div className="flex items-center justify-between gap-4 border-b border-foreground/4 bg-secondary/80 px-4 py-2">
        <div className="flex items-center gap-3 text-[13px] font-medium text-muted-foreground">
          {redFlagsCount > 0 && (
            <span className="flex items-center gap-1.5 text-foreground">
              <FlagMark size={14} />
              <span>{redFlagsCount} {redFlagsCount === 1 ? 'flag' : 'flags'}</span>
            </span>
          )}
          {redFlagsCount > 0 && dataGapsCount > 0 && (
            <span className="text-foreground/30">·</span>
          )}
          {dataGapsCount > 0 && (
            <span className="flex items-center gap-1.5 text-foreground">
              <DataGapMark size={14} />
              <span>{dataGapsCount} data {dataGapsCount === 1 ? 'gap' : 'gaps'}</span>
            </span>
          )}
          {redFlagsCount === 0 && dataGapsCount === 0 && (
            <span className="flex items-center gap-1.5 text-foreground">
              <FlagMark size={14} />
              <span>{flagHeading(total)}</span>
            </span>
          )}
        </div>
        <ViewToggle advanced={advanced} onToggle={onToggleView} />
      </div>
      <div className="flex flex-col gap-1.5 p-2.5">
        {listed.map((flag, idx) => (
          <button
            key={`${flag.parameterId || flag.name}-${idx}`}
            type="button"
            onClick={() => onOpenFlag(flag.parameterId)}
            className="rounded-md border border-border/30 bg-secondary/20 p-2.5 text-left transition-colors hover:bg-surface-hover hover:border-border/60"
          >
            <div className="flex flex-wrap items-center gap-2">
              <mark
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[12.5px] font-medium not-italic',
                  FLAG_TONE[flag.kind],
                )}
              >
                {flag.kind === 'gap' ? (
                  <DataGapMark size={13} />
                ) : (
                  <FlagMark size={13} />
                )}
                <span>{printName({ id: flag.parameterId, name: flag.name })}</span>
              </mark>
              {flag.severity && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {flag.severity} severity
                </span>
              )}
              {flag.materialityPct != null && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {flag.materialityPct}% weight
                </span>
              )}
            </div>

            {(flag.headline || flag.finding || flag.summary) && (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">
                {flag.headline || flag.finding || flag.summary}
              </p>
            )}

            {(flag.ask || flag.action) && (flag.ask || flag.action) !== (flag.headline || flag.finding || flag.summary) && (
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {flag.ask || flag.action}
              </p>
            )}

            {flag.whyItMatters && (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/80">Impact: </span>
                {flag.whyItMatters}
              </p>
            )}
          </button>
        ))}
        {!open && rest > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-0.5 px-2 py-1 text-left text-[12px] font-medium text-primary hover:underline focus:outline-none"
          >
            and {rest} more item{rest > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </section>
  )
}

export function NarrativeBlock({ memo }: { memo?: string[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!memo || !memo.length) return null

  const paragraphs = memo
    .flatMap(m => (typeof m === 'string' ? m.split(/\n\s*\n/) : []))
    .map(p => p.trim())
    .filter(Boolean)

  if (!paragraphs.length) return null

  const preview = paragraphs.slice(0, 1)
  const rest = paragraphs.slice(1)

  return (
    <section className="overflow-hidden rounded-lg bg-background ring-1 ring-foreground/6">
      <div className="flex items-center justify-between border-b border-foreground/4 bg-secondary/80 px-4 py-2">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          Executive Summary
        </h2>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-3 text-[13px] leading-relaxed text-foreground/85">
        {(expanded ? paragraphs : preview).map((para, idx) => (
          <p key={idx} className="leading-relaxed">
            {para}
          </p>
        ))}
        {!expanded && rest.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="self-start text-[12px] font-medium text-primary hover:underline focus:outline-none"
          >
            Read more
          </button>
        )}
      </div>
    </section>
  )
}

export function ScoreTree({
  report,
  expanded,
  selectedId,
  advanced,
  onToggle,
  onOpenLeaf,
}: {
  report: DealReport
  expanded: Set<string>
  selectedId: string | null
  advanced: boolean
  onToggle: (id: string) => void
  onOpenLeaf: (id: string) => void
  key?: Key
}) {
  const flagMap = new Map<string, FlagKind>()
  for (const flag of report.flags) {
    if (flag.parameterId) flagMap.set(flag.parameterId, flag.kind)
    if (flag.ref) flagMap.set(flag.ref, flag.kind)
    if (flag.inputKey) flagMap.set(flag.inputKey, flag.kind)
    if (flag.name) flagMap.set(flag.name.toLowerCase(), flag.kind)
  }
  const categories = report.tree.filter(row => row.score != null && !row.notEnoughInformation)

  return (
    <div className="flex flex-col gap-2.5">
      {advanced && (
        <div className="flex items-center justify-between gap-4 px-4 py-0.5">
          <span className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
            Parameter
          </span>
          <span className="flex shrink-0 items-center gap-6">
            <span className={cn(WEIGHT_COL, 'text-right text-[11px] font-medium tracking-[0.04em] text-foreground-subtle')}>
              Weight
            </span>
            <span className={cn(APPLIED_COL, 'text-right text-[11px] font-medium tracking-[0.04em] text-foreground-subtle')}>
              Applied
            </span>
            <span className={cn(SCORE_COL, 'text-right text-[11px] font-medium tracking-[0.04em] text-foreground-subtle')}>
              Score
            </span>
          </span>
        </div>
      )}
      {categories.map(row => (
        <section
          key={row.id}
          id={`score-${row.id}`}
          className="scroll-mt-16 overflow-hidden rounded-lg bg-background ring-1 ring-foreground/6"
        >
          <TreeRow
            row={row}
            depth={0}
            expanded={expanded}
            selectedId={selectedId}
            flagMap={flagMap}
            advanced={advanced}
            onToggle={onToggle}
            onOpenLeaf={onOpenLeaf}
          />
        </section>
      ))}
    </div>
  )
}
