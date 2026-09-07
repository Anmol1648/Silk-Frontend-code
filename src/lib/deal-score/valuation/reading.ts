import type { ValuationPeer, ValuationPointer, ValuationReport } from './types'

export function formatCr(n: number) {
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
  return `₹${rounded} Cr`
}

/** ₹50–60 Cr */
export function formatCrRange(low: number, high: number) {
  const lo = Number.isInteger(low) ? String(low) : low.toFixed(1).replace(/\.0$/, '')
  const hi = Number.isInteger(high) ? String(high) : high.toFixed(1).replace(/\.0$/, '')
  return `₹${lo}–${hi} Cr`
}

export function formatPctRange(low: number, high: number) {
  return `${low}–${high}%`
}

export function formatPct(n: number) {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
  return `${v}%`
}

function lerp(low: number, high: number, t: number) {
  return low + (high - low) * t
}

function roundTenths(n: number) {
  return Math.round(n * 10) / 10
}

/** Dilution and valuation at a preferred raise inside the suggested band. */
export function preferenceAtRaise(report: ValuationReport, raiseCr: number) {
  const span = Math.max(report.raise.high - report.raise.low, 1e-9)
  const t = Math.min(1, Math.max(0, (raiseCr - report.raise.low) / span))
  return {
    raiseCr: roundTenths(raiseCr),
    dilutionPct: roundTenths(lerp(report.dilution.low, report.dilution.high, t)),
    valuationCr: roundTenths(lerp(report.range.low, report.range.high, t)),
  }
}

export function formatMonthRange(low: number, high: number) {
  return `${low}–${high} mo`
}

export function formatMultiple(n: number) {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
  return `${v}x`
}

export function formatDiscount(share: number) {
  const pct = Math.round(Math.abs(share) * 100)
  if (share < 0) return `−${pct}%`
  if (share > 0) return `+${pct}%`
  return '0%'
}

export function raiseHeadlineParts(report: ValuationReport) {
  const band = formatCrRange(report.headline.raiseLow, report.headline.raiseHigh)
  if (report.headline.kind === 'cannot') {
    return {
      before: 'This profile ',
      mark: 'cannot take a raise',
      after: ' yet.',
    }
  }
  if (report.headline.kind === 'once-settled') {
    const hole = report.headline.hole ?? 'the open hole'
    return {
      before: 'A raise of ',
      mark: band,
      after: ` is possible once ${hole.toLowerCase()} is settled.`,
    }
  }
  return {
    before: 'A raise of ',
    mark: band,
    after: ' is what this profile can take.',
  }
}

/** Short name for the binding hole on the judgment line. */
export function valuationHoleWord(name: string) {
  return /cash/i.test(name) ? 'Cash' : name
}

export function peerJourneyPoints(peer: ValuationPeer) {
  return (peer.journey ?? [])
    .filter((round): round is typeof round & { revenueCr: number } => round.revenueCr != null)
    .map(round => {
      const evCr =
        round.evCr ??
        (round.multiple != null ? Math.round(round.multiple * round.revenueCr) : null)
      return {
        t: round.year + ((round.month ?? 6) - 1) / 12,
        year: round.year,
        stage: round.stage,
        revenueCr: round.revenueCr,
        multiple: round.multiple,
        raiseCr: round.raiseCr ?? null,
        evCr,
        source: round.source ?? null,
      }
    })
}

export function parseValuationPointer(id: string): ValuationPointer {
  if (id === 'raise') return { kind: 'raise' }
  if (id === 'range') return { kind: 'range' }
  if (id === 'dilution') return { kind: 'dilution' }
  if (id === 'runway') return { kind: 'runway' }
  if (id === 'funds') return { kind: 'funds' }
  if (id === 'clock') return { kind: 'clock' }
  if (id.startsWith('peer:')) return { kind: 'peer', peerId: id.slice(5) }
  if (id.startsWith('phase:')) return { kind: 'phase', phaseId: id.slice(6) }
  return { kind: 'profile' }
}

