import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Linkedin02Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import FieldControl from './FieldControl';
import { fieldHasValue } from './profile-utils';

/* ── StatusTag (exact from page.tsx line 90) ── */
export function StatusTag({ label, hoverLabel, onClick, tone = 'neutral' }) {
  const ai = tone === 'ai';

  if (!onClick) {
    return (
      <span className={`cp-tag-${ai ? 'ai' : 'confirmed'}`}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={hoverLabel || label}
      title={hoverLabel || label}
      onClick={e => {
        e.preventDefault();
        onClick();
      }}
      className={`cp-status-tag-btn cp-tag-${ai ? 'ai' : 'confirmed'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        padding: '0.125rem 0.375rem',
        borderRadius: '0.25rem',
        marginLeft: '-0.25rem',
        marginRight: '-0.25rem',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
      }}
    >
      <span className="cp-status-default">{label}</span>
      <span className="cp-status-hover" style={{ display: 'none' }}>{hoverLabel || label}</span>
    </button>
  );
}

/* ── DocumentUploadField Placeholder ── */
function DocumentUploadField({ fieldName, onAsk }) {
  return (
    <div className="cp-upload-zone" onClick={onAsk}>
      <p className="cp-upload-zone-text">
        Drop <strong>{fieldName}</strong> here or click to browse.
      </p>
    </div>
  );
}

/* ── LeadershipEditor (exact from page.tsx line 559) ── */
function normalizeLinkedin(url) {
  if (!url) return '';
  try {
    const u = new URL(url.includes('http') ? url : `https://${url}`);
    return u.pathname.replace(/^\/in\//i, '').replace(/\/$/, '');
  } catch {
    return url.replace(/^\/?in\//i, '').replace(/\/$/, '');
  }
}

function LeadershipEditor({ people, onChange, fieldId }) {
  const update = (id, patch) => {
    onChange(people.map(p => (p.id === id ? { ...p, ...patch } : p)));
  };

  const remove = (id) => {
    onChange(people.filter(p => p.id !== id || p.isOwner));
  };

  const add = () => {
    if (people.filter(p => !p.isOwner).length >= 5) return;
    onChange([
      ...people,
      {
        id: crypto.randomUUID(),
        name: '',
        role: 'Co-founder',
        linkedin: '',
      },
    ]);
  };

  const canAdd = people.filter(p => !p.isOwner).length < 5;

  return (
    <div className="flex flex-col gap-6" id={fieldId} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {people.map((person, idx) => (
        <div key={person.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: '12px', color: 'var(--cp-fg-subtle)' }}>
              {person.isOwner ? 'You' : `Founder ${idx + 1}`}
            </span>
            {!person.isOwner && (
              <button
                type="button"
                aria-label={`Remove ${person.name || 'founder'}`}
                onClick={() => remove(person.id)}
                style={{
                  borderRadius: '0.5rem', padding: '0.25rem', color: 'rgb(3 7 18 / 0.2)',
                  background: 'none', border: 'none', cursor: 'pointer'
                }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--cp-destructive)'; e.currentTarget.style.background = 'var(--cp-muted)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'rgb(3 7 18 / 0.2)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>

          <div className="cp-compact-row" style={{ rowGap: '0.625rem' }}>
            <input
              type="text"
              value={person.name}
              onChange={e => update(person.id, { name: e.target.value })}
              placeholder="Full name"
              className="cp-input"
            />
            <input
              type="text"
              value={person.role}
              onChange={e => update(person.id, { role: e.target.value })}
              placeholder="Role / title"
              className="cp-input"
            />
            <div className="cp-shell-input" style={{ gridColumn: '1 / -1' }}>
              <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '0.375rem', padding: '0 0.75rem', fontSize: '13px', color: 'var(--cp-fg-subtle)' }}>
                <HugeiconsIcon icon={Linkedin02Icon} size={15} strokeWidth={2} />
                linkedin.com/in/
              </span>
              <input
                type="text"
                value={person.linkedin}
                onChange={e =>
                  update(person.id, {
                    linkedin: normalizeLinkedin(e.target.value.replace(/\s+/g, '')),
                  })
                }
                placeholder="username"
                aria-label={`${person.name || 'Founder'} LinkedIn`}
              />
            </div>
          </div>
        </div>
      ))}

      {canAdd && (
        <button
          type="button"
          onClick={add}
          style={{
            display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            borderRadius: '0.5rem', padding: '0.75rem', fontSize: '13px', color: 'var(--cp-fg-subtle)',
            background: 'var(--cp-secondary)', border: 'none', cursor: 'pointer'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--cp-muted)'; e.currentTarget.style.color = 'var(--cp-secondary-fg)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--cp-secondary)'; e.currentTarget.style.color = 'var(--cp-fg-subtle)'; }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={1.8} />
          Add founder
        </button>
      )}
    </div>
  );
}

/* ── KnowledgeField (exact from page.tsx line 666) ── */
export default function KnowledgeField({
  item,
  value,
  confirmed,
  conflict,
  docDraft,
  onChange,
  panelMode,
  onAsk,
  onSources,
  onAnalysis,
  onConfirm,
  onUnconfirm,
  onOpenConflict,
  leadershipPeople,
  onLeadershipChange,
  confirmedFields,
  onConfirmField,
  onUnconfirmField,
}) {
  const hasValue = fieldHasValue(item.kind, value);
  const showConflict = Boolean(conflict);
  const showAiDraft = Boolean(!showConflict && hasValue && !confirmed && (item.aiFilled || docDraft));
  const showConfirmed = Boolean(hasValue && confirmed && !showConflict);
  const askActive = panelMode === 'ask';
  const sourcesActive = panelMode === 'sources';
  const analysisActive = panelMode === 'analysis';
  const edgeOpen = Boolean(panelMode);
  const isMultiFieldSection = [
    'business_model_obj',
    'company_story_obj',
    'industry_research_obj',
    'financial_summary_obj',
    'investors_cap_table_obj',
    'investment_thesis_obj',
    'document_center_obj',
    'founders_array',
    'products_array',
    'markets_array',
    'advantages_array',
    'competitors_array',
    'revenue_model_array',
    'company_metrics_array',
    'funding_history_array',
    'news_array',
  ].includes(item.kind);

  const edgeActions = (
    <span className={`cp-field-actions cp-edge-actions ${edgeOpen ? 'cp-edge-actions--visible' : ''}`}>
      {showConflict && (
        <button
          type="button"
          aria-label={`Resolve conflict for ${item.name}`}
          onClick={e => { e.preventDefault(); onOpenConflict?.(); }}
          style={{
            borderRadius: '0.25rem', padding: '0.125rem 0.375rem', fontSize: '11px', fontWeight: 500,
            color: '#92400e', background: 'rgba(254, 243, 199, 0.8)', border: 'none', cursor: 'pointer'
          }}
        >
          Conflict
        </button>
      )}
      {!showConflict && showAiDraft && !isMultiFieldSection && (
        <button
          type="button"
          aria-label={`Confirm ${item.name}`}
          onClick={e => { e.preventDefault(); onConfirm(); }}
          className="cp-confirm-btn"
        >
          Confirm
        </button>
      )}
      <button
        type="button"
        aria-label={
          item.kind === 'upload'
            ? 'Ask Silk AI'
            : item.aiFilled || showConflict || docDraft
              ? 'View sources'
              : 'Ask Silk AI'
        }
        data-active={sourcesActive || askActive || analysisActive}
        onClick={e => {
          e.preventDefault();
          if (item.kind === 'upload') onAnalysis?.();
          else if (item.aiFilled || showConflict || docDraft) onSources();
          else onAsk();
        }}
        className="cp-ask-btn"
      >
        Ask Silk
      </button>
    </span>
  );

  if (item.kind === 'upload') {
    return (
      <div className="cp-field" id={`field-${item.id}`}>
        <div className="cp-field-header">
          <span className="cp-field-label">{item.name}</span>
          {value === 'analyzed' && <StatusTag label="Analysed" />}
          {edgeActions}
        </div>
        <DocumentUploadField fieldName={item.name} onAsk={onAsk} />
      </div>
    );
  }

  const fieldId = `field-${item.id}`;

  return (
    <div className="cp-field">
      <div className="cp-field-header">
        <label htmlFor={fieldId} className="cp-field-label">
          {item.name}
        </label>
        {!isMultiFieldSection && (
          <>
            {showAiDraft && <StatusTag label="AI Draft" tone="ai" />}
            {showConfirmed && (
              <StatusTag
                label="Confirmed"
                hoverLabel="Unconfirm"
                onClick={onUnconfirm}
              />
            )}
          </>
        )}
        {!isMultiFieldSection && edgeActions}
      </div>
      {item.kind === 'founders' && leadershipPeople && onLeadershipChange ? (
        <LeadershipEditor
          fieldId={fieldId}
          people={leadershipPeople}
          onChange={onLeadershipChange}
        />
      ) : (
        <FieldControl
          kind={item.kind}
          value={value}
          onChange={onChange}
          placeholder={item.placeholder}
          options={item.options}
          scaled={item.scaled}
          fieldId={fieldId}
          confirmedFields={confirmedFields}
          confirmedCount={item.confirmedCount}
          onConfirmField={onConfirmField}
          onUnconfirmField={onUnconfirmField}
          onAsk={onAsk}
          onOpenAnalysis={onAnalysis}
        />
      )}
      {item.hint && !hasValue && (
        <p className="cp-hint">{item.hint}</p>
      )}
    </div>
  );
}
