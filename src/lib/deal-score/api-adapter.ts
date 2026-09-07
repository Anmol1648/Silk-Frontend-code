import type {
  DealBand,
  DealFlag,
  DealMove,
  DealReport,
  FlagKind,
  LeafBand,
  Rubric,
  ScoredBranch,
  ScoredLeaf,
  ScoredRow,
} from './types'
import { scoreDeal, isBranch, collectLeaves, projectedMoveLift } from './score'
import { novatechCase } from './cases/novatech'

function generateMovesFromTree(tree: ScoredRow[], overallScore: number): DealMove[] {
  const leaves = collectLeaves(tree)
  const tempReport = { tree, score: overallScore } as any

  return leaves
    .flatMap(leaf => {
      if (leaf.score == null || !leaf.band || !leaf.nextBand) return []
      const action = leaf.diligenceAsk || leaf.reasoning || `${leaf.nextBand} is the next cut.`
      const lift = projectedMoveLift(tempReport, { parameterId: leaf.id, to: leaf.nextBand })
      return [
        {
          parameterId: leaf.id,
          name: leaf.name,
          from: leaf.band,
          to: leaf.nextBand,
          action,
          lift,
        },
      ]
    })
    .sort((a, b) => b.lift - a.lift)
}

function extractFlagsFromTree(rows: ScoredRow[], into: DealFlag[] = []) {
  for (const row of rows) {
    if (isBranch(row)) {
      extractFlagsFromTree(row.children, into)
    } else {
      if (row.flag) {
        into.push({
          parameterId: row.id,
          name: row.name,
          kind: row.flag.kind,
          summary: row.flag.summary || row.diligenceAsk || `Data gap on ${row.name}`,
        })
      } else if (row.notEnoughInformation && row.diligenceAsk) {
        into.push({
          parameterId: row.id,
          name: row.name,
          kind: 'gap',
          summary: row.diligenceAsk,
        })
      }
    }
  }
  return into
}

function mapLeaf(item: any, depth: number): ScoredLeaf {
  const score = item.score != null ? Number(item.score) : item.systemScore != null ? Number(item.systemScore) : null
  const band: LeafBand | null = item.band || item.systemBand || null
  const declaredWeight = Number(item.declaredWeight ?? item.declared_weight ?? item.weight ?? item.weights?.declaredWeight ?? item.weights?.weightWithinParent ?? 20)

  const rawApplied = item.appliedWeightPct ?? item.applied_weight_pct ?? item.appliedWeight ?? item.applied_weight ?? item.weights?.appliedWeight
  let appliedWeight: number
  if (score == null) {
    appliedWeight = 0
  } else if (rawApplied != null) {
    const numApplied = Number(rawApplied)
    appliedWeight = numApplied > 1 ? numApplied / 100 : numApplied
  } else {
    appliedWeight = declaredWeight / 100
  }

  return {
    id: item.inputKey || item.ref || item.id || '',
    name: item.name || '',
    depth,
    weight: declaredWeight,
    appliedWeight,
    score,
    band,
    notEnoughInformation: score == null,
    reasoning: item.reasoning || item.provenance?.statement || null,
    soWhat: item.provenance?.statement || item.reasoning || null,
    diligenceAsk: item.missingValueAsk || null,
    nextBand: band === 'Good' ? 'Excellent' : band === 'Fair' ? 'Good' : band === 'Poor' ? 'Fair' : null,
    nextBandLabel: null,
    measured: (item.valueDisplay != null && item.valueDisplay !== '') || (item.value != null && item.value !== '')
      ? { value: item.valueDisplay ?? item.value, unit: item.unit || '' }
      : null,
    citations: item.provenance?.source
      ? [{ source: item.provenance.source, quote: item.reasoning || item.provenance?.statement }]
      : [],
    evidenceTier: item.evidenceTier || null,
    confidence: item.confidence || null,
    flag: item.missingValueAsk || item.evidenceTier === 'Not Evidenced' || (item.dataGaps && item.dataGaps.length > 0)
      ? { kind: 'gap', summary: item.missingValueAsk || 'Missing parameter data' }
      : band === 'Poor' || (score != null && score <= 3.0)
        ? { kind: 'contradiction', summary: item.flagSummary || `${item.name} scored Poor.` }
        : null,
    rubric: item.scoringCriteria?.bands && Object.keys(item.scoringCriteria.bands).length > 0
      ? ({
        kind: 'qualitative',
        labels: item.scoringCriteria.bands,
      } as Rubric)
      : undefined,
    shareOfParent: 0.2,
    shareOfDeal: 0.05,
  }
}

