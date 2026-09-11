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

function toText(val: any): string | null {
  if (val == null) return null
  if (typeof val === 'string') return val.trim() || null
  if (Array.isArray(val)) return val.map(toText).filter(Boolean).join(' ') || null
  if (typeof val === 'object') {
    if (typeof val.statement === 'string') return val.statement
    if (typeof val.text === 'string') return val.text
    if (typeof val.description === 'string') return val.description
    if (typeof val.explanation === 'string') return val.explanation
    if (typeof val.definition === 'string') return val.definition
    if (typeof val.scoring_basis === 'string') return val.scoring_basis
    if (typeof val.summary === 'string') return val.summary
    if (typeof val.ask === 'string') return val.ask
    return null
  }
  return String(val)
}

function mapLeaf(item: any, depth: number): ScoredLeaf {
  const p = item.parameter || item

  const score = item.score != null
    ? Number(item.score)
    : (p.score != null ? Number(p.score) : (p.assessment?.effective?.score != null ? Number(p.assessment.effective.score) : null))
  const band: LeafBand | null = item.band || p.band || p.assessment?.effective?.band || p.assessment?.system?.band || null
  const declaredWeight = Number(
    (typeof p.weight === 'object' ? p.weight?.declared : p.weight) ??
    item.declaredWeight ??
    item.declared_weight ??
    p.weights?.declaredWeight ??
    item.weights?.declaredWeight ??
    20
  )

  const rawApplied = (typeof p.weight === 'object' ? p.weight?.applied : undefined) ??
    item.appliedWeightPct ??
    item.applied_weight_pct ??
    item.appliedWeight ??
    item.applied_weight ??
    p.applied_weight ??
    p.appliedWeight

  let appliedWeight: number
  if (score == null) {
    appliedWeight = 0
  } else if (rawApplied != null) {
    const numApplied = Number(rawApplied)
    appliedWeight = numApplied > 1 ? numApplied / 100 : numApplied
  } else {
    appliedWeight = declaredWeight / 100
  }

  const leafId = p.key || item.key || item.inputKey || item.input_key || (p.is_reference ? `${p.ref || item.ref}_ref` : (p.ref || item.ref || item.code || item.id || ''))
  const leafName = item.name || p.name || ''

  const reasoning = toText(p.evidence?.reasoning ?? p.reasoning ?? p.justification_summary ?? p.assessment ?? item.reasoning ?? p.provenance?.statement ?? item.provenance?.statement)
  const basis = toText(p.trace?.explanation ?? p.anchor?.scoring_basis ?? p.dictionary?.definition ?? p.provenance?.statement ?? item.basis ?? item.scoringCriteria?.basis)
  const soWhat = toText(p.provenance?.statement ?? p.dictionary?.definition ?? item.provenance?.statement ?? item.reasoning)
  const diligenceAsk = toText(p.diligence_ask ?? p.diligenceAsk ?? item.diligence_ask ?? item.diligenceAsk ?? item.missingValueAsk ?? p.missingValueAsk ?? p.dataGaps ?? item.dataGaps)

  const rawValue = p.value?.display ?? p.value?.raw ?? item.valueDisplay ?? item.value
  const rawUnit = p.value?.unit ?? item.unit ?? ''
  const isBandValue = rawValue === 'Excellent' || rawValue === 'Good' || rawValue === 'Fair' || rawValue === 'Poor'
  const measured = (rawValue != null && rawValue !== '' && !isBandValue)
    ? { value: rawValue, unit: rawUnit }
    : null

  let citations: Citation[] = []
  const rawCitations = p.evidence?.citations || p.citations || item.citations || item.evidence?.citations
  if (Array.isArray(rawCitations) && rawCitations.length > 0) {
    citations = rawCitations.map((c: any) => ({
      source: c.source || p.provenance?.source || '',
      quote: c.quote || reasoning || p.justification_summary || '',
      locator: c.locator || '',
      url: c.url || p.provenance?.sourceUrl || '',
      type: c.source_type || c.type || p.provenance?.sourceKind || '',
      tier: c.source_tier != null ? `Tier ${c.source_tier}` : (c.tier ? `Tier ${c.tier}` : (p.provenance?.tierMeaning || undefined)),
    }))
  } else if (p.provenance?.source || item.provenance?.source) {
    const prov = p.provenance || item.provenance
    citations = [{
      source: prov.source,
      quote: reasoning || prov.statement || '',
      url: prov.sourceUrl || '',
      tier: prov.tierMeaning || (prov.tier ? `Tier ${prov.tier}` : undefined),
    }]
  }

  const evidenceTier = p.evidence?.tier || item.evidence?.tier || p.evidenceTier || item.evidenceTier || (p.provenance?.tier ? `Tier ${p.provenance.tier}` : null)
  const confidence = p.evidence?.confidence || item.evidence?.confidence || p.confidence || item.confidence || null

  const flag = (diligenceAsk || item.missingValueAsk || p.missingValueAsk || evidenceTier === 'Not Evidenced' || (p.dataGaps && p.dataGaps.length > 0) || (item.dataGaps && item.dataGaps.length > 0) || p.flag || item.flag)
    ? {
      kind: (p.flag?.kind || item.flag?.kind || ((Array.isArray(p.contradictions) && p.contradictions.length > 0) ? 'contradiction' : 'gap')) as FlagKind,
      summary: diligenceAsk || item.missingValueAsk || p.missingValueAsk || p.flag?.summary || item.flag?.summary || 'Missing parameter data',
    }
    : (band === 'Poor' || (score != null && score <= 3.0))
      ? { kind: 'contradiction' as FlagKind, summary: item.flagSummary || p.flagSummary || `${leafName} scored Poor.` }
      : (band === 'Fair' || (score != null && score <= 5.5 && reasoning))
        ? { kind: 'inferred' as FlagKind, summary: reasoning || `${leafName} requires verification.` }
        : null

  const apiBands = p.anchor?.bands || item.anchor?.bands || p.rubric?.labels || item.scoringCriteria?.bands
  let rubric: Rubric | undefined
  if (p.rubric) {
    rubric = {
      ...p.rubric,
      kind: p.rubric.kind || 'monotonic',
      labels: apiBands,
    } as Rubric
  } else if (apiBands && Object.keys(apiBands).length > 0) {
    rubric = {
      kind: 'qualitative',
      labels: apiBands,
    } as Rubric
  }

  const reportedValue = p.value?.display ?? (p.value?.raw != null ? String(p.value.raw) : null) ?? item.valueDisplay ?? (item.value != null ? String(item.value) : null) ?? null
  const effectiveBand = p.assessment?.effective?.band ?? p.band ?? item.band ?? null
  const asOf = toText(p.as_of ?? p.asOf ?? item.as_of ?? item.asOf)
  const periodBasis = toText(p.period_basis ?? p.periodBasis ?? p.period ?? item.period_basis ?? item.period)
  const insight = toText(p.justification_summary ?? p.insight ?? item.justification_summary ?? item.insight)

  const dictDefinition = toText(p.dictionary?.definition ?? item.dictionary?.definition ?? p.definition ?? item.definition)
  const dictWhereToFind = toText(p.dictionary?.where_to_find ?? item.dictionary?.where_to_find ?? p.where_to_find ?? item.where_to_find)
  const dictMeasuredOn = toText(p.dictionary?.measured_on ?? item.dictionary?.measured_on ?? p.measured_on ?? item.measured_on ?? dictDefinition)
  const dictionary = (dictDefinition || dictWhereToFind || dictMeasuredOn) ? {
    definition: dictDefinition,
    where_to_find: dictWhereToFind,
    measured_on: dictMeasuredOn,
  } : null

  const anchorBands = p.anchor?.bands ?? item.anchor?.bands ?? (rubric && 'labels' in rubric ? rubric.labels : undefined)
  const anchorEvidenceReq = toText(p.anchor?.evidence_required ?? item.anchor?.evidence_required ?? p.evidence_required)
  const anchorScoringBasis = toText(p.anchor?.scoring_basis ?? item.anchor?.scoring_basis)
  const anchor = (anchorBands || anchorEvidenceReq || anchorScoringBasis) ? {
    bands: anchorBands,
    evidence_required: anchorEvidenceReq,
    scoring_basis: anchorScoringBasis,
  } : null

  const weightWithinParent = Number((typeof p.weight === 'object' ? p.weight?.declared : undefined) ?? p.weights?.weightWithinParent ?? item.weights?.weightWithinParent ?? declaredWeight)
  const effectiveOfTotalPct = Number((typeof p.weight === 'object' ? p.weight?.effectiveOfTotalPct : undefined) ?? p.weights?.effectiveOfTotalPct ?? p.applied_weight ?? item.appliedWeightPct ?? item.applied_weight ?? (appliedWeight * 100))
  const weightsData = {
    weightWithinParent,
    effectiveOfTotalPct,
    declaredWeight,
    appliedWeight,
  }
  const contribution = (typeof p.weight === 'object' ? p.weight?.contribution : undefined) ?? p.contribution ?? item.contribution ?? (score != null ? (score * (appliedWeight || 0.1)) / 10 : null)

  return {
    id: leafId,
    name: leafName,
    depth,
    weight: declaredWeight,
    appliedWeight,
    score,
    band,
    notEnoughInformation: score == null,
    reasoning,
    basis,
    soWhat,
    diligenceAsk,
    nextBand: band === 'Good' ? 'Excellent' : band === 'Fair' ? 'Good' : band === 'Poor' ? 'Fair' : null,
    nextBandLabel: null,
    measured,
    citations,
    evidenceTier,
    confidence,
    flag,
    rubric,
    shareOfParent: 0.2,
    shareOfDeal: 0.05,
    reportedValue,
    effectiveBand,
    asOf,
    periodBasis,
    insight,
    dictionary,
    anchor,
    weightsData,
    contribution,
    trace: p.trace || item.trace || null,
    isReference: Boolean(p.is_reference ?? item.is_reference ?? false),
  }
}

