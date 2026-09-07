import React from 'react';

/**
 * InvestorGrid (Section 10.3)
 * Tabbed investor table with search, sort, star/save, and pagination.
 */

const STARS_FULL = '★';
const STAR_EMPTY = '☆';

function renderStars(count) {
  return STARS_FULL.repeat(count) + STAR_EMPTY.repeat(5 - count);
}

function getMatchPillClass(score) {
  if (score >= 85) return 'id-match-pill id-match-pill--high';
  if (score >= 70) return 'id-match-pill id-match-pill--med';
  return 'id-match-pill id-match-pill--low';
}

export default function InvestorGrid({
  investors,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedId,
  onSelect,
  onToggleSave,
  savedCount,
  page,
  setPage,
  pageSize,
}) {
  const totalPages = Math.ceil(investors.length / pageSize);
  const startIdx = (page - 1) * pageSize;
  const paged = investors.slice(startIdx, startIdx + pageSize);

  return (
    <div className="id-table-card">
      {/* Tabs */}
      <div className="id-tabs">
        <div
          className={`id-tab ${activeTab === 'top' ? 'id-tab--active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          Top Matches
        </div>
        <div
          className={`id-tab ${activeTab === 'good' ? 'id-tab--active' : ''}`}
          onClick={() => setActiveTab('good')}
        >
          Good Alternatives
        </div>
        <div
          className={`id-tab ${activeTab === 'saved' ? 'id-tab--active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Investors ({savedCount})
        </div>
      </div>

      {/* Search + Sort */}
      <div className="id-controls">
        <input
          type="text"
          className="id-search-input"
          placeholder="Search investor name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="id-sort-control">
          <span>Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="matchScore">Match Score</option>
            <option value="name">Name</option>
            <option value="type">Investor Type</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="id-table">
        <thead>
          <tr>
            <th>Investor</th>
            <th>Match Score</th>
            <th>Investor Type</th>
            <th>Avg. Ticket</th>
            <th>Sector Focus</th>
            <th>Geography</th>
            <th style={{ textAlign: 'center' }}>Save</th>
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                No investors match your current filters.
              </td>
            </tr>
          ) : (
            paged.map((inv) => (
              <tr
                key={inv.id}
                className={selectedId === inv.id ? 'id-row--selected' : ''}
                onClick={() => onSelect(inv)}
              >
                <td>
                  <div className="id-investor-cell">
                    <div className="id-investor-logo" style={{ background: inv.logoColor }}>
                      {inv.logoInitial}
                    </div>
                    <div>
                      <div className="id-investor-name">{inv.name}</div>
                      <div className="id-investor-stars">{renderStars(inv.rating)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={getMatchPillClass(inv.matchScore)}>
                    {inv.matchScore}%
                  </span>
                </td>
                <td style={{ color: '#475569' }}>{inv.investorType}</td>
                <td style={{ color: '#0f172a', fontWeight: 600 }}>{inv.avgTicket}</td>
                <td style={{ color: '#475569' }}>{inv.sectorFocus.join(', ')}</td>
                <td style={{ color: '#475569' }}>{inv.geography.join(', ')}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="id-star-btn"
                    onClick={(e) => { e.stopPropagation(); onToggleSave(inv.id); }}
                    title={inv.isSaved ? 'Remove from outreach' : 'Save for outreach'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24"
                      fill={inv.isSaved ? '#fbbf24' : 'none'}
                      stroke={inv.isSaved ? '#f59e0b' : '#cbd5e1'}
                      strokeWidth={inv.isSaved ? 1.5 : 2}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="id-pagination">
        <div className="id-pagination-info">
          Showing {investors.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + pageSize, investors.length)} of {investors.length} matches
        </div>
        <div className="id-pagination-btns">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