function mapNode(item: any, depth: number): ScoredRow {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0
  const score = item.score != null ? Number(item.score) : null
  const band: LeafBand | null = item.band || null
  const declaredWeight = Number(item.declaredWeight ?? item.declared_weight ?? item.weight ?? 20)

  if (!hasChildren) {
    return mapLeaf(item, depth)
  }

  const children: ScoredRow[] = item.children.map((child: any) => mapNode(child, depth + 1))

  const rawApplied = item.appliedWeightPct ?? item.applied_weight_pct ?? item.appliedWeight ?? item.applied_weight ?? item.weights?.appliedWeight
  let appliedWeight: number
  if (rawApplied != null) {
    const numApplied = Number(rawApplied)
    appliedWeight = numApplied > 1 ? numApplied / 100 : numApplied
  } else if (score == null && children.every(c => c.score == null)) {
    appliedWeight = 0
  } else {
    const childrenAppliedSum = children.reduce((sum, c) => sum + (c.appliedWeight || 0), 0)
    appliedWeight = childrenAppliedSum > 0 ? childrenAppliedSum : declaredWeight / 100
  }

  const branch: ScoredBranch = {
    id: item.ref || item.id || '',
    name: item.name || '',
    depth,
    weight: declaredWeight,
    appliedWeight,
    score,
    band,
    notEnoughInformation: score == null,
    sentence: item.summary || item.description || item.sentence || null,
    children,
    shareOfParent: 0.2,
    shareOfDeal: 0.1,
  }
  return branch
}

export function buildDealReportFromApi(apiData: any): DealReport {
  if (!apiData) {
    return scoreDeal(novatechCase)
  }

  const scorecard = apiData.dealScorecardData || apiData
  const rawCategories = scorecard.categories || apiData.categories

  if (!rawCategories || !Array.isArray(rawCategories) || rawCategories.length === 0) {
    return scoreDeal(novatechCase)
  }

  const tree: ScoredRow[] = rawCategories.map((cat: any) => mapNode(cat, 0))

  const overallScore = Number(
    apiData.overall_score ?? scorecard.system_score ?? apiData.overallScore ?? 6.48
  )
  const dealRating = (apiData.deal_rating || scorecard.system_rating || apiData.dealRating || 'Average') as DealBand

  const execSummary = apiData.executiveSummaryData || apiData.executiveSummary
  const memo: string[] = Array.isArray(execSummary?.narrative)
    ? execSummary.narrative
    : typeof execSummary?.narrative === 'string'
      ? [execSummary.narrative]
      : [
        `${apiData.company || execSummary?.companyName || 'The company'} is a ${apiData.deal_stage || 'Series A'} stage company.`,
      ]

  const flags: DealFlag[] = []
  if (Array.isArray(apiData.diligenceFindingsData || apiData.diligenceFindings)) {
    const findings = apiData.diligenceFindingsData || apiData.diligenceFindings
    findings.forEach((f: any, idx: number) => {
      const leafId = f.inputKey || f.ref || f.parameter_ref || f.parameterId || `flag-${idx}`
      const leafName = f.category || f.title || f.name || 'Diligence finding'
      const kind: FlagKind = Array.isArray(f.contradictions) && f.contradictions.length > 0
        ? 'contradiction'
        : (f.kind === 'contradiction' || f.kind === 'inferred' ? f.kind : 'gap')
      const summary = f.ask || f.description || f.summary || f.evidence || ''

      flags.push({
        parameterId: leafId,
        name: leafName,
        kind,
        summary,
      })
    })
  } else {
    extractFlagsFromTree(tree, flags)
  }

  let moves: DealMove[] = []
  const rawMoves = apiData.recommendedMoves || apiData.recommended_moves || apiData.bandRecommendationsData || apiData.bandRecommendations
  if (Array.isArray(rawMoves) && rawMoves.length > 0) {
    moves = rawMoves.map((m: any) => ({
      parameterId: m.parameterId || m.ref || m.inputKey || '',
      name: m.name || m.title || '',
      from: m.from || m.fromBand || 'Fair',
      to: m.to || m.toBand || 'Good',
      action: m.action || m.recommendation || m.description || '',
      lift: Number(m.lift ?? m.scoreLift ?? 0.1),
    }))
  } else {
    moves = generateMovesFromTree(tree, overallScore)
  }

  return {
    mandate: {
      company: apiData.company || execSummary?.companyName || 'Zyla Health',
      sector: apiData.sector || 'Healthtech',
      stage: apiData.deal_stage || apiData.dealStage || scorecard.dealStage || 'Series A',
      ask: apiData.ask_amount || apiData.askAmount ? `$${apiData.ask_amount || apiData.askAmount}` : '$1.5M',
      raised: apiData.capital_raised || apiData.capitalRaised ? `$${apiData.capital_raised || apiData.capitalRaised}` : '$500K',
      assessed: apiData.assessment_date || apiData.assessmentDate || new Date().toISOString().slice(0, 10),
    },
    memo,
    score: overallScore,
    band: dealRating,
    tree,
    flags,
    moves,
  }
}
