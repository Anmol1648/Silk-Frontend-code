import { findRow, isBranch } from '../score'
import { printName } from '../reading'
import type { DealInput, DealReport, ScoredLeaf } from '../types'
import type { ValuationPeer, ValuationPeerRound, ValuationReport, ValuationSeed } from './types'

const BLOCKING_LEAF_IDS = ['B.7'] as const

function parseCrAmount(raw: string): number | null {
  const match = raw.replace(/,/g, '').match(/([\d.]+)/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) ? n : null
}

function mid(low: number, high: number) {
  return Math.round(((low + high) / 2) * 10) / 10
}

function leaf(report: DealReport, id: string): ScoredLeaf | null {
  const row = findRow(report.tree, id)
  if (!row || isBranch(row)) return null
  return row
}

function blockingHole(report: DealReport): ValuationReport['blockedBy'] {
  for (const id of BLOCKING_LEAF_IDS) {
    const row = leaf(report, id)
    if (!row) continue
    const cashNil =
      row.measured?.unit.toLowerCase().startsWith('month') && row.measured.value <= 0
    if (row.flag || cashNil || (row.band === 'Poor' && id === 'B.7')) {
      return {
        parameterId: row.id,
        name: printName(row),
        summary: row.flag?.summary ?? row.reasoning ?? 'This still blocks a process.',
      }
    }
  }
  const flag = report.flags.find(f => BLOCKING_LEAF_IDS.includes(f.parameterId as (typeof BLOCKING_LEAF_IDS)[number]))
  if (flag) {
    return {
      parameterId: flag.parameterId,
      name: flag.name,
      summary: flag.summary,
    }
  }
  return null
}

function headlineFor(args: {
  score: number
  blockedBy: ValuationReport['blockedBy']
  raise: { low: number; high: number }
}): ValuationReport['headline'] {
  const hole = args.blockedBy?.name ?? null
  if (args.score < 5) {
    return {
      kind: 'cannot',
      raiseLow: args.raise.low,
      raiseHigh: args.raise.high,
      hole,
    }
  }
  if (args.score < 7 || args.blockedBy) {
    return {
      kind: 'once-settled',
      raiseLow: args.raise.low,
      raiseHigh: args.raise.high,
      hole: hole ?? 'the open hole',
    }
  }
  return {
    kind: 'can-take',
    raiseLow: args.raise.low,
    raiseHigh: args.raise.high,
    hole: null,
  }
}

function movesFor(args: {
  blockedBy: ValuationReport['blockedBy']
  peers: ValuationReport['peers']
}): ValuationReport['moves'] {
  const out: ValuationReport['moves'] = []
  if (args.blockedBy) {
    out.push({
      id: 'move-block',
      name: args.blockedBy.name,
      step: 'Blocks this raise',
      action: args.blockedBy.summary,
      pointerId: args.blockedBy.parameterId,
    })
  }
  const stale = args.peers.find(p => p.fragility)
  if (stale) {
    out.push({
      id: `move-peer-${stale.id}`,
      name: `${stale.name} print`,
      step: 'Moves the median',
      action: stale.fragility ?? 'Drop it and the median moves.',
      pointerId: `peer:${stale.id}`,
    })
  }
  return out.slice(0, 3)
}

function sortRounds(rounds: ValuationPeerRound[]) {
  return [...rounds].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return (a.month ?? 0) - (b.month ?? 0)
  })
}

function journeyForPeer(peer: {
  year: number
  stage: string | null
  revenueCr: number | null
  multiple: number | null
  source: string | null
  journey?: ValuationPeerRound[]
}): ValuationPeer['journey'] {
  const rounds = sortRounds(
    (peer.journey ?? []).map(round => ({
      year: round.year,
      month: round.month,
      stage: round.stage,
      revenueCr: round.revenueCr ?? null,
      multiple: round.multiple ?? null,
      raiseCr: round.raiseCr,
      evCr: round.evCr,
      source: round.source,
    })),
  )
  const printAlreadyIn = rounds.some(
    round =>
      round.year === peer.year &&
      round.revenueCr === peer.revenueCr &&
      round.multiple === peer.multiple,
  )
  if (
    !printAlreadyIn &&
    (peer.revenueCr != null || peer.multiple != null)
  ) {
    rounds.push({
      year: peer.year,
      stage: peer.stage ?? rounds.at(-1)?.stage ?? 'Print',
      revenueCr: peer.revenueCr,
      multiple: peer.multiple,
      source: peer.source,
    })
  }
  return sortRounds(rounds)
}

/** Build the valuation reading from the score report and the case seed. */
export function valueDeal(input: DealInput, score: DealReport): ValuationReport {
  const seed = input.valuation
  if (!seed) {
    throw new Error('Valuation seed is missing on this profile.')
  }

  const revenueLeaf = leaf(score, 'B.1')
  const revenueCr =
    revenueLeaf?.measured?.unit.toLowerCase().includes('cr')
      ? revenueLeaf.measured.value
      : null

  const discountLeaf = leaf(score, 'D.4')
  const premiumOrDiscount = discountLeaf?.measured?.unit === '%' ? discountLeaf.measured.value / 100 : null

  const askCr = parseCrAmount(score.mandate.ask)
  const impliedAtMedian =
    revenueCr != null ? Math.round(seed.medianMultiple * revenueCr) : null

  const blockedBy = blockingHole(score)
  const provisional = Boolean(blockedBy) || score.score < 7

  const peers = seed.peers.map(p => {
    const revenueCr = p.revenueCr ?? null
    const multiple = p.multiple ?? null
    const source = p.source ?? null
    const stage = p.stage ?? null
    return {
      id: p.id,
      name: p.name,
      year: p.year,
      stage,
      why: p.why,
      revenueCr,
      multiple,
      source,
      fragility: p.fragility ?? null,
      journey: journeyForPeer({
        year: p.year,
        stage,
        revenueCr,
        multiple,
        source,
        journey: p.journey,
      }),
    }
  })

  const raise = {
    low: seed.raiseCr.low,
    high: seed.raiseCr.high,
    working: mid(seed.raiseCr.low, seed.raiseCr.high),
    sentence: seed.raiseSentence,
  }

  return {
    raise,
    range: { ...seed.rangeCr },
    dilution: { ...seed.dilutionPct },
    runwayAfter: { ...seed.runwayAfterMonths },
    clock: {
      monthsLow: seed.clock.monthsLow,
      monthsHigh: seed.clock.monthsHigh,
      phases: seed.clock.phases.map(p => ({ ...p })),
    },
    frame: {
      sector: score.mandate.sector,
      stage: score.mandate.stage,
    },
    medianMultiple: seed.medianMultiple,
    multipleKind: seed.multipleKind,
    revenueCr,
    impliedAtMedian,
    premiumOrDiscount,
    askCr,
    peers,
    argument: seed.argument,
    useOfFunds: seed.useOfFunds,
    blockedBy,
    provisional,
    headline: headlineFor({
      score: score.score,
      blockedBy,
      raise,
    }),
    moves: movesFor({ blockedBy, peers }),
  }
}

export type { ValuationSeed }
