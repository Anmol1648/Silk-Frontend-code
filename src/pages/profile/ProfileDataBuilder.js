/**
 * ProfileDataBuilder.js
 *
 * Pure data-transformation logic for converting the API company-profile
 * response into the readiness category/subsection/item structure used by
 * the Company Profile page.  No React — just functions and constants.
 */

import {
  PROFILE_CATEGORIES,
  SECTION_TO_CATEGORY,
  detectFieldKind,
  getSelectOptions,
} from '../../components/readiness/profile-utils';

/* ── Constants ── */

const SKIP_KEYS = new Set([
  'total_funding_raised_usd_mn', 'latest_pre_money_usd_mn', 'latest_post_money_usd_mn',
  'total_funding_raised_display', 'latest_pre_money_display', 'latest_post_money_display',
]);

export const SECTION_SUBFIELDS = {
  business_model: [
    { key: 'business_model_types', name: 'Business Model Types' },
    { key: 'customer_type', name: 'Customer Type' },
    { key: 'value_proposition', name: 'Value Proposition' },
    { key: 'delivery_model', name: 'Delivery Model' },
    { key: 'pricing_model', name: 'Pricing Model' },
    { key: 'sales_model', name: 'Sales Model' },
    { key: 'distribution_channels', name: 'Distribution Channels' },
  ],
  company_story: [
    { key: 'origin_story', name: 'Origin Story' },
    { key: 'brand_evolution', name: 'Brand Evolution' },
    { key: 'milestones', name: 'Milestones' },
    { key: 'usp', name: 'Unique Selling Proposition' },
  ],
  industry_research: [
    { key: 'industry_evolution', name: 'Industry Evolution & Dynamics' },
    { key: 'market_sizing_narrative', name: 'Market Sizing Narrative' },
    { key: 'methodology', name: 'Market Sizing Methodology' },
    { key: 'market_sizing', name: 'TAM / SAM / SOM Breakdown' },
    { key: 'performance_trends', name: 'Performance & Market Trends' },
    { key: 'regulatory_developments', name: 'Regulatory Developments' },
  ],
  financial_summary: [
    { key: 'financials', name: 'Financial Performance' },
    { key: 'observations', name: 'Financial Observations' },
  ],
  investors_cap_table: [
    { key: 'cap_table_summary', name: 'Cap Table Ownership' },
    { key: 'investors_list', name: 'Investors List' },
  ],
  investment_thesis: [
    { key: 'opportunity_explanation', name: 'Investment Opportunity' },
    { key: 'leadership_assessment', name: 'Leadership Assessment' },
    { key: 'risks_and_concerns', name: 'Risks & Concerns' },
  ],
};

/* ── Helpers ── */

export function getSectionCandidateKeys(sectionKey, fieldKey) {
  if (!fieldKey || fieldKey === 'array' || fieldKey === 'obj') {
    const keysMap = {
      founders: ['founders'],
      products_services: ['products_services'],
      customers_markets: ['customers_markets'],
      competitive_advantages: ['competitive_advantages'],
      competitors: ['competitors'],
      industry_research: ['industry_evolution', 'market_sizing_narrative', 'methodology', 'market_sizing', 'performance_trends', 'regulatory_developments'],
      business_model: ['business_model_types', 'customer_type', 'value_proposition', 'delivery_model', 'pricing_model', 'sales_model', 'distribution_channels'],
      revenue_model: ['revenue_model'],
      company_metrics: ['company_metrics'],
      financial_summary: ['financials', 'observations'],
      funding_history: ['funding_history'],
      investors_cap_table: ['cap_table_summary', 'investors_list'],
      news: ['news'],
      company_story: ['origin_story', 'brand_evolution', 'milestones', 'usp'],
      investment_thesis: ['opportunity_explanation', 'leadership_assessment', 'risks_and_concerns'],
      document_center: ['documents'],
    };
    return keysMap[sectionKey] || [fieldKey, sectionKey];
  }
  if (fieldKey.includes('total_funding_raised')) {
    return ['total_funding_raised_usd_mn'];
  }
  if (fieldKey.includes('latest_pre_money')) {
    return ['latest_pre_money_usd_mn'];
  }
  if (fieldKey.includes('latest_post_money')) {
    return ['latest_post_money_usd_mn'];
  }
  return [fieldKey];
}

