'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BarChartIcon,
  ChartLineData01Icon,
  DiscoverCircleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { AiMark } from '@/components/ai-mark'
import {
  SILK_AI_OPEN_EVENT,
  type SilkAiOpenDetail,
} from '@/lib/silk-ai-panel'
import { fetchDealEvaluation } from '../api'
import {
  buildDealReportFromApi,
  ancestorsOf,
  collectLeaves,
  findRow,
  isBranch,
  investorHeadlineParts,
  lookParts,
  lookWord,
  matchInvestors,
  nextMoves,
  novatechCase,
  raiseHeadlineParts,
  scoreDeal,
  valueDeal,
  type DealReport,
  type InvestorMatchReport,
  type ScoreTab,
  type ScoredLeaf,
  type ValuationReport,
} from '@/lib/deal-score'
import { QuietInsightCard, ScoreInsightCard } from './insight-card'
import { InvestorsAside } from './investors-aside'
import { InvestorsInsightCard } from './investors-insight'
import { InvestorsLetter } from './investors-letter'
import { ScoreAside } from './score-aside'
import { FlagsBlock, NarrativeBlock, ScoreTree, ViewToggle } from './score-tree'
import { ValuationAside } from './valuation-aside'
import { ValuationInsightCard } from './valuation-insight'
import { ValuationLetter } from './valuation-letter'

const TABS: { id: ScoreTab; label: string; icon: typeof ChartLineData01Icon }[] = [
  { id: 'score', label: 'Profile Scorecard', icon: ChartLineData01Icon },
  { id: 'valuation', label: 'Raise and Valuation', icon: BarChartIcon },
  { id: 'investors', label: 'Investor match', icon: DiscoverCircleIcon },
]

const THINK_STEPS = [
  'Reading the profile…',
  'Weighing each part…',
  'Writing the score…',
]

function loadScoreReport(): DealReport {
  return scoreDeal(novatechCase)
}

async function loadScoreReportFromApi(companyId: string): Promise<DealReport> {
  const apiData = await fetchDealEvaluation(companyId)
  return buildDealReportFromApi(apiData)
}

function loadValuationReport(score: DealReport): ValuationReport {
  return valueDeal(novatechCase, score)
}

function loadInvestorReport(
  score: DealReport,
  valuation: ValuationReport,
): InvestorMatchReport {
  return matchInvestors(novatechCase, score, valuation)
}

function isScoreLeafId(id: string) {
  return /^[A-G](\.\d+)*$/.test(id)
}

function scrollChildInto(
  root: HTMLElement,
  el: HTMLElement,
  { offset = 24 }: { offset?: number } = {},
) {
  const rootRect = root.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const top = elRect.top - rootRect.top + root.scrollTop - offset
  const max = Math.max(0, root.scrollHeight - root.clientHeight)
  root.scrollTo({ top: Math.min(Math.max(0, top), max), behavior: 'smooth' })
}

function isAssessmentCompleted(apiData: any): boolean {
  if (!apiData) return false
  const status = (apiData.status || apiData.raw?.status || apiData.summary?.status || '')
    .toString()
    .toLowerCase()
    .trim()

  if (['completed', 'complete', 'ready', 'done', 'succeeded'].includes(status)) {
    return true
  }

  if (['draft', 'generating', 'processing', 'pending', 'in_progress', 'drafting'].includes(status)) {
    return false
  }

  // If no explicit status was returned, check if categories or score are populated
  if (!status && (apiData.overallScore != null || (apiData.categories && apiData.categories.length > 0))) {
    return true
  }

  return false
}

