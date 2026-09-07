export type CrRange = {
  low: number
  high: number
}

export type ValuationPhase = {
  id: string
  name: string
  weeks: number
  why: string
}

/** One capital event on a peer. Revenue is the print nearest that raise. */
export type ValuationPeerRound = {
  year: number
  month?: number
  stage: string
  revenueCr?: number | null
  multiple?: number | null
  raiseCr?: number | null
  evCr?: number | null
  source?: string | null
}

export type ValuationPeer = {
  id: string
  name: string
  year: number
  /** Stage at the current moment, or at the print if that is all we have. */
  stage: string | null
  why: string
  /** Revenue in ₹ Cr when a print exists. */
  revenueCr: number | null
  /** EV/Revenue (or active multiple) when a print exists. */
  multiple: number | null
  /** Where the print was read from. */
  source: string | null
  fragility: string | null
  /** Raises in time order. The engine appends the active print if it is missing. */
  journey: ValuationPeerRound[]
}

export type ValuationMove = {
  id: string
  name: string
  step: string
  action: string
  /** Score leaf to open, or a valuation pointer id. */
  pointerId: string
}

export type ValuationPointer =
  | { kind: 'raise' }
  | { kind: 'range' }
  | { kind: 'dilution' }
  | { kind: 'runway' }
  | { kind: 'peer'; peerId: string }
  | { kind: 'funds' }
  | { kind: 'clock' }
  | { kind: 'phase'; phaseId: string }
  | { kind: 'profile' }

/** Structured facts the valuation reading needs beyond scored leaves. */
export type ValuationSeed = {
  raiseCr: CrRange
  rangeCr: CrRange
  dilutionPct: CrRange
  runwayAfterMonths: CrRange
  clock: {
    monthsLow: number
    monthsHigh: number
    phases: ValuationPhase[]
  }
  medianMultiple: number
  multipleKind: 'EV/Revenue'
  peers: Array<{
    id: string
    name: string
    year: number
    stage?: string
    why: string
    revenueCr?: number
    multiple?: number
    source?: string
    fragility?: string
    journey?: ValuationPeerRound[]
  }>
  raiseSentence: string
  argument: string
  useOfFunds: string | null
}

export type ValuationReport = {
  raise: CrRange & {
    working: number
    sentence: string
  }
  range: CrRange
  dilution: CrRange
  runwayAfter: CrRange
  clock: {
    monthsLow: number
    monthsHigh: number
    phases: ValuationPhase[]
  }
  /** Orientation for the rail snapshot. From the score mandate. */
  frame: {
    sector: string
    stage: string
  }
  medianMultiple: number
  multipleKind: 'EV/Revenue'
  /** Company revenue used for implied (₹ Cr). */
  revenueCr: number | null
  impliedAtMedian: number | null
  /** Signed share vs median at the ask reference. Negative is a discount. */
  premiumOrDiscount: number | null
  /** Ask used for the discount read (₹ Cr). */
  askCr: number | null
  peers: ValuationPeer[]
  argument: string
  useOfFunds: string | null
  blockedBy: {
    parameterId: string
    name: string
    summary: string
  } | null
  provisional: boolean
  headline: {
    kind: 'can-take' | 'once-settled' | 'cannot'
    raiseLow: number
    raiseHigh: number
    hole: string | null
  }
  moves: ValuationMove[]
}
