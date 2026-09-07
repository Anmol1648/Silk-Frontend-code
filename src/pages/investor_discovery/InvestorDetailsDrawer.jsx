import React from 'react';
import { createPortal } from 'react-dom';

/**
 * InvestorDetailsDrawer (Section 10.4)
 * Deep-dive dossier that opens as a side drawer on the right.
 * Displays match breakdown, contact, AI rationale, portfolio, and stats.
 */
export default function InvestorDetailsDrawer({ investor, onClose, onToggleSave }) {
  if (!investor) return null;

  const { matchBreakdown, contact, aiRationale, portfolioTags, recentDeals, stats } = investor;

  return createPortal(
    <div className="id-drawer-overlay" onClick={onClose}>
      <div className="id-drawer" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="id-drawer-header">
        <div className="id-drawer-header-left">
          <div className="id-drawer-logo" style={{ background: investor.logoColor }}>
            {investor.logoInitial}
          </div>
          <div>
            <h2 className="id-drawer-name">{investor.name}</h2>
            <div className="id-drawer-meta">
              <span className="id-drawer-meta-text">
                {investor.investorType} &bull; {investor.geography.join(', ')}
              </span>
              <span className={`id-match-pill ${investor.matchScore >= 85 ? 'id-match-pill--high' : investor.matchScore >= 70 ? 'id-match-pill--med' : 'id-match-pill--low'}`}>
                {investor.matchScore}% Match
              </span>
            </div>
          </div>
        </div>
        <button className="id-drawer-close" onClick={onClose}>&times;</button>
      </div>

      {/* Content Grid */}
      <div className="id-drawer-content">
        {/* Section 1: Match Breakdown */}
        <div className="id-drawer-card">
          <h3 className="id-drawer-section-title">Match Breakdown</h3>
          <div className="id-breakdown-list">
            {matchBreakdown.map((item, i) => (
              <div key={i} className="id-breakdown-row">
                <div className="id-breakdown-labels">
                  <span>{item.dimension} ({item.detail})</span>
                  <strong>{item.score}%</strong>
                </div>
                <div className="id-breakdown-bar">
                  <div className="id-breakdown-fill" style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Key Partner & AI Rationale */}
        <div className="id-drawer-card">
          <h3 className="id-drawer-section-title">Key Partner Contact</h3>
          <div className="id-contact-info">
            <div className="id-contact-avatar">{contact.initials}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="id-contact-name">{contact.name}</div>
              <div className="id-contact-title">{contact.title} &bull; {contact.location}</div>
              <div className="id-contact-email">{contact.email}</div>
            </div>
          </div>
          <div className="id-rationale">
            <strong>AI Rationale: </strong>{aiRationale}
          </div>
        </div>

        {/* Section 3: Momentum Stats */}
        <div className="id-drawer-card">
          <h3 className="id-drawer-section-title">Momentum Stats</h3>
          <div className="id-stats-row">
            <div className="id-stat-box">
              <div className="id-stat-value">{stats.deals12M}</div>
              <div className="id-stat-label">Deals 12M</div>
            </div>
            <div className="id-stat-box">
              <div className="id-stat-value">{stats.medianTicket}</div>
              <div className="id-stat-label">Ticket</div>
            </div>
            <div className="id-stat-box">
              <div className="id-stat-value id-stat-value--green">{stats.leadPct}%</div>
              <div className="id-stat-label">Lead %</div>
            </div>
            <div className="id-stat-box">
              <div className="id-stat-value">{stats.exits}</div>
              <div className="id-stat-label">Exits</div>
            </div>
          </div>
        </div>

        {/* Section 4: Portfolio Synergy & History */}
        <div className="id-drawer-card">
          <h3 className="id-drawer-section-title">Portfolio Synergy & History</h3>
          <div className="id-portfolio-tags">
            {portfolioTags.map((tag, i) => (
              <span key={i} className="id-portfolio-tag">
                <span className="id-portfolio-dot" style={{ background: tag.color }} />
                {tag.name}
              </span>
            ))}
          </div>

          <table className="id-deals-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Round</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.map((deal, i) => (
                <tr key={i}>
                  <td className="id-td-bold">{deal.company}</td>
                  <td>{deal.round}</td>
                  <td className="id-td-right">{deal.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Action */}
      <div className="id-drawer-footer">
        <button
          className={`id-btn-save-outreach ${investor.isSaved ? 'id-btn-save-outreach--saved' : ''}`}
          onClick={() => onToggleSave(investor.id)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={investor.isSaved ? '#fbbf24' : 'none'}
            stroke={investor.isSaved ? '#f59e0b' : '#fff'}
            strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {investor.isSaved ? 'Saved to Outreach' : 'Save for Outreach'}
        </button>
      </div>
      </div>
    </div>,
    document.body
  );
}
