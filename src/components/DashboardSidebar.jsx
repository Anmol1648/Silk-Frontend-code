import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home02Icon,
  File02Icon,
  Target01Icon,
  DiscoverCircleIcon,
  Message02Icon,
  FileValidationIcon,
  Briefcase09Icon,
  PolicyIcon,
  CheckmarkCircle02Icon,
  Logout01Icon,
  Settings02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '../context/AppContext';
import { WorkspaceInviteControl } from './WorkspaceInviteControl';

function SettingsModal({ open, onClose, name, email, company }) {
  if (!open) return null;
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#e5e7eb] animate-in fade-in zoom-in-95 duration-150 relative"
      >
        <div className="px-5 pt-5 pb-4 border-b border-[#f3f4f6] relative pr-12">
          <h3 className="font-sans text-[16px] font-semibold text-[#030712]">Settings</h3>
          <p className="text-[14px] text-[#6b7280] mt-0.5">Account and workspace preferences.</p>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 size-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#030712] hover:bg-[#f3f4f6] transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#030712] flex items-center justify-center text-white text-[15px] font-semibold shrink-0">
              {name?.trim()[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-medium text-[#030712] truncate">{name || 'Your name'}</div>
              <div className="text-[12.5px] text-[#6b7280] truncate">{email || 'No email on file'}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1.5">
                Full name
              </div>
              <div className="h-10 px-3 rounded-lg border border-[#e5e7eb] bg-[#f7f7f8] text-[14px] text-[#030712] flex items-center">
                {name || '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1.5">
                Email
              </div>
              <div className="h-10 px-3 rounded-lg border border-[#e5e7eb] bg-[#f7f7f8] text-[14px] text-[#030712] flex items-center">
                {email || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SilkMark({ className = '' }) {
  return (
    <img
      src="/brand/silk-logo.svg"
      alt="Silk"
      style={{ width: 20, height: 20 }}
      className={`w-5 h-5 object-contain ${className}`}
    />
  );
}

function HomeIcon({ size = 17, strokeWidth = 1.7, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 11.9896V14.5C3 17.7998 3 19.4497 4.02513 20.4749C5.05025 21.5 6.70017 21.5 10 21.5H14C17.2998 21.5 18.9497 21.5 19.9749 20.4749C21 19.4497 21 17.7998 21 14.5V11.9896C21 10.3083 21 9.46773 20.6441 8.74005C20.2882 8.01237 19.6247 7.49628 18.2976 6.46411L16.2976 4.90855C14.2331 3.30285 13.2009 2.5 12 2.5C10.7991 2.5 9.76689 3.30285 7.70242 4.90855L5.70241 6.46411C4.37533 7.49628 3.71179 8.01237 3.3559 8.74005C3 9.46773 3 10.3083 3 11.9896Z" />
      <path d="M15.0002 17C14.2007 17.6224 13.1504 18 12.0002 18C10.8499 18 9.79971 17.6224 9.00018 17" />
    </svg>
  );
}

function PanelIcon({ className = '' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2.25" y="3" width="13.5" height="12" rx="2" />
      <path d="M7 3v12" />
    </svg>
  );
}

const STAGE_ICON_MAP = {
  company_profile: File02Icon,
  fundraising_strategy: Target01Icon,
  investor_discovery: DiscoverCircleIcon,
  outreach: Message02Icon,
  term_sheets: FileValidationIcon,
  due_diligence: Briefcase09Icon,
  definitive_documents: PolicyIcon,
  closing: CheckmarkCircle02Icon,
};

export default function DashboardSidebar({ companyId, company, stages }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [menuOpen]);

  const isInsideCompany = Boolean(companyId || (company && company.companyName && company.companyName !== 'Silk'));
  const companyName = company?.companyName || (typeof company === 'string' && company ? company : 'Silk');
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'founder@fundos.ai';

  let companyLogo = company?.logoUrl || company?.logo_url || company?.logoBase64;
  if (!companyLogo && (company?.websiteUrl || company?.website || company?.website_url)) {
    const web = company?.websiteUrl || company?.website || company?.website_url;
    const domain = web.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (domain && domain.includes('.')) {
      companyLogo = `https://img.logo.dev/${domain}?token=pk_EsMpGCHZTke3dtHjuBheHA`;
    }
  }

  const nameParts = userName.trim().split(/\s+/).filter(Boolean);
  const userInitials = nameParts.length >= 2
    ? `${nameParts[0][0] || ''}${nameParts[nameParts.length - 1][0] || ''}`.toUpperCase()
    : (nameParts[0]?.[0]?.toUpperCase() || 'U');

  function CompanyBrandMark({ className = '' }) {
    if (isInsideCompany) {
      if (companyLogo) {
        return (
          <div className={`w-[26px] h-[26px] rounded-[7px] border border-[#e5e7eb] bg-white flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
            <img
              src={companyLogo}
              alt=""
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
            />
            <div className="hidden w-full h-full bg-[#f3f4f6] text-[#030712] font-semibold text-[12px] items-center justify-center">
              {companyName ? companyName.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
        );
      }
      return (
        <div className={`w-[26px] h-[26px] rounded-[7px] border border-[#e5e7eb] bg-[#f4f4f5] text-[#030712] font-semibold text-[12px] flex items-center justify-center shrink-0 ${className}`}>
          {companyName ? companyName.charAt(0).toUpperCase() : '?'}
        </div>
      );
    }
    return (
      <div className={`w-[26px] h-[26px] rounded-[7px] border border-[#e5e7eb] bg-white flex items-center justify-center shrink-0 ${className}`}>
        <SilkMark className="w-4 h-4 shrink-0" />
      </div>
    );
  }

  function getStageHref(stage) {
    if (!companyId) return '#';
    const key = stage.stageKey;
    if (key === 'company_profile') return `/companies/${companyId}/profile`;
    if (key === 'fundraising_strategy') return `/companies/${companyId}/strategy`;
    if (key === 'investor_discovery') return `/companies/${companyId}/investors`;
    if (key === 'outreach') return `/companies/${companyId}/outreach`;
    if (key === 'term_sheets') return `/companies/${companyId}/term-sheets`;
    if (key === 'due_diligence') return `/companies/${companyId}/diligence`;
    if (key === 'definitive_documents') return `/companies/${companyId}/documents`;
    if (key === 'closing') return `/companies/${companyId}/closing`;
    return `/companies/${companyId}/profile`;
  }

  // Backend stages or fallback (filtering out stage 0 / foundation since Home is under MAIN)
  const rawStages = (stages && stages.length > 0) ? stages : [
    { stageNo: 1, stageKey: 'company_profile', label: 'Company Profile' },
    { stageNo: 2, stageKey: 'fundraising_strategy', label: 'Fundraising Strategy' },
    { stageNo: 3, stageKey: 'investor_discovery', label: 'Investor Discovery' },
    { stageNo: 4, stageKey: 'outreach', label: 'Outreach' },
    { stageNo: 5, stageKey: 'term_sheets', label: 'Term sheets' },
    { stageNo: 6, stageKey: 'due_diligence', label: 'Due Diligence' },
    { stageNo: 7, stageKey: 'definitive_documents', label: 'Definitive Documents' },
    { stageNo: 8, stageKey: 'closing', label: 'Closing' },
  ];

  const workspaceStages = rawStages.filter(s => s.stageKey !== 'foundation' && s.stageNo !== 0);

  return (
    <aside
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
      className={`flex h-screen max-h-screen sticky top-0 min-h-0 shrink-0 flex-col overflow-hidden bg-white text-[#030712] border-r border-[#f3f4f6] transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[72px]' : 'w-[220px]'
      }`}
    >
      {/* ---- Brand & Workspace Topbar ---- */}
      <div
        className={`flex items-center h-[72px] shrink-0 ${
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-5'
        }`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="group w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f3f4f6]"
            title={companyName}
          >
            <CompanyBrandMark className="group-hover:hidden" />
            <PanelIcon className="hidden group-hover:block text-[#6b7280]" />
          </button>
        ) : (
          <>
            <CompanyBrandMark />
            <span className="font-medium text-[16px] tracking-[-0.02em] truncate flex-1 min-w-0 text-[#030712]">
              {companyName}
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6] transition-colors shrink-0"
            >
              <PanelIcon />
            </button>
          </>
        )}
      </div>

      {/* ---- Navigation ---- */}
      <nav
        className={`min-h-0 flex-1 overflow-y-auto ${
          collapsed ? 'flex flex-col items-center' : 'px-3'
        }`}
      >
        {/* GROUP 1: MAIN */}
        <div className={`mt-1 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <div className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#9ca3af]">
              Main
            </div>
          )}
          <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
            <NavLink
              to="/dashboard"
              title={collapsed ? 'Home' : undefined}
              className={({ isActive }) => {
                const active = isActive || location.pathname === '/dashboard' || location.pathname === '/home';
                return `group flex items-center rounded-lg text-[14px] h-[36px] gap-2.5 transition-all duration-150 text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#030712] ${
                  collapsed ? 'justify-center size-10 px-0' : 'px-3 w-full'
                } ${active ? 'bg-[#f4f4f5] text-[#030712] font-medium' : 'bg-transparent font-normal'}`;
              }}
            >
              {({ isActive }) => {
                const active = isActive || location.pathname === '/dashboard' || location.pathname === '/home';
                return (
                  <>
                    <HomeIcon
                      size={17}
                      strokeWidth={1.7}
                      className={`shrink-0 transition-colors ${
                        active ? 'text-[#030712]' : 'text-[#71717a] group-hover:text-[#030712]'
                      }`}
                    />
                    {!collapsed && (
                      <span
                        className={`truncate transition-colors ${
                          active ? 'text-[#030712]' : 'text-[#71717a] group-hover:text-[#030712]'
                        }`}
                      >
                        Home
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          </div>
        </div>

        {/* GROUP 2: WORKSPACE */}
        <div className={`mt-6 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed && (
            <div className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#9ca3af]">
              Workspace
            </div>
          )}
          <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
            {workspaceStages.map((stage) => {
              const href = getStageHref(stage);
              const Icon = STAGE_ICON_MAP[stage.stageKey] || File02Icon;
              const isHome = location.pathname === '/dashboard' || location.pathname === '/home';
              const isActive = !isHome && href !== '#' && (location.pathname === href || location.pathname.startsWith(href));

              return (
                <NavLink
                  key={stage.stageKey || stage.stageNo}
                  to={href}
                  title={collapsed ? stage.label : undefined}
                  className={`group flex items-center rounded-lg text-[14px] h-[36px] gap-2.5 transition-all duration-150 text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#030712] ${
                    collapsed ? 'justify-center size-10 px-0' : 'px-3 w-full'
                  } ${isActive ? 'bg-[#f4f4f5] text-[#030712] font-medium' : 'bg-transparent font-normal'}`}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    size={17}
                    strokeWidth={1.7}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#030712]' : 'text-[#71717a] group-hover:text-[#030712]'
                    }`}
                  />
                  {!collapsed && (
                    <span
                      className={`truncate transition-colors ${
                        isActive ? 'text-[#030712]' : 'text-[#71717a] group-hover:text-[#030712]'
                      }`}
                    >
                      {stage.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ---- Footer ---- */}
      <div
        className={`pb-4 shrink-0 relative ${
          collapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-3'
        }`}
      >
        {/* Workspace Invite Control */}
        <div className={`mb-2 ${collapsed ? 'mb-0' : ''}`}>
          <WorkspaceInviteControl collapsed={collapsed} />
        </div>

        {/* User Account Trigger */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            title={collapsed ? userName : undefined}
            className={`group flex items-center rounded-lg transition-colors outline-none hover:bg-[#f4f4f5] ${
              collapsed ? 'justify-center size-10' : 'gap-2 w-full px-3 h-10'
            }`}
          >
            <div className="w-[26px] h-[26px] rounded-full bg-[#030712]/[0.06] flex items-center justify-center text-[10.5px] font-medium tracking-[-0.04em] text-[#374151] shrink-0">
              {userInitials}
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 min-w-0 text-left text-[13.5px] text-[#374151] group-hover:text-[#030712] truncate">
                  {userName}
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 text-[#9ca3af] group-hover:text-[#030712] transition-colors"
                />
              </>
            )}
          </button>

          {/* User Account Popup Menu */}
          {menuOpen && (
            <div
              className="absolute bottom-12 left-0 w-48 bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2.5 py-2">
                <div className="text-[13px] font-medium text-[#030712] truncate">{userName}</div>
                <div className="text-[12px] text-[#9ca3af] truncate">{userEmail}</div>
              </div>
              <div className="my-1 border-t border-[#f3f4f6]" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
                className="w-full flex items-center gap-2 h-8 px-2.5 rounded-lg text-[13.5px] text-[#374151] hover:bg-[#f4f4f5] hover:text-[#030712] transition-colors"
              >
                <HugeiconsIcon icon={Settings02Icon} size={15} strokeWidth={1.8} className="text-[#9ca3af]" />
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 h-8 px-2.5 rounded-lg text-[13.5px] text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
              >
                <HugeiconsIcon icon={Logout01Icon} size={15} strokeWidth={1.8} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        name={userName}
        email={userEmail}
        company={companyName}
      />
    </aside>
  );
}
