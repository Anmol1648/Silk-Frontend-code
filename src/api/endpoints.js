// ---------------------------------------------------------------------------
// One binding per backend endpoint, verified against fundos/urls.py and the
// delivered views. Deal-scoped calls take dealId first.
// ---------------------------------------------------------------------------
import { api, get, post, put, patch, del } from './client';

// ---- Auth & identity (M0) --------------------------------------------------
export const auth = {
  signup: (body) => post('/auth/signup', body, { auth: false }),                 // {email,name?,companyName?} → 202
  requestOtp: (email) => post('/auth/otp/request', { email }, { auth: false }),
  verifyOtp: (email, code) => post('/auth/otp/verify', { email, code }, { auth: false }), // field is `code`
};

export const me = {
  // sortBy: createdAt (default) | companyName | sector; order: desc | asc.
  contexts: (sortBy, order) => {
    const q = new URLSearchParams();
    if (sortBy) q.set('sortBy', sortBy);
    if (order) q.set('order', order);
    const s = q.toString();
    return get(`/me/contexts${s ? `?${s}` : ''}`);
  },
  switchContext: (dealId) => post('/contexts/switch', { dealId }),
  notifications: () => get('/notifications'),
  markRead: (id) => post(`/notifications/${id}/read`, {}),
};

// ---- Onboarding (G2) -------------------------------------------------------
export const companies = {
  list: () => get('/companies'),
  create: (body) => post('/companies', body),                                    // {name, domain?, hqCountry?}
  deals: (companyId) => get(`/companies/${companyId}/deals`),
  createDeal: (companyId, body) => post(`/companies/${companyId}/deals`, body), // {name, roundType}
  remove: (companyId) => del(`/companies/${companyId}`),                        // DELETE — cascades everything
  updateLogo: (companyId, body) => patch(`/companies/${companyId}/logo`, body), // {logoBase64}
};

// ---- Deal navigation (M0) --------------------------------------------------
export const deal = {
  masterplan: (d) => get(`/deals/${d}/masterplan`),
  stageState: (d) => get(`/deals/${d}/stage-state`),
  dashboard: (d) => get(`/deals/${d}/dashboard`),
  overrideStage: (d, n) => post(`/deals/${d}/stages/${n}/override`, { confirm: true }),
  job: (d, jobId) => get(`/deals/${d}/jobs/${jobId}`),
  members: (d) => get(`/deals/${d}/members`),
  invite: (d, body) => post(`/deals/${d}/members`, body),                        // {email, role}
  removeMember: (d, userId) => del(`/deals/${d}/members/${userId}`),
};

// ---- CKB (M0) ---------------------------------------------------------------
export const ckb = {
  read: (d) => get(`/deals/${d}/ckb`),                                           // {completenessPct, groups:{...}}
  // Founder edit — sets verified; response {field, warnings[]} (soft, advisory)
  setField: (d, key, body) => patch(`/deals/${d}/ckb/fields/${encodeURIComponent(key)}`, body),
  // Accept / reject a parked AI suggestion (BR-M0-011)
  suggestionAction: (d, key, action) =>
    patch(`/deals/${d}/ckb/fields/${encodeURIComponent(key)}`, { action }),
  assign: (d, body) => post(`/deals/${d}/ckb/assign`, body),
};



// ---- Platform configuration (admin-owned; read-only to the client) ---------
// Everything here is configured by an administrator in the Django Admin
// panel. The client renders whatever it is given rather than hard-coding
// branding, stage numbering, labels or reference data.
export const config = {
  app: () => api('/config/app', { auth: false }),                 // {brand, stages}
  countries: () => api('/config/countries', { auth: false }),     // {items:[...]}
  buckets: () => get('/config/buckets'),                          // seven fund-raise values
  profileSections: () => get('/config/profile-sections'),
  uiCopy: () => api('/config/ui-copy', { auth: false }),
  // Req 1: all dropdown master data in one call (sectors, sub_sectors,
  // funding_statuses, revenue_sizes, currencies, unit_scales, countries).
  // Authenticated — cache for the session.
  lookups: () => get('/config/lookups'),
};

