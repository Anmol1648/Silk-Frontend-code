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
  contradiction: 'bg-amber-50 text-amber-900',
  gap: 'bg-rose-50 text-rose-900',
  inferred: 'bg-[var(--status-ai)] text-[var(--status-ai-foreground)]',
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

function RowMark({ flagged }: { flagged: boolean }) {
  return (
    <span aria-hidden className="grid size-3.5 shrink-0 place-items-center">
      {flagged ? (
        <FlagMark />
      ) : (
        <span className="size-1.5 rounded-full bg-foreground/20" />
      )}
    </span>
  )
}

function FlagMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      className="text-amber-800"
      aria-hidden
    >
      <rect x="2.4" y="1.4" width="1.5" height="11.2" rx="0.35" fill="currentColor" />
      <path fill="currentColor" d="M3.9 1.8h8.2L9.6 5.1l2.5 3.3H3.9z" />
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
  flagged,
  advanced,
  onToggle,
  onOpenLeaf,
}: {
  row: ScoredRow
  depth: number
  expanded: Set<string>
  selectedId: string | null
  flagged: Set<string>
  advanced: boolean
  onToggle: (id: string) => void
  onOpenLeaf: (id: string) => void
  key?: Key
}) {
  const branch = isBranch(row)
  const isFlagged = flagged.has(row.id)
  const open = expanded.has(row.id)
  const selected = selectedId === row.id
  const namePad = depth <= 1 ? '' : depth === 2 ? 'pl-5' : 'pl-10'
  const innerRow =
    'flex w-full items-center justify-between gap-6 rounded-lg px-2.5 py-1.5 text-left transition-colors'

  if (branch) {
    const childList = open && row.children.length > 0 && (
      <div
        className={cn(
          'flex flex-col gap-0.5',
          depth === 0 ? 'mt-4 -mx-2.5' : 'mt-1 mb-2',
        )}
      >
        {row.children.map(child => (
          <TreeRow
            key={child.id}
            row={child}
            depth={depth + 1}
            expanded={expanded}
            selectedId={selectedId}
            flagged={flagged}
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
            className="flex w-full items-center justify-between gap-4 border-b border-foreground/4 bg-secondary px-5 py-3 text-left transition-colors hover:bg-muted"
          >
            <span className="min-w-0 text-[14px] font-medium text-foreground">
              {printName(row)}
            </span>
            <WeightMarks row={row} advanced={advanced} />
          </button>
          <div className="px-5 py-4">
            {line && (
              <p className="whitespace-nowrap text-[13px] leading-relaxed text-muted-foreground">
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
          <span className={cn('flex min-w-0 items-center gap-2', namePad)}>
            <RowMark flagged={isFlagged} />
            <span className="min-w-0 text-[14px] font-medium text-foreground">
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
          ? 'bg-surface-hover text-foreground'
          : 'text-secondary-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <span className={cn('flex min-w-0 items-center gap-2', namePad)}>
        <RowMark flagged={isFlagged} />
        <span className="min-w-0 text-[14px]">{printName(row)}</span>
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

  return (
    <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
      <div className="flex items-center justify-between gap-4 border-b border-foreground/4 bg-secondary px-5 py-3">
        <h2 className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
          <FlagMark size={15} />
          {flagHeading(total)}
        </h2>
        <ViewToggle advanced={advanced} onToggle={onToggleView} />
      </div>
      <div className="flex flex-col gap-1 px-3 py-3">
        {listed.map(flag => (
          <button
            key={flag.parameterId}
            type="button"
            onClick={() => onOpenFlag(flag.parameterId)}
            className="rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-surface-hover"
          >
            <p className="text-[14px] font-medium">
              <mark
                className={cn(
                  'rounded-[4px] px-1 py-px font-medium not-italic',
                  FLAG_TONE[flag.kind],
                )}
              >
                {printName({ id: flag.parameterId, name: flag.name })}
              </mark>
            </p>
            <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              {flag.summary}
            </p>
          </button>
        ))}
        {!open && rest > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-2.5 py-2 text-left text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus:outline-none focus-visible:outline-none"
          >
            and {rest} more
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
  const flagged = flaggedIds(report)
  const categories = report.tree.filter(row => row.score != null && !row.notEnoughInformation)

  return (
    <div className="flex flex-col gap-4">
      {advanced && (
        <div className="flex items-center justify-between gap-6 px-5">
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
          className="scroll-mt-16 overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6"
        >
          <TreeRow
            row={row}
            depth={0}
            expanded={expanded}
            selectedId={selectedId}
            flagged={flagged}
            advanced={advanced}
            onToggle={onToggle}
            onOpenLeaf={onOpenLeaf}
          />
        </section>
      ))}
    </div>
  )
}
