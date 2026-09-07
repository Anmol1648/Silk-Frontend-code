import { DEAL_BAND_CUT, nextDealBand } from './bands'
import { findRow, isBranch } from './score'
import type {
  Citation,
  DealBand,
  DealFlag,
  DealMove,
  DealReport,
  FlagKind,
  MeasuredFact,
  ScoredBranch,
  ScoredLeaf,
  ScoredRow,
} from './types'

export type SourceKind = 'deck' | 'document' | 'web' | 'field' | 'report'

export type SourceRef = {
  kind: SourceKind
  kindLabel: string
  name: string
  locator: string | null
  href: string | null
  external: boolean
}

/** Company Profile holds uploaded decks and files until /documents is real. */
const INTERNAL_DOCS_HREF = '/readiness'

export type ProfileLook = 'in good shape' | 'needs improvement' | 'incomplete'

export type ScoreTab = 'score' | 'valuation' | 'investors'

export type LeafBeats = {
  why: string
  wrong: string | null
  raise: string | null
}

export type AdvancementTarget = {
  band: DealBand
  cut: number
}

/** Categories the company can still change. Sector and niche are market facts. */
const COMPANY_OWNED = new Set(['A', 'B', 'C', 'D'])

const CATEGORY_LABEL: Record<string, string> = {
  A: 'Team',
  B: 'Financials',
  C: 'Business',
  D: 'Round',
  E: 'Sector',
  F: 'Niche',
}

const NAME_ALIAS: Record<string, string> = {
  'A.2': 'Leadership',
  'A.1.a': 'Education',
  'A.1.b': 'Industry network',
  'A.1.c': 'Co-founder relationship',
  'A.1.d': 'Industry experience',
  'A.1.e': 'Prior startup experience',
}

const FLAG_RANK: Record<FlagKind, number> = {
  contradiction: 0,
  gap: 1,
  inferred: 2,
}

const FLAG_PREVIEW = 3

const JARGON = [
  /GAP AND CONFLICT\.?\s*/gi,
  /SINGLE LARGEST OPEN ITEM\.?\s*/gi,
  /per the Qualitative Anchors instruction[^.]*\.?\s*/gi,
  /See Evidence & Workings[^.]*\.?\s*/gi,
  /Already at the top band[^.]*\.?\s*/gi,
  /No specific evidence gap[^.]*\.?\s*/gi,
  /Independently verify[^.]*\.?\s*/gi,
  /Assumption [A-Z]\.\d+[^.]*\.?\s*/gi,
  /must be confirmed\.?\s*/gi,
]

export function collectLeaves(rows: ScoredRow[], into: ScoredLeaf[] = []) {
  for (const row of rows) {
    if (isBranch(row)) collectLeaves(row.children, into)
    else into.push(row)
  }
  return into
}

export function printName(row: { id: string; name: string }) {
  return row.name
}

