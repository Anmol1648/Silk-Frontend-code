/**
 * profile-utils.js — Exact port of silkAnkit readiness-data.ts
 *
 * All constants (CATEGORIES, field kinds, layout helpers, READINESS_LADDER)
 * match the silkAnkit source — names, order, everything.
 */

// ── Currencies & Scales ─────────────────────────────────────
// Hardcoded fallbacks are removed — live data comes from LookupsContext.
// Kept as thin fallback for CurrencyInput when lookups haven't loaded yet.
export const CURRENCIES_FALLBACK = ['USD', 'INR', 'EUR', 'GBP', 'SGD', 'AED', 'JPY', 'CAD'];
export const CURRENCY_SCALES_FALLBACK = [
  { id: 'K', label: 'Thousand', multiplier: 1e3 },
  { id: 'L', label: 'Lakh', multiplier: 1e5 },
  { id: 'M', label: 'Million', multiplier: 1e6 },
  { id: 'Cr', label: 'Crore', multiplier: 1e7 },
  { id: 'B', label: 'Billion', multiplier: 1e9 },
];

export const CURRENCIES = CURRENCIES_FALLBACK;
export const CURRENCY_SCALES = CURRENCY_SCALES_FALLBACK;

// ── Format / Parse currency value (backend: "CODE:amount:scale") ──
// Req 2: uses colon separator to match _display format.
export function formatCurrencyValue(currency, amount, scale) {
  const amtStr = amount !== null && amount !== undefined ? String(amount).trim() : '';
  if (!amtStr) return '';
  return [currency || 'USD', amtStr, scale || 'M'].join(':');
}

export function parseCurrencyValue(raw) {
  if (typeof raw === 'number' || (typeof raw === 'string' && !raw.includes(':') && !raw.includes('|') && !isNaN(parseFloat(raw)))) {
    return { currency: 'USD', amount: String(raw), scale: 'M' };
  }
  if (!raw || typeof raw !== 'string') return { currency: 'USD', amount: '', scale: '' };
  // Support both : (new) and | (legacy) separators
  const sep = raw.includes(':') ? ':' : '|';
  const parts = raw.split(sep);
  return {
    currency: parts[0] || 'USD',
    amount: parts[1] || '',
    scale: parts[2] || '',
  };
}

// ── Sanitize numeric (exact from silkAnkit page.tsx line 208) ──
export function sanitizeNumeric(raw, { decimal = true, negative = false } = {}) {
  let out = '';
  let seenDot = false;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') { out += ch; continue; }
    if (decimal && ch === '.' && !seenDot) { out += ch; seenDot = true; continue; }
    if (negative && ch === '-' && out.length === 0) { out += ch; }
  }
  return out;
}

// ── Number Formatting Rules ─────────────────────────────────────
// % -> 1 decimal place (e.g. 21.0%)
// decimal/currency/multiple -> 2 decimal places (e.g. 21.20)
// integer/normal -> whole number (e.g. 2025)
export function formatProfileNumber(value, kind = 'text') {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);

  if (kind === 'percent' || kind === 'percentage') {
    return `${num.toFixed(1)}%`;
  }
  if (kind === 'currency' || kind === 'decimal' || kind === 'multiple') {
    return num.toFixed(2);
  }
  return String(Math.round(num));
}

// ── Countries (fallback only — live data from LookupsContext) ──
export const COUNTRIES_FALLBACK = [
  'India', 'United States', 'United Kingdom', 'Singapore',
  'United Arab Emirates', 'Germany', 'Canada', 'Australia',
  'Netherlands', 'France', 'Japan', 'Israel', 'Brazil',
  'Indonesia', 'South Korea', 'China', 'Other',
];
export const COUNTRIES = COUNTRIES_FALLBACK;

// ── Select options ──────────────────────────────────────────
// Hardcoded arrays are used ONLY as fallbacks when lookups haven't loaded.
const BUSINESS_MODELS_FALLBACK = [
  'B2B', 'B2C', 'B2B2C', 'D2C', 'SaaS', 'Marketplace', 'Other',
];