// ---- Stage 1: Company Profile (company-scoped per C1) ----------------------
// A company is an independent entity: it may have no deal, or several
// concurrent ones. The profile therefore hangs off the company.
export const profile = {
  read: (c) => get(`/companies/${c}/profile`),
  onboard: (c, body) => post(`/companies/${c}/profile/onboard`, body, { idempotent: true }),
  confirmReview: (c) => post(`/companies/${c}/profile/review`, {}),
  deepGenerate: (c) => post(`/companies/${c}/profile/deep-generate`, {}, { idempotent: true }),
  // Req 5+6: full QA body — field_id, question, chat_history, document_id.
  // A field_id alone (no question) requests a grounded draft.
  ask: (c, body) => post(`/companies/${c}/profile/qa`, body),
  // Req 5: field-level source citations.
  fieldSources: (c, fieldId, opts) => get(`/companies/${c}/profile/fields/${encodeURIComponent(fieldId)}/sources`, opts),
  saveSection: (c, key, body) =>
    patch(`/companies/${c}/profile/sections/${encodeURIComponent(key)}`, body),
  regenerateSection: (c, key, force = false) =>
    post(`/companies/${c}/profile/sections/${encodeURIComponent(key)}/regenerate`,
      { force }, { idempotent: true }),
  sectionHistory: (c, key) =>
    get(`/companies/${c}/profile/sections/${encodeURIComponent(key)}/history`),
  addFounder: (c, body) => post(`/companies/${c}/founders`, body),
  updateFounder: (c, id, body) => patch(`/companies/${c}/founders/${id}`, body),
  removeFounder: (c, id) => del(`/companies/${c}/founders/${id}`),
  // Generic list-record CRUD (Key People, Competitors, Funding History,
  // Recent News) — one endpoint family, keyed by sectionKey. Mirrors the
  // founder verbs; the backend validates each record type.
  addRecord: (c, sectionKey, body) =>
    post(`/companies/${c}/profile/records/${encodeURIComponent(sectionKey)}`, body),
  updateRecord: (c, sectionKey, id, body) =>
    patch(`/companies/${c}/profile/records/${encodeURIComponent(sectionKey)}/${id}`, body),
  removeRecord: (c, sectionKey, id) =>
    del(`/companies/${c}/profile/records/${encodeURIComponent(sectionKey)}/${id}`),
  // Numeric/structured forms — Revenue Model, Company Metrics, Financial
  // Summary. Body is {items:[...]}; validated server-side (e.g. revenue
  // shares must total 100%).
  saveStructuredForm: (c, sectionKey, items) =>
    patch(`/companies/${c}/profile/sections/${encodeURIComponent(sectionKey)}/structured`,
      { items }),
  // Field-level AI regeneration — returns {status, fieldKey, value}; the
  // caller decides whether to accept the value into the form.
  regenerateField: (c, sectionKey, fieldKey) =>
    post(`/companies/${c}/profile/sections/${encodeURIComponent(sectionKey)}/fields/${encodeURIComponent(fieldKey)}/regenerate`,
      {}, { idempotent: true }),
  cashPosition: (c) => get(`/companies/${c}/cash-position`),
  saveCashPosition: (c, body) => post(`/companies/${c}/cash-position`, body),
  fundraiseRecommendation: (c) => get(`/companies/${c}/fundraise-recommendation`),
  // C6 — headline deal terms. Only the two inputs are sent; post-money and
  // dilution are calculated server-side and returned alongside them.
  // Resolves (creating if needed) the deal that company-scoped strategy
  // screens work against — the deal stays hidden from the founder.
  defaultDeal: (c) => get(`/companies/${c}/default-deal`),
  // Document Center uploads (multipart — the client sets no Content-Type
  // so the browser can add the multipart boundary).
  uploadDocument: (c, formData) =>
    api(`/companies/${c}/documents`, { method: 'POST', formData }),
  deleteDocument: (c, id) => del(`/companies/${c}/documents/${id}`),
  dealTargets: (c, query = '') => get(`/companies/${c}/deal-targets${query}`),
  saveDealTargets: (c, body) => post(`/companies/${c}/deal-targets`, body),
};