function sentenceName(name: string) {
  return name.replace(/\b([A-Za-z0-9$]+)\b/g, (word, _whole, offset) => {
    if (/^[A-Z0-9$]{2,}$/.test(word)) return word
    if (/^[A-Z]{1,3}\d+$/.test(word)) return word
    if (offset === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    return word.toLowerCase()
  })
}

export function lookWord(score: number): ProfileLook {
  if (score >= 7) return 'in good shape'
  if (score >= 5) return 'needs improvement'
  return 'incomplete'
}

export function lookParts(look: ProfileLook) {
  if (look === 'needs improvement') return { before: 'The profile ', mark: 'needs improvement' }
  if (look === 'in good shape') return { before: 'The profile is ', mark: 'in good shape' }
  return { before: 'The profile is ', mark: 'incomplete' }
}

export function lookSentence(look: ProfileLook) {
  const { before, mark } = lookParts(look)
  return `${before}${mark}.`
}

export function printLook(score: number) {
  const look = lookWord(score)
  if (look === 'needs improvement') return 'Needs improvement'
  if (look === 'in good shape') return 'In good shape'
  return 'Incomplete'
}

export function formatScore(score: number) {
  return score.toFixed(1)
}

export function formatMoveLift(lift: number) {
  if (lift == null || isNaN(lift)) return '0.0'
  const rounded = Math.round(lift * 100) / 100
  if (rounded < 0.1 && rounded > 0) return rounded.toFixed(2)
  return rounded % 1 === 0 ? rounded.toFixed(1) : rounded.toString()
}

export function formatWeight(val: number) {
  if (val == null || isNaN(val)) return '0.0%'
  const pct = val > 1 ? val : val * 100
  return `${pct.toFixed(1)}%`
}

export function formatMeasured(fact: MeasuredFact) {
  if (!fact || fact.value == null) return ''
  const valStr = String(fact.value).trim()
  const unitStr = String(fact.unit || '').trim()

  // Clean any duplicated units e.g. "1.0% %" -> "1.0%", "9 years Years" -> "9 years"
  const cleanedVal = valStr
    .replace(/(%\s*)+%/g, '%')
    .replace(/\b(years?|months?|days?|cr|lakhs?|k)\s+\1\b/gi, '$1')

  if (typeof fact.value === 'string' && isNaN(Number(fact.value))) {
    const valLower = cleanedVal.toLowerCase()
    const unitLower = unitStr.toLowerCase()

    if (
      unitStr &&
      (valLower.endsWith(unitLower) ||
        ((unitLower === 'years' || unitLower === 'year') && valLower.includes('year')) ||
        ((unitLower === 'months' || unitLower === 'month') && valLower.includes('month')) ||
        ((unitLower === 'days' || unitLower === 'day') && valLower.includes('day')) ||
        (unitLower === '%' && valLower.includes('%')))
    ) {
      return cleanedVal
    }
    return unitStr ? `${cleanedVal} ${unitStr}` : cleanedVal
  }

  const num = Number(fact.value)
  const unit = unitStr.toLowerCase()
  const value = trimNumber(num)
  if (unit === 'years' || unit === 'year') {
    return cleanedVal.toLowerCase().includes('year') ? cleanedVal : `${value} ${value === '1' ? 'year' : 'years'}`
  }
  if (unit === 'months' || unit === 'month') {
    return cleanedVal.toLowerCase().includes('month') ? cleanedVal : `${value} ${value === '1' ? 'month' : 'months'}`
  }
  if (unit === 'days' || unit === 'day') {
    return cleanedVal.toLowerCase().includes('day') ? cleanedVal : `${value} ${value === '1' ? 'day' : 'days'}`
  }
  if (unit === '%') {
    return cleanedVal.includes('%') ? cleanedVal : `${value}%`
  }
  if (unit === 'count') return value
  return unitStr ? (cleanedVal.toLowerCase().endsWith(unit.toLowerCase()) ? cleanedVal : `${value} ${unitStr}`) : value
}

function trimNumber(value: number) {
  if (isNaN(value)) return ''
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 10) / 10)
}

export function printSentence(sentence: string | null, rows: ScoredRow[]) {
  if (!sentence) return null
  const named = collectNamed(rows).sort((a, b) => b.name.length - a.name.length)
  let next = sentence
  for (const row of named) {
    const printed = printName(row)
    if (printed !== row.name) next = next.split(row.name).join(printed)
  }
  return next
}

export function categoryLine(row: ScoredBranch) {
  if (row.sentence && row.sentence.trim()) {
    return asOneLine(row.sentence)
  }
  const leaves = collectLeaves(row.children)
  const flagged = leaves
    .filter(leaf => leaf.flag)
    .sort((a, b) => FLAG_RANK[a.flag!.kind] - FLAG_RANK[b.flag!.kind])
  const top = flagged[0]
  if (top?.flag) return asOneLine(top.flag.summary)

  const scored = leaves.filter((leaf): leaf is ScoredLeaf & { score: number } => leaf.score != null)
  if (!scored.length) return null
  const worst = scored.reduce((a, b) => (a.score <= b.score ? a : b))
  const best = scored.reduce((a, b) => (a.score >= b.score ? a : b))

  if (worst.reasoning) {
    const line = asOneLine(worst.reasoning)
    if (line) return line
  }

  if (worst.measured && worst.band) {
    return `${printName(worst)} is ${formatMeasured(worst.measured)}. That is ${worst.band.toLowerCase()}.`
  }

  if (best.id === worst.id) {
    return `${printName(best)} is ${(best.band ?? 'unscored').toLowerCase()}.`
  }
  if (worst.score <= 5) return `${printName(worst)} is the drag.`
  return `${printName(best)} leads. ${printName(worst)} is the constraint.`
}

