import type { InvestorMatchSeed } from './investors/types'
import type { ValuationSeed } from './valuation/types'

export const LEAF_BANDS = ['Excellent', 'Good', 'Fair', 'Poor'] as const
export type LeafBand = (typeof LEAF_BANDS)[number]

export const DEAL_BANDS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] as const
export type DealBand = (typeof DEAL_BANDS)[number]

export type FlagKind = 'contradiction' | 'inferred' | 'gap'

export type Citation = {
  source: string
  quote?: string
  locator?: string
  type?: string
  tier?: string
  /** Public http(s) URL when the source is off-platform. */
  url?: string
}

export type ThresholdCut = {
  value: number
  unit: string
}

export type ThresholdRubric = {
  kind: 'threshold'
  higherIsBetter: boolean
  cuts: {
    excellent: ThresholdCut
    good: ThresholdCut
    fair: ThresholdCut
  }
  labels: Record<LeafBand, string>
}

export type QualitativeRubric = {
  kind: 'qualitative'
  labels: Record<LeafBand, string>
}

export type Rubric = ThresholdRubric | QualitativeRubric

export type ScoreNode = {
  id: string
  name: string
  weight: number
  children?: ScoreNode[]
  rubric?: Rubric
}

export type MeasuredFact = {
  value: number | string
  unit: string
}

export type LeafEvidence = {
  /** Analyst or model judgment. Required when the rubric is qualitative. */
  band?: LeafBand
  measured?: MeasuredFact
  reasoning: string
  soWhat?: string
  diligenceAsk?: string
  citations?: Citation[]
  evidenceTier?: string
  confidence?: 'high' | 'medium' | 'low'
  asOf?: string
  flag?: {
    kind: FlagKind
    summary: string
  }
}

export type DealMandate = {
  company: string
  sector: string
  stage: string
  ask: string
  raised: string
  assessed: string
  hq?: string
}

export type DealInput = {
  mandate: DealMandate
  /** Short paragraphs. The page may show these as the memo. */
  memo: string[]
  /** Keyed by parameter id. Missing keys are treated as not enough information. */
  evidence: Record<string, LeafEvidence>
  /** Structured raise and comps facts for the Valuation tab. */
  valuation?: ValuationSeed
  /** Investor types and book shape for the Investors tab. */
  investors?: InvestorMatchSeed
}

export type ScoredLeaf = {
  id: string
  name: string
  depth: number
  weight: number
  appliedWeight: number
  score: number | null
  band: LeafBand | null
  notEnoughInformation: boolean
  reasoning: string | null
  soWhat: string | null
  diligenceAsk: string | null
  nextBand: LeafBand | null
  nextBandLabel: string | null
  measured: MeasuredFact | null
  citations: Citation[]
  evidenceTier: string | null
  confidence: LeafEvidence['confidence'] | null
  flag: LeafEvidence['flag'] | null
  rubric: Rubric | undefined
  shareOfParent: number
  shareOfDeal: number
}

export type ScoredBranch = {
  id: string
  name: string
  depth: number
  weight: number
  appliedWeight: number
  score: number | null
  band: LeafBand | null
  notEnoughInformation: boolean
  sentence: string | null
  children: ScoredRow[]
  shareOfParent: number
  shareOfDeal: number
}

export type ScoredRow = ScoredLeaf | ScoredBranch

export type DealFlag = {
  parameterId: string
  name: string
  kind: FlagKind
  summary: string
}

export type DealMove = {
  parameterId: string
  name: string
  from: LeafBand
  to: LeafBand
  action: string
  lift: number
}

export type DealReport = {
  mandate: DealMandate
  memo: string[]
  score: number
  band: DealBand
  tree: ScoredRow[]
  flags: DealFlag[]
  moves: DealMove[]
}
