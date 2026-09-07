import { useEffect, useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { useConfig } from '../context/ConfigContext';
import { profile as profileApi } from '../api/endpoints';
import DashboardSidebar from '../components/DashboardSidebar';

// Exact AiMark component from silkAnkit
function AiMark({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 0C9.384 0 10.576-.0002 11.495.445C12.393.881 13.119 1.607 13.555 2.505C14 3.424 14 4.616 14 7C14 9.384 14 9.576 13.555 10.495C13.119 11.393 12.393 12.119 11.495 12.555C10.576 13 9.384 13 7 13H2.845C1.849 13 1.351 13 0.971 12.807C.636 12.636.364 12.364.193 12.029-.0003 11.649 0 11.151 0 10.155V7C0 4.616-.0002 3.424.445 2.505C.881 1.607 1.607.881 2.505.445C3.424-.0002 4.616 0 7 0Z"
        fill="#ffffff"
      />
      <path
        d="M7.855 3.235C7.278 2.922 6.698 2.922 6.121 3.235L6.722 6.757L3.591 5.121C3.351 5.353 3.186 5.613 3.098 5.902C3.009 6.192 2.98 6.51 3.013 6.857H3.02L6.512 7.378L4.006 9.958C4.246 10.57 4.72 10.918 5.427 11L6.992 7.85L8.582 11C9.287 10.918 9.763 10.57 10.003 9.958L7.473 7.378L10.988 6.857C11.019 6.51 10.989 6.192 10.892 5.902C10.794 5.613 10.626 5.353 10.386 5.121L7.277 6.757L7.855 3.235Z"
        fill="#18181b"
      />
    </svg>
  );
}

/**
 * Shell for company-scoped pages (Company Profile, Fundraising Strategy).
 * Exact 1:1 port of silkAnkit Topbar design.
 */
export default function CompanyLayout() {
  const { companyId } = useParams();
  const location = useLocation();
  const { stages } = useConfig();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    profileApi.read(companyId)
      .then((res) => setCompany(res))
      .catch(() => setCompany(null));
  }, [companyId]);

  const getPageTitle = (pathname) => {
    if (pathname.includes('/profile') || pathname.includes('/readiness')) return 'Company Profile';
    if (pathname.includes('/fundraising') || pathname.includes('/strategy')) return 'Fundraising Strategy';
    if (pathname.includes('/investors') || pathname.includes('/discovery')) return 'Investor Discovery';
    if (pathname.includes('/outreach')) return 'Outreach';
    if (pathname.includes('/term-sheets') || pathname.includes('/termsheets')) return 'Term Sheets';
    if (pathname.includes('/diligence') || pathname.includes('/due-diligence')) return 'Due Diligence';
    if (pathname.includes('/documents') || pathname.includes('/definitive')) return 'Definitive Documents';
    if (pathname.includes('/closing')) return 'Closing';
    return 'Company Profile';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="ds-layout">
      <DashboardSidebar activeItem="workspaces" companyId={companyId} company={company} stages={stages} />

      <div className="ds-main-area">
        {/* ---- Top header bar (Exact silkAnkit Topbar) ---- */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            height: '64px',
            minHeight: '64px',
            flexShrink: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: '2rem',
            paddingRight: '2rem',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Title */}
          <h2
            style={{
              fontFamily: 'Schibsted Grotesk, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: '#030712',
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            {title}
          </h2>

          {/* Right Section: Search + Silk AI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', width: '256px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="cp-search-input"
                style={{
                  width: '100%',
                  height: '36px',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#030712',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Silk AI Button */}
            <button
              type="button"
              className="cp-silk-ai-btn"
              style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('silk:open-ai-panel', { detail: { mode: 'ask' } }));
              }}
            >
              <span className="cp-silk-ai-btn__inner" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
                <AiMark size={14} className="cp-silk-ai-btn__mark" />
                Silk AI
              </span>
            </button>
          </div>
        </header>

        {/* ---- Page content ---- */}
        <div
          className="ds-content"
          style={
            location.pathname.includes('/strategy') || location.pathname.includes('/fundraising')
              ? { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }
              : undefined
          }
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