function mapNode(item: any, depth: number): ScoredRow {
  const rawChildren = item.children || item.subitems || item.parameters
  const hasChildren = Array.isArray(rawChildren) && rawChildren.length > 0
  const score = item.score != null ? Number(item.score) : (item.assessment?.effective?.score != null ? Number(item.assessment.effective.score) : null)
  const band: LeafBand | null = item.band || item.assessment?.effective?.band || null
  const declaredWeight = Number(item.declaredWeight ?? item.declared_weight ?? (typeof item.weight === 'object' ? item.weight?.declared : item.weight) ?? 20)

  if (!hasChildren) {
    return mapLeaf(item, depth)
  }

  const children: ScoredRow[] = rawChildren.map((child: any) => mapNode(child, depth + 1))

  const rawApplied = item.appliedWeightPct ?? item.applied_weight_pct ?? item.appliedWeight ?? item.applied_weight ?? (typeof item.weight === 'object' ? item.weight?.applied : undefined) ?? item.weights?.appliedWeight
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

  const branchSentence = toText(item.description ?? item.sentence ?? item.summary)

  const branch: ScoredBranch = {
    id: item.code || item.ref || item.id || '',
    name: item.name || '',
    depth,
    weight: declaredWeight,
    appliedWeight,
    score,
    band,
    notEnoughInformation: score == null,
    sentence: branchSentence,
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
  const rawCategories = scorecard.categories || apiData.categories || apiData.data?.categories

  const summaryObj = apiData.summary || apiData.data?.summary || {}
  const analysisObj = apiData.analysis || apiData.data?.analysis || scorecard.analysis || {}
  const baselineObj = analysisObj.band_recommendations?.baseline || apiData.band_recommendations?.baseline || {}
  const overallScore = Number(
    baselineObj.overall ?? summaryObj.displayScore ?? summaryObj.overall_score ?? summaryObj.overallScore ?? apiData.overall_score ?? scorecard.system_score ?? apiData.overallScore ?? 6.37
  )
  const dealRating = (baselineObj.rating ?? summaryObj.displayRating ?? summaryObj.deal_rating ?? summaryObj.dealRating ?? apiData.deal_rating ?? scorecard.system_rating ?? apiData.dealRating ?? 'Average') as DealBand

  let tree: ScoredRow[] = []
  if (Array.isArray(rawCategories) && rawCategories.length > 0) {
    tree = rawCategories.map((cat: any) => mapNode(cat, 0))
  } else {
    tree = scoreDeal(novatechCase).tree
  }

  const execSummary = summaryObj.executive_summary || apiData.summary?.executive_summary || apiData.executive_summary || apiData.executiveSummaryData || apiData.executiveSummary || apiData.data?.summary?.executive_summary || apiData.data?.executive_summary
  const rawNarrative = execSummary?.narrative || summaryObj.narrative || apiData.narrative
  const memo: string[] = Array.isArray(rawNarrative)
    ? rawNarrative
    : typeof rawNarrative === 'string'
      ? [rawNarrative]
      : [
        `${apiData.company_name || apiData.company || execSummary?.companyName || 'The company'} is a ${summaryObj.stage || apiData.inputs?.stage || apiData.deal_stage || 'Series A'} stage company.`,
      ]

  const flags: DealFlag[] = []
  const redFlags = analysisObj.red_flags || apiData.red_flags || apiData.data?.red_flags || []
  const dataGaps = analysisObj.data_gaps || apiData.data_gaps || apiData.data?.data_gaps || []
  const findings = analysisObj.diligence_findings || apiData.diligence_findings || apiData.diligenceFindingsData || apiData.diligenceFindings || apiData.data?.diligence_findings

  if (Array.isArray(redFlags) && redFlags.length > 0) {
    redFlags.forEach((rf: any, idx: number) => {
      const leafId = rf.inputKey || rf.ref || `red-flag-${idx}`
      const leafName = rf.parameter || rf.name || rf.title || 'Red Flag'
      const summary = rf.headline || rf.ask || rf.finding || rf.summary || ''
      flags.push({
        parameterId: leafId,
        name: leafName,
        kind: 'contradiction',
        summary,
        headline: rf.headline || null,
        ask: rf.ask || null,
        severity: rf.severity || 'High',
        couldChangeRating: rf.couldChangeRating ?? false,
        ref: rf.ref,
        inputKey: rf.inputKey,
      })
    })
  }

  if (Array.isArray(dataGaps) && dataGaps.length > 0) {
    dataGaps.forEach((dg: any, idx: number) => {
      const leafId = dg.inputKey || dg.ref || `data-gap-${idx}`
      const leafName = dg.parameter || dg.name || dg.title || 'Data Gap'
      const summary = dg.headline || dg.ask || dg.finding || dg.summary || ''
      flags.push({
        parameterId: leafId,
        name: leafName,
        kind: 'gap',
        summary,
        headline: dg.headline || null,
        ask: dg.ask || null,
        severity: dg.severity || 'Medium',
        couldChangeRating: dg.couldChangeRating ?? false,
        ref: dg.ref,
        inputKey: dg.inputKey,
      })
    })
  }

  if (flags.length === 0 && Array.isArray(findings) && findings.length > 0) {
    findings.forEach((f: any, idx: number) => {
      const leafId = f.inputKey || f.ref || f.parameter_ref || f.parameterId || `flag-${idx}`
      const leafName = f.parameter || f.name || f.category || f.title || 'Diligence finding'
      const kind: FlagKind = (f.findingType === 'Contradiction' || f.check === 'contradiction' || (Array.isArray(f.contradictions) && f.contradictions.length > 0))
        ? 'contradiction'
        : (f.findingType === 'Data Gap' || f.severity === 'High' ? 'gap' : 'inferred')
      const summary = f.headline || f.finding || f.action || f.whyItMatters || f.summary || f.description || f.evidence || ''

      flags.push({
        parameterId: leafId,
        name: leafName,
        kind,
        summary,
        headline: f.headline || f.finding || null,
        ask: f.ask || f.action || null,
        severity: f.severity,
        whyItMatters: f.whyItMatters,
        action: f.action,
        evidence: f.evidence,
        materialityPct: f.materialityPct,
        findingType: f.findingType,
        ref: f.ref,
        inputKey: f.inputKey,
      })
    })
  }

  if (flags.length === 0) {
    extractFlagsFromTree(tree, flags)
  }

  // Synchronize leaves with the extracted flags so leaf.flag.kind accurately reflects red_flags vs data_gaps
  const leaves = collectLeaves(tree)
  for (const leaf of leaves) {
    const matchedFlag = flags.find(
      f =>
        f.parameterId === leaf.id ||
        (f.ref && (f.ref === (leaf as any).ref || f.ref === (leaf as any).code)) ||
        (f.inputKey && (f.inputKey === (leaf as any).inputKey || f.inputKey === (leaf as any).key)) ||
        (f.name && leaf.name && f.name.toLowerCase() === leaf.name.toLowerCase())
    )
    if (matchedFlag) {
      leaf.flag = {
        kind: matchedFlag.kind,
        summary: matchedFlag.headline || matchedFlag.summary || leaf.diligenceAsk || '',
      }
    }
  }

  let moves: DealMove[] = []
  const rawMoves = analysisObj.band_recommendations?.items || analysisObj.band_recommendations || analysisObj.recommendations || apiData.recommendedMoves || apiData.recommended_moves || apiData.bandRecommendationsData || apiData.bandRecommendations
  if (Array.isArray(rawMoves) && rawMoves.length > 0) {
    moves = rawMoves.map((m: any) => ({
      parameterId: m.inputKey || m.ref || m.parameterId || '',
      name: m.parameter || m.name || m.title || '',
      from: (m.currentBand || m.from || m.fromBand || 'Fair') as LeafBand,
      to: (m.targetBand || m.to || m.toBand || 'Good') as LeafBand,
      action: m.target || m.description || m.action || m.recommendation || '',
      lift: Number(m.overallImpact ?? m.lift ?? m.scoreLift ?? 0.1),
      displayValue: m.displayValue ?? null,
      currentBand: m.currentBand ?? null,
      targetBand: m.targetBand ?? null,
      target: m.target ?? null,
      overallImpact: m.overallImpact != null ? Number(m.overallImpact) : null,
      ref: m.ref ?? null,
      inputKey: m.inputKey ?? null,
    }))
  } else {
    moves = generateMovesFromTree(tree, overallScore)
  }

  const inputs = apiData.inputs || {}
  const companyName = apiData.company_name || apiData.company || execSummary?.companyName || 'Company'
  const sector = inputs.sectors?.[0] || apiData.sector || 'Healthcare'
  const stage = summaryObj.stage || inputs.stage || apiData.deal_stage || 'Series A'
  const ask = inputs.raise_amount_usd_mn != null
    ? `$${inputs.raise_amount_usd_mn}M`
    : (apiData.ask_amount || apiData.askAmount ? `$${apiData.ask_amount || apiData.askAmount}` : '$5.0M')
  const raised = apiData.capital_raised || apiData.capitalRaised ? `$${apiData.capital_raised || apiData.capitalRaised}` : '$500K'
  const assessed = apiData.created_at
    ? new Date(apiData.created_at).toISOString().slice(0, 10)
    : (apiData.assessment_date || apiData.assessmentDate || new Date().toISOString().slice(0, 10))

  return {
    mandate: {
      company: companyName,
      sector,
      stage,
      ask,
      raised,
      assessed,
    },
    memo,
    score: overallScore,
    band: dealRating,
    tree,
    flags,
    moves,
  }
}