function asOneLine(text: string) {
  const two = cutDown(text, 2)
  if (two.length > 0 && two.length <= 140) return two
  return cutDown(text, 1)
}

function collectNamed(rows: ScoredRow[], into: { id: string; name: string }[] = []) {
  for (const row of rows) {
    into.push(row)
    if (isBranch(row)) collectNamed(row.children, into)
  }
  return into
}

export function scoredCategories(report: DealReport) {
  return report.tree.filter(row => row.score != null && !row.notEnoughInformation)
}

export function shownFlags(report: DealReport) {
  const flags = [...report.flags].sort((a, b) => FLAG_RANK[a.kind] - FLAG_RANK[b.kind])
  return {
    flags,
    preview: flags.slice(0, FLAG_PREVIEW),
    total: flags.length,
    rest: Math.max(0, flags.length - FLAG_PREVIEW),
  }
}

export function flaggedIds(report: DealReport) {
  return new Set(report.flags.map(flag => flag.parameterId))
}

export function judgmentLine(report: DealReport) {
  const ranked = [...report.flags].sort((a, b) => FLAG_RANK[a.kind] - FLAG_RANK[b.kind])
  const cash = ranked.find(flag => /cash/i.test(flag.name) || /cash/i.test(flag.summary))
  const top = cash ?? ranked[0]
  if (top) {
    const name = printName({ id: top.parameterId, name: top.name })
    if (/cash/i.test(name) || /cash/i.test(top.summary)) {
      return 'Cash is the hole. The rest of the profile holds.'
    }
    return `${name} is the hole. The rest of the profile holds.`
  }

  const weakest = scoredCategories(report)
    .filter((row): row is ScoredRow & { score: number } => row.score != null)
    .sort((a, b) => a.score - b.score)[0]
  if (weakest && weakest.score < 6 && isBranch(weakest) && weakest.sentence) {
    return weakest.sentence
  }
  return null
}

export function nextMoves(report: DealReport) {
  const owned = report.moves.filter(move => isCompanyOwned(report, move.parameterId))
  const written = owned.filter(move => hasWrittenAction(report, move))
  const ranked = written.length ? written : owned
  if (!ranked.length) return []

  const blocking = ranked.filter(move => {
    const leaf = findRow(report.tree, move.parameterId)
    if (!leaf || isBranch(leaf) || !leaf.flag) return false
    return (
      /cash/i.test(move.name) ||
      leaf.flag.kind === 'gap' ||
      leaf.flag.kind === 'contradiction'
    )
  })
  const cash = blocking.find(move => /cash/i.test(move.name))
  const first = cash ?? blocking[0]
  const rest = first
    ? ranked.filter(move => move.parameterId !== first.parameterId)
    : ranked
  return (first ? [first, ...rest] : rest).slice(0, 3)
}

export function advancementTarget(report: DealReport): AdvancementTarget | null {
  const next = nextDealBand(report.band)
  if (!next) return null
  return { band: next, cut: DEAL_BAND_CUT[next] }
}

export function printBandStep(move: DealMove) {
  return `${move.from} → ${move.to}`
}

export function printMoveButton(move: DealMove, report: DealReport) {
  const row = findRow(report.tree, move.parameterId)
  const leaf = row && !isBranch(row) ? row : null
  if (leaf?.flag) return 'Settle this'
  return 'Review'
}

