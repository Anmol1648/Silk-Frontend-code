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
    const baseWeight = cat.declaredWeight ?? cat.declared_weight ?? cat.weight ?? cat.weights?.declaredWeight;
    const isUnscored = (cat.score == null && cat.systemScore == null) || (cat.children && cat.children.length > 0 && cat.children.every(c => c.score == null && c.systemScore == null));

    let appliedPct;
    if (isUnscored) {
      appliedPct = 0;
    } else {
      const rawApplied = cat.appliedWeightPct ?? cat.applied_weight_pct ?? cat.appliedWeight ?? cat.applied_weight;
      appliedPct = rawApplied != null ? Number(rawApplied) : baseWeight;
    }

    const mapped = {
      ...cat,
      code: cat.code || cat.ref,
      declaredWeight: baseWeight,
      appliedWeightPct: appliedPct,
      appliedWeight: appliedPct > 1 ? appliedPct / 100 : appliedPct,
      weight: baseWeight,
    };
    if (cat.children && cat.children.length > 0) {
      mapped.children = mapCategories(cat.children);
    } else {
      delete mapped.children;
      if (cat.weights) {
        if (mapped.declaredWeight === undefined || mapped.declaredWeight === null) {
          mapped.declaredWeight = cat.weights.declaredWeight ?? cat.weights.declared_weight;
        }
      }
    }
    return mapped;
  });
}

// ── Phase 1: Deal Evaluation ────────────────────────────────────
// Returns data in the EXACT shape the real API will return.

export async function fetchDealEvaluation(companyId) {
  const data = await get(`/companies/${companyId}/fundraising/phase1`);
  console.log("Phase1 API response:", data);

  const scorecardData = data.dealScorecardData || {};

  return {
    // ── Company metadata (header banner) ──
    company: data.company,
    sector: data.sector,
    subSector: data.sub_sector,
    dealStage: data.deal_stage,
    askAmount: data.ask_amount,
    capitalRaised: data.capital_raised,
    assessmentDate: data.assessment_date,
    overallScore: data.overall_score ?? scorecardData.system_score,
    dealRating: data.deal_rating || scorecardData.system_rating,
    inputCoverage: data.input_coverage ?? scorecardData.coveragePct,
    strongestCategory: data.strongest_category,
    weakestCategory: data.weakest_category,
    bandLegend: data.band_legend,

    // ── Phase 1 sections (exact API contract) ──
    dealScorecardData: scorecardData,
    categories: mapCategories(scorecardData.categories || data.categories || []),
    executiveSummary: data.executiveSummaryData || data.executiveSummary,
    diligenceFindings: data.diligenceFindingsData || data.diligenceFindings || [],
    bandRecommendations: data.recommendedMoves || data.bandRecommendationsData || data.bandRecommendations || [],
  };
}

// ── Phase 1: Override ───────────────────────────────────────────
// POST /api/v1/companies/{companyId}/fundraising/phase1/override
// When real API is ready, replace with actual fetch POST.

export async function submitOverride(companyId, parameterRef, overrideScore, reason) {
  return await post(`/companies/${companyId}/fundraising/phase1/override`, {
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
