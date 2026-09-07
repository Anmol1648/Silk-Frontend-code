import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companies, me } from '../api/endpoints';
import { useAuth, useToast } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { Skeleton, Tooltip } from '../components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Illo } from '../components/illos';
import { fmtDate } from '../lib/format';
import DashboardSidebar from '../components/DashboardSidebar';
import AddCompanyModal from '../components/AddCompanyModal';
import { AiMark } from '../components/ai-mark';

/**
 * Dashboard — the landing page after login (PRD §4).
 *
 * Redesigned to use a sidebar layout matching Clarum's design pattern.
 * Companies are displayed as cards in a responsive grid.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast, error: toastError } = useToast();
  const { brand } = useConfig();
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => me.contexts()
    .then((res) => setItems(res.items || []))
    .catch((e) => { toastError(e); setItems([]); });

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group by company: one card per company, however many deals it has.
  const byCompany = new Map();
  for (const it of items || []) {
    const key = it.companyId || it.companyName;
    if (!key) continue;
    if (!byCompany.has(key)) {
      byCompany.set(key, {
        companyId: it.companyId,
        companyName: it.companyName || 'Untitled company',
        industry: it.industry || it.sector || '',
        logoUrl: it.logoUrl || '',
        stageNo: it.currentStageNo ?? it.stageNo,
        stageLabel: it.currentStageLabel || '',
        updatedAt: it.updatedAt || it.lastUpdatedAt,
        resumePath: it.resumePath,
        profileComplete: it.profileComplete,
        lastRaise: it.lastRaise,
        attachmentLinks: it.attachmentLinks,
        deals: [],
      });
    }
    const row = byCompany.get(key);
    
    if (it.scope === 'company') {
      if (it.industry || it.sector) row.industry = it.industry || it.sector;
      if (it.lastRaise !== undefined) row.lastRaise = it.lastRaise;
      if (it.attachmentLinks !== undefined) row.attachmentLinks = it.attachmentLinks;
      if (it.profileComplete !== undefined) row.profileComplete = it.profileComplete;
      if (it.logoUrl !== undefined) row.logoUrl = it.logoUrl;
    }

    if (it.dealId && it.scope === 'deal') row.deals.push(it);
    if (it.updatedAt && (!row.updatedAt || it.updatedAt > row.updatedAt)) {
      row.updatedAt = it.updatedAt;
    }
  }
  const cards = [...byCompany.values()].sort((a, b) => {
    const d1 = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const d2 = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return d2 - d1;
  });
  const filteredCards = selectedCompanyId ? cards.filter(c => c.companyId === selectedCompanyId) : cards;

  return (
    <div className="ds-layout">
      <DashboardSidebar 
        activeItem="workspaces" 
        companies={cards.slice(0, 3)} 
        selectedCompanyId={selectedCompanyId} 
        onSelectCompany={setSelectedCompanyId} 
      />

      <div className="ds-main-area">
        {/* ---- Top header bar ---- */}
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <h1 className="ds-page-title">Companies</h1>
            <button className="ds-help-btn" aria-label="Help">
              Help
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          </div>
          <div className="ds-topbar-right">
            <button className="silk-ai-btn" onClick={() => setAdding(true)}>
              <span className="silk-ai-btn__inner">
                <AiMark size={14} className="silk-ai-btn__mark" />
                Create +
              </span>
            </button>
          </div>
        </header>

        {/* ---- Add Company Modal (overlay) ---- */}
        {adding && (
          <AddCompanyModal
            onCancel={() => { setAdding(false); load(); }}
            onCreated={(companyId) => navigate(`/companies/${companyId}/profile`)}
          />
        )}

        {/* ---- Content ---- */}
        <div className="ds-content">

          {items === null && (
            <div className="ds-cards-grid">
              <Skeleton h={180} style={{ borderRadius: '12px' }} />
              <Skeleton h={180} style={{ borderRadius: '12px' }} />
              <Skeleton h={180} style={{ borderRadius: '12px' }} />
            </div>
          )}

          {items !== null && cards.length === 0 && (
            <div className="ds-empty-state">
              <span className="illo-wrap"><Illo name="handshake" size={110} /></span>
              <h2>Welcome to {brand.productName}</h2>
              <p className="hint" style={{ maxWidth: 460, margin: '0 auto 18px' }}>
                Add your company and {brand.productName} will build a complete company
                profile from your website, your documents and public sources — then help
                you plan the raise.
              </p>
              <button className="silk-ai-btn" onClick={() => setAdding(true)}>
                <span className="silk-ai-btn__inner">
                  <AiMark size={14} className="silk-ai-btn__mark" />
                  Create +
                </span>
              </button>
            </div>
          )}

          {cards.length > 0 && filteredCards.length > 0 && (
            <>
              <div className="ds-cards-count">{filteredCards.length} total</div>
              <div className="ds-cards-grid">
                {filteredCards.map((c) => (
                  <CompanyCard 
                    key={c.companyId || c.companyName} 
                    company={c} 
                    onDeleteClick={() => setCompanyToDelete(c)}
                  />
                ))}
              </div>
            </>
          )}
          
          {cards.length > 0 && filteredCards.length === 0 && (
            <div className="ds-empty-state">
              <h2>No matching companies found</h2>
              <p className="hint">Try clearing your filters.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(isOpen) => {
        if (!isOpen && !deleting) setCompanyToDelete(null);
      }}>
        <AlertDialogContent className="max-w-[400px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
          <AlertDialogHeader className="p-6 pb-4 text-left grid-rows-[auto] place-items-start">
            {/* Danger icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
              border: '1px solid #fecaca',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <AlertDialogTitle className="text-[16px] font-semibold text-[#111827]">
              Delete {companyToDelete?.companyName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px] leading-[1.55] text-[#6b7280]">
              This will permanently remove this company along with all associated workspaces, profiles, and documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-4 pt-2 border-t-0 bg-transparent flex-row gap-3 justify-end"
            style={{ margin: 0, borderTop: '1px solid #f3f4f6' }}
          >
            <AlertDialogCancel
              disabled={deleting}
              variant="outline"
              onClick={() => setCompanyToDelete(null)}
              className="h-9 px-4 text-[13px] font-medium border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                if (deleting) return;
                setDeleting(true);
                try {
                  await companies.remove(companyToDelete.companyId);
                  toast(`${companyToDelete.companyName} has been deleted.`);
                  setCompanyToDelete(null);
                  load(); // refresh dashboard
                } catch (ex) {
                  toastError(ex);
                } finally {
                  setDeleting(false);
                }
              }}
              className="h-9 px-4 text-[13px] font-medium text-white border-none"
              style={{
                background: deleting ? '#991b1b' : '#dc2626',
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? 'Deleting…' : 'Delete Company'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


/**
 * CompanyCard — styled like Clarum's workflow cards.
 * Clean white card with title, proper description, industry tags,
 * bottom row with document info + right-arrow navigate button.
 */
function CompanyCard({ company, onDeleteClick }) {
  const navigate = useNavigate();

  function open() {
    if (company.resumePath) { navigate(company.resumePath); return; }
    if (company.profileComplete && company.deals.length) {
      const stage = company.stageNo && company.stageNo > 0 ? company.stageNo : 1;
      navigate(`/deals/${company.deals[0].dealId}/stage/${stage}`);
      return;
    }
    navigate(`/companies/${company.companyId}/profile`);
  }

  // Build a natural description from available company data
  const descParts = [];
  if (company.industry) {
    descParts.push(`Operating in the ${company.industry} sector.`);
  }
  if (company.lastRaise && company.lastRaise.round) {
    let raiseText = `Last raised ${company.lastRaise.round}`;
    if (company.lastRaise.date) {
      // Use fmtDate for clean "Month Year" or similar (or just standard fmtDate which gives "8 Aug 2023")
      // To get "August 2023", you can do a custom format, but fmtDate is fine. Let's use it.
      raiseText += ` in ${fmtDate(company.lastRaise.date)}`;
    }
    descParts.push(raiseText + '.');
  } else if (company.deals.length > 0) {
    descParts.push(`Currently has ${company.deals.length} active fundraising round${company.deals.length !== 1 ? 's.' : '.'}`);
  }
  
  const description = descParts.length > 0
    ? descParts.join(' ')
    : `Company profile and fundraising workspace for ${company.companyName}.`;

  // Tags from industry keywords
  const tags = [];
  if (company.industry) {
    company.industry.split(/[,\/&]+/).forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) tags.push(trimmed);
    });
  }

  // Document type label — show what they've uploaded if available
  const docLabel = company.deals.length > 0 ? 'Documents' : 'Profile';
  const links = company.attachmentLinks || {};
  const hasIcons = !!(links.companyUrl || links.founderProfile || links.productDeck || links.companyPresentation || links.financialModel || links.annualReportFinancialStatements || (links.other && links.other.length > 0) || (links.otherDocuments && links.otherDocuments.length > 0));

  return (
    <div className="ds-company-card" onClick={open} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}>
      {/* Title */}
      <div className="ds-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {company.logoUrl ? (
            <>
              <img 
                src={company.logoUrl} 
                alt="" 
                style={{ width: 48, height: 48, borderRadius: '8px', objectFit: 'contain', background: '#fff', border: '1px solid var(--line)' }} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                style={{ 
                  width: 48, height: 48, borderRadius: '8px', border: '1px solid var(--line)',
                  display: 'none', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--blue-050)', color: 'var(--blue-600)', fontSize: '20px', fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                {company.companyName ? company.companyName.charAt(0) : '?'}
              </div>
            </>
          ) : (
            <div 
              style={{ 
                width: 48, height: 48, borderRadius: '8px', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--blue-050)', color: 'var(--blue-600)', fontSize: '20px', fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              {company.companyName ? company.companyName.charAt(0) : '?'}
            </div>
          )}
          <h3 className="ds-card-title">{company.companyName}</h3>
        </div>
        <button 
          className="btn btn-ghost btn-sm"
          style={{ padding: 6, borderRadius: '8px', color: 'var(--muted-foreground)', marginTop: '-4px', marginRight: '-4px' }}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          title="Delete Company"
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red-600)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {/* Description */}
      <Tooltip content={description} position="bottom">
        <p className="ds-card-desc" style={{ cursor: 'default' }}>{description}</p>
      </Tooltip>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="ds-card-tags">
          {tags.slice(0, 3).map((tag) => (
            <span className="ds-tag" key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="ds-card-spacer" />

      {/* Bottom info row */}
      <div className="ds-card-bottom">
        <div className="ds-card-meta">
          {hasIcons ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {links.companyUrl && (
                <Tooltip content="Company Website" width={130}>
                  <a href={links.companyUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--muted-foreground)', display: 'flex', cursor: 'pointer', textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </a>
                </Tooltip>
              )}
              {links.founderProfile && (
                <Tooltip content="Founder LinkedIn" width={130}>
                  <a href={links.founderProfile} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--muted-foreground)', display: 'flex', cursor: 'pointer', textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                </Tooltip>
              )}
              {(links.productDeck || links.companyPresentation) && (
                <Tooltip content="Product Deck" width={110}>
                  <a href={links.productDeck || links.companyPresentation} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--muted-foreground)', display: 'flex', cursor: 'pointer', textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  </a>
                </Tooltip>
              )}
              {links.financialModel && (
                <Tooltip content="Financial Model" width={120}>
                  <a href={links.financialModel} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--muted-foreground)', display: 'flex', cursor: 'pointer', textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                  </a>
                </Tooltip>
              )}
              {links.annualReportFinancialStatements && (
                <Tooltip content="Annual Report" width={110}>
                  <a href={links.annualReportFinancialStatements} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--muted-foreground)', display: 'flex', cursor: 'pointer', textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </a>
                </Tooltip>
              )}
              {(links.otherDocuments || links.other) && (links.otherDocuments || links.other).length > 0 && (
                <Tooltip content="Other Documents" width={130}>
                  <a href={(links.otherDocuments || links.other)[0]} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--muted-foreground)', display: 'flex', cursor: 'pointer', textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/><line x1="8" y1="8" x2="10" y2="8"/></svg>
                  </a>
                </Tooltip>
              )}
            </div>
          ) : (
            <>
              <span className="ds-meta-dot" />
              <span className="ds-meta-type">{docLabel}</span>
            </>
          )}
          {company.updatedAt && (
            <>
              <svg className="ds-meta-clock" style={{ marginLeft: hasIcons ? '12px' : 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="ds-meta-time">
                {fmtDate(company.updatedAt)}
              </span>
            </>
          )}
        </div>
        <span className="ds-card-icon-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </div>
  );
}