export function beatsForValuationPointer(
  report: ValuationReport,
  pointerId: string,
): { title: string; lede: string | null; why: string; wrong: string | null; next: string | null } {
  const pointer = parseValuationPointer(pointerId)

  switch (pointer.kind) {
    case 'raise':
      return {
        title: 'Raise',
        lede: formatCrRange(report.raise.low, report.raise.high),
        why: report.raise.sentence,
        wrong: report.blockedBy
          ? `${report.blockedBy.name}: ${report.blockedBy.summary}`
          : null,
        next:
          report.useOfFunds
          ?? (report.provisional
            ? 'Settle the blocking hole on Score before this band is a meeting you can take.'
            : 'If the ask moves above this band, dilution and the clock move with it.'),
      }
    case 'range':
      return {
        title: 'Ideal valuation',
        lede: formatCrRange(report.range.low, report.range.high),
        why: report.argument,
        wrong:
          report.premiumOrDiscount != null && report.impliedAtMedian != null
            ? `At the peer median (${formatMultiple(report.medianMultiple)}) the implied is ${formatCr(report.impliedAtMedian)}. The ask sits ${formatDiscount(report.premiumOrDiscount)} to that.`
            : null,
        next: 'Drop a stale print from the peer set. The median and this range move with it.',
      }
    case 'dilution':
      return {
        title: 'Dilution',
        lede: formatPctRange(report.dilution.low, report.dilution.high),
        why: `The band at a raise of ${formatCrRange(report.raise.low, report.raise.high)} against a range of ${formatCrRange(report.range.low, report.range.high)}.`,
        wrong: null,
        next: 'A higher raise inside the same range takes more of the company.',
      }
    case 'runway':
      return {
        title: 'Runway after',
        lede: formatMonthRange(report.runwayAfter.low, report.runwayAfter.high),
        why: `Months after the working raise of ${formatCr(report.raise.working)}.`,
        wrong: report.blockedBy
          ? `Today ${report.blockedBy.name.toLowerCase()} is the hole. This runway is what the band buys after that is fixed.`
          : null,
        next: 'The next print is meant to land before this runway runs out.',
      }
    case 'peer': {
      const peer = report.peers.find(p => p.id === pointer.peerId)
      if (!peer) {
        return {
          title: 'Peer',
          lede: null,
          why: 'This peer is not in the set.',
          wrong: null,
          next: null,
        }
      }
      const parts: string[] = []
      if (peer.stage) parts.push(peer.stage)
      parts.push(String(peer.year))
      if (peer.revenueCr != null) parts.push(formatCr(peer.revenueCr))
      if (peer.multiple != null) parts.push(formatMultiple(peer.multiple))
      if (peer.source) parts.push(peer.source)
      return {
        title: peer.name,
        lede: parts.join('  ·  '),
        why: peer.why,
        wrong: peer.fragility,
        next:
          peer.revenueCr == null || peer.multiple == null
            ? 'Add the print, revenue and EV/Rev, so this row can do work in the median.'
            : 'Drop from the set if the print is too stale or the wrong scale.',
      }
    }
    case 'funds':
      return {
        title: 'Use of funds',
        lede: null,
        why: report.useOfFunds ?? 'No use-of-funds split is in the profile yet.',
        wrong: null,
        next: 'Put a real split in the knowledge base if you want it typeset here.',
      }
    case 'clock':
    case 'phase': {
      const phase =
        pointer.kind === 'phase'
          ? report.clock.phases.find(p => p.id === pointer.phaseId)
          : null
      return {
        title: phase?.name ?? 'Clock',
        lede: phase
          ? `${phase.weeks} weeks`
          : `${report.clock.monthsLow}–${report.clock.monthsHigh} months`,
        why: phase?.why ?? 'Sum of preparation, outreach, and meetings, plus slack.',
        wrong: report.blockedBy
          ? `Preparation includes settling ${report.blockedBy.name.toLowerCase()} before outreach.`
          : null,
        next: 'Shorten preparation by clearing Score holes first.',
      }
    }
    case 'profile':
      return {
        title: 'Ask about the raise',
        lede: null,
        why: report.argument,
        wrong: report.blockedBy
          ? `${report.blockedBy.name}: ${report.blockedBy.summary}`
          : null,
        next: report.raise.sentence,
      }
    default: {
      const _exhaustive: never = pointer
      return _exhaustive
    }
  }
}

export function valuationSuggestions(pointerId: string | null): string[] {
  const pointer = pointerId ? parseValuationPointer(pointerId) : { kind: 'profile' as const }
  switch (pointer.kind) {
    case 'raise':
      return [
        'Why this raise, not more?',
        'If we raised a higher band, what happens to dilution?',
        'What is the next inflection this is meant to buy?',
      ]
    case 'range':
      return [
        'Why this range?',
        'Which peer is doing the most work?',
        'What would move the range?',
      ]
    case 'dilution':
      return [
        'Why this dilution band?',
        'If we raised a higher band, what happens to dilution?',
        'What range keeps dilution inside this band?',
      ]
    case 'runway':
      return [
        'What does this runway buy?',
        'What happens if cash stays nil?',
        'When does the next print need to land?',
      ]
    case 'peer':
      return [
        'Why is this company in the set?',
        'If we drop this print, what happens to the range?',
        'What would an investor say about this comp?',
      ]
    case 'funds':
      return [
        'What will cash actually eat?',
        'Is the stated use the economic use?',
        'What would an investor ask about use of funds?',
      ]
    case 'clock':
    case 'phase':
      return [
        'What shortens this clock?',
        'What still blocks outreach?',
        'What happens in preparation?',
      ]
    case 'profile':
      return [
        'Why this raise?',
        'Which peer is doing the most work?',
        'What would move the range?',
      ]
    default: {
      const _exhaustive: never = pointer
      return _exhaustive
    }
  }
}
