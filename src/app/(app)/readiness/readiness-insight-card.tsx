'use client'

import { cn } from '@/lib/utils'
import type { NextActionKind, NextReadinessAction } from './readiness-data'

function PillButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-7 max-w-full items-center truncate rounded-full',
        'bg-muted px-3 text-[12.5px] font-medium text-popover-foreground',
        'transition-colors hover:bg-surface-focus hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

const NAME_TONE: Record<NextActionKind, string> = {
  confirm: 'bg-[var(--status-ai)] text-[var(--status-ai-foreground)]',
  resolve: 'bg-amber-50 text-amber-900',
  fill: 'bg-[var(--readiness-mark-soft)] text-foreground',
  upload: 'bg-[var(--readiness-mark-soft)] text-foreground',
}

const GAUGE = {
  size: 180,
  cx: 90,
  cy: 90,
  r: 78,
  tick: 8,
  ticks: 60,
}

/** Stable SVG coords — Node vs browser trig can disagree past ~12 decimals. */
function gaugeCoord(n: number) {
  return n.toFixed(3)
}

const GAUGE_TICKS = Array.from({ length: GAUGE.ticks }, (_, i) => {
  const t = i / GAUGE.ticks
  const angle = Math.PI / 2 - Math.PI * 2 * t
  const inner = GAUGE.r - GAUGE.tick
  return {
    t,
    x1: gaugeCoord(GAUGE.cx + inner * Math.cos(angle)),
    y1: gaugeCoord(GAUGE.cy - inner * Math.sin(angle)),
    x2: gaugeCoord(GAUGE.cx + GAUGE.r * Math.cos(angle)),
    y2: gaugeCoord(GAUGE.cy - GAUGE.r * Math.sin(angle)),
  }
})

function ScoreGauge({
  score,
  done,
  total,
  ladder,
}: {
  score: number
  done: number
  total: number
  ladder: string
}) {
  const shown = Math.max(12, Math.min(100, score))
  const pct = shown / 100
  return (
    <div aria-label={`Readiness ${shown} of 100, ${ladder}`}>
      <div className="relative mx-auto w-[72%]">
        <svg
          viewBox={`0 0 ${GAUGE.size} ${GAUGE.size}`}
          className="block w-full"
          aria-hidden
        >
          {GAUGE_TICKS.map((tick, i) => {
            const reached = tick.t <= pct
            return (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={reached ? 'var(--readiness-mark)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)'}
                strokeWidth={2}
                strokeLinecap="round"
              />
            )
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-[28px] font-normal leading-none tracking-[-0.05em] text-foreground tabular-nums">
            {shown}
          </p>
          <p className="mt-1 text-[11px] text-foreground-subtle">out of 100</p>
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center">
        <span className="inline-flex items-center rounded-full bg-[var(--readiness-mark-soft)] px-2.5 py-0.5 text-[11px] font-medium text-popover-foreground">
          {ladder}
        </span>
        <p className="mt-1.5 text-[11px] tabular-nums text-foreground-subtle">
          {done}/{total} verified
        </p>
      </div>
    </div>
  )
}

export function ReadinessInsightCard({
  score,
  done,
  total,
  ladder,
  actions,
  onPrimary,
  open = true,
  className,
}: {
  score: number
  done: number
  total: number
  ladder: string
  actions: NextReadinessAction[]
  onPrimary: (action: NextReadinessAction) => void
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
        <ScoreGauge score={score} done={done} total={total} ladder={ladder} />

        {actions.length > 0 ? (
          <div className="mt-6 flex flex-col">
            <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
              Next
            </p>
            {actions.map((action, index) => (
              <div
                key={action.id}
                className={cn(index === 0 ? 'mt-3' : 'mt-5 border-t border-foreground/4 pt-5')}
              >
                <p className="text-[13px] leading-relaxed text-foreground/55">
                  <mark
                    className={cn(
                      'mr-1 rounded-[4px] px-1 py-px font-medium not-italic',
                      NAME_TONE[action.kind],
                    )}
                  >
                    {action.name}
                  </mark>
                  {action.reason}
                </p>
                <div className="mt-3">
                  <PillButton
                    label={action.primaryLabel}
                    onClick={() => onPrimary(action)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-[13px] leading-relaxed text-popover-foreground">
            The knowledge base is complete. Submit when you want it in front of
            investors.
          </p>
        )}
      </div>
    </aside>
  )
}