/**
 * Returns dropdown options for a field key.
 * @param {string} key - the field key (e.g. 'macro_sector', 'funding_status_name')
 * @param {object} lookups - live lookups from LookupsContext (optional)
 * @returns {string[]|null} - array of option strings, or null if not a select field
 */
export function getSelectOptions(key, lookups = {}) {
  const k = key.toLowerCase();

  if (k.includes('macro_sector') || (k.includes('sector') && !k.includes('sub_sector'))) {
    return lookups.sectors?.length
      ? lookups.sectors.map(s => s.name)
      : null;
  }
  if (k.includes('sub_sector')) {
    return lookups.sub_sectors?.length
      ? lookups.sub_sectors.map(s => s.name)
      : null;
  }
  if (k.includes('funding_status_name') || k === 'funding_status') {
    return lookups.funding_statuses?.length
      ? lookups.funding_statuses.map(s => s.name)
      : null;
  }
  if (k.includes('revenue_size_name') || k === 'revenue_size') {
    return lookups.revenue_sizes?.length
      ? lookups.revenue_sizes.map(s => s.name)
      : null;
  }
  if (k === 'business_model' || k.includes('business_model_type')) return BUSINESS_MODELS_FALLBACK;
  if (k.includes('customer_type')) return ['Enterprise', 'SMB', 'D2C consumers', 'Prosumer', 'Government', 'Other'];
  if (k.includes('country') || k === 'hq_country' || k === 'geography') {
    return lookups.countries?.length
      ? lookups.countries.map(c => c.name)
      : COUNTRIES_FALLBACK;
  }
  if (k.includes('currency_id')) {
    return lookups.currencies?.length
      ? lookups.currencies.map(c => c.code)
      : CURRENCIES_FALLBACK;
  }
  return null;
}

// ── Field kind detection (exact from silkAnkit) ─────────────
export function detectFieldKind(key) {
  const k = key.toLowerCase();
  if (k.includes('country') || k === 'hq_country' || k === 'geography') return 'country';
  if (k.includes('currency_id') || k.endsWith('_currency') || k.endsWith('_denomination')) return 'select';
  if (k.includes('funding_status_name') || k.includes('revenue_size_name')) return 'select';
  if (k.includes('macro_sector') || k.includes('sub_sector')) return 'select';
  if (k.includes('customer_type')) return 'select';
  if (k.includes('_pct') || k.includes('percent') || k.includes('share_percent') || k.includes('ownership_pct') || k.includes('dilution_pct')) return 'percent';
  if (k.includes('_usd_mn') || k.includes('amount_usd') || k.includes('pre_money') || k.includes('post_money') || k.includes('funding_amount') || k.includes('valuation_usd') || k.includes('revenue_m') || k.includes('ebitda_m') || k.includes('pat_m')) return 'currency';
  if (k === 'website' || k === 'link' || k.includes('linkedin_url') || k.includes('_url')) return 'text';
  if (k === 'date' || k.includes('_date') || k === 'financial_year') return 'date';
  if (k === 'name' || k === 'title' || k === 'role' || k === 'stream' || k === 'metric' || k === 'unit' || k === 'value' || k === 'source' || k === 'round' || k === 'status' || k === 'category' || k === 'investor_type' || k === 'market' || k === 'investor_name' || k === 'activity_type' || k === 'target_company') return 'text';
  if (k === 'description' || k === 'description_of_business' || k === 'background' || k === 'value_proposition' || k === 'delivery_model' || k === 'pricing_model' || k === 'sales_model' || k === 'origin_story' || k === 'brand_evolution' || k === 'usp' || k === 'industry_evolution' || k === 'opportunity_explanation' || k === 'leadership_assessment' || k === 'market_positioning' || k === 'business_model') return 'textarea';
  return 'text';
}

import { 
  Building03Icon, 
  Analytics01Icon, 
  Briefcase01Icon, 
  ChartLineData01Icon, 
  Coins01Icon, 
  BulbIcon, 
  FileAttachmentIcon 
} from '@hugeicons/core-free-icons';