export function printMoveAction(move: DealMove, report: DealReport) {
  if (move.action) return move.action

  const row = findRow(report.tree, move.parameterId)
  const leaf = row && !isBranch(row) ? row : null
  const cut = thresholdCut(leaf, move)

  if (leaf?.flag && (/cash/i.test(move.name) || leaf.flag.kind === 'gap')) {
    const hole = cutDown(leaf.flag.summary, 1)
    return [hole.replace(/\.$/, ''), cut].filter(Boolean).join('. ')
  }

  const fromAsk = unwrapDiligenceAsk(leaf?.diligenceAsk ?? null)
  if (fromAsk) return fromAsk

  const fromReasoning = extractAsk(leaf?.reasoning ?? null)
  if (fromReasoning) return fromReasoning

  if (leaf?.soWhat) return cutDown(leaf.soWhat, 2)
  if (cut && leaf?.measured) {
    return `${formatMeasured(leaf.measured)} now. ${cut}`
  }
  if (cut) return cut
  if (/^confirm the gap/i.test(move.action) && leaf?.reasoning) {
    return cutDown(leaf.reasoning, 2)
  }
  if (/^no specific|^already at| is ≥ | is >= /i.test(move.action)) {
    return cut ?? `${move.to} is the next cut.`
  }
  return cutDown(move.action, 2)
}

function isCompanyOwned(report: DealReport, parameterId: string) {
  const root = ancestorsOf(report.tree, parameterId)[0] ?? parameterId
  return COMPANY_OWNED.has(root)
}

function hasWrittenAction(report: DealReport, move: DealMove) {
  const row = findRow(report.tree, move.parameterId)
  const leaf = row && !isBranch(row) ? row : null
  if (!leaf) return false
  if (leaf.flag) return true
  if (unwrapDiligenceAsk(leaf.diligenceAsk)) return true
  if (extractAsk(leaf.reasoning)) return true
  return false
}

function isRealAsk(ask: string) {
  return (
    !ask.startsWith('No specific evidence gap') &&
    !ask.startsWith('Already at the top band')
  )
}

function unwrapDiligenceAsk(ask: string | null) {
  if (!ask || !isRealAsk(ask)) return null
  const wrapped = ask.match(
    /Confirm the gap noted in diligence\s+[—-]\s+(.+?)\s+[—-]\s+to verify/i,
  )
  if (wrapped?.[1]) {
    const gap = wrapped[1].replace(
      /, so the (Excellent|Good|Fair|Poor) anchor.+$/i,
      '',
    )
    return cutDown(gap, 2)
  }
  if (/^confirm the gap/i.test(ask)) return null
  return cutDown(ask, 2)
}

function extractAsk(text: string | null) {
  if (!text) return null
  const cleaned = stripJargon(text)
  const match = cleaned.match(
    /(?:ASK(?:\s+for)?:?\s+|Confirm who |Confirm the |Get the |Sight |Resolve before )[^.]+/i,
  )
  return match ? cutDown(match[0], 2) : null
}

function thresholdCut(leaf: ScoredLeaf | null, move: DealMove) {
  if (leaf?.rubric?.kind === 'threshold' && leaf.nextBandLabel) {
    return `${move.to} starts at ${spokenCut(leaf.nextBandLabel)}.`
  }
  if (leaf?.rubric?.kind === 'threshold') return thresholdLine(move.action, move.to)
  return null
}

function cleanCut(label: string) {
  return label.replace(/^≥\s*/, '').replace(/^>=\s*/, '')
}

function thresholdLine(action: string, to: string) {
  const match = action.match(/≥\s*(.+)$/)
  if (!match?.[1]) return `${to} is the next cut.`
  return `${to} starts at ${match[1]}.`
}

export function ancestorsOf(rows: ScoredRow[], id: string): string[] {
  const walk = (nodes: ScoredRow[], path: string[]): string[] | null => {
    for (const row of nodes) {
      if (row.id === id) return path
      if (isBranch(row)) {
        const found = walk(row.children, [...path, row.id])
        if (found) return found
      }
    }
    return null
  }
  return walk(rows, []) ?? []
}

export function trailFor(report: DealReport, id: string) {
  const path = [...ancestorsOf(report.tree, id), id]
  return path
    .map(nodeId => {
      const row = findRow(report.tree, nodeId)
      return row ? printName(row) : null
    })
    .filter((name): name is string => Boolean(name))
    .slice(0, -1)
    .join(' · ')
}

export function weightLine(report: DealReport, leaf: ScoredLeaf) {
  const parents = ancestorsOf(report.tree, leaf.id)
  const parentId = parents[parents.length - 1]
  if (!parentId) return null
  const parent = findRow(report.tree, parentId)
  if (!parent) return null
  const share = Math.round(leaf.shareOfParent * 100)
  if (share <= 0) return null
  return `This is ${share}% of ${printName(parent)}.`
}

