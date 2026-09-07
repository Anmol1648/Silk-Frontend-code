export type InvestorRole = 'lead' | 'follow' | 'skip'

export type InvestorThesis =
  | 'sector'
  | 'stage'
  | 'family'
  | 'existing'
  | 'angel'
  | 'micro'
  | 'strategic'

export type InvestorCheck = {
  low: number
  high: number
}

export type InvestorTypeSeed = {
  id: string
  name: string
  thesis: InvestorThesis
  checkCr: InvestorCheck
  sentence: string
  why: string
  fragile: string | null
  next: string
}

export type InvestorFillSeed = {
  typeId: string
  label: string
  cr: InvestorCheck
}

export type InvestorMatchSeed = {
  types: InvestorTypeSeed[]
  fills: InvestorFillSeed[]
  argument: string
  bookSentence: string
}

export type InvestorType = InvestorTypeSeed & {
  role: InvestorRole
}

export type InvestorFill = {
  typeId: string
  label: string
  low: number
  high: number
}

export type InvestorMove = {
  id: string
  name: string
  step: string
  action: string
  pointerId: string
}

export type InvestorPointer =
  | { kind: 'book' }
  | { kind: 'type'; typeId: string }
  | { kind: 'fill'; typeId: string }
  | { kind: 'profile' }

export type InvestorMatchReport = {
  lead: {
    name: string
    role: InvestorRole
  } | null
  book: {
    working: number
    sentence: string
  }
  raise: {
    low: number
    high: number
  }
  frame: {
    sector: string
    stage: string
  }
  types: InvestorType[]
  skips: InvestorType[]
  fills: InvestorFill[]
  argument: string
  blockedBy: {
    parameterId: string
    name: string
    summary: string
  } | null
  provisional: boolean
  headline: {
    kind: 'can-lead' | 'once-settled' | 'cannot' | 'no-lead'
    leadName: string | null
    hole: string | null
  }
  moves: InvestorMove[]
}
