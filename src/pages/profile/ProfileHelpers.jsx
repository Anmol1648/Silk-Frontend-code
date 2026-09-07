import React, { useState, useEffect } from 'react';

/* ── Constants ── */

export const PIPELINE_ORDER = ['research', 'documents', 'consolidating', 'synthesizing', 'saving'];

export const THINK_STEPS = [
  'Reading the profile…',
  'Weighing each part…',
  'Analyzing company data…',
];

/* ── getStepStatus ── */
export function getStepStatus(data, stepKey) {
  if (!data || (data.status !== 'generating' && data.status !== 'draft')) return 'done';
  if (data.pipelineStage) {
    const currentIdx = PIPELINE_ORDER.indexOf(data.pipelineStage);
    const stepIdx = PIPELINE_ORDER.indexOf(stepKey);
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }
  return 'pending';
}

/* ── scrollChildInto ── */
export function scrollChildInto(root, el, { offset = 0, align = 'start' } = {}) {
  const rootRect = root.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  let top = elRect.top - rootRect.top + root.scrollTop;
  if (align === 'center') top -= (root.clientHeight - elRect.height) / 2;
  else top -= offset;
  const max = Math.max(0, root.scrollHeight - root.clientHeight);
  root.scrollTo({ top: Math.min(Math.max(0, top), max), behavior: 'smooth' });
}

/* ── AiMark ── */
export function AiMark({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M7 0C9.384 0 10.576-.0002 11.495.445C12.393.881 13.119 1.607 13.555 2.505C14 3.424 14 4.616 14 7C14 9.384 14 9.576 13.555 10.495C13.119 11.393 12.393 12.119 11.495 12.555C10.576 13 9.384 13 7 13H2.845C1.849 13 1.351 13 0.971 12.807C.636 12.636.364 12.364.193 12.029-.0003 11.649 0 11.151 0 10.155V7C0 4.616-.0002 3.424.445 2.505C.881 1.607 1.607.881 2.505.445C3.424-.0002 4.616 0 7 0ZM7.855 3.235C7.278 2.922 6.698 2.922 6.121 3.235L6.722 6.757L3.591 5.121C3.351 5.353 3.186 5.613 3.098 5.902C3.009 6.192 2.98 6.51 3.013 6.857H3.02L6.512 7.378L4.006 9.958C4.246 10.57 4.72 10.918 5.427 11L6.992 7.85L8.582 11C9.287 10.918 9.763 10.57 10.003 9.958L7.473 7.378L10.988 6.857C11.019 6.51 10.989 6.192 10.892 5.902C10.794 5.613 10.626 5.353 10.386 5.121L7.277 6.757L7.855 3.235Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ── GeneratingStep ── */
export function GeneratingStep({ label, detail, status }) {
  return (
    <div className="flex items-start gap-4" style={{ marginBottom: 16 }}>
      <div className="mt-1 flex-shrink-0" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {status === 'done' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {status === 'active' && (
          <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ccc', borderTopColor: 'black', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
        )}
        {status === 'pending' && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e7eb' }} />
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'black' }}>{label}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{detail}</div>
      </div>
    </div>
  );
}

/* ── ProfileThinkingBlock ── */
export function ProfileThinkingBlock({ steps = THINK_STEPS }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex(n => Math.min(n + 1, steps.length - 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [steps]);

  const label = steps[index] || 'Reading the profile…';

  return (
    <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center bg-white">
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-[20px] h-[20px] rounded-[5px] bg-[#030712]/[0.08] flex items-center justify-center text-[11px] font-semibold text-[#030712] silk-think-mark shrink-0 leading-none">
          ✳
        </div>
        <p key={label} className="silk-think-text text-[13.5px] font-normal leading-none flex items-center">
          {label}
        </p>
      </div>
    </div>
  );
}