export function beatsForLeaf(leaf: ScoredLeaf, move?: DealMove | null): LeafBeats {
  return {
    why: whyBeat(leaf),
    wrong: wrongBeat(leaf),
    raise: raiseBeat(leaf, move),
  }
}

function whyBeat(leaf: ScoredLeaf) {
  if (leaf.reasoning) return cutDown(leaf.reasoning, 2)
  if (leaf.measured) {
    const band = leaf.band ? leaf.band.toLowerCase() : 'unscored'
    return `${formatMeasured(leaf.measured)}. That lands ${band}.`
  }
  return 'Not enough is in the profile to score this yet.'
}

function wrongBeat(leaf: ScoredLeaf) {
  if (leaf.flag) return leaf.flag.summary
  if (leaf.band === 'Good' || leaf.band === 'Excellent') return null
  return null
}

function raiseBeat(leaf: ScoredLeaf, move?: DealMove | null) {
  if (leaf.band === 'Excellent') return null
  if (leaf.nextBand && leaf.nextBandLabel) {
    return `To clear ${leaf.nextBand}, show ${spokenCut(leaf.nextBandLabel)}.`
  }
  if (move?.action && !/ is ≥ | is >= |^confirm the gap|^no specific|^already at/i.test(move.action)) {
    return cutDown(move.action, 2)
  }
  if (leaf.nextBand) return `To clear ${leaf.nextBand}, this has to move.`
  return null
}

function spokenCut(label: string) {
  return cleanCut(label)
    .replace(/\bMonths\b/g, 'months')
    .replace(/\bYears\b/g, 'years')
    .replace(/\bDays\b/g, 'days')
    .replace(/\s+%/g, '%')
}

function stripJargon(text: string) {
  let next = text
  for (const pattern of JARGON) next = next.replace(pattern, '')
  next = next.replace(/\s*—\s*/g, '. ').replace(/\s+/g, ' ').trim()
  next = next.replace(/[,\s]+$/g, '')
  if (next && !/[.!?]$/.test(next)) next += '.'
  return next
}

function cutDown(text: string, maxSentences: number) {
  const next = stripJargon(text)
  const sentences = next
    .split(/(?<=[A-Za-z]{2,}[.!?])\s+(?=[A-Z])/)
    .map(part => part.trim())
    .filter(
      part =>
        part.length > 12 &&
        !/M\.\s*BS|Evidence & Workings|row \d+|Assumption [A-Z]\.|^But M\.?$|Confidence is /i.test(part),
    )
  return sentences.slice(0, maxSentences).join(' ')
}

export function scoreSuggestions(leaf: ScoredLeaf) {
  if (!leaf.flag && (leaf.band === 'Good' || leaf.band === 'Excellent')) {
    return []
  }

  const name = printName(leaf)

  if (leaf.flag) {
    return [
      `What would settle ${name}?`,
      `How can ${name} be improved?`,
      `If ${name} were settled, what happens to the score?`,
    ]
  }

  if (leaf.band === 'Fair' || leaf.band === 'Poor') {
    const next = leaf.nextBand?.toLowerCase()
    const measuredCut =
      leaf.rubric?.kind === 'threshold' && leaf.nextBandLabel
        ? spokenCut(leaf.nextBandLabel).toLowerCase()
        : null

    return unique([
      `How can ${name} be improved?`,
      measuredCut
        ? `If ${name} were ${measuredCut}, what happens to the score?`
        : next
          ? `If ${name} were ${next}, what happens to the score?`
          : `What is the next cut for ${name}?`,
      next && measuredCut
        ? `If ${name} were ${next}, what happens to the score?`
        : `What is the next cut for ${name}?`,
    ])
  }

  return [
    `How can ${name} be improved?`,
    `What is missing for ${name}?`,
    'What would move the score?',
  ]
}

export function profileSuggestions(look: ProfileLook) {
  const why =
    look === 'needs improvement'
      ? 'Why does the profile need improvement?'
      : look === 'in good shape'
        ? 'Why is the profile in good shape?'
        : 'Why is the profile incomplete?'
  return [why, 'Which hole should we fix first?', 'What would move us a band?']
}

