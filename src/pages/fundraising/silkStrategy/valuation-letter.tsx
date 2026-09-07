'use client'

import { cn } from '@/lib/utils'
import {
  formatCr,
  formatCrRange,
  formatMonthRange,
  formatMultiple,
  formatPctRange,
  type ValuationPeer,
  type ValuationPhase,
  type ValuationReport,
} from '@/lib/deal-score'

function CardHeader({
  name,
  value,
  selected,
  onOpen,
  emphasize,
}: {
  name: string
  value: string
  selected: boolean
  onOpen: () => void
  emphasize?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center justify-between gap-4 border-b border-foreground/4 bg-secondary px-5 py-3 text-left transition-colors',
        selected ? 'bg-muted' : 'hover:bg-muted',
      )}
    >
      <span className="min-w-0 text-[14px] font-medium text-foreground">{name}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums text-foreground',
          emphasize
            ? 'text-[15px] font-medium tracking-[-0.02em]'
            : 'text-[14px]',
        )}
      >
        {value}
      </span>
    </button>
  )
}

function MetricTile({
  name,
  value,
  selected,
  onOpen,
}: {
  name: string
  value: string
  selected: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-muted' : 'bg-secondary hover:bg-muted',
      )}
    >
      <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
        {name}
      </p>
      <p className="mt-1.5 text-[15px] font-medium tabular-nums tracking-[-0.02em] text-foreground">
        {value}
      </p>
    </button>
  )
}

function cellOrDash(value: string | null) {
  return value ?? '—'
}

