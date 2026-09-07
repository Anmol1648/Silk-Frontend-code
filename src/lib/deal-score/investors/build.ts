import type { DealInput, DealReport } from '../types'
import type { ValuationReport } from '../valuation/types'
import type {
  InvestorMatchReport,
  InvestorRole,
  InvestorType,
  InvestorTypeSeed,
} from './types'

const SKIP_SHARE = 0.15
const LEAD_SHARE = 0.35

function shareOf(type: InvestorTypeSeed, working: number) {
  if (working <= 0) return 0
  return type.checkCr.high / working
}

function sectorLeadExists(types: InvestorTypeSeed[], working: number) {
  return types.some(
    type => type.thesis === 'sector' && shareOf(type, working) >= LEAD_SHARE,
  )
}

/** Cheque size gets a type into the book. Thesis picks the lead. */
export function roleForType(
  type: InvestorTypeSeed,
  working: number,
  hasSectorLead: boolean,
): InvestorRole {
  const share = shareOf(type, working)
  if (type.thesis === 'angel' || share < SKIP_SHARE) return 'skip'
  if (type.thesis === 'micro' && share < 0.2) return 'skip'
  if (type.thesis === 'sector' && share >= LEAD_SHARE) return 'lead'
  if (type.thesis === 'stage' && share >= LEAD_SHARE && !hasSectorLead) {
    return 'lead'
  }
  return 'follow'
}

function headlineFor(args: {
  score: number
  blockedBy: InvestorMatchReport['blockedBy']
  leadName: string | null
}): InvestorMatchReport['headline'] {
  const hole = args.blockedBy?.name ?? null
  if (args.score < 5) {
    return { kind: 'cannot', leadName: args.leadName, hole }
  }
  if (!args.leadName) {
    return { kind: 'no-lead', leadName: null, hole }
  }
  if (args.score < 7 || args.blockedBy) {
    return {
      kind: 'once-settled',
      leadName: args.leadName,
      hole: hole ?? 'the open hole',
    }
  }
  return { kind: 'can-lead', leadName: args.leadName, hole: null }
}

function movesFor(args: {
  blockedBy: InvestorMatchReport['blockedBy']
  types: InvestorType[]
}): InvestorMatchReport['moves'] {
  const out: InvestorMatchReport['moves'] = []
  if (args.blockedBy) {
    out.push({
      id: 'move-block',
      name: args.blockedBy.name,
      step: 'Binds the second meeting',
      action: args.blockedBy.summary,
      pointerId: args.blockedBy.parameterId,
    })
  }
  const existing = args.types.find(type => type.thesis === 'existing')
  if (existing) {
    out.push({
      id: `move-type-${existing.id}`,
      name: existing.name,
      step: 'Name who follows',
      action: existing.fragile ?? existing.sentence,
      pointerId: `type:${existing.id}`,
    })
  }
  const angels = args.types.find(type => type.thesis === 'angel' && type.role === 'skip')
  if (angels) {
    out.push({
      id: `move-type-${angels.id}`,
      name: angels.name,
      step: 'Do not spend the clock here',
      action: angels.sentence,
      pointerId: `type:${angels.id}`,
    })
  }
  return out.slice(0, 3)
}

/** Build the investor-match reading from the score, the raise, and the case seed. */
export function matchInvestors(
  input: DealInput,
  score: DealReport,
  valuation: ValuationReport,
): InvestorMatchReport {
  const seed = input.investors
  if (!seed) {
    throw new Error('Investor-match seed is missing on this profile.')
  }

  const working = valuation.raise.working
  const hasSectorLead = sectorLeadExists(seed.types, working)
  const typed = seed.types.map(type => ({
    ...type,
    role: roleForType(type, working, hasSectorLead),
  }))

  const bookTypes = typed.filter(type => type.role !== 'skip')
  const skips = typed.filter(type => type.role === 'skip')
  const lead = bookTypes.find(type => type.role === 'lead') ?? null
  const blockedBy = valuation.blockedBy
  const provisional = valuation.provisional

  return {
    lead: lead ? { name: lead.name, role: lead.role } : null,
    book: {
      working,
      sentence: seed.bookSentence,
    },
    raise: {
      low: valuation.raise.low,
      high: valuation.raise.high,
    },
    frame: {
      sector: score.mandate.sector,
      stage: score.mandate.stage,
    },
    types: bookTypes,
    skips,
    fills: seed.fills.map(fill => ({
      typeId: fill.typeId,
      label: fill.label,
      low: fill.cr.low,
      high: fill.cr.high,
    })),
    argument: seed.argument,
    blockedBy,
    provisional,
    headline: headlineFor({
      score: score.score,
      blockedBy,
      leadName: lead?.name ?? null,
    }),
    moves: movesFor({ blockedBy, types: typed }),
  }
}
