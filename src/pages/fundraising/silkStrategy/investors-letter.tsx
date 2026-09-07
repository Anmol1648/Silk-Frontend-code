'use client'

import { cn } from '@/lib/utils'
import {
  formatCheck,
  formatCr,
  formatCrRange,
  formatRole,
  type InvestorFill,
  type InvestorMatchReport,
  type InvestorType,
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
      <p className="mt-1.5 text-[15px] font-medium tracking-[-0.02em] text-foreground">
        {value}
      </p>
    </button>
  )
}

function BookInsight({ report }: { report: InvestorMatchReport }) {
  return (
    <p className="w-full text-[13px] leading-relaxed text-muted-foreground">
      {report.argument}
    </p>
  )
}

function FillBar({
  fills,
  selectedId,
  onOpen,
}: {
  fills: InvestorFill[]
  selectedId: string | null
  onOpen: (id: string) => void
}) {
  const weights = fills.map(fill => Math.max((fill.low + fill.high) / 2, 1))
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1

  return (
    <div>
      <div className="flex items-stretch gap-1.5">
        {fills.map((fill, index) => {
          const id = `fill:${fill.typeId}`
          const selected = selectedId === id || selectedId === `type:${fill.typeId}`
          return (
            <button
              key={fill.typeId}
              type="button"
              onClick={() => onOpen(id)}
              style={{ flexGrow: weights[index] / total, flexBasis: 0 }}
              className="group min-w-0 text-left transition-colors"
            >
              <div
                className={cn(
                  'h-2 w-full rounded-full transition-colors',
                  selected
                    ? 'bg-[var(--readiness-mark)]'
                    : index === 0
                      ? 'bg-[var(--readiness-mark)]/70 group-hover:bg-[var(--readiness-mark)]'
                      : index === 1
                        ? 'bg-foreground/16 group-hover:bg-foreground/22'
                        : 'bg-foreground/10 group-hover:bg-foreground/16',
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
                {fill.label}
              </p>
              <p className="mt-0.5 text-[12px] tabular-nums text-foreground-subtle">
                {formatCrRange(fill.low, fill.high)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TypeTable({
  types,
  selectedId,
  onOpen,
  reasonLabel = 'Why this type',
}: {
  types: InvestorType[]
  selectedId: string | null
  onOpen: (id: string) => void
  reasonLabel?: string
}) {
  const labels = [
    { key: 'type', label: 'Type', width: 'w-[28%]' },
    { key: 'role', label: 'Role', width: 'w-[12%]' },
    { key: 'cheque', label: 'Typical cheque', width: 'w-[18%]' },
    { key: 'reason', label: reasonLabel, width: 'w-[42%]' },
  ] as const

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[560px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-foreground/6">
            {labels.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-[11px] font-medium tracking-[0.04em] text-foreground-subtle',
                  col.width,
                  col.key === 'type' && 'pl-5',
                  col.key === 'reason' && 'pr-5',
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map(type => {
            const id = `type:${type.id}`
            const selected = selectedId === id || selectedId === `fill:${type.id}`
            return (
              <tr
                key={type.id}
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
                  {type.name}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-secondary-foreground">
                  {formatRole(type.role)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-[13px] tabular-nums text-foreground">
                  {formatCheck(type.checkCr.low, type.checkCr.high)}
                </td>
                <td className="px-3 py-3.5 pr-5 text-[13px] leading-snug text-muted-foreground">
                  {type.sentence}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function InvestorsLetter({
  report,
  selectedId,
  onOpen,
}: {
  report: InvestorMatchReport
  selectedId: string | null
  onOpen: (id: string) => void
}) {
  const lead = report.types.find(type => type.role === 'lead') ?? null

  return (
    <div className="silk-enter flex flex-col gap-4">
      <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
        <CardHeader
          name="The book"
          value={formatCr(report.book.working)}
          selected={selectedId === 'book'}
          onOpen={() => onOpen('book')}
          emphasize
        />
        <div className="px-5 py-4">
          <BookInsight report={report} />
          <div className="mt-5 flex gap-1 border-t border-foreground/6 pt-4">
            <MetricTile
              name="Lead"
              value={lead?.name ?? 'None'}
              selected={Boolean(lead) && selectedId === `type:${lead?.id}`}
              onOpen={() => onOpen(lead ? `type:${lead.id}` : 'book')}
            />
            <MetricTile
              name="Lead cheque"
              value={
                lead
                  ? formatCheck(lead.checkCr.low, lead.checkCr.high)
                  : '—'
              }
              selected={Boolean(lead) && selectedId === `type:${lead?.id}`}
              onOpen={() => onOpen(lead ? `type:${lead.id}` : 'book')}
            />
            <MetricTile
              name="Skip"
              value={
                report.skips.length
                  ? `${report.skips.length} types`
                  : 'None'
              }
              selected={Boolean(
                selectedId &&
                  report.skips.some(type => selectedId === `type:${type.id}`),
              )}
              onOpen={() => {
                const first = report.skips[0]
                onOpen(first ? `type:${first.id}` : 'book')
              }}
            />
          </div>
        </div>
      </section>

      {report.fills.length > 0 && (
        <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
          <CardHeader
            name="How it fills"
            value={formatCrRange(report.raise.low, report.raise.high)}
            selected={
              selectedId === 'book' || Boolean(selectedId?.startsWith('fill:'))
            }
            onOpen={() => onOpen('book')}
            emphasize
          />
          <div className="px-5 py-5">
            <p className="mb-5 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              {report.book.sentence}
            </p>
            <FillBar
              fills={report.fills}
              selectedId={selectedId}
              onOpen={onOpen}
            />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
        <div className="flex items-center justify-between gap-4 border-b border-foreground/4 bg-secondary px-5 py-3">
          <span className="min-w-0 text-[14px] font-medium text-foreground">
            Who writes it
          </span>
          <span className="shrink-0 text-[13px] text-muted-foreground">
            {report.types.length} types
          </span>
        </div>
        <div className="px-5">
          <TypeTable
            types={report.types}
            selectedId={selectedId}
            onOpen={onOpen}
          />
        </div>
      </section>

      {report.skips.length > 0 && (
        <section className="overflow-hidden rounded-xl bg-background ring-1 ring-foreground/6">
          <div className="flex items-center justify-between gap-4 border-b border-foreground/4 bg-secondary px-5 py-3">
            <span className="min-w-0 text-[14px] font-medium text-foreground">
              Skip
            </span>
            <span className="shrink-0 text-[13px] text-muted-foreground">
              Wrong universe for this raise
            </span>
          </div>
          <div className="px-5">
            <TypeTable
              types={report.skips}
              selectedId={selectedId}
              onOpen={onOpen}
              reasonLabel="Why skip"
            />
          </div>
        </section>
      )}
    </div>
  )
}
