import { formatCr, formatCrRange, valuationHoleWord } from '../valuation/reading'
import type {
  InvestorMatchReport,
  InvestorPointer,
  InvestorRole,
  InvestorType,
} from './types'

export function formatRole(role: InvestorRole) {
  if (role === 'lead') return 'Lead'
  if (role === 'follow') return 'Follow'
  return 'Skip'
}

export function formatCheck(low: number, high: number) {
  if (low === high) return formatCr(low)
  return formatCrRange(low, high)
}

export function findInvestorType(
  report: InvestorMatchReport,
  typeId: string,
): InvestorType | null {
  return (
    report.types.find(type => type.id === typeId) ??
    report.skips.find(type => type.id === typeId) ??
    null
  )
}

export function parseInvestorPointer(id: string): InvestorPointer {
  if (id === 'book') return { kind: 'book' }
  if (id.startsWith('type:')) return { kind: 'type', typeId: id.slice(5) }
  if (id.startsWith('fill:')) return { kind: 'fill', typeId: id.slice(5) }
  return { kind: 'profile' }
}

export function investorHeadlineParts(report: InvestorMatchReport) {
  const hole = report.headline.hole
    ? valuationHoleWord(report.headline.hole).toLowerCase()
    : 'the open hole'
  const lead = report.headline.leadName

  if (report.headline.kind === 'cannot') {
    return {
      before: 'This profile ',
      mark: 'cannot take a book',
      after: ' yet.',
    }
  }
  if (report.headline.kind === 'no-lead') {
    return {
      before: 'This raise ',
      mark: 'has no lead',
      after: ' in the current mix.',
    }
  }
  if (!lead) {
    return {
      before: 'This raise ',
      mark: 'has no lead',
      after: ' in the current mix.',
    }
  }
  if (report.headline.kind === 'once-settled') {
    return {
      before: '',
      mark: lead,
      after: ` can lead once ${hole} is settled.`,
    }
  }
  return {
    before: '',
    mark: lead,
    after: ' can lead this raise.',
  }
}

export function beatsForInvestorPointer(
  report: InvestorMatchReport,
  pointerId: string,
): { title: string; lede: string | null; why: string; wrong: string | null; next: string | null } {
  const pointer = parseInvestorPointer(pointerId)

  switch (pointer.kind) {
    case 'book':
      return {
        title: 'The book',
        lede: formatCr(report.book.working),
        why: report.book.sentence,
        wrong: report.blockedBy
          ? `${report.blockedBy.name}: ${report.blockedBy.summary}`
          : null,
        next: report.argument,
      }
    case 'type': {
      const type = findInvestorType(report, pointer.typeId)
      if (!type) {
        return {
          title: 'Investor type',
          lede: null,
          why: 'This type is not in the mix.',
          wrong: null,
          next: null,
        }
      }
      return {
        title: type.name,
        lede: `${formatCheck(type.checkCr.low, type.checkCr.high)}  ·  ${formatRole(type.role)}`,
        why: type.why,
        wrong: type.fragile,
        next: type.next,
      }
    }
    case 'fill': {
      const fill = report.fills.find(item => item.typeId === pointer.typeId)
      const type = findInvestorType(report, pointer.typeId)
      if (!fill) {
        return {
          title: 'How it fills',
          lede: null,
          why: 'This slice is not in the book.',
          wrong: null,
          next: null,
        }
      }
      return {
        title: fill.label,
        lede: formatCrRange(fill.low, fill.high),
        why: type?.why ?? report.book.sentence,
        wrong: type?.fragile ?? (report.blockedBy
          ? `${report.blockedBy.name}: ${report.blockedBy.summary}`
          : null),
        next: type?.next ?? report.argument,
      }
    }
    case 'profile':
      return {
        title: 'Ask about the book',
        lede: report.lead ? report.lead.name : null,
        why: report.argument,
        wrong: report.blockedBy
          ? `${report.blockedBy.name}: ${report.blockedBy.summary}`
          : null,
        next: report.book.sentence,
      }
    default: {
      const _exhaustive: never = pointer
      return _exhaustive
    }
  }
}

export function investorSuggestions(
  report: InvestorMatchReport,
  pointerId: string | null,
): string[] {
  const pointer = pointerId
    ? parseInvestorPointer(pointerId)
    : { kind: 'profile' as const }
  switch (pointer.kind) {
    case 'book':
      return [
        'Who leads?',
        'Who should we not take meetings with?',
        'What would change the mix?',
      ]
    case 'type': {
      const type = findInvestorType(report, pointer.typeId)
      if (type?.role === 'skip') {
        return [
          'Why skip this?',
          'When would this type come back?',
          'What cheque do they actually write?',
        ]
      }
      if (type?.role === 'lead') {
        return [
          'Why this type leads?',
          'If we drop this type, how does the raise fill?',
          'What cheque do they actually write?',
        ]
      }
      return [
        'Why this type follows?',
        'If we drop this type, how does the raise fill?',
        'What cheque do they actually write?',
      ]
    }
    case 'fill':
      return [
        'Why this split, not a single lead for the whole raise?',
        'If the existing follow is real, what happens to new money?',
        'What would change this slice?',
      ]
    case 'profile':
      return [
        'Who leads?',
        'Who should we not take meetings with?',
        'What would change the mix?',
      ]
    default: {
      const _exhaustive: never = pointer
      return _exhaustive
    }
  }
}
