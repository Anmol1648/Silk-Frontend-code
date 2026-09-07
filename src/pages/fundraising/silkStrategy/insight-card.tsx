'use client'

import { useLayoutEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUp02Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import {
  ancestorsOf,
  formatMoveLift,
  formatScore,
  findRow,
  isBranch,
  printLook,
  printMoveAction,
  printMoveButton,
  printName,
  projectedCategoryLift,
  type DealMove,
  type DealReport,
} from '@/lib/deal-score'

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

const GAUGE = {
  size: 180,
  cx: 90,
  cy: 90,
  r: 78,
  tick: 8,
  ticks: 60,
}

const GAUGE_MARK = 'var(--readiness-mark)'
const GAUGE_TRACK = 'color-mix(in srgb, var(--foreground) 10%, transparent)'

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

function motionMs(name: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('s') && !raw.endsWith('ms') ? value * 1000 : value
}

function cubicBezierEase(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const xAt = (t: number) => ((ax * t + bx) * t + cx) * t
  const yAt = (t: number) => ((ay * t + by) * t + cy) * t
  const dxAt = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const delta = xAt(t) - x
      if (Math.abs(delta) < 1e-6) break
      const d = dxAt(t)
      if (Math.abs(d) < 1e-6) break
      t = Math.min(1, Math.max(0, t - delta / d))
    }
    return Math.min(1, Math.max(0, yAt(t)))
  }
}

/** Same curve as --silk-aside-ease: fast in, long settle. */
const sweepEase = cubicBezierEase(0.16, 1, 0.3, 1)

function useGaugeFill(target: number) {
  const [shown, setShown] = useState(0)

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target)
      return
    }

    setShown(0)
    const duration = motionMs('--silk-gauge-fill', 1400)
    const started = performance.now()
    let frame = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      setShown(t < 1 ? Math.max(0, target * sweepEase(t)) : target)
      if (t < 1) frame = window.requestAnimationFrame(step)
    }

    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [target])

  return shown
}

function ScoreGauge({ score }: { score: number }) {
  const shown = useGaugeFill(score)
  const pct = Math.max(0, Math.min(1, shown / 10))
  const look = printLook(score)
  return (
    <div aria-label={`${formatScore(score)} out of 10, ${look}`}>
      <div className="relative mx-auto w-[72%]">
        <svg
          viewBox={`0 0 ${GAUGE.size} ${GAUGE.size}`}
          className="block w-full"
          aria-hidden
        >
          {GAUGE_TICKS.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.t <= pct ? GAUGE_MARK : GAUGE_TRACK}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-heading text-[28px] font-normal leading-none tracking-[-0.05em] text-foreground tabular-nums">
            {formatScore(shown)}
          </p>
          <p className="mt-1 text-[11px] text-foreground-subtle">out of 10</p>
        </div>
      </div>
      <div className="mt-1 flex flex-col items-center">
        <span className="inline-flex items-center rounded-full bg-[var(--readiness-mark-soft)] px-2.5 py-0.5 text-[11px] font-medium text-popover-foreground">
          {look}
        </span>
      </div>
    </div>
  )
}

export function ScoreInsightCard({
  report,
  score,
  moves,
  onSelect,
  open = true,
  className,
}: {
  report: DealReport
  score: number
  moves: DealMove[]
  onSelect: (parameterId: string) => void
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
        <ScoreGauge score={score} />

        {moves.length > 0 ? (
          <div className="mt-6 flex flex-col">
            <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
              Next
            </p>
            {moves.map((move, index) => {
              const lift = move.lift != null && move.lift > 0 ? move.lift : projectedCategoryLift(report, move)
              const categoryId = ancestorsOf(report.tree, move.parameterId)[0]
              const category = categoryId ? findRow(report.tree, categoryId) : null
              return (
              <div
                key={move.parameterId}
                className={cn(index === 0 ? 'mt-3' : 'mt-5 border-t border-foreground/4 pt-5')}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 text-[13px] font-medium text-popover-foreground">
                    {printName({ id: move.parameterId, name: move.name })}
                  </p>
                  <mark
                    className="inline-flex shrink-0 items-center gap-0.5 rounded-[4px] px-1 py-px text-[12px] font-medium not-italic tabular-nums bg-[var(--status-up)] text-[var(--status-up-foreground)]"
                    aria-label={
                      category
                        ? `Raises ${printName(category)} by ${formatMoveLift(lift)}`
                        : `Raises score by ${formatMoveLift(lift)}`
                    }
                  >
                    {formatMoveLift(lift)}
                    <HugeiconsIcon icon={ArrowUp02Icon} size={12} strokeWidth={2} />
                  </mark>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-foreground/55">
                  {printMoveAction(move, report)}
                </p>
                <div className="mt-3">
                  <PillButton
                    label={printMoveButton(move, report)}
                    onClick={() => onSelect(move.parameterId)}
                  />
                </div>
              </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-6 text-[13px] leading-relaxed text-popover-foreground">
            Nothing sitting in Next. The holes are settled.
          </p>
        )}
      </div>
    </aside>
  )
}

export function QuietInsightCard({
  title,
  line,
  open = true,
  className,
}: {
  title: string
  line: string
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
      <div className="rounded-xl bg-background px-6 py-8 ring-1 ring-foreground/6">
        <p className="text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
          {title}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-popover-foreground">{line}</p>
      </div>
    </aside>
  )
}