export default function Page({ companyId }: { companyId?: string }) {
  const [phase, setPhase] = useState<'thinking' | 'ready' | 'failed'>('thinking')
  const [report, setReport] = useState<DealReport | null>(null)
  const [valuation, setValuation] = useState<ValuationReport | null>(null)
  const [investors, setInvestors] = useState<InvestorMatchReport | null>(null)
  const [tab, setTab] = useState<ScoreTab>('score')
  const [thinkStep, setThinkStep] = useState(0)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [advanced, setAdvanced] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [drawerShown, setDrawerShown] = useState(false)
  const [tabsStuck, setTabsStuck] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const stepTimer = window.setInterval(() => {
      setThinkStep(n => (n + 1) % THINK_STEPS.length)
    }, 1200)

    function applyData(apiData: any) {
      const next = buildDealReportFromApi(apiData)
      const nextValuation = loadValuationReport(next)
      const nextInvestors = loadInvestorReport(next, nextValuation)
      if (!cancelled) {
        setReport(next)
        setValuation(nextValuation)
        setInvestors(nextInvestors)
        setPhase('ready')
      }
    }

    async function load() {
      if (!companyId) {
        try {
          const next = loadScoreReport()
          const nextValuation = loadValuationReport(next)
          const nextInvestors = loadInvestorReport(next, nextValuation)
          if (!cancelled) {
            setReport(next)
            setValuation(nextValuation)
            setInvestors(nextInvestors)
            setPhase('ready')
          }
        } catch {
          if (!cancelled) setPhase('failed')
        }
        return
      }

      setPhase('thinking')
      try {
        const apiData = await fetchDealEvaluation(companyId)
        if (cancelled) return

        if (isAssessmentCompleted(apiData)) {
          applyData(apiData)
        } else {
          // Status is draft or generating, start polling until completed
          pollTimer = setInterval(async () => {
            if (cancelled) return
            try {
              const polledData = await fetchDealEvaluation(companyId)
              if (cancelled) return
              if (isAssessmentCompleted(polledData)) {
                if (pollTimer) {
                  clearInterval(pollTimer)
                  pollTimer = null
                }
                applyData(polledData)
              }
            } catch (err) {
              console.error('Polling assessment error:', err)
            }
          }, 3000)
        }
      } catch (err) {
        console.error('Failed to load assessment:', err)
        if (!cancelled) {
          setPhase('failed')
        }
      }
    }

    load()

    return () => {
      cancelled = true
      window.clearInterval(stepTimer)
      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [companyId, reloadTrigger])

  const openScorePointer = useCallback((id: string) => {
    if (!report) {
      setSelectedId(null)
      setDrawerShown(true)
      setPanelOpen(true)
      return
    }
    const row = findRow(report.tree, id)
    if (!row) {
      setSelectedId(null)
      setDrawerShown(true)
      setPanelOpen(true)
      return
    }

    const targetLeaf = isBranch(row) ? collectLeaves(row.children)[0] : row
    const targetId = targetLeaf ? targetLeaf.id : id

    const parents = ancestorsOf(report.tree, targetId)
    setExpanded(prev => {
      const next = new Set(prev)
      for (const parent of parents) next.add(parent)
      next.add(id)
      if (targetLeaf) next.add(targetLeaf.id)
      return next
    })
    setSelectedId(targetId)
    setDrawerShown(true)
    setPanelOpen(true)
    window.requestAnimationFrame(() => {
      const root = scrollRef.current
      const el = document.getElementById(`score-${parents[0] ?? targetId}`)
      if (root && el) scrollChildInto(root, el)
    })
  }, [report])

  const openValuationPointer = useCallback((id: string) => {
    if (isScoreLeafId(id)) {
      setTab('score')
      setPanelOpen(false)
      setDrawerShown(false)
      setSelectedId(null)
      window.setTimeout(() => openScorePointer(id), 120)
      return
    }
    setSelectedId(id)
    setDrawerShown(true)
    setPanelOpen(true)
  }, [openScorePointer])

  const openInvestorPointer = useCallback((id: string) => {
    if (isScoreLeafId(id)) {
      setTab('score')
      setPanelOpen(false)
      setDrawerShown(false)
      setSelectedId(null)
      window.setTimeout(() => openScorePointer(id), 120)
      return
    }
    setSelectedId(id)
    setDrawerShown(true)
    setPanelOpen(true)
  }, [openScorePointer])

  const openPointer =
    tab === 'investors'
      ? openInvestorPointer
      : tab === 'valuation'
        ? openValuationPointer
        : openScorePointer

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<SilkAiOpenDetail>).detail ?? {}
      if (detail.fieldId) {
        openPointer(detail.fieldId)
        return
      }
      setSelectedId(null)
      setDrawerShown(true)
      setPanelOpen(true)
    }
    window.addEventListener(SILK_AI_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(SILK_AI_OPEN_EVENT, onOpen)
  }, [openPointer])

  useEffect(() => {
    if (panelOpen) {
      setDrawerShown(true)
      return
    }
    if (!drawerShown) return
    const t = window.setTimeout(() => setDrawerShown(false), 700)
    return () => window.clearTimeout(t)
  }, [panelOpen, drawerShown])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const update = () => {
      const tabs = tabsRef.current
      if (!tabs) return
      root.style.setProperty('--readiness-tabs', `${tabs.offsetHeight}px`)
      setTabsStuck(tabs.getBoundingClientRect().top <= root.getBoundingClientRect().top + 2)
    }
    update()
    root.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      root.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const look = report ? lookWord(report.score) : null
  const headline = look ? lookParts(look) : null
  const moves = report ? nextMoves(report) : []
  const valuationHeadline = valuation ? raiseHeadlineParts(valuation) : null
  const investorsHeadline = investors ? investorHeadlineParts(investors) : null
  const selectedLeaf = useMemo<ScoredLeaf | null>(() => {
    if (!report || !selectedId || tab !== 'score') return null
    const row = findRow(report.tree, selectedId)
    if (!row) return null
    if (isBranch(row)) {
      const leaves = collectLeaves(row.children)
      return leaves[0] ?? null
    }
    return row
  }, [report, selectedId, tab])

  const insightOpen = !panelOpen
  const shellMax = cn(
    'mx-auto w-full transition-[max-width] duration-(--silk-aside-shift) ease-(--silk-aside-ease)',
    'motion-reduce:transition-none',
    insightOpen ? 'max-w-[1100px]' : 'max-w-[760px]',
  )

  function toggleBranch(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function changeTab(next: ScoreTab) {
    setTab(next)
    setPanelOpen(false)
    setDrawerShown(false)
    setSelectedId(null)
  }

  function retry() {
    setPhase('thinking')
    setThinkStep(0)
    setReport(null)
    setValuation(null)
    setInvestors(null)
    setReloadTrigger(v => v + 1)
  }

  if (phase === 'thinking') {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center bg-white">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-[18px] h-[18px] rounded-[4px] bg-[#030712]/[0.08] flex items-center justify-center text-[10px] font-semibold text-[#030712] silk-think-mark shrink-0 leading-none">
            ✳
          </div>
          <p className="silk-think-text text-[13px] font-normal leading-none">
            {THINK_STEPS[thinkStep]}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 w-full items-stretch overflow-hidden">
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none pl-10 pb-8',
          'transition-[padding-right] duration-(--silk-aside-shift) ease-(--silk-aside-ease)',
          'motion-reduce:transition-none',
        )}
        style={{
          paddingRight: panelOpen
            ? 'calc(2.5rem + var(--silk-aside))'
            : '2.5rem',
        }}
      >
        <div className={cn('pt-8', shellMax)}>
          <header className="mb-8">
            {(tab === 'score' || tab === 'valuation' || tab === 'investors') &&
              phase === 'ready' && (
                <p className="font-heading text-[32px] font-normal leading-[1.2] tracking-[-0.03em] text-[#9ca3af]">
                  We&apos;ve understood your company details.
                </p>
              )}
            <h1
              className={cn(
                'font-heading text-[32px] font-normal leading-[1.2] tracking-[-0.03em] text-foreground',
                (tab === 'score' || tab === 'valuation' || tab === 'investors') &&
                phase === 'ready' &&
                'mt-1',
              )}
            >
              {tab === 'score' && headline ? (
                <>
                  {headline.before}
                  <span className="underline decoration-foreground/20 decoration-[1.5px] underline-offset-[7px]">
                    {headline.mark}
                  </span>
                  .
                </>
              ) : tab === 'valuation' && valuationHeadline ? (
                <>
                  {valuationHeadline.before}
                  <span className="underline decoration-foreground/20 decoration-[1.5px] underline-offset-[7px]">
                    {valuationHeadline.mark}
                  </span>
                  {valuationHeadline.after}
                </>
              ) : tab === 'investors' && investorsHeadline ? (
                <>
                  {investorsHeadline.before}
                  <span className="underline decoration-foreground/20 decoration-[1.5px] underline-offset-[7px]">
                    {investorsHeadline.mark}
                  </span>
                  {investorsHeadline.after}
                </>
              ) : tab === 'score' ? (
                'Profile Scorecard'
              ) : tab === 'valuation' ? (
                'Raise and Valuation'
              ) : tab === 'investors' ? (
                'Investor Match'
              ) : (
                'Profile Scorecard'
              )}
            </h1>
          </header>
        </div>

        <div
          ref={tabsRef}
          className={cn(
            'sticky top-0 z-20 -mx-10 bg-background px-10',
            tabsStuck && 'border-b border-border',
          )}
        >
          <div className={shellMax}>
            <div className="flex w-full max-w-[760px] flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
              {TABS.map(item => {
                const active = item.id === tab
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => changeTab(item.id)}
                    className={cn(
                      'inline-flex h-7 items-center rounded-md px-2.5 text-[13px] transition-colors',
                      active
                        ? 'gap-1.5 bg-muted font-medium text-foreground'
                        : 'text-foreground-subtle hover:bg-surface-hover hover:text-foreground',
                    )}
                  >
                    {active && (
                      <HugeiconsIcon icon={item.icon} size={14} strokeWidth={1.7} />
                    )}
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className={cn('mt-4 flex w-full items-start gap-8', shellMax)}>
          <div className="flex min-w-0 w-full max-w-[760px] shrink-0 flex-col">
            {phase === 'failed' && (
              <div className="pt-2">
                <p className="text-[14px] text-popover-foreground">
                  {tab === 'investors'
                    ? 'The book failed.'
                    : tab === 'valuation'
                      ? 'The range failed.'
                      : 'The score failed.'}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Try again
                </button>
              </div>
            )}

            {phase === 'ready' && report && tab === 'score' && (
              <div className="silk-enter flex flex-col gap-3">
                <NarrativeBlock memo={report.memo} />
                <FlagsBlock
                  report={report}
                  advanced={advanced}
                  onToggleView={() => setAdvanced(v => !v)}
                  onOpenFlag={openScorePointer}
                />
                {!report.flags.length && (
                  <div className="flex justify-end">
                    <ViewToggle
                      advanced={advanced}
                      onToggle={() => setAdvanced(v => !v)}
                    />
                  </div>
                )}
                <ScoreTree
                  report={report}
                  expanded={expanded}
                  selectedId={selectedId}
                  advanced={advanced}
                  onToggle={toggleBranch}
                  onOpenLeaf={openScorePointer}
                />
              </div>
            )}

            {phase === 'ready' && tab === 'valuation' && valuation && (
              <ValuationLetter
                report={valuation}
                selectedId={selectedId}
                onOpen={openValuationPointer}
              />
            )}

            {phase === 'ready' && tab === 'valuation' && !valuation && (
              <div className="silk-enter max-w-[52ch]">
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  Evaluating valuation data…
                </p>
              </div>
            )}

            {phase === 'ready' && tab === 'investors' && investors && (
              <InvestorsLetter
                report={investors}
                selectedId={selectedId}
                onOpen={openInvestorPointer}
              />
            )}

            {phase === 'ready' && tab === 'investors' && !investors && (
              <div className="silk-enter max-w-[52ch]">
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  Matching investors for your profile…
                </p>
              </div>
            )}
          </div>

          {tab === 'score' && report && phase === 'ready' ? (
            <ScoreInsightCard
              report={report}
              score={report.score}
              moves={moves}
              onSelect={openScorePointer}
              open={insightOpen}
              className="sticky top-[calc(var(--readiness-tabs,0px)+12px)]"
            />
          ) : tab === 'valuation' && valuation && phase === 'ready' ? (
            <ValuationInsightCard
              report={valuation}
              open={insightOpen}
              className="sticky top-[calc(var(--readiness-tabs,0px)+12px)]"
            />
          ) : tab === 'investors' && investors && phase === 'ready' ? (
            <InvestorsInsightCard
              report={investors}
              onSelect={openInvestorPointer}
              open={insightOpen}
              className="sticky top-[calc(var(--readiness-tabs,0px)+12px)]"
            />
          ) : tab === 'valuation' ? (
            <QuietInsightCard
              title="Next"
              line="The range is not ready."
              open={insightOpen}
              className="sticky top-[calc(var(--readiness-tabs,0px)+12px)]"
            />
          ) : tab === 'investors' ? (
            <QuietInsightCard
              title="Next"
              line="The book is not ready."
              open={insightOpen}
              className="sticky top-[calc(var(--readiness-tabs,0px)+12px)]"
            />
          ) : null}
        </div>
      </div>

      {drawerShown && report && tab === 'score' && (
        <ScoreAside
          key={selectedId ?? 'profile'}
          report={report}
          leaf={selectedLeaf}
          leaving={!panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {drawerShown && valuation && tab === 'valuation' && (
        <ValuationAside
          key={selectedId ?? 'valuation-profile'}
          report={valuation}
          pointerId={selectedId}
          leaving={!panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {drawerShown && investors && tab === 'investors' && (
        <InvestorsAside
          key={selectedId ?? 'investors-profile'}
          report={investors}
          pointerId={selectedId}
          leaving={!panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  )
}
