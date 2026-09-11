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

export type ParameterRubric = {
  key?: string
  kind?: string
  metric?: string
  unit?: string
  direction?: string
  parameter?: string
  stages?: Record<string, { excellent?: number; good?: number; fair?: number; ideal_min?: number; ideal_max?: number }>
  good_tolerance?: number
  fair_tolerance?: number
  rationale?: string
  labels?: Record<string, string>
}

export type Rubric = ThresholdRubric | QualitativeRubric | ParameterRubric

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

export type ParameterDictionary = {
  definition?: string | null
  where_to_find?: string | null
  measured_on?: string | null
}

export type ParameterAnchor = {
  bands?: Record<string, string>
  evidence_required?: string | null
  scoring_basis?: string | null
}

export type ParameterWeights = {
  weightWithinParent?: number
  effectiveOfTotalPct?: number
  declaredWeight?: number
  appliedWeight?: number
}

export type ParameterTrace = {
  method?: string
  explanation?: string | null
  stage?: string | null
  unit?: string | null
  direction?: string | null
  matched_band?: string | null
  score?: number | null
  thresholds?: Record<string, number> | null
  rationale?: string | null
  inputs?: Record<string, any> | null
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
  reportedValue?: string | null
  effectiveBand?: string | null
  asOf?: string | null
  periodBasis?: string | null
  insight?: string | null
  dictionary?: ParameterDictionary | null
  anchor?: ParameterAnchor | null
  weightsData?: ParameterWeights | null
  contribution?: number | string | null
  trace?: ParameterTrace | null
  isReference?: boolean
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
  headline?: string | null
  ask?: string | null
  finding?: string | null
  findingType?: string | null
  severity?: string | null
  whyItMatters?: string | null
  action?: string | null
  evidence?: string | null
  materialityPct?: number | null
  couldChangeRating?: boolean
  ref?: string | null
  inputKey?: string | null
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
