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
import { Input } from '../components/ui/input';
import { OptionsCombobox } from '../components/options-combobox';
import { useBackgroundTasks } from '../context/BackgroundTaskContext';
import { ShareCompanyModal } from '../components/WorkspaceInviteControl';
import { HugeiconsIcon } from '@hugeicons/react';
import { Share08Icon } from '@hugeicons/core-free-icons';

/**
 * Dashboard — the landing page after login (PRD §4).
 *
 * Clean, modern SaaS dashboard with integrated Search, Grid & Table views,
 * and high-fidelity company workspace cards.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast, error: toastError } = useToast();
  const { brand } = useConfig();
  const { stopWatchingCompany } = useBackgroundTasks();
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyToShare, setCompanyToShare] = useState(null);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical'); // 'alphabetical' | 'funding'
  const [tableSortKey, setTableSortKey] = useState(null);
  const [tableSortDir, setTableSortDir] = useState('asc');

  const load = () => me.contexts()
    .then((res) => {
      setItems(res.items || []);
    })
    .catch((e) => { toastError(e); setItems([]); });

  useEffect(() => {
    load();
    const handleCreated = () => { load(); };
    window.addEventListener('company-created', handleCreated);
    return () => window.removeEventListener('company-created', handleCreated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        entity: it.entity || it.parentEntity || it.parentCompany || it.industry || it.companyName || '',
        type: it.type || it.entityType || (it.industry?.toLowerCase().includes('fund') ? 'Fund' : it.industry?.toLowerCase().includes('group') ? 'Group' : 'Company'),
        logoUrl: it.logoUrl || '',
        stageNo: it.currentStageNo ?? it.stageNo,
        stageLabel: it.currentStageLabel || '',
        updatedAt: it.updatedAt || it.lastUpdatedAt,
        createdAt: it.createdAt || it.updatedAt || it.lastUpdatedAt,
        resumePath: it.resumePath,
        profileComplete: it.profileComplete,
        totalFundingReceivedUsdMn: it.totalFundingReceivedUsdMn,
        lastRaise: it.lastRaise,
        attachmentLinks: it.attachmentLinks,
        isOwner: it.isOwner ?? true,
        canShare: it.canShare ?? true,
        canDelete: it.canDelete ?? true,
        deals: [],
      });
    }
    const row = byCompany.get(key);
    
    if (it.scope === 'company') {
      if (it.industry || it.sector) row.industry = it.industry || it.sector;
      if (it.entity || it.parentEntity) row.entity = it.entity || it.parentEntity;
      if (it.type || it.entityType) row.type = it.type || it.entityType;
      if (it.createdAt) row.createdAt = it.createdAt;
      if (it.lastRaise !== undefined) row.lastRaise = it.lastRaise;
      if (it.totalFundingReceivedUsdMn !== undefined) row.totalFundingReceivedUsdMn = it.totalFundingReceivedUsdMn;
      if (it.attachmentLinks !== undefined) row.attachmentLinks = it.attachmentLinks;
      if (it.profileComplete !== undefined) row.profileComplete = it.profileComplete;
      if (it.logoUrl !== undefined) row.logoUrl = it.logoUrl;
      if (it.isOwner !== undefined) row.isOwner = it.isOwner;
      if (it.canShare !== undefined) row.canShare = it.canShare;
      if (it.canDelete !== undefined) row.canDelete = it.canDelete;
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

  let filteredCards = cards.filter((c) => {
    if (selectedCompanyId && c.companyId !== selectedCompanyId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.companyName?.toLowerCase().includes(q);
      const matchIndustry = c.industry?.toLowerCase().includes(q);
      const matchRaise = c.lastRaise?.round?.toLowerCase().includes(q);
      if (!matchName && !matchIndustry && !matchRaise) return false;
    }
    return true;
  });

  // Sort filtered cards
  if (viewMode === 'table' && tableSortKey) {
    filteredCards = [...filteredCards].sort((a, b) => {
      let valA, valB;
      if (tableSortKey === 'company') {
        valA = a.companyName || '';
        valB = b.companyName || '';
        return tableSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (tableSortKey === 'sector') {
        valA = a.industry || '';
        valB = b.industry || '';
        return tableSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (tableSortKey === 'funding') {
        valA = Number(a.totalFundingReceivedUsdMn || 0);
        valB = Number(b.totalFundingReceivedUsdMn || 0);
        return tableSortDir === 'asc' ? valA - valB : valB - valA;
      } else if (tableSortKey === 'updated') {
        valA = new Date(a.updatedAt || 0).getTime();
        valB = new Date(b.updatedAt || 0).getTime();
        return tableSortDir === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  } else if (sortBy === 'funding') {
    filteredCards = [...filteredCards].sort((a, b) => {
      const f1 = Number(a.totalFundingReceivedUsdMn || 0);
      const f2 = Number(b.totalFundingReceivedUsdMn || 0);
      return f2 - f1;
    });
  } else if (sortBy === 'alphabetical') {
    filteredCards = [...filteredCards].sort((a, b) => 
      (a.companyName || '').localeCompare(b.companyName || '')
    );
  }

  const handleTableSort = (key) => {
    if (tableSortKey === key) {
      setTableSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setTableSortKey(key);
      setTableSortDir('asc');
    }
  };

  return (
    <div className="ds-layout ds-dashboard-layout">
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
            onCreated={(companyId) => {
              setAdding(false);
              navigate(`/companies/${companyId}/profile`);
            }}
          />
        )}

        {/* ---- Content ---- */}
        <div className="ds-content ds-dashboard-content">
          {items === null && (
            <div className="ds-cards-grid">
              <Skeleton h={195} style={{ borderRadius: '14px' }} />
              <Skeleton h={195} style={{ borderRadius: '14px' }} />
              <Skeleton h={195} style={{ borderRadius: '14px' }} />
            </div>
          )}

          {items !== null && cards.length === 0 && (
            <div className="ds-empty-state">
              <span className="illo-wrap"><Illo name="handshake" size={110} /></span>
              <h2>Welcome to {brand.productName}</h2>
              <p className="hint" style={{ maxWidth: 460, margin: '0 auto 18px', color: '#71717a' }}>
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

          {cards.length > 0 && (
            <>
              {/* ---- Section Heading ---- */}
              <div className="ds-section-heading" style={{ marginBottom: '16px' }}>
                <div>
                  <span className="ds-section-kicker">Company workspaces</span>
                  <h2>Everything for Your Company</h2>
                </div>
              </div>

              {/* ---- Action & Filter Toolbar ---- */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                {/* Left: Search bar + Company Count Badge */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-64 max-w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-subtle flex items-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search companies…"
                      className="h-9 pl-9 pr-8 text-sm bg-secondary border-0 text-foreground"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground cursor-pointer flex items-center justify-center p-0.5"
                        aria-label="Clear search"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-foreground-subtle bg-secondary rounded-lg h-9 select-none">
                    {filteredCards.length} {filteredCards.length === 1 ? 'total' : 'total'}
                  </span>
                </div>

                {/* Right: Sort dropdown using OptionsCombobox + View Mode */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-[180px]">
                    <OptionsCombobox
                      value={sortBy}
                      onChange={(val) => setSortBy(val)}
                      options={[
                        { label: 'Name (A–Z)', value: 'alphabetical' },
                        { label: 'Highest Raised', value: 'funding' },
                      ]}
                      placeholder="Sort by…"
                      searchable={false}
                      triggerClassName="h-9 py-1 bg-secondary border-0 text-sm font-normal rounded-lg shadow-none"
                    />
                  </div>

                  {/* View Mode Toggle Controls */}
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-secondary h-9">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center ${
                        viewMode === 'grid'
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-foreground-subtle hover:text-foreground'
                      }`}
                      title="Card view"
                      aria-label="Card view"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`h-8 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center ${
                        viewMode === 'table'
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-foreground-subtle hover:text-foreground'
                      }`}
                      title="Table view"
                      aria-label="Table view"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {filteredCards.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="ds-cards-grid">
                    {filteredCards.map((c) => (
                      <CompanyCard 
                        key={c.companyId || c.companyName} 
                        company={c} 
                        onShareClick={() => setCompanyToShare(c)}
                        onDeleteClick={() => setCompanyToDelete(c)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full flex-1 min-h-0 overflow-auto bg-white border border-[#e5e7eb]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#f9fafb]">
                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[13px] font-medium">
                          <th
                            className="py-2 px-5 font-medium cursor-pointer select-none hover:text-[#18181b] transition-colors"
                            onClick={() => handleTableSort('company')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Company</span>
                              <SortArrowsIcon size={11} className="text-[#a1a1aa]" />
                            </div>
                          </th>
                          <th
                            className="py-2 px-5 font-medium cursor-pointer select-none hover:text-[#18181b] transition-colors"
                            onClick={() => handleTableSort('sector')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Sector</span>
                              <SortArrowsIcon size={11} className="text-[#a1a1aa]" />
                            </div>
                          </th>
                          <th
                            className="py-2 px-5 font-medium cursor-pointer select-none hover:text-[#18181b] transition-colors"
                            onClick={() => handleTableSort('funding')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Total Raised / Round</span>
                              <SortArrowsIcon size={11} className="text-[#a1a1aa]" />
                            </div>
                          </th>
                          <th className="py-2 px-5 font-medium">
                            <span>Materials & Links</span>
                          </th>
                          <th
                            className="py-2 px-5 font-medium cursor-pointer select-none hover:text-[#18181b] transition-colors"
                            onClick={() => handleTableSort('updated')}
                          >
                            <div className="flex items-center justify-between">
                              <span>Last Updated</span>
                              <SortArrowsIcon size={11} className="text-[#a1a1aa]" />
                            </div>
                          </th>
                          <th className="py-2 px-5 text-right font-medium">
                            <span>Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCards.map((c) => (
                          <CompanyTableRow 
                            key={c.companyId || c.companyName} 
                            company={c} 
                            onShareClick={() => setCompanyToShare(c)}
                            onDeleteClick={() => setCompanyToDelete(c)} 
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="ds-empty-state" style={{ padding: '36px 20px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#71717a' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>
                    No companies found
                  </h3>
                  <p className="hint" style={{ fontSize: '13px', color: '#71717a', margin: '0 0 14px' }}>
                    {searchQuery ? 'No companies matching your search.' : 'No companies found.'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1.5 rounded-lg border border-[#e4e4e7] bg-white text-[13px] font-medium text-[#18181b] hover:bg-[#f4f4f5] transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(isOpen) => {
        if (!isOpen && !deleting) setCompanyToDelete(null);
      }}>
        <AlertDialogContent className="max-w-[440px] p-0 gap-0 overflow-hidden bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 text-[#030712]" style={{ fontFamily: 'var(--font-schibsted), system-ui, sans-serif' }}>
          <div className="p-6 pb-4 bg-white">
            {/* Header: Danger Icon + Heading Title + Close Button */}
            <div className="flex items-center justify-between gap-3" style={{ marginBottom: '24px' }}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Danger Icon */}
                <div className="size-9 rounded-xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-[#dc2626] shadow-xs shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>

                {/* Heading next to Icon */}
                <AlertDialogTitle className="font-heading text-[18px] font-medium text-[#030712] tracking-[-0.02em] leading-snug truncate" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>
                  Delete {companyToDelete?.companyName}?
                </AlertDialogTitle>
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setCompanyToDelete(null)}
                className="size-7 -mr-1 rounded-md text-[#6b7280] hover:text-[#030712] hover:bg-[#f4f4f5] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Description Text Below */}
            <AlertDialogDescription className="text-[13px] leading-[1.6] text-[#6b7280]" style={{ marginTop: '0px', marginBottom: '16px' }}>
              This will permanently remove this company along with all associated workspaces, documents, and data. This action cannot be undone.
            </AlertDialogDescription>

            {/* Target Item Preview Card */}
            {companyToDelete && (
              <div className="mt-4 p-3 rounded-xl bg-[#fafafa] border border-[#e5e7eb] flex items-center gap-3">
                <div className="size-9 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-center overflow-hidden shrink-0">
                  {companyToDelete.logoUrl ? (
                    <img src={companyToDelete.logoUrl} alt={companyToDelete.companyName} className="size-full object-contain p-1" />
                  ) : (
                    <span className="text-[13px] font-bold text-[#030712]">
                      {companyToDelete.companyName?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-[#030712] truncate">
                    {companyToDelete.companyName}
                  </div>
                  <div className="text-[11.5px] text-[#6b7280] truncate flex items-center gap-1.5 mt-0.5">
                    {companyToDelete.industry && <span>{companyToDelete.industry}</span>}
                    {companyToDelete.industry && <span className="text-[#d4d4d8]">•</span>}
                    <span>Workspace & Data</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <AlertDialogFooter className="p-4 pt-3 bg-[#fafafa] border-t border-[#e5e7eb] flex flex-row items-center justify-end gap-2.5 m-0">
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => setCompanyToDelete(null)}
              className="h-9 px-4 text-[13px] font-medium rounded-lg border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f4f4f5] hover:text-[#030712] transition-colors cursor-pointer m-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                if (deleting) return;
                setDeleting(true);
                const delId = companyToDelete.companyId;
                const delName = companyToDelete.companyName;
                try {
                  await companies.remove(delId);
                  if (stopWatchingCompany) stopWatchingCompany(delId);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('company-deleted', { detail: { companyId: delId } }));
                  }
                  toast(`${delName} has been deleted.`);
                  setCompanyToDelete(null);
                  load(); // refresh dashboard
                } catch (ex) {
                  toastError(ex);
                } finally {
                  setDeleting(false);
                }
              }}
              className="h-9 px-4 text-[13px] font-medium rounded-lg text-white bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] border-none shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 m-0"
            >
              {deleting ? (
                <>
                  <span className="inline-block size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span>Delete Company</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Company Modal */}
      <ShareCompanyModal
        open={!!companyToShare}
        onClose={() => setCompanyToShare(null)}
        company={companyToShare}
      />
    </div>
  );
}

function fmtFunding(usdMn) {
  if (usdMn === null || usdMn === undefined || usdMn === '') return null;
  const num = Number(usdMn);
  if (isNaN(num) || num <= 0) return null;
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (num >= 1) {
    return `$${num.toFixed(1).replace(/\.0$/, '')}M`;
  }
  return `$${Math.round(num * 1000)}K`;
}

function fmtRaiseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

/**
 * CompanyCard — styled with rich fundraising metrics, document readiness, and shimmer interaction.
 */
function CompanyCard({ company, isLastActive, onShareClick, onDeleteClick }) {
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

  // Tags from industry keywords
  const tags = [];
  if (company.industry) {
    company.industry.split(/[,\/&]+/).forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) tags.push(trimmed);
    });
  }

  // Highlights / Status metrics
  const stageName = company.stageLabel || (company.stageNo ? `Stage ${company.stageNo}` : null);
  const raiseRound = company.lastRaise?.round;
  const raiseDate = fmtRaiseDate(company.lastRaise?.date);
  const formattedFunding = fmtFunding(company.totalFundingReceivedUsdMn);
  const activeDealsCount = company.deals?.length || 0;

  // Build a rich, enticing natural summary
  const descParts = [];
  if (company.industry) {
    descParts.push(`Operating in the ${company.industry} sector.`);
  }
  if (formattedFunding) {
    descParts.push(`Secured ${formattedFunding} in total funding${raiseRound ? ` (latest: ${raiseRound}${raiseDate ? ` in ${raiseDate}` : ''})` : ''}.`);
  } else if (raiseRound) {
    descParts.push(`Last raised ${raiseRound}${raiseDate ? ` in ${raiseDate}` : ''}.`);
  }
  const description = descParts.length > 0
    ? descParts.join(' ')
    : `Company profile and workspace for ${company.companyName}.`;

  const docLabel = activeDealsCount > 0 ? 'Documents' : 'Profile';
  const links = company.attachmentLinks || {};
  const hasIcons = !!(links.companyUrl || links.founderProfile || links.productDeck || links.companyPresentation || links.financialModel || links.annualReportFinancialStatements || (links.other && links.other.length > 0) || (links.otherDocuments && links.otherDocuments.length > 0));

  return (
    <div
      className="ds-company-card group"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
    >
      {/* Header: Logo, Company Name, Role, Recent Tag, Delete action */}
      <div className="ds-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
          {company.logoUrl ? (
            <>
              <img 
                src={company.logoUrl} 
                alt="" 
                style={{ width: 44, height: 44, borderRadius: '10px', objectFit: 'contain', background: '#fff', border: '1px solid #e4e4e7', padding: '2px', flexShrink: 0 }} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                style={{ 
                  width: 44, height: 44, borderRadius: '10px', border: '1px solid #e4e4e7',
                  display: 'none', alignItems: 'center', justifyContent: 'center',
                  background: '#f4f4f5', color: '#18181b', fontSize: '17px', fontWeight: 600,
                  textTransform: 'uppercase', flexShrink: 0
                }}
              >
                {company.companyName ? company.companyName.charAt(0) : '?'}
              </div>
            </>
          ) : (
            <div 
              style={{ 
                width: 44, height: 44, borderRadius: '10px', border: '1px solid #e4e4e7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f4f4f5', color: '#18181b', fontSize: '17px', fontWeight: 600,
                textTransform: 'uppercase', flexShrink: 0
              }}
            >
              {company.companyName ? company.companyName.charAt(0) : '?'}
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="ds-card-title truncate" title={company.companyName}>
              {company.companyName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '11.5px', color: '#71717a' }}>
              <span className="truncate">
                {company.industry || 'Workspace'}
                {raiseRound ? ` • ${raiseRound}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Share action */}
          {company.canShare && (
            <button 
              type="button"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/[0.05] transition-colors cursor-pointer"
              style={{ marginTop: '-4px' }}
              onClick={(e) => {
                e.stopPropagation();
                onShareClick?.();
              }}
              title="Share Company"
              aria-label="Share Company"
            >
              <HugeiconsIcon icon={Share08Icon} size={15} strokeWidth={2} />
            </button>
          )}

          {/* Delete action */}
          {company.canDelete && (
            <button 
              type="button"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              style={{ marginTop: '-4px', marginRight: '-4px' }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
              title="Delete Company"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <Tooltip content={description} position="bottom">
        <p className="ds-card-desc" style={{ cursor: 'default', margin: '11px 0 13px', minHeight: '38px' }}>
          {description}
        </p>
      </Tooltip>

      {/* Tags / Metrics Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {/* Total Funding Badge */}
        {formattedFunding && (
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#18181b', background: 'rgba(24, 24, 27, 0.04)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(24, 24, 27, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            {formattedFunding} Raised
          </span>
        )}

        {/* Latest Round Badge (if no total funding) */}
        {!formattedFunding && raiseRound && (
          <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#18181b', background: '#f4f4f5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e4e4e7' }}>
            {raiseRound}
          </span>
        )}

        {/* Industry Tag */}
        {tags.slice(0, 1).map((tag) => (
          <span className="ds-tag" key={tag}>{tag}</span>
        ))}
      </div>

      {/* Spacer */}
      <div className="ds-card-spacer" />

      {/* Bottom info row */}
      <div className="ds-card-bottom">
        <div className="ds-card-meta">
          {hasIcons ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {links.companyUrl && (
                <Tooltip content="Company Website" width={130}>
                  <a href={links.companyUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#71717a', display: 'flex', cursor: 'pointer', textDecoration: 'none' }} className="hover:text-[#18181b] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </a>
                </Tooltip>
              )}
              {links.founderProfile && (
                <Tooltip content="Founder LinkedIn" width={130}>
                  <a href={links.founderProfile} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#71717a', display: 'flex', cursor: 'pointer', textDecoration: 'none' }} className="hover:text-[#18181b] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                </Tooltip>
              )}
              {(links.productDeck || links.companyPresentation) && (
                <Tooltip content="Pitch Deck" width={100}>
                  <a href={links.productDeck || links.companyPresentation} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#71717a', display: 'flex', cursor: 'pointer', textDecoration: 'none' }} className="hover:text-[#18181b] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  </a>
                </Tooltip>
              )}
              {links.financialModel && (
                <Tooltip content="Financial Model" width={120}>
                  <a href={links.financialModel} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#71717a', display: 'flex', cursor: 'pointer', textDecoration: 'none' }} className="hover:text-[#18181b] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                  </a>
                </Tooltip>
              )}
              {links.annualReportFinancialStatements && (
                <Tooltip content="Annual Report" width={110}>
                  <a href={links.annualReportFinancialStatements} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#71717a', display: 'flex', cursor: 'pointer', textDecoration: 'none' }} className="hover:text-[#18181b] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </a>
                </Tooltip>
              )}
              {(links.otherDocuments || links.other) && (links.otherDocuments || links.other).length > 0 && (
                <Tooltip content="Other Documents" width={130}>
                  <a href={(links.otherDocuments || links.other)[0]} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#71717a', display: 'flex', cursor: 'pointer', textDecoration: 'none' }} className="hover:text-[#18181b] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/><line x1="8" y1="8" x2="10" y2="8"/></svg>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: hasIcons ? '6px' : '0', color: '#a1a1aa' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{fmtDate(company.updatedAt)}</span>
            </span>
          )}
        </div>

        <span className="silk-ai-btn silk-ai-btn--icon ds-card-icon-badge" aria-hidden="true">
          <span className="silk-ai-btn__inner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </span>
      </div>
    </div>
  );
}

function CalendarIcon({ size = 13, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function SortArrowsIcon({ size = 11, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function fmtTableDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

function CompanyTableRow({ company, isLastActive, onShareClick, onDeleteClick }) {
  const navigate = useNavigate();

  function open() {
    if (company.resumePath) { navigate(company.resumePath); return; }
    if (company.profileComplete && company.deals?.length) {
      const stage = company.stageNo && company.stageNo > 0 ? company.stageNo : 1;
      navigate(`/deals/${company.deals[0].dealId}/stage/${stage}`);
      return;
    }
    navigate(`/companies/${company.companyId}/profile`);
  }

  const tags = [];
  if (company.industry) {
    company.industry.split(/[,\/&]+/).forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) tags.push(trimmed);
    });
  }

  const stageName = company.stageLabel || (company.stageNo ? `Stage ${company.stageNo}` : null);
  const raiseRound = company.lastRaise?.round;
  const raiseDate = fmtRaiseDate(company.lastRaise?.date);
  const formattedFunding = fmtFunding(company.totalFundingReceivedUsdMn);
  const links = company.attachmentLinks || {};
  const hasIcons = !!(links.companyUrl || links.founderProfile || links.productDeck || links.companyPresentation || links.financialModel || links.annualReportFinancialStatements || (links.other && links.other.length > 0) || (links.otherDocuments && links.otherDocuments.length > 0));

  return (
    <tr 
      onClick={open} 
      className="group hover:bg-[#fafafa] transition-colors cursor-pointer text-[#18181b]"
    >
      {/* 1. Company (Plain text - no logo, no icon) */}
      <td className="py-1 px-5 font-normal text-[13.5px] text-[#18181b]">
        <div className="flex flex-col justify-center">
          <span className="font-normal text-[#18181b] text-[13.5px] leading-tight">{company.companyName}</span>
          {stageName && (
            <span className="text-[11px] text-[#71717a] font-normal leading-tight mt-0.5">{stageName}</span>
          )}
        </div>
      </td>

      {/* 2. Sector */}
      <td className="py-1 px-5 text-[13px] text-[#3f3f46]">
        {company.industry || (tags.length > 0 ? tags.join(', ') : '—')}
      </td>

      {/* 3. Total Raised / Round */}
      <td className="py-1 px-5 text-[13px] text-[#18181b]">
        {formattedFunding ? (
          <span>
            {formattedFunding}
            {raiseRound ? <span className="text-[#71717a] text-[11.5px] ml-1.5">({raiseRound})</span> : null}
          </span>
        ) : raiseRound ? (
          <span className="text-[#3f3f46]">{raiseRound}</span>
        ) : (
          <span className="text-[#a1a1aa]">—</span>
        )}
      </td>

      {/* 4. Materials & Links */}
      <td className="py-1 px-5">
        {hasIcons ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {links.companyUrl && (
              <Tooltip content="Website" width={90}>
                <a href={links.companyUrl} target="_blank" rel="noreferrer" className="text-[#71717a] hover:text-[#18181b] transition-colors">
                  <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </a>
              </Tooltip>
            )}
            {links.founderProfile && (
              <Tooltip content="Founder LinkedIn" width={110}>
                <a href={links.founderProfile} target="_blank" rel="noreferrer" className="text-[#71717a] hover:text-[#18181b] transition-colors">
                  <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </Tooltip>
            )}
            {(links.productDeck || links.companyPresentation) && (
              <Tooltip content="Pitch Deck" width={90}>
                <a href={links.productDeck || links.companyPresentation} target="_blank" rel="noreferrer" className="text-[#71717a] hover:text-[#18181b] transition-colors">
                  <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                </a>
              </Tooltip>
            )}
            {links.financialModel && (
              <Tooltip content="Financial Model" width={110}>
                <a href={links.financialModel} target="_blank" rel="noreferrer" className="text-[#71717a] hover:text-[#18181b] transition-colors">
                  <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                </a>
              </Tooltip>
            )}
          </div>
        ) : (
          <span className="text-[#a1a1aa] text-[12px]">—</span>
        )}
      </td>

      {/* 5. Last Updated */}
      <td className="py-1 px-5 text-[#52525b] text-[12.5px]">
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={13} className="text-[#a1a1aa] shrink-0" />
          <span>{fmtTableDate(company.updatedAt)}</span>
        </div>
      </td>

      {/* 6. Actions */}
      <td className="py-1 px-5 text-right">
        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {company.canShare && (
            <button 
              type="button"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              onClick={onShareClick}
              title="Share Company"
              aria-label="Share Company"
            >
              <HugeiconsIcon icon={Share08Icon} size={14} strokeWidth={1.8} />
            </button>
          )}
          {company.canDelete && (
            <button 
              type="button"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              onClick={onDeleteClick}
              title="Delete Company"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
          <button
            type="button"
            className="p-1.5 rounded-md text-foreground-subtle hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            onClick={open}
            title="Open Workspace"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
