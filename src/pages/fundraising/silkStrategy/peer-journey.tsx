'use client'

import { curveMonotoneX } from 'd3-shape'
import { Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import {
  formatCr,
  formatMultiple,
  peerJourneyPoints,
  type ValuationPeer,
} from '@/lib/deal-score'

/** Smooth curve that always rises with revenue. Never dips between rounds. */
const smoothCurve = curveMonotoneX

type JourneyPoint = ReturnType<typeof peerJourneyPoints>[number] & { i: number }

function RoundTick({
  x,
  y,
  payload,
  points,
}: {
  x?: string | number
  y?: string | number
  payload?: { value: number }
  points: JourneyPoint[]
}) {
  if (x == null || y == null || payload == null) return null
  const point = points[payload.value]
  if (!point) return null
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={14}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={10}
      >
        {point.year}
      </text>
      <text
        dy={27}
        textAnchor="middle"
        className="fill-foreground-subtle"
        fontSize={10}
      >
        {point.stage}
      </text>
    </g>
  )
}

function JourneyDot({
  cx,
  cy,
}: {
  cx?: number
  cy?: number
  payload?: JourneyPoint
}) {
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="var(--readiness-mark)" fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={4.25} fill="var(--readiness-mark)" />
    </g>
  )
}

function JourneyTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: JourneyPoint }>
}) {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-border/70 bg-background/95 px-2.5 py-2 shadow-md backdrop-blur-sm">
      <p className="text-[12px] font-medium text-foreground">
        {point.stage}
        {'  ·  '}
        {point.year}
      </p>
      <dl className="mt-1.5 grid gap-1 text-[12px] tabular-nums">
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Revenue</dt>
          <dd className="text-foreground">{formatCr(point.revenueCr)}</dd>
        </div>
        {point.multiple != null && (
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground">EV/Rev</dt>
            <dd className="text-foreground">{formatMultiple(point.multiple)}</dd>
          </div>
        )}
        {point.raiseCr != null && (
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground">Raised</dt>
            <dd className="text-foreground">{formatCr(point.raiseCr)}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function PeerJourney({ peer }: { peer: ValuationPeer }) {
  const points: JourneyPoint[] = peerJourneyPoints(peer).map((point, i) => ({
    ...point,
    i,
  }))
  if (!points.length) return null

  const last = points.length - 1
  const pad = points.length < 2 ? 0.55 : 0.2

  return (
    <div className="mt-5 overflow-hidden rounded-xl bg-secondary px-3 pb-2 pt-3">
      <p className="px-1 text-[11px] font-medium tracking-[0.04em] text-foreground-subtle">
        Revenue at each raise
      </p>
      <ChartContainer
        config={{
          revenue: { label: 'Revenue', color: 'var(--readiness-mark)' },
        }}
        className="mt-1 aspect-auto h-[176px] w-full"
        initialDimension={{ width: 280, height: 176 }}
      >
        <LineChart
          data={points}
          margin={{ top: 12, right: 14, left: 0, bottom: 10 }}
        >
          <XAxis
            dataKey="i"
            type="number"
            domain={[-pad, last + pad]}
            ticks={points.map(point => point.i)}
            tickLine={false}
            axisLine={false}
            interval={0}
            height={34}
            tick={props => <RoundTick {...props} points={points} />}
          />
          <YAxis
            dataKey="revenueCr"
            width={30}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            tick={{ fill: 'var(--foreground-subtle)', fontSize: 10 }}
            tickFormatter={value =>
              typeof value === 'number' ? String(Math.round(value)) : ''
            }
          />
          <Tooltip
            cursor={{
              stroke: 'var(--foreground)',
              strokeOpacity: 0.08,
              strokeWidth: 1,
            }}
            content={<JourneyTooltip />}
          />
          <Line
            type={smoothCurve}
            dataKey="revenueCr"
            stroke="var(--readiness-mark)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={props => <JourneyDot {...props} />}
            activeDot={{
              r: 5.5,
              fill: 'var(--readiness-mark)',
              stroke: 'var(--secondary)',
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