function unique(items: string[]) {
  return [...new Set(items)].slice(0, 3)
}

export function parentOfLeaf(report: DealReport, id: string): ScoredBranch | null {
  const parents = ancestorsOf(report.tree, id)
  const parentId = parents[parents.length - 1]
  if (!parentId) return null
  const row = findRow(report.tree, parentId)
  return row && isBranch(row) ? row : null
}

export function flagHeading(count: number) {
  if (count === 1) return '1 flag'
  return `${count} flags`
}

export function findMove(report: DealReport, parameterId: string): DealMove | null {
  return report.moves.find(move => move.parameterId === parameterId) ?? null
}

export function contradictionSource(leaf: ScoredLeaf) {
  if (leaf.flag?.kind !== 'contradiction') return null
  return printSourceLine(leaf)
}

/** Map citation type / filename to a kind the page can name. */
export function sourceKind(citation: Citation): SourceKind {
  const type = (citation.type ?? '').toLowerCase()
  const source = citation.source.toLowerCase()

  if (type.includes('field') || type.includes('knowledge')) return 'field'
  if (
    type.includes('web') ||
    type.includes('press') ||
    source === 'web research' ||
    (Boolean(citation.url) && /news|media|press|story/i.test(citation.source))
  ) {
    return 'web'
  }
  if (type.includes('deck') || /\.(pptx?|key)$/i.test(citation.source)) return 'deck'
  if (type.includes('report') || /research|insights|market report/i.test(citation.source)) {
    return 'report'
  }
  if (/\.pdf$/i.test(citation.source) || type.includes('document') || type.includes('pdf')) {
    return 'document'
  }
  return 'document'
}

function httpUrl(raw: string | undefined) {
  const value = raw?.trim()
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    return null
  }
  return null
}

function resolveSourceLink(
  citation: Citation,
  kind: SourceKind,
): { href: string; external: boolean } | null {
  const external = httpUrl(citation.url)
  if (external) return { href: external, external: true }

  if (kind === 'field' || kind === 'deck') {
    return { href: INTERNAL_DOCS_HREF, external: false }
  }
  if (/\.(pptx?|pdf|docx?|xlsx?|csv|key)$/i.test(citation.source)) {
    return { href: INTERNAL_DOCS_HREF, external: false }
  }
  if (kind === 'document' && (/^M\.\s/i.test(citation.source) || /^Project\s/i.test(citation.source))) {
    return { href: INTERNAL_DOCS_HREF, external: false }
  }
  return null
}

function printSourceKind(kind: SourceKind) {
  switch (kind) {
    case 'deck':
      return 'Company deck'
    case 'document':
      return 'Document'
    case 'web':
      return 'Web'
    case 'field':
      return 'Knowledge base'
    case 'report':
      return 'Report'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function shortSourceName(source: string) {
  const head = source.split(/\s+[—–-]\s+/)[0]?.trim()
  if (head && head.length < source.length && head.length <= 48) return head
  if (source.length <= 52) return source
  return `${source.slice(0, 49).trimEnd()}…`
}

function citationToRef(citation: Citation): SourceRef {
  const kind = sourceKind(citation)
  const link = resolveSourceLink(citation, kind)
  return {
    kind,
    kindLabel: printSourceKind(kind),
    name: shortSourceName(citation.source),
    locator: citation.locator?.trim() || null,
    href: link?.href ?? null,
    external: link?.external ?? false,
  }
}

/** All citations on the leaf, in order. Empty when none. */
export function sourceRefs(leaf: ScoredLeaf): SourceRef[] {
  return leaf.citations
    .filter(citation => citation.source.trim())
    .map(citationToRef)
}

/** First citation, or null. Prefer `sourceRefs` in UI. */
export function sourceRef(leaf: ScoredLeaf): SourceRef | null {
  return sourceRefs(leaf)[0] ?? null
}

/** Plain-text source line. Prefer `sourceRefs` in UI. */
export function printSourceLine(leaf: ScoredLeaf) {
  const ref = sourceRef(leaf)
  if (!ref) return null
  const base = `${ref.kindLabel} · ${ref.name}`
  return ref.locator ? `${base} · ${ref.locator}` : base
}
