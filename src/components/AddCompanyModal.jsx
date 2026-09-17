import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { config as configApi, companies, profile as profileApi } from '../api/endpoints';
import { useToast } from '../context/AppContext';
import { useBackgroundTasks } from '../context/BackgroundTaskContext';
import { Input } from './ui/input';
import { OptionsCombobox } from './options-combobox';
import { Checkbox } from './ui/checkbox';
import { AiMark } from './ai-mark';

/**
 * AddCompanyModal — a single combined modal that creates a company AND
 * submits onboarding data (website, country, founders, documents) in one
 * flow. Replaces the old two-step: "AddCompany inline form" → navigate to
 * OnboardingForm.
 *
 * Design matches the Clarum "Add Company" modal reference exactly.
 */

const UPLOAD_CATEGORIES = [
  { key: 'company_presentation', label: 'Company Presentation' },
  { key: 'financial_model', label: 'Financial Model' },
  { key: 'annual_report', label: 'Annual Report / Financial Statements' },
  { key: 'other', label: 'Other Documents' },
];

const ACCEPTED = '.pdf,.docx,.doc,.ppt,.pptx,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.zip';

export default function AddCompanyModal({ onCancel, onCreated }) {
  const { toast, error: toastError } = useToast();
  const { watchCompanyGeneration, requestNotificationPermission } = useBackgroundTasks();

  /* ---- state ---- */
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [founders, setFounders] = useState([
    { name: '', linkedinUrl: '', isFullTime: false, selfConfirmed: false },
  ]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState({});

  const [logoUrl, setLogoUrl] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [logoError, setLogoError] = useState(false);

  /* ---- auto fetch logo from domain ---- */
  useEffect(() => {
    if (logoBase64) return; // If manually uploaded, don't overwrite
    const domain = website.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (domain && domain.includes('.')) {
      setLogoUrl(`https://img.logo.dev/${domain}?token=pk_EsMpGCHZTke3dtHjuBheHA`);
      setLogoError(false);
    } else {
      setLogoUrl('');
      setLogoError(false);
    }
  }, [website, logoBase64]);

  function onLogoPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoBase64(ev.target.result);
      setLogoUrl(ev.target.result); // Use base64 as the preview
      setLogoError(false);
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    configApi.countries()
      .then((r) => setCountries(r.items || []))
      .catch(() => setCountries([]));
  }, []);

  /* Close on Escape */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !busy) onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, busy]);

  /* ---- founder helpers ---- */
  const setFounder = (i, patch) =>
    setFounders((list) => list.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const addFounder = () =>
    setFounders((l) => [...l, { name: '', linkedinUrl: '', isFullTime: false, selfConfirmed: false }]);

  const removeFounder = (i) =>
    setFounders((l) => (l.length === 1 ? l : l.filter((_, idx) => idx !== i)));

  /* ---- file helpers ---- */
  function onPick(e, category) {
    const picked = [...e.target.files].map((file) => ({ file, category }));
    setFiles((f) => [...f, ...picked]);
    e.target.value = '';
  }

  /* ---- validation ---- */
  function validate() {
    const next = {};
    if (!companyName.trim()) next.companyName = 'Company name is required.';
    if (!website.trim()) next.website = 'Company website is required.';
    if (!country) next.hqCountry = 'Headquarters country is required.';
    setErrs(next);
    return Object.keys(next).length === 0;
  }

  /* ---- submit: create company + onboard then open profile ---- */
  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);

    // Request notification permission during the user click gesture (must await
    // so the browser prompt appears before we navigate away)
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await requestNotificationPermission();
      }
    } catch (_) {}

    try {
      /* Step 1: create the company */
      const res = await companies.create({ name: companyName.trim() });
      const companyId = res?.id || res?.companyId;
      if (!companyId) throw new Error('Company was created but no id was returned.');

      /* Step 2: upload documents if any */
      if (files.length) {
        for (const item of files) {
          try {
            const fd = new FormData();
            fd.append('file', item.file);
            fd.append('category', item.category);
            await profileApi.uploadDocument(companyId, fd);
          } catch (ex) {
            console.warn(`Couldn't upload ${item.file?.name}:`, ex);
          }
        }
      }

      /* Step 3: onboard with collected metadata */
      const url = website.trim()
        ? (website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`)
        : undefined;

      await profileApi.onboard(companyId, {
        ...(url ? { websiteUrl: url } : {}),
        ...(country ? { hqCountry: country } : {}),
        ...(logoUrl && !logoBase64 ? { logoUrl } : {}),
        ...(logoBase64 ? { logoBase64 } : {}),
        founders: founders
          .filter((f) => f.name?.trim() || f.linkedinUrl?.trim())
          .map((f) => ({
            name: f.name.trim(),
            linkedinUrl: f.linkedinUrl?.trim() || '',
            isFullTime: !!f.isFullTime,
            selfConfirmed: !!f.selfConfirmed,
          })),
      });

      /* Step 4: Start background watcher BEFORE navigating away so the
         polling loop + notification dispatch survive page transitions. */
      if (watchCompanyGeneration) {
        watchCompanyGeneration({ companyId, companyName: companyName.trim() });
      }

      onCreated(companyId);
    } catch (ex) {
      setErrs(ex.fields || {});
      toastError(ex);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="acm-overlay" onClick={onCancel}>
        <div
          className="acm-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Add Company"
        >
          {/* ---- Header ---- */}
          <div className="acm-header">
            <div className="acm-header-copy">
              <div className="acm-kicker-row">
                <span className="acm-kicker">NEW WORKSPACE</span>
                <span className="acm-kicker-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="acm-kicker-icon">
                    <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
                  </svg>
                  AI Powered
                </span>
              </div>
              <h2 className="acm-title">Create Company Workspace</h2>
              <p className="acm-subtitle">
                Enter company essentials — Silk AI will automatically extract insights & build an investor-ready workspace.
              </p>
            </div>
            <button
              type="button"
              className="acm-close"
              onClick={onCancel}
              aria-label="Close"
              title="Close modal (Esc)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ---- Form ---- */}
          <form onSubmit={submit} className="acm-form">
            {/* Top: Logo & Essentials */}
            <div className="acm-top-section">
              {/* Logo Row */}
              <div className="acm-logo-row">
                <label className="acm-logo-box" title="Upload company logo">
                  <input type="file" accept="image/*" onChange={onLogoPick} style={{ display: 'none' }} />
                  {logoUrl && !logoError ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="acm-logo-img"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="acm-logo-placeholder">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="9" y1="6" x2="9" y2="6.01" />
                        <line x1="15" y1="6" x2="15" y2="6.01" />
                        <line x1="9" y1="10" x2="9" y2="10.01" />
                        <line x1="15" y1="10" x2="15" y2="10.01" />
                        <line x1="9" y1="14" x2="9" y2="14.01" />
                        <line x1="15" y1="14" x2="15" y2="14.01" />
                        <line x1="9" y1="18" x2="15" y2="18" />
                      </svg>
                      <span className="acm-logo-badge">+</span>
                    </div>
                  )}
                </label>

                <div className="acm-logo-info">
                  <div className="acm-logo-title">Company Logo</div>
                  <div className="acm-logo-desc">Upload company logo</div>
                  <div className="acm-logo-format">PNG, JPG or SVG (max 5MB)</div>
                </div>
              </div>

              {/* Company Name */}
              <div className="acm-field">
                <label className="acm-label">
                  Company Name <span className="acm-req">*</span>
                </label>
                <div className="acm-input-icon-wrap">
                  <span className="acm-input-left-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="6" x2="9" y2="6.01" />
                      <line x1="15" y1="6" x2="15" y2="6.01" />
                      <line x1="9" y1="10" x2="9" y2="10.01" />
                      <line x1="15" y1="10" x2="15" y2="10.01" />
                      <line x1="9" y1="14" x2="9" y2="14.01" />
                      <line x1="15" y1="14" x2="15" y2="14.01" />
                      <line x1="9" y1="18" x2="15" y2="18" />
                    </svg>
                  </span>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    autoFocus
                    className="acm-input-main"
                  />
                </div>
                {errs.companyName && <span className="acm-error">{errs.companyName}</span>}
              </div>

              {/* Row: Website & Country */}
              <div className="acm-row-2">
                <div className="acm-field">
                  <label className="acm-label">
                    Company Website <span className="acm-req">*</span>
                  </label>
                  <div className="acm-input-icon-wrap">
                    <span className="acm-input-left-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </span>
                    <Input
                      type="text"
                      className="acm-input-main"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://acme.com"
                    />
                  </div>
                  {errs.website && <span className="acm-error">{errs.website}</span>}
                </div>

                <div className="acm-field">
                  <label className="acm-label">
                    Headquarters Country <span className="acm-req">*</span>
                  </label>
                  <OptionsCombobox
                    value={country}
                    onChange={(val) => setCountry(val)}
                    options={countries.map((c) => ({ label: c.name, value: c.iso2 }))}
                    placeholder="Select country…"
                    searchPlaceholder="Search country…"
                    leftIcon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    }
                    triggerClassName="acm-combobox-btn"
                  />
                  {errs.hqCountry && <span className="acm-error">{errs.hqCountry}</span>}
                </div>
              </div>
            </div>

            {/* Middle Grid: Founders (Left) + Pitch & Documents (Right) */}
            <div className="acm-details-grid">
              {/* ---- Founders Panel ---- */}
              <section className="acm-card acm-founders-card">
                <div className="acm-card-head">
                  <div className="acm-card-title-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4f46e5]">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3 className="acm-card-title">Founders & Leadership</h3>
                    <span className="acm-badge-count">{founders.length}</span>
                  </div>
                  <button type="button" className="acm-btn-add-inline" onClick={addFounder}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Founder
                  </button>
                </div>

                {/* Scrollable container for founder cards */}
                <div className="acm-founders-list">
                  {founders.map((f, i) => (
                    <div key={i} className="acm-founder-item">
                      <div className="acm-founder-inputs">
                        <div className="acm-input-icon-wrap flex-1">
                          <span className="acm-input-left-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </span>
                          <Input
                            type="text"
                            value={f.name}
                            placeholder="Full name"
                            className="acm-input-compact"
                            onChange={(e) => setFounder(i, { name: e.target.value })}
                          />
                        </div>

                        <div className="acm-input-icon-wrap flex-1">
                          <span className="acm-input-left-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#0077b5">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </span>
                          <Input
                            type="text"
                            className="acm-input-compact"
                            value={f.linkedinUrl}
                            placeholder="LinkedIn profile URL"
                            onChange={(e) => setFounder(i, { linkedinUrl: e.target.value })}
                          />
                        </div>

                        {founders.length > 1 && (
                          <button
                            type="button"
                            className="acm-remove-founder-btn"
                            onClick={() => removeFounder(i)}
                            title="Remove founder"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="acm-founder-checkbox-row">
                        <label className="acm-check flex items-center gap-2 cursor-pointer select-none">
                          <Checkbox
                            checked={f.isFullTime}
                            onCheckedChange={(checked) => setFounder(i, { isFullTime: Boolean(checked) })}
                          />
                          <span className="text-xs text-slate-600 font-normal">Working full-time</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- Documents Panel ---- */}
              <section className="acm-card acm-docs-card">
                <div className="acm-card-head">
                  <div className="acm-card-title-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b]">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <h3 className="acm-card-title">Pitch & Documents</h3>
                  </div>
                  <span className="acm-optional-badge">Optional</span>
                </div>

                <div className="acm-upload-grid">
                  {UPLOAD_CATEGORIES.map((cat) => {
                    const catFileCount = files.filter((f) => f.category === cat.key).length;
                    return (
                      <label key={cat.key} className={`acm-upload-tile ${catFileCount > 0 ? 'acm-upload-tile--active' : ''}`}>
                        <input
                          type="file"
                          multiple
                          accept={ACCEPTED}
                          onChange={(e) => onPick(e, cat.key)}
                          style={{ display: 'none' }}
                        />
                        <div className="acm-tile-icon-wrap">
                          {cat.key === 'company_presentation' && (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                          )}
                          {cat.key === 'financial_model' && (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                          )}
                          {cat.key === 'annual_report' && (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          )}
                          {cat.key === 'other' && (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          )}
                        </div>
                        <span className="acm-upload-label">{cat.label}</span>
                        <span className="acm-upload-count">
                          {catFileCount > 0 ? `${catFileCount} file(s)` : '+ Upload'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {files.length > 0 && (
                  <div className="acm-attached-chips">
                    {files.map((f, i) => (
                      <span key={i} className="acm-file-chip" title={f.file.name}>
                        <span className="acm-file-chip-name">{f.file.name}</span>
                        <button
                          type="button"
                          className="acm-file-chip-remove"
                          onClick={() => setFiles((l) => l.filter((_, idx) => idx !== i))}
                          title="Remove file"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ---- Footer ---- */}
            <div className="acm-footer">
              <div className="acm-footer-hint">
                <span className="acm-hint-sparkle">✦</span>
                <span>Silk AI automatically synthesizes public data and uploaded files.</span>
              </div>
              <div className="acm-footer-actions">
                <button type="button" className="acm-btn-cancel" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="acm-btn-generate" disabled={busy}>
                  {busy ? (
                    <span className="spin" style={{ borderTopColor: '#fff', width: 14, height: 14 }} />
                  ) : (
                    <span className="acm-btn-sparkle">✦</span>
                  )}
                  <span>Generate Company Profile</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
  );
}
