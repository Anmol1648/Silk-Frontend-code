import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

/**
 * ProfileTabs — Sticky category tab bar with scroll-spy active state.
 */
export default function ProfileTabs({
  categories,
  selected,
  tabsRef,
  tabsStuck,
  onSelect,
  maxCls,
}) {
  return (
    <div
      ref={tabsRef}
      className={`sticky top-0 z-20 -mx-10 px-10 bg-white border-b border-solid transition-colors duration-200 ${tabsStuck ? 'border-[#e5e7eb]' : 'border-transparent'}`}
      style={{
        marginLeft: '-2.5rem',
        marginRight: '-2.5rem',
        paddingLeft: '2.5rem',
        paddingRight: '2.5rem',
        background: '#ffffff',
      }}
    >
      <div className={maxCls}>
        <div className="flex w-full max-w-[760px] flex-nowrap items-center gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            if (!cat.subsections.length) return null;
            const active = cat.id === selected;
            return (
              <button
                key={cat.id}
                className={`cp-tab ${active ? 'cp-tab--active' : ''}`}
                onClick={() => onSelect(cat.id)}
              >
                {active && cat.icon && (
                  <HugeiconsIcon icon={cat.icon} size={15} strokeWidth={1.7} />
                )}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
