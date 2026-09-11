import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LockIcon,
  Message02Icon,
  FileValidationIcon,
  Briefcase09Icon,
  PolicyIcon,
  CheckmarkCircle02Icon,
  Target01Icon,
  DiscoverCircleIcon,
  File02Icon,
} from '@hugeicons/core-free-icons';

export const NAV = [
  { href: '/readiness', label: 'Company Profile', icon: File02Icon },
  { href: '/profile', label: 'Company Profile', icon: File02Icon },
  { href: '/strategy', label: 'Fundraising Strategy', icon: Target01Icon },
  { href: '/investors', label: 'Investor Discovery', icon: DiscoverCircleIcon },
  { href: '/outreach', label: 'Outreach', icon: Message02Icon },
  { href: '/term-sheets', label: 'Term sheets', icon: FileValidationIcon },
  { href: '/diligence', label: 'Due Diligence', icon: Briefcase09Icon },
  { href: '/documents', label: 'Definitive Documents', icon: PolicyIcon },
  { href: '/closing', label: 'Closing', icon: CheckmarkCircle02Icon },
];

const UNLOCKS_AFTER = NAV.find((n) => n.href === '/readiness')?.label ?? 'Company Profile';

export function ComingSoon(props) {
  const item =
    'href' in props && props.href
      ? NAV.find((n) => n.href === props.href || props.href.includes(n.href.replace('/', '')))
      : { label: props.title, icon: props.icon };

  if (!item) {
    throw new Error(`Unknown nav href for ComingSoon: ${'href' in props ? props.href : ''}`);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-[380px]">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in oklch, var(--primary, #030712) 7%, transparent)' }}
        >
          <HugeiconsIcon
            icon={item.icon || Message02Icon}
            size={26}
            color="var(--primary, #030712)"
            strokeWidth={1.8}
          />
        </div>
        <h1 className="font-sans text-[22px] font-normal text-gray-950 mt-5 tracking-tight">
          {item.label}
        </h1>
        <p className="text-[14px] font-normal text-gray-500 mt-2 leading-relaxed">
          {props.note}
        </p>
        <div className="inline-flex items-center gap-1.5 mt-5 text-[12.5px] font-normal text-gray-400 border border-gray-200 rounded-full px-3 py-1.5">
          <HugeiconsIcon icon={LockIcon} size={13} strokeWidth={2} />
          Unlocks after {UNLOCKS_AFTER}
        </div>
      </div>
    </div>
  );
}

export default ComingSoon;