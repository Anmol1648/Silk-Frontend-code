import React from 'react';

/**
 * SmartFilters (Locked)
 * Displays the criteria used by the AI to generate the list.
 * Based on user feedback, these are now locked down to prevent searching outside scope.
 */
export default function SmartFilters({ values }) {
  return (
    <div className="id-filters">
      <div className="id-filters-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        AI Matching Criteria (Locked)
      </div>

      <div className="id-filters-grid">
        <div className="id-filter-group">
          <label>Stage</label>
          <div className="id-filter-locked">{values.stage || 'All Stages'}</div>
        </div>
        <div className="id-filter-group">
          <label>Raise Size</label>
          <div className="id-filter-locked">{values.raiseSize || 'All Sizes'}</div>
        </div>
        <div className="id-filter-group">
          <label>Sector</label>
          <div className="id-filter-locked">{values.sector || 'All Sectors'}</div>
        </div>
        <div className="id-filter-group">
          <label>Country</label>
          <div className="id-filter-locked">{values.country || 'All Countries'}</div>
        </div>
        <div className="id-filter-group">
          <label>Expansion Focus</label>
          <div className="id-filter-locked">{values.expansionFocus || 'All Regions'}</div>
        </div>
        <div className="id-filter-group">
          <label>Investor Type</label>
          <div className="id-filter-locked">{values.investorType || 'All Types'}</div>
        </div>
      </div>
    </div>
  );
}
