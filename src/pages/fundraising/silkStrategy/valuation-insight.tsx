'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import {
  formatCr,
  formatPct,
  preferenceAtRaise,
  type ValuationReport,
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

function RaisePreference({ report }: { report: ValuationReport }) {
  const sliderId = useId()
  const [raise, setRaise] = useState(report.raise.working)

  useEffect(() => {
    setRaise(report.raise.working)
  }, [report.raise.working])

  const preference = useMemo(
    () => preferenceAtRaise(report, raise),
    [report, raise],
  )

  const span = Math.max(report.raise.high - report.raise.low, 1)
  const pct = Math.min(
    1,
    Math.max(0, (raise - report.raise.low) / span),
  )
  const pill = report.provisional ? 'Provisional' : null

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
          Preferred raise
        </p>
        {pill && (
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#e2f3fc] px-2.5 py-0.5 text-[11px] font-medium text-[#2d566e]">
            {pill}
          </span>
        )}
      </div>
      <p className="mt-2 font-heading text-[28px] font-normal leading-none tracking-[-0.04em] text-foreground tabular-nums">
        {formatCr(preference.raiseCr)}
      </p>

      <div className="mt-5">
        <div className="relative h-5">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#eeeeee]">
            <div
              className="h-full rounded-full bg-[#52a3c7]"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <input
            id={sliderId}
            type="range"
            min={report.raise.low}
            max={report.raise.high}
            step={0.5}
            value={raise}
            onChange={e => setRaise(Number(e.target.value))}
            aria-label={`Preferred raise between ${formatCr(report.raise.low)} and ${formatCr(report.raise.high)}`}
            className="silk-raise-slider absolute inset-0 w-full cursor-pointer"
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-foreground-subtle">
          <span>{formatCr(report.raise.low)}</span>
          <span>{formatCr(report.raise.high)}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 border-t border-foreground/6 pt-4">
        <SnapshotRow label="Dilution" value={formatPct(preference.dilutionPct)} />
        <SnapshotRow label="Valuation" value={formatCr(preference.valuationCr)} />
      </div>
    </div>
  )
}

export function ValuationInsightCard({
  report,
  open = true,
  className,
}: {
  report: ValuationReport
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
        <RaisePreference report={report} />

        <div className="mt-6 flex flex-col gap-2.5 border-t border-foreground/6 pt-5">
          <SnapshotRow label="Stage" value={report.frame.stage} />
          <SnapshotRow label="Sector" value={report.frame.sector} />
          <SnapshotRow
            label="Clock"
            value={`${report.clock.monthsLow}–${report.clock.monthsHigh} mo`}
          />
        </div>

        <div className="mt-6 border-t border-foreground/6 pt-5">
          <button
            type="button"
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-[13.5px] font-medium text-secondary-foreground transition-colors hover:border-foreground/25 hover:bg-secondary"
          >
            Lock preferred raise
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              size={15}
              strokeWidth={2}
              className="text-muted-foreground"
            />
          </button>
        </div>
      </div>
    </aside>
  )
}
