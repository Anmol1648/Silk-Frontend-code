import React from 'react';

const NAME_TONE = {
  confirm: 'bg-[var(--cp-status-ai)] text-[var(--cp-status-ai-fg)]',
  resolve: 'bg-amber-50 text-amber-900',
  fill: 'bg-[var(--cp-readiness-mark-soft)] text-foreground',
  upload: 'bg-[var(--cp-readiness-mark-soft)] text-foreground',
};

const GAUGE = {
  size: 180, cx: 90, cy: 90, r: 78, tick: 8, ticks: 60,
};

function gaugeCoord(n) {
  return n.toFixed(3);
}

const GAUGE_TICKS = Array.from({ length: GAUGE.ticks }, (_, i) => {
  const t = i / GAUGE.ticks;
  const angle = Math.PI / 2 - Math.PI * 2 * t;
  const inner = GAUGE.r - GAUGE.tick;
  return {
    t,
    x1: gaugeCoord(GAUGE.cx + inner * Math.cos(angle)),
    y1: gaugeCoord(GAUGE.cy - inner * Math.sin(angle)),
    x2: gaugeCoord(GAUGE.cx + GAUGE.r * Math.cos(angle)),
    y2: gaugeCoord(GAUGE.cy - GAUGE.r * Math.sin(angle)),
  };
});

function ScoreGauge({ score, done, total, ladder }) {
  const shown = typeof score === 'number' ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const pct = shown / 100;
  return (
    <div>
      <div style={{ position: 'relative', margin: '0 auto', width: '72%' }}>
        <svg viewBox={`0 0 ${GAUGE.size} ${GAUGE.size}`} style={{ display: 'block', width: '100%' }}>
          {GAUGE_TICKS.map((tick, i) => {
            const reached = tick.t <= pct;
            return (
              <line
                key={i}
                x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
                stroke={reached ? 'var(--cp-readiness-mark)' : 'color-mix(in srgb, var(--cp-fg) 10%, transparent)'}
                strokeWidth={2} strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p className="cp-gauge-score">{shown}</p>
          <p className="cp-gauge-subtitle">out of 100</p>
        </div>
      </div>
      <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="cp-gauge-badge">{ladder}</span>
        <p className="cp-gauge-verified">{done}/{total} verified</p>
      </div>
    </div>
  );
}

export default function ReadinessInsightCard({
  score, done, total, ladder, actions = [], onPrimary, open = true, className = '',
}) {
  return (
    <aside
      className={`cp-insight ${open ? 'cp-insight--visible' : 'cp-insight--hidden'} ${className}`}
      aria-hidden={!open}
    >
      <div className="cp-insight-card">
        <ScoreGauge score={score} done={done} total={total} ladder={ladder} />

        {actions.length > 0 ? (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <p className="cp-next-label">Next</p>
            {actions.map((action, index) => {
              let toneStyle = { background: 'var(--cp-readiness-mark-soft)', color: 'var(--cp-fg)' };
              if (action.kind === 'confirm') toneStyle = { background: 'rgba(124, 58, 237, 0.08)', color: '#6d28d9' };
              else if (action.kind === 'resolve') toneStyle = { background: '#fffbeb', color: '#78350f' };

              return (
                <div key={action.id} style={{ marginTop: index === 0 ? '0.75rem' : '1.25rem', borderTop: index === 0 ? 'none' : '1px solid rgb(3 7 18 / 0.04)', paddingTop: index === 0 ? '0' : '1.25rem' }}>
                  <p className="cp-action-text">
                    <mark className="cp-action-name" style={toneStyle}>
                      {action.name}
                    </mark>{' '}
                    {action.reason}
                  </p>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button type="button" className="cp-pill-btn" onClick={() => onPrimary(action)}>
                      {action.primaryLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ marginTop: '1.5rem', fontSize: '13px', lineHeight: 1.625, color: 'var(--cp-popover-fg)' }}>
            The Company Profile is complete. Submit when you want it in front of investors.
          </p>
        )}
      </div>
    </aside>
  );
}
