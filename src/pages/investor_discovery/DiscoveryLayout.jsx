import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './discovery.css';
import { snapshotData, kpiData, filterOptions, filterDefaults, investorDatabase } from './mockDatabase';
import SmartFilters from './SmartFilters';
import InvestorGrid from './InvestorGrid';
import InvestorDetailsDrawer from './InvestorDetailsDrawer';

/**
 * DiscoveryLayout — Stage 3: Investor Discovery
 *
 * Full-page layout with sidebar, KPI cards, smart filters,
 * investor data table, and the details drawer.
 *
 * This component manages all local state (filters, saved list,
 * selected investor, etc.) and passes slices down to children.
 */

const PAGE_SIZE = 10;

export default function DiscoveryLayout() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  // ── State ──
  const [filters, setFilters] = useState({ ...filterDefaults });
  const [investors, setInvestors] = useState(() =>
    investorDatabase.map((inv) => ({ ...inv }))
  );
  const [activeTab, setActiveTab] = useState('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('matchScore');
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [page, setPage] = useState(1);

  // ── Derived data ──
  const savedCount = useMemo(() => investors.filter((i) => i.isSaved).length, [investors]);

  // Base list of investors matching the locked Smart Filters
  const baseFilteredInvestors = useMemo(() => {
    let list = [...investors];
    if (filters.sector) {
      list = list.filter((i) => i.sectorFocus.includes(filters.sector));
    }
    if (filters.investorType) {
      list = list.filter((i) => i.investorType === filters.investorType);
    }
    if (filters.country) {
      list = list.filter((i) => i.geography.includes(filters.country) || i.geography.includes('Global'));
    }
    return list;
  }, [investors, filters]);

  // Derived KPIs
  const topMatchesCount = useMemo(() => {
    return baseFilteredInvestors.filter((i) => i.tier === 'top').length;
  }, [baseFilteredInvestors]);

  const avgMatchScore = useMemo(() => {
    const topMatches = baseFilteredInvestors.filter((i) => i.tier === 'top');
    if (topMatches.length === 0) return 0;
    return Math.round(topMatches.reduce((sum, i) => sum + i.matchScore, 0) / topMatches.length);
  }, [baseFilteredInvestors]);

  // The final list shown in the grid
  const filteredInvestors = useMemo(() => {
    let list = [...baseFilteredInvestors];

    // Tab filter
    if (activeTab === 'top') {
      list = list.filter((i) => i.tier === 'top');
    } else if (activeTab === 'good') {
      list = list.filter((i) => i.tier === 'good');
    } else if (activeTab === 'saved') {
      list = list.filter((i) => i.isSaved);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === 'matchScore') {
      list.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'type') {
      list.sort((a, b) => a.investorType.localeCompare(b.investorType));
    }

    return list;
  }, [baseFilteredInvestors, activeTab, searchQuery, sortBy]);

  // ── Handlers ──
  const toggleSave = useCallback((id) => {
    setInvestors((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, isSaved: !inv.isSaved } : inv))
    );
    // Also update selected investor if it's open
    setSelectedInvestor((prev) => {
      if (prev && prev.id === id) return { ...prev, isSaved: !prev.isSaved };
      return prev;
    });
  }, []);

  const handleSelect = useCallback((inv) => {
    setSelectedInvestor((prev) => (prev?.id === inv.id ? null : inv));
  }, []);

  // Keep selected investor in sync with save state
  const currentSelected = useMemo(() => {
    if (!selectedInvestor) return null;
    return investors.find((i) => i.id === selectedInvestor.id) || selectedInvestor;
  }, [selectedInvestor, investors]);



  // Reset page when filters or tabs change
  const handleTabChange = (tab) => { setActiveTab(tab); setPage(1); setSelectedInvestor(null); };
  const handleFilterChange = (f) => { setFilters(f); setPage(1); };
  const handleSearchChange = (q) => { setSearchQuery(q); setPage(1); };

  return (
    <div className="id-layout">
      {/* ── Left Sidebar (Snapshot Widget) ── */}
      <div className="id-sidebar">
        <div className="id-snapshot">
          <h4>Your Snapshot</h4>

          <div className="id-snapshot-row">
            <span className="id-snapshot-label">Evaluation Score</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="id-snapshot-score">
                {snapshotData.evaluationScore} <span>/ {snapshotData.maxScore}</span>
              </span>
              <span className="id-snapshot-band">{snapshotData.scoreBand}</span>
            </div>
          </div>

          <div className="id-snapshot-divider" />

          <div className="id-snapshot-row">
            <span className="id-snapshot-label">Stage</span>
            <span className="id-snapshot-value">{snapshotData.stage}</span>
          </div>

          <div className="id-snapshot-divider" />

          <div className="id-snapshot-row">
            <span className="id-snapshot-label">Sector</span>
            <span className="id-snapshot-value">{snapshotData.sector}</span>
          </div>

          <div className="id-snapshot-divider" />

          <div className="id-snapshot-row">
            <span className="id-snapshot-label">Raise Amount</span>
            <span className="id-snapshot-value">{snapshotData.raiseAmount}</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="id-main">
        {/* Back link */}
        <div className="id-back-link" onClick={() => navigate(`/companies/${companyId}/strategy`)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Fundraising Strategy
        </div>

        {/* Header */}
        {/* <div className="id-header">
          <div>
            <h1>Investor Discovery</h1>
            <p>AI-powered investor recommendations pre-filtered from Jan'24–May'26 database</p>
          </div>
          <button className="id-btn-export">📥 Export PDF</button>
        </div> */}

        {/* KPI Cards */}
        <div className="id-kpi-row">
          <div className="id-kpi-card">
            <div className="id-kpi-label">Master Records</div>
            <div className="id-kpi-value">{kpiData.masterRecords.toLocaleString()}</div>
          </div>
          <div className="id-kpi-card">
            <div className="id-kpi-label">Top Matches</div>
            <div className="id-kpi-value id-kpi-value--green">{topMatchesCount}</div>
          </div>
          <div className="id-kpi-card">
            <div className="id-kpi-label">Avg Match Score</div>
            <div className="id-kpi-value id-kpi-value--purple">{avgMatchScore}%</div>
          </div>
          <div className="id-kpi-card id-kpi-card--highlight">
            <div className="id-kpi-label">Saved for Outreach</div>
            <div className="id-kpi-value id-kpi-value--amber">{savedCount}</div>
          </div>
        </div>

        {/* Smart Filters */}
        <SmartFilters
          options={filterOptions}
          values={filters}
          onChange={handleFilterChange}
        />

        {/* Investor Grid */}
        <InvestorGrid
          investors={filteredInvestors}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedId={currentSelected?.id}
          onSelect={handleSelect}
          onToggleSave={toggleSave}
          savedCount={savedCount}
          page={page}
          setPage={setPage}
          pageSize={PAGE_SIZE}
        />

        {/* Details Drawer (below the table) */}
        {currentSelected && (
          <InvestorDetailsDrawer
            investor={currentSelected}
            onClose={() => setSelectedInvestor(null)}
            onToggleSave={toggleSave}
          />
        )}
      </div>
    </div>
  );
}