// ── Categories (exact match of silkAnkit CATEGORIES) ────────
export const PROFILE_CATEGORIES = [
  { id: 'company', label: 'Company', icon: Building03Icon },
  { id: 'market', label: 'Market', icon: Analytics01Icon },
  { id: 'business', label: 'Business', icon: Briefcase01Icon },
  { id: 'traction', label: 'Traction', icon: ChartLineData01Icon },
  { id: 'fundraising', label: 'Raise', icon: Coins01Icon },
  { id: 'story', label: 'Story', icon: BulbIcon },
  { id: 'documents', label: 'Files', icon: FileAttachmentIcon },
];

// Map backend section keys → category IDs
export const SECTION_TO_CATEGORY = {
  company_profile: 'company',
  founders: 'company',
  products_services: 'company',
  customers_markets: 'market',
  competitive_advantages: 'market',
  industry_research: 'market',
  business_model: 'business',
  revenue_model: 'business',
  company_metrics: 'traction',
  financial_summary: 'traction',
  funding_history: 'fundraising',
  investors_cap_table: 'fundraising',
  investment_thesis: 'story',
  company_story: 'story',
  news: 'story',
  competitors: 'market',
  document_center: 'documents',
};

// ── Field completeness ──────────────────────────────────────
export function fieldHasValue(kind, value) {
  if (['founders_array','products_array','markets_array','advantages_array','competitors_array','industry_research_obj','business_model_obj','revenue_model_array','company_metrics_array','financial_summary_obj','funding_history_array','investors_cap_table_obj','news_array','company_story_obj','investment_thesis_obj', 'document_center_obj'].includes(kind)) {
    if (kind === 'document_center_obj') return Array.isArray(value) && value.length > 0;
    if (kind.endsWith('_obj')) return value && typeof value === 'object' && Object.values(value).some(v => v);
    return Array.isArray(value) && value.length > 0;
  }
  if (!value) return false;
  const s = String(value).trim();
  if (!s) return false;
  if (kind === 'currency') {
    const { amount } = parseCurrencyValue(s);
    return Boolean(amount);
  }
  return true;
}

export function isCompactKind(kind) {
  return ['text', 'number', 'percent', 'months', 'select', 'country', 'currency', 'date'].includes(kind);
}

// ── Layout rows (exact from silkAnkit) ──────────────────────
export function layoutFieldRows(items) {
  const rows = [];
  let compactBuf = [];

  const flushCompact = () => {
    if (!compactBuf.length) return;
    // pair compact fields into rows of 2
    for (let i = 0; i < compactBuf.length; i += 2) {
      rows.push(compactBuf.slice(i, i + 2));
    }
    compactBuf = [];
  };

  for (const item of items) {
    if (isCompactKind(item.kind || 'textarea')) {
      compactBuf.push(item);
    } else {
      flushCompact();
      rows.push([item]);
    }
  }
  flushCompact();
  return rows;
}

// ── Readiness ladder (exact from silkAnkit) ─────────────────
export const READINESS_LADDER = [
  'just getting started',
  'taking shape',
  'well underway',
  'nearly there',
  'investor-ready',
];

export function ladderIndex(score) {
  if (score >= 90) return 4;
  if (score >= 70) return 3;
  if (score >= 45) return 2;
  if (score >= 20) return 1;
  return 0;
}

// ── Time greeting (exact from silkAnkit) ────────────────────
export function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

// ── Section labels ──────────────────────────────────────────
export const SECTION_LABELS = {
  company_profile: 'Company',
  founders: 'Team',
  products_services: 'Products & Services',
  customers_markets: 'Customers & Markets',
  competitive_advantages: 'Competitive Advantages',
  business_model: 'Business Model',
  revenue_model: 'Revenue Model',
  company_metrics: 'Company Metrics',
  financial_summary: 'Financials',
  funding_history: 'Funding History',
  competitors: 'Competitors',
  investors_cap_table: 'Investors & Cap Table',
  company_story: 'Company Story',
  industry_research: 'Industry & Market Research',
  investment_thesis: 'Investment Thesis',
  news: 'Recent News',
  document_center: 'Documents',
};