function PeerTable({
  peers,
  selectedId,
  onOpen,
}: {
  peers: ValuationPeer[]
  selectedId: string | null
  onOpen: (id: string) => void
}) {
  const columns = [
    { key: 'company', label: 'Company', width: 'w-[18%]', align: 'left' },
    { key: 'year', label: 'Year', width: 'w-[10%]', align: 'right' },
    { key: 'revenue', label: 'Revenue', width: 'w-[12%]', align: 'right' },
    { key: 'multiple', label: 'EV/Rev', width: 'w-[10%]', align: 'right' },
    { key: 'source', label: 'Source', width: 'w-[14%]', align: 'left' },
    { key: 'why', label: 'Why comparable', width: 'w-[36%]', align: 'left' },
  ] as const

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-foreground/6">
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-[11px] font-medium tracking-[0.04em] text-foreground-subtle',
                  col.width,
                  col.key === 'company' && 'pl-5',
                  col.key === 'why' && 'pr-5',
                  col.align === 'right' && 'text-right',
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {peers.map(peer => {
            const id = `peer:${peer.id}`
            const selected = selectedId === id
            return (
              <tr
                key={peer.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'cursor-pointer border-b border-foreground/4 last:border-b-0 transition-colors',
                  selected ? 'bg-surface-hover' : 'hover:bg-surface-hover',
                )}
                onClick={() => onOpen(id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen(id)
                  }
                }}
              >
                <td className="truncate px-3 py-3.5 pl-5 text-[14px] font-medium text-foreground">
                  {peer.name}
                </td>
                <td className="px-3 py-3.5 text-right text-[13px] tabular-nums text-secondary-foreground">
                  {peer.year}
                </td>
                <td className="px-3 py-3.5 text-right text-[13px] tabular-nums text-secondary-foreground">
                  {cellOrDash(peer.revenueCr != null ? formatCr(peer.revenueCr) : null)}
                </td>
                <td className="px-3 py-3.5 text-right text-[13px] tabular-nums text-foreground">
                  {cellOrDash(peer.multiple != null ? formatMultiple(peer.multiple) : null)}
                </td>
                <td className="truncate px-3 py-3.5 text-[13px] text-secondary-foreground">
                  {cellOrDash(peer.source)}
                </td>
                <td className="px-3 py-3.5 pr-5 text-[13px] leading-snug text-muted-foreground">
                  {peer.why}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ClockTimeline({
  phases,
  monthsLow,
  monthsHigh,
  selectedId,
  onOpen,
}: {
  phases: ValuationPhase[]
  monthsLow: number
  monthsHigh: number
  selectedId: string | null
  onOpen: (id: string) => void
}) {
  const totalWeeks = phases.reduce((sum, phase) => sum + phase.weeks, 0) || 1
  const clockOpen = selectedId === 'clock'

  return (
    <div>
      <p className="mb-5 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
        {monthsLow}–{monthsHigh} months end to end, including slack between phases.
      </p>

      <div className="flex items-stretch gap-1.5">
        {phases.map((phase, index) => {
          const id = `phase:${phase.id}`
          const selected = selectedId === id || clockOpen
          const weight = phase.weeks / totalWeeks

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => onOpen(id)}
              style={{ flexGrow: weight, flexBasis: 0 }}
              className="group min-w-0 text-left transition-colors"
            >
              <div
                className={cn(
                  'h-2 w-full rounded-full transition-colors',
                  selected
                    ? 'bg-[var(--readiness-mark)]'
                    : 'bg-foreground/10 group-hover:bg-foreground/16',
                  index === 0 && 'rounded-l-full',
                  index === phases.length - 1 && 'rounded-r-full',
                )}
              />
              <p
                className={cn(
                  'mt-3 text-[13px] font-medium',
                  selected
                    ? 'text-foreground'
                    : 'text-secondary-foreground group-hover:text-foreground',
                )}
              >
                {phase.name}
              </p>
              <p className="mt-0.5 text-[12px] tabular-nums text-foreground-subtle">
                {phase.weeks} weeks
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RaiseInsight({ report }: { report: ValuationReport }) {
  const runwayMonths = `${report.runwayAfter.low}–${report.runwayAfter.high} months`
  const marks = ['Cash is nil', runwayMonths, 'dilution'] as const
  const parts: Array<{ text: string; marked: boolean }> = []
  let rest = report.raise.sentence

  while (rest.length) {
    let nextIndex = -1
    let nextMark: string | null = null
    for (const mark of marks) {
      const at = rest.indexOf(mark)
      if (at === -1) continue
      if (nextIndex === -1 || at < nextIndex) {
        nextIndex = at
        nextMark = mark
      }
    }
    if (nextIndex === -1 || !nextMark) {
      parts.push({ text: rest, marked: false })
      break
    }
    if (nextIndex > 0) {
      parts.push({ text: rest.slice(0, nextIndex), marked: false })
    }
    parts.push({ text: nextMark, marked: true })
    rest = rest.slice(nextIndex + nextMark.length)
  }

  return (
    <p className="w-full text-[13px] leading-relaxed text-muted-foreground">
      {parts.map((part, index) =>
        part.marked ? (
          <mark
            key={`${part.text}-${index}`}
            className="rounded-[4px] bg-[var(--readiness-mark-soft)] px-1 py-px font-medium not-italic text-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </p>
  )
}

export function ValuationLetter({
  report,
  selectedId,
  onOpen,
}: {
  report: ValuationReport
  selectedId: string | null
  onOpen: (id: string) => void
}) {
  const multipleKind =
    report.multipleKind === 'EV/Revenue' ? 'EV/Rev' : report.multipleKind

  return (
    <div className="silk-enter flex flex-col gap-4">
      <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
        <CardHeader
          name="Raise recommendation"
          value={formatCrRange(report.raise.low, report.raise.high)}
          selected={selectedId === 'raise'}
          onOpen={() => onOpen('raise')}
          emphasize
        />
        <div className="px-5 py-4">
          <RaiseInsight report={report} />
          <div className="mt-5 flex gap-1 border-t border-foreground/6 pt-4">
            <MetricTile
              name="Ideal valuation"
              value={formatCrRange(report.range.low, report.range.high)}
              selected={selectedId === 'range'}
              onOpen={() => onOpen('range')}
            />
            <MetricTile
              name="Dilution"
              value={formatPctRange(report.dilution.low, report.dilution.high)}
              selected={selectedId === 'dilution'}
              onOpen={() => onOpen('dilution')}
            />
            <MetricTile
              name="Runway after"
              value={formatMonthRange(report.runwayAfter.low, report.runwayAfter.high)}
              selected={selectedId === 'runway'}
              onOpen={() => onOpen('runway')}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
        <div className="flex items-center justify-between gap-4 border-b border-foreground/4 bg-secondary px-5 py-3">
          <span className="min-w-0 text-[14px] font-medium text-foreground">
            Comparable peers
          </span>
          <span className="flex shrink-0 items-baseline gap-2">
            <span className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
              Median {multipleKind}
            </span>
            <span className="text-[15px] font-medium tabular-nums tracking-[-0.02em] text-foreground">
              {formatMultiple(report.medianMultiple)}
            </span>
          </span>
        </div>
        <div className="px-5">
          <PeerTable
            peers={report.peers}
            selectedId={selectedId}
            onOpen={onOpen}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
        <CardHeader
          name="Fundraising clock"
          value={`${report.clock.monthsLow}–${report.clock.monthsHigh} months`}
          selected={selectedId === 'clock' || Boolean(selectedId?.startsWith('phase:'))}
          onOpen={() => onOpen('clock')}
        />
        <div className="px-5 py-5">
          <ClockTimeline
            phases={report.clock.phases}
            monthsLow={report.clock.monthsLow}
            monthsHigh={report.clock.monthsHigh}
            selectedId={selectedId}
            onOpen={onOpen}
          />
        </div>
      </section>
    </div>
  )
}
