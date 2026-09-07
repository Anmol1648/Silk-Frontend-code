'use client'

import { cn } from '@/lib/utils'
import {
  formatCrRange,
  type InvestorMatchReport,
} from '@/lib/deal-score'

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] text-foreground-subtle">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}

export function InvestorsInsightCard({
  report,
  onSelect,
  open = true,
  className,
}: {
  report: InvestorMatchReport
  onSelect: (id: string) => void
  open?: boolean
  className?: string
}) {
  return (
    <aside
      className={cn(
        'w-[292px] shrink-0',
        'transition-opacity duration-(--silk-aside-shift) ease-(--silk-aside-ease)',
        'motion-reduce:transition-none',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
        className,
      )}
      aria-hidden={!open}
    >
      <div className="rounded-xl bg-background p-6 ring-1 ring-foreground/6">
        <div className="flex items-center justify-start">
          <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--readiness-mark-soft)] px-2.5 py-0.5 text-[11px] font-medium text-popover-foreground">
            Lead
          </span>
        </div>
        <p className="mt-2 font-heading text-[28px] font-normal leading-none tracking-[-0.04em] text-foreground">
          {report.lead?.name ?? 'No lead'}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 border-t border-foreground/6 pt-5">
          <SnapshotRow
            label="Raise"
            value={formatCrRange(report.raise.low, report.raise.high)}
          />
          <SnapshotRow label="Stage" value={report.frame.stage} />
          <SnapshotRow label="Sector" value={report.frame.sector} />
        </div>

        {report.moves.length > 0 && (
          <div className="mt-6 flex flex-col border-t border-foreground/6 pt-5">
            <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
              Next
            </p>
            {report.moves.map((move, index) => (
              <button
                key={move.id}
                type="button"
                onClick={() => onSelect(move.pointerId)}
                className={cn(
                  'text-left transition-colors',
                  index === 0 ? 'mt-3' : 'mt-5 border-t border-foreground/4 pt-5',
                )}
              >
                <p className="text-[13px] font-medium text-popover-foreground">
                  {move.name}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">
                  {move.action}
                </p>
                <span className="mt-3 inline-flex h-7 items-center rounded-full bg-muted px-3 text-[12.5px] font-medium text-popover-foreground">
                  {move.step}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