export function isItemConfirmed(confirmedFields, fieldKey, sectionKey) {
  if (!confirmedFields || !confirmedFields.length) return false;
  const candidates = getSectionCandidateKeys(sectionKey, fieldKey);
  return confirmedFields.some(k => candidates.includes(k) || k === fieldKey || k === String(fieldKey) || k === Number(fieldKey) || k === sectionKey);
}

/* ── Main builder ── */

/**
 * Transforms the raw API profile response into the categories / subsections /
 * items structure consumed by the Company Profile UI.
 *
 * Returns `{ categories, values, confirmed }` or `null` if the input is empty.
 */
export function buildReadinessData(apiData, fetchedCountries, lookups) {
  if (!apiData || !apiData.sections) return null;

  const nextValues = {};
  const nextConfirmed = {};
  const catsMap = {};
  PROFILE_CATEGORIES.forEach(c => { catsMap[c.id] = []; });

  Object.entries(apiData.sections).forEach(([sectionKey, sectionObj]) => {
    const catId = SECTION_TO_CATEGORY[sectionKey];
    if (!catId) return;

    const items = [];
    const sectionData = sectionObj.data || {};
    const confirmedFields = sectionObj.confirmed_fields || [];

    if (sectionKey === 'founders') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({
          id: p.id,
          name: p.name || '',
          role: p.role || '',
          background: p.background || p.description || '',
          linkedin_url: p.linkedin_url || '',
          is_full_time: p.is_full_time ?? false,
          is_founder: p.is_founder ?? true,
        }));
      }

      items.push({
        id,
        name: 'Founders and Key People',
        kind: 'founders_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });

      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) {
        nextConfirmed[id] = true;
      }
    } else if (sectionKey === 'products_services') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({
          id: p.id,
          name: p.name || '',
          category: p.category || '',
          description: p.description || '',
        }));
      }

      items.push({
        id,
        name: 'Products & Services',
        kind: 'products_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });

      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) {
        nextConfirmed[id] = true;
      }
    } else if (sectionKey === 'customers_markets') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({
          id: p.id,
          market: p.market || '',
          customer_type: p.customer_type || '',
          geography: p.geography || '',
        }));
      }
      items.push({
        id, name: 'Customers & Markets', kind: 'markets_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'competitive_advantages') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({
          id: p.id,
          title: p.title || p.name || '',
          description: p.description || '',
        }));
      }
      items.push({
        id, name: 'Competitive Advantages', kind: 'advantages_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'competitors') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({ ...p }));
      }
      items.push({
        id, name: 'Competitors', kind: 'competitors_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'industry_research') {
      const id = `${sectionKey}__obj`;
      const totalCount = 6;
      const confirmedCount = ['industry_evolution', 'market_sizing_narrative', 'methodology', 'market_sizing', 'performance_trends', 'regulatory_developments'].filter(k => confirmedFields.includes(k)).length;
      const populatedCount = sectionObj.populated ?? (apiData.readinessBreakdown?.find(b => b.sectionKey === sectionKey)?.populated ?? totalCount);
      const isConf = confirmedCount === totalCount || (populatedCount > 0 && confirmedCount >= populatedCount) || confirmedFields.includes('obj') || confirmedFields.includes('industry_research');
      items.push({
        id, name: 'Industry Research', kind: 'industry_research_obj',
        status: sectionData.industry_evolution ? 'analyzed' : 'needs_input',
        aiFilled: !!sectionData.industry_evolution,
        totalCount, confirmedCount,
      });
      nextValues[id] = sectionData;
      if (isConf && sectionData.industry_evolution) nextConfirmed[id] = true;
    } else if (sectionKey === 'business_model') {
      const id = `${sectionKey}__obj`;
      const totalCount = 7;
      const confirmedCount = ['business_model_types', 'customer_type', 'value_proposition', 'delivery_model', 'pricing_model', 'sales_model', 'distribution_channels'].filter(k => confirmedFields.includes(k)).length;
      const populatedCount = sectionObj.populated ?? (apiData.readinessBreakdown?.find(b => b.sectionKey === sectionKey)?.populated ?? totalCount);
      const isConf = confirmedCount === totalCount || (populatedCount > 0 && confirmedCount >= populatedCount) || confirmedFields.includes('obj') || confirmedFields.includes('business_model');
      items.push({
        id, name: 'Business Model', kind: 'business_model_obj',
        status: sectionData.value_proposition ? 'analyzed' : 'needs_input',
        aiFilled: !!sectionData.value_proposition,
        totalCount, confirmedCount,
      });
      nextValues[id] = sectionData;
      if (isConf && sectionData.value_proposition) nextConfirmed[id] = true;
    } else if (sectionKey === 'revenue_model') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => {
          let sp = p.share_percent;
          if (sp !== null && sp !== undefined && sp !== '' && !isNaN(Number(sp))) {
            sp = Number(Number(sp).toFixed(1));
          }
          return {
            id: p.id,
            stream: p.stream || '',
            share_percent: sp,
          };
        });
      }
      items.push({
        id, name: 'Revenue Model', kind: 'revenue_model_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'company_metrics') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => {
          let rawVal = String(p.value || '').trim();
          let rawUnit = String(p.unit || '').trim();

          if (rawVal.endsWith('%')) {
            rawVal = rawVal.replace(/%/g, '').trim();
            if (!rawUnit) rawUnit = '%';
          }

          if ((rawUnit === '%' || rawUnit.includes('%')) && rawVal !== '' && !isNaN(Number(rawVal))) {
            rawVal = Number(rawVal).toFixed(1);
          }

          return {
            id: p.id,
            metric: p.metric || '',
            value: rawVal,
            unit: p.unit || rawUnit || '',
          };
        });
      }
      items.push({
        id, name: 'Company Metrics', kind: 'company_metrics_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'financial_summary') {
      const id = `${sectionKey}__obj`;
      let finData = { ...(sectionData || {}) };
      if (Array.isArray(finData.financials)) {
        finData.financials = finData.financials.map(f => {
          const fmt2 = (v) => (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(Number(v).toFixed(2)) : v;
          const fmt1 = (v) => (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(Number(v).toFixed(1)) : v;
          return {
            ...f,
            revenue_m: fmt2(f.revenue_m),
            ebitda_m: fmt2(f.ebitda_m),
            pat_m: fmt2(f.pat_m),
            yoy_revenue_growth_pct: fmt1(f.yoy_revenue_growth_pct),
            ev_revenue_multiple: fmt2(f.ev_revenue_multiple),
          };
        });
      }
      const totalCount = 2;
      const confirmedCount = ['financials', 'observations'].filter(k => confirmedFields.includes(k)).length;
      const populatedCount = sectionObj.populated ?? (apiData.readinessBreakdown?.find(b => b.sectionKey === sectionKey)?.populated ?? totalCount);
      const isConf = confirmedCount === totalCount || (populatedCount > 0 && confirmedCount >= populatedCount) || confirmedFields.includes('obj') || confirmedFields.includes('financial_summary');
      items.push({
        id, name: 'Financial Summary', kind: 'financial_summary_obj',
        status: (finData.financials && finData.financials.length > 0) ? 'analyzed' : 'needs_input',
        aiFilled: !!(finData.financials && finData.financials.length > 0),
        totalCount, confirmedCount,
      });
      nextValues[id] = finData;
      if (isConf && finData.financials && finData.financials.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'funding_history') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({ ...p }));
      }
      items.push({
        id, name: 'Funding History', kind: 'funding_history_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'investors_cap_table') {
      const id = `${sectionKey}__obj`;
      let capData = { ...(sectionData || {}) };
      if (capData.cap_table_summary && Array.isArray(capData.cap_table_summary.ownership)) {
        capData.cap_table_summary = {
          ...capData.cap_table_summary,
          ownership: capData.cap_table_summary.ownership.map(o => {
            let op = o.ownership_pct;
            if (op !== null && op !== undefined && op !== '' && !isNaN(Number(op))) {
              op = Number(Number(op).toFixed(1));
            }
            return { ...o, ownership_pct: op };
          }),
        };
      }
      if (Array.isArray(capData.investors_list)) {
        capData.investors_list = capData.investors_list.map(inv => {
          const fmt2 = (v) => (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(Number(v).toFixed(2)) : v;
          return {
            ...inv,
            funding_amount_usd_mn: fmt2(inv.funding_amount_usd_mn),
            valuation_usd_mn: fmt2(inv.valuation_usd_mn),
          };
        });
      }
      const totalCount = 2;
      const confirmedCount = ['cap_table_summary', 'investors_list'].filter(k => confirmedFields.includes(k)).length;
      const populatedCount = sectionObj.populated ?? (apiData.readinessBreakdown?.find(b => b.sectionKey === sectionKey)?.populated ?? totalCount);
      const isConf = confirmedCount === totalCount || (populatedCount > 0 && confirmedCount >= populatedCount) || confirmedFields.includes('obj') || confirmedFields.includes('investors_cap_table');
      items.push({
        id, name: 'Investors & Cap Table', kind: 'investors_cap_table_obj',
        status: (capData.investors_list && capData.investors_list.length > 0) ? 'analyzed' : 'needs_input',
        aiFilled: !!(capData.investors_list && capData.investors_list.length > 0),
        totalCount, confirmedCount,
      });
      nextValues[id] = capData;
      if (isConf && capData.investors_list && capData.investors_list.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'news') {
      const id = `${sectionKey}__array`;
      let valArray = [];
      if (Array.isArray(sectionData)) {
        valArray = sectionData.map(p => ({ ...p }));
      }
      items.push({
        id, name: 'News & Press', kind: 'news_array',
        status: valArray.length ? 'analyzed' : 'needs_input',
        aiFilled: valArray.length > 0,
      });
      nextValues[id] = valArray;
      if (isItemConfirmed(confirmedFields, 'array', sectionKey) && valArray.length > 0) nextConfirmed[id] = true;
    } else if (sectionKey === 'company_story') {
      const id = `${sectionKey}__obj`;
      const totalCount = 4;
      const confirmedCount = ['origin_story', 'brand_evolution', 'milestones', 'usp'].filter(k => confirmedFields.includes(k)).length;
      const populatedCount = sectionObj.populated ?? (apiData.readinessBreakdown?.find(b => b.sectionKey === sectionKey)?.populated ?? totalCount);
      const isConf = confirmedCount === totalCount || (populatedCount > 0 && confirmedCount >= populatedCount) || confirmedFields.includes('obj') || confirmedFields.includes('company_story');
      items.push({
        id, name: 'Company Story', kind: 'company_story_obj',
        status: sectionData.origin_story ? 'analyzed' : 'needs_input',
        aiFilled: !!sectionData.origin_story,
        totalCount, confirmedCount,
      });
      nextValues[id] = sectionData;
      if (isConf && sectionData.origin_story) nextConfirmed[id] = true;
    } else if (sectionKey === 'investment_thesis') {
      const id = `${sectionKey}__obj`;
      const totalCount = 3;
      const confirmedCount = ['opportunity_explanation', 'leadership_assessment', 'risks_and_concerns'].filter(k => confirmedFields.includes(k)).length;
      const populatedCount = sectionObj.populated ?? (apiData.readinessBreakdown?.find(b => b.sectionKey === sectionKey)?.populated ?? totalCount);
      const isConf = confirmedCount === totalCount || (populatedCount > 0 && confirmedCount >= populatedCount) || confirmedFields.includes('obj') || confirmedFields.includes('investment_thesis');
      items.push({
        id, name: 'Investment Thesis', kind: 'investment_thesis_obj',
        status: sectionData.opportunity_explanation ? 'analyzed' : 'needs_input',
        aiFilled: !!sectionData.opportunity_explanation,
        totalCount, confirmedCount,
      });
      nextValues[id] = sectionData;
      if (isConf && sectionData.opportunity_explanation) nextConfirmed[id] = true;
    } else if (sectionKey === 'document_center') {
      const id = `${sectionKey}__documents`;
      const docs = sectionData.documents || [];
      const hasVal = docs.length > 0;
      items.push({
        id, name: 'Investment material', kind: 'document_center_obj',
        status: hasVal ? 'analyzed' : 'needs_input',
        aiFilled: hasVal,
        totalCount: 1,
        confirmedCount: (confirmedFields.includes('documents') || confirmedFields.includes('document_center') || confirmedFields.includes('obj')) ? 1 : 0,
      });
      nextValues[id] = docs;
      if ((confirmedFields.includes('documents') || confirmedFields.includes('document_center') || confirmedFields.includes('obj')) && hasVal) nextConfirmed[id] = true;
    } else if (Array.isArray(sectionData)) {
      // Handle sections that are arrays (metrics, etc)
      sectionData.forEach((item, idx) => {
        const title = item.name || item.title || item.metric || item.market || item.stream || item.date || `Item ${idx + 1}`;
        const id = `${sectionKey}__${idx}`;

        let valStr = '';
        if (item.value !== undefined) {
          const vStr = String(item.value).trim()
            .replace(/(%\s*)+%/g, '%')
            .replace(/\b(years?|months?|days?|cr|lakhs?|k)\s+\1\b/gi, '$1');
          const uStr = String(item.unit || '').trim();
          const vLower = vStr.toLowerCase();
          const uLower = uStr.toLowerCase();
          if (
            uStr &&
            (vLower.endsWith(uLower) ||
              (uLower === '%' && vLower.includes('%')) ||
              ((uLower === 'years' || uLower === 'year') && vLower.includes('year')) ||
              ((uLower === 'months' || uLower === 'month') && vLower.includes('month')) ||
              ((uLower === 'days' || uLower === 'day') && vLower.includes('day')))
          ) {
            valStr = vStr;
          } else {
            valStr = `${vStr} ${uStr}`.trim();
          }
        } else {
          Object.entries(item).forEach(([k, v]) => {
            if (v && k !== 'name' && k !== 'title' && k !== 'metric' && k !== 'market' && k !== 'stream' && k !== 'date') {
              const vStr = Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : v);
              valStr += `${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${vStr}\n\n`;
            }
          });
        }

        items.push({
          id,
          name: title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          kind: valStr.length > 50 || valStr.includes('\n') ? 'textarea' : 'text',
          status: valStr ? 'analyzed' : 'needs_input',
          aiFilled: !!valStr,
        });

        nextValues[id] = valStr.trim();
        if (isItemConfirmed(confirmedFields, idx.toString(), sectionKey) && valStr) {
          nextConfirmed[id] = true;
        }
      });
    } else {
      // Handle sections that are objects
      Object.entries(sectionData).forEach(([fieldKey, fieldValue]) => {
        if (SKIP_KEYS.has(fieldKey)) return;

        const kind = detectFieldKind(fieldKey);
        const options = getSelectOptions(fieldKey, lookups);
        const id = `${sectionKey}__${fieldKey}`;

        let val = fieldValue || '';
        if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            val = val.map(item => {
              if (typeof item === 'object') {
                return Object.entries(item).filter(([k, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' | ');
              }
              return item;
            }).join('\n\n');
          } else {
            val = val.value || JSON.stringify(val);
          }
        }

        items.push({
          id,
          name: fieldKey.replace(/_usd_mn$/i, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          kind: (typeof val === 'string' && (val.length > 50 || val.includes('\n'))) ? 'textarea' : kind,
          options: kind === 'country' ? (fetchedCountries || []).map(c => ({ label: c.name, value: c.code || c.iso2 })) : options,
          scaled: kind === 'currency',
          status: val ? 'analyzed' : 'needs_input',
          aiFilled: !!val,
        });

        nextValues[id] = String(val);
        // Req 3: use confirmed_fields from backend
        const confirmedFields = sectionObj.confirmed_fields || [];
        if (confirmedFields.includes(fieldKey) && val) {
          nextConfirmed[id] = true;
        }
      });

      // Req 2: Add composite money fields from _display keys
      const moneyPairs = [
        { display: 'total_funding_raised_display', label: 'Total Funding Raised' },
        { display: 'latest_pre_money_display', label: 'Latest Pre Money Valuation' },
        { display: 'latest_post_money_display', label: 'Latest Post Money Valuation' },
      ];
      for (const pair of moneyPairs) {
        if (pair.display in sectionData) {
          const displayVal = sectionData[pair.display] || '';
          const id = `${sectionKey}__${pair.display}`;
          items.push({
            id,
            name: pair.label,
            kind: 'currency',
            scaled: true,
            status: displayVal ? 'analyzed' : 'needs_input',
            aiFilled: !!displayVal,
          });
          nextValues[id] = displayVal;
          const confirmedFields = sectionObj.confirmed_fields || [];
          const baseKey = pair.display.replace('_display', '');
          const usdKey = baseKey + '_usd_mn';
          if ((confirmedFields.includes(pair.display) || confirmedFields.includes(baseKey) || confirmedFields.includes(usdKey)) && displayVal) {
            nextConfirmed[id] = true;
          }
        }
      }
    }

    catsMap[catId].push({
      id: sectionKey,
      label: sectionKey === 'founders' ? 'Founders and Key People' : sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      items,
    });
  });

  const categories = PROFILE_CATEGORIES.map(c => ({
    ...c,
    subsections: catsMap[c.id],
  }));

  return { categories, values: nextValues, confirmed: nextConfirmed };
}
