import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { config as configApi, companies, profile as profileApi } from '../api/endpoints';
import { useToast } from '../context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
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

function GeneratingStep({ label, detail, status }) {
  return (
    <div className="flex items-start gap-4" style={{ marginBottom: 16 }}>
      <div className="mt-1 flex-shrink-0" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {status === 'done' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {status === 'active' && (
          <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ccc', borderTopColor: 'black', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
        )}
        {status === 'pending' && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e7eb' }} />
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'black' }}>{label}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{detail}</div>
      </div>
    </div>
  );
}

export default function AddCompanyModal({ onCancel, onCreated }) {
  const { toast, error: toastError } = useToast();

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
  const [submitPhase, setSubmitPhase] = useState('idle'); // 'idle' | 'creating' | 'uploading' | 'onboarding'
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
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

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

  /* ---- submit: create company + onboard in one shot ---- */
  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setSubmitPhase('creating');
    try {
      /* Step 1: create the company */
      const res = await companies.create({ name: companyName.trim() });
      const companyId = res?.id || res?.companyId;
      if (!companyId) throw new Error('Company was created but no id was returned.');

      /* Step 2: upload documents if any */
      if (files.length) {
        setSubmitPhase('uploading');
        for (const item of files) {
          try {
            const fd = new FormData();
            fd.append('file', item.file);
            fd.append('category', item.category);
            await profileApi.uploadDocument(companyId, fd);
          } catch (ex) {
            toastError(new Error(`Couldn't upload ${item.file.name} — continuing without it.`));
          }
        }
      }

      /* Step 3: onboard with collected metadata */
      setSubmitPhase('onboarding');
      const url = website.trim()
        ? (website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`)
        : undefined;

      await profileApi.onboard(companyId, {
        ...(url ? { websiteUrl: url } : {}),
        ...(country ? { hqCountry: country } : {}),
        ...(logoUrl && !logoBase64 ? { logoUrl } : {}),
        ...(logoBase64 ? { logoBase64 } : {}),
        founders: founders
          .filter((f) => f.name.trim() || f.linkedinUrl.trim())
          .map((f) => ({
            name: f.name.trim(),
            linkedinUrl: f.linkedinUrl.trim(),
            isFullTime: f.isFullTime,
            selfConfirmed: f.selfConfirmed,
          })),
      });

      setSubmitPhase('idle');
      onCreated(companyId);
    } catch (ex) {
      setErrs(ex.fields || {});
      toastError(ex);
      setSubmitPhase('idle');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={submitPhase !== 'idle'}>
        <DialogContent
          className="acm-progress-dialog sm:max-w-[425px]"
          style={{ zIndex: 320, background: '#fff', color: '#000', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
          showCloseButton={false}
        >
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ padding: 8, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <DialogTitle style={{ fontSize: 20, color: 'black', margin: 0 }}>Generating company profile…</DialogTitle>
            </div>
            <DialogDescription style={{ color: '#6b7280', fontSize: 14, marginTop: 0 }}>
              We're building a comprehensive profile from your website, uploaded documents, and public sources. This may take a few minutes.
            </DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: 24 }}>
            <GeneratingStep
              label="Initializing profile"
              detail="Registering company and founders"
              status={submitPhase === 'creating' ? 'active' : 'done'}
            />
            <GeneratingStep
              label="Uploading documents"
              detail={files.length > 0 ? `Securely transferring ${files.length} file(s)` : 'No documents provided'}
              status={submitPhase === 'creating' ? 'pending' : (submitPhase === 'uploading' ? 'active' : 'done')}
            />
            <GeneratingStep
              label="Starting AI Pipeline"
              detail="Web research and document extraction"
              status={submitPhase === 'onboarding' ? 'active' : 'pending'}
            />
          </div>
        </DialogContent>
      </Dialog>

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
                <span className="acm-kicker">New Workspace</span>
                <span className="acm-kicker-badge">AI Powered</span>
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
                <line x1="6" y1="12" x2="18" y2="12" style={{ display: 'none' }} />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ---- Form ---- */}
          <form onSubmit={submit} className="acm-form">
            {/* Top Card: Company Essentials */}
            <section className="acm-essentials-card">
              {/* Row 1: Logo & Company Name */}
              <div className="acm-essentials-top">
                <label className="acm-logo-upload" title="Upload company logo (PNG/JPG)">
                  <input type="file" accept="image/*" onChange={onLogoPick} style={{ display: 'none' }} />
                  <div className="acm-logo-frame">
                    {logoUrl && !logoError ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="acm-logo-image"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="acm-logo-placeholder">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span className="acm-logo-badge">+</span>
                      </div>
                    )}
                  </div>
                </label>

                <div className="acm-field acm-field-name">
                  <div className="acm-label-row">
                    <span className="acm-label">Company Name <span className="acm-req">*</span></span>
                    {logoUrl && !logoError && (
                      <span className="acm-logo-detected">Logo auto-detected</span>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    autoFocus
                    className="acm-input-main"
                  />
                  {errs.companyName && <span className="acm-error">{errs.companyName}</span>}
                </div>
              </div>

              {/* Row 2: Website + HQ Country */}
              <div className="acm-row-2">
                <div className="acm-field">
                  <span className="acm-label">Company Website <span className="acm-req">*</span></span>
                  <div className="acm-input-icon">
                    <span className="acm-input-icon-left">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </span>
                    <Input
                      type="text"
                      className="pl-9 acm-input-main"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://acme.com"
                    />
                  </div>
                  {errs.website && <span className="acm-error">{errs.website}</span>}
                </div>

                <div className="acm-field">
                  <span className="acm-label">Headquarters Country <span className="acm-req">*</span></span>
                  <OptionsCombobox
                    value={country}
                    onChange={(val) => setCountry(val)}
                    options={countries.map((c) => ({ label: c.name, value: c.iso2 }))}
                    placeholder="Select country…"
                    searchPlaceholder="Search country…"
                    triggerClassName="h-9 py-1 bg-[#fafafa] border border-[#e5e7eb] text-sm font-normal rounded-lg shadow-none"
                  />
                  {errs.hqCountry && <span className="acm-error">{errs.hqCountry}</span>}
                </div>
              </div>
            </section>

            {/* Middle Grid: Founders (Left) + Pitch & Documents (Right) */}
            <div className="acm-details-grid">
              {/* ---- Founders Panel ---- */}
              <section className="acm-panel acm-founders-panel">
                <div className="acm-panel-head">
                  <div className="acm-panel-title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1]">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3 className="acm-panel-title">Founders & Leadership</h3>
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

                {/* Scrollable container for founder cards (only this area scrolls when >1-2 founders) */}
                <div className="acm-founders-scrollable">
                  {founders.map((f, i) => (
                    <div key={i} className="acm-founder-card">
                      <div className="acm-founder-fields">
                        <div className="acm-founder-field-item flex-1">
                          <Input
                            type="text"
                            value={f.name}
                            placeholder="Full name"
                            className="acm-input-compact"
                            onChange={(e) => setFounder(i, { name: e.target.value })}
                          />
                        </div>
                        <div className="acm-founder-field-item flex-1">
                          <div className="acm-input-icon">
                            <span className="acm-input-icon-left acm-linkedin-icon">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </span>
                            <Input
                              type="text"
                              className="pl-8 acm-input-compact"
                              value={f.linkedinUrl}
                              placeholder="LinkedIn profile URL"
                              onChange={(e) => setFounder(i, { linkedinUrl: e.target.value })}
                            />
                          </div>
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
                      <div className="acm-founder-subrow">
                        <label className="acm-check flex items-center gap-1.5 cursor-pointer select-none">
                          <Checkbox
                            checked={f.isFullTime}
                            onCheckedChange={(checked) => setFounder(i, { isFullTime: Boolean(checked) })}
                          />
                          <span className="text-[11px] text-[#475569] font-normal">Working full-time</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- Documents Panel ---- */}
              <section className="acm-panel acm-docs-panel">
                <div className="acm-panel-head">
                  <div className="acm-panel-title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f59e0b]">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <h3 className="acm-panel-title">Pitch & Documents</h3>
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                          )}
                          {cat.key === 'financial_model' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                          )}
                          {cat.key === 'annual_report' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          )}
                          {cat.key === 'other' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
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
                <button type="submit" className="silk-ai-btn" disabled={busy}>
                  <span className="silk-ai-btn__inner">
                    {busy ? (
                      <span className="spin" style={{ borderTopColor: '#fff', width: 14, height: 14 }} />
                    ) : (
                      <AiMark size={14} className="silk-ai-btn__mark" />
                    )}
                    Generate Company Profile
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
