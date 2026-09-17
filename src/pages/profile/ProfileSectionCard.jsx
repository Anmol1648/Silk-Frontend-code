import React from 'react';
import KnowledgeField from '../../components/readiness/KnowledgeField';
import { layoutFieldRows, fieldHasValue, isCompactKind } from '../../components/readiness/profile-utils';

const FULL_WIDTH_KINDS = new Set([
  'textarea', 'upload', 'founders_array', 'products_array', 'markets_array',
  'advantages_array', 'competitors_array', 'industry_research_obj', 'business_model_obj',
  'revenue_model_array', 'company_metrics_array', 'financial_summary_obj',
  'funding_history_array', 'investors_cap_table_obj', 'news_array',
  'company_story_obj', 'investment_thesis_obj', 'document_center_obj',
]);

/**
 * ProfileSectionCard — Renders a single subsection (header + field rows).
 */
export default function ProfileSectionCard({
  sub,
  catIdx,
  subIdx,
  values,
  data,
  savingSubId,
  panelFieldId,
  panelMode,
  isSectionDirty,
  onCancelSection,
  onSaveSection,
  onSetValue,
  onOpenPanel,
  readinessBreakdown,
}) {
  // Use readinessBreakdown from backend for accurate section-level counts
  const breakdownEntry = readinessBreakdown?.find(b => (b.sectionKey || b.section_key) === sub.id);
  const fallbackTotal = sub.items.reduce((acc, i) => acc + (i.totalCount || 1), 0);
  const fallbackDone = sub.items.reduce((acc, i) => acc + (i.confirmedCount !== undefined ? i.confirmedCount : 0), 0);

  const subTotal = breakdownEntry && breakdownEntry.fields !== undefined ? breakdownEntry.fields : fallbackTotal;
  const subDoneRaw = breakdownEntry && breakdownEntry.confirmed !== undefined ? breakdownEntry.confirmed : fallbackDone;
  const subDone = Math.min(Math.max(0, subDoneRaw), subTotal);

  return (
    <div className="cp-subsection">
      <div className="cp-subsection-header">
        <div className="cp-subsection-header-left">
          <span className="cp-subsection-num">
            {`${catIdx + 1}.${subIdx + 1}`}
          </span>
          <h2 className="cp-subsection-title">{sub.label}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSectionDirty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                disabled={savingSubId === sub.id}
                onClick={() => onCancelSection(sub)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingSubId === sub.id}
                onClick={() => onSaveSection(sub)}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: '#030712',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: savingSubId === sub.id ? 0.7 : 1,
                }}
              >
                {savingSubId === sub.id ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
          <span className="cp-subsection-count">{subDone}/{subTotal}</span>
        </div>
      </div>

      <div className="cp-subsection-body">
        {layoutFieldRows(sub.items).map(row => {
          const isCompact = row.every(i => isCompactKind(i.kind || '') && !FULL_WIDTH_KINDS.has(i.kind));
          console.log(row, "rowww")
          return (
            <div key={row.map(i => i.id).join('-')} className={isCompact ? 'cp-compact-row' : ''}>
              {row.map(item => (
                <div key={item.id} data-field-id={item.id} className="w-full">
                  <KnowledgeField
                    item={item}
                    value={values[item.id] || ''}
                    onChange={v => onSetValue(item.id, v)}
                    panelMode={panelFieldId === item.id ? panelMode : null}
                    onAsk={() => onOpenPanel(item.id, 'ask')}
                    onOpenAnalysis={() => onOpenPanel(item.id, 'analysis')}
                    onSources={() => onOpenPanel(item.id, 'sources')}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
