/**
 * Async API layer for the Fundraising Strategy page.
 *
 * ── HOW THIS WORKS ──────────────────────────────────────────────
 * The real backend endpoint is:
 *   GET /api/v1/companies/{companyId}/fundraising/phase1
 *
 * It returns a single JSON object with exactly these top-level keys:
 *   { executiveSummaryData, dealScorecardData, diligenceFindingsData, bandRecommendationsData }
 *
 * Right now we simulate that by reading zyla_deal_data.json + mockData.js.
 * When the real API is ready, replace the body of fetchPhase1() with
 *   return fetch(`/api/v1/companies/${companyId}/fundraising/phase1`).then(r => r.json());
 * and everything will just work.
 * ────────────────────────────────────────────────────────────────
 */

import { get, post } from '../../api/client';

function mapCategories(cats) {
  if (!cats || !Array.isArray(cats)) return undefined;
  return cats.map((cat) => {
    const rawChildren = cat.children || cat.subitems || cat.parameters;
    const hasChildren = Array.isArray(rawChildren) && rawChildren.length > 0;

    const baseWeight = cat.declaredWeight ?? cat.declared_weight ?? (typeof cat.weight === 'object' ? cat.weight?.declared : cat.weight) ?? cat.weights?.declaredWeight ?? 20;
    const isUnscored = (cat.score == null && cat.systemScore == null) || (hasChildren && rawChildren.every(c => c.score == null && c.systemScore == null));

    let appliedPct;
    if (isUnscored) {
      appliedPct = 0;
    } else {
      const rawApplied = cat.appliedWeightPct ?? cat.applied_weight_pct ?? cat.appliedWeight ?? cat.applied_weight ?? (typeof cat.weight === 'object' ? cat.weight?.applied : undefined);
      appliedPct = rawApplied != null ? Number(rawApplied) : baseWeight;
    }

    const mapped = {
      ...cat,
      code: cat.code || cat.ref || cat.key,
      ref: cat.ref || cat.code || cat.key,
      key: cat.key || cat.input_key || cat.code || cat.ref,
      declaredWeight: baseWeight,
      appliedWeightPct: appliedPct,
      appliedWeight: appliedPct > 1 ? appliedPct / 100 : appliedPct,
      weight: baseWeight,
    };

    if (hasChildren) {
      mapped.children = mapCategories(rawChildren);
    } else {
      delete mapped.children;
    }
    return mapped;
  });
}

// ── Assessment: Deal Evaluation ────────────────────────────────────
// Connects to GET /api/v1/companies/{companyId}/assessment

export async function fetchDealEvaluation(companyId) {
  const data = await get(`/companies/${companyId}/assessment`);

  const summaryObj = data.summary || {};
  const execSummary = summaryObj.executive_summary || {};
  const analysisObj = data.analysis || {};

  return {
    // ── Company metadata (header banner) ──
    company_name: data.company_name,
    company: data.company_name,
    sector: data.inputs?.sectors?.[0] || 'Healthcare',
    subSector: data.inputs?.sub_sector,
    dealStage: summaryObj.stage || data.inputs?.stage,
    askAmount: data.inputs?.raise_amount_usd_mn,
    capitalRaised: null,
    assessmentDate: data.created_at,
    overallScore: analysisObj.band_recommendations?.baseline?.overall ?? summaryObj.displayScore ?? summaryObj.overall_score,
    dealRating: analysisObj.band_recommendations?.baseline?.rating ?? summaryObj.displayRating ?? summaryObj.deal_rating,
    inputCoverage: summaryObj.coverage?.coverage_pct,
    strongestCategory: summaryObj.strongest_category,
    weakestCategory: summaryObj.weakest_category,
    bandLegend: null,

    // ── Top-level raw fields for api-adapter ──
    summary: summaryObj,
    inputs: data.inputs,
    created_at: data.created_at,
    analysis: analysisObj,

    // ── Categories tree ──
    categories: mapCategories(data.categories || []),

    // ── Executive summary ──
    executiveSummary: execSummary,

    // ── Diligence findings & recommendations ──
    diligenceFindings: analysisObj.diligence_findings || data.diligenceFindings || data.diligenceFindingsData || [],
    bandRecommendations: analysisObj.recommendations || data.recommendedMoves || data.bandRecommendationsData || data.bandRecommendations || [],
  };
}

// ── Assessment: Override ───────────────────────────────────────────
// POST /api/v1/companies/{companyId}/assessment/override

export async function submitOverride(companyId, parameterRef, overrideScore, reason) {
  return await post(`/companies/${companyId}/assessment/override`, {
    parameter_ref: parameterRef,
    override_score: overrideScore,
    reason,
  });
}

// ── Phase 2: Funding Valuation ──────────────────────────────────

export async function fetchValuation(companyId) {
  await delay();

  const dynamicRecommendation = JSON.parse(JSON.stringify(recommendationData));
  const targetRaiseKpi = dynamicRecommendation.kpis.find(k => k.label === 'Target Raise');
  if (targetRaiseKpi && zylaData.ask_amount) {
    targetRaiseKpi.value = zylaData.ask_amount;
  }

  return {
    valuation: valuationData,
    recommendation: dynamicRecommendation,
  };
}

// ── Phase 3: Investor Matching ──────────────────────────────────

export async function fetchInvestorMatching(companyId) {
  await delay();
  return investorMatchingData;
}
