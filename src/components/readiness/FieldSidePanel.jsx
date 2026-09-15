import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ArrowUp02Icon, ArrowUpRight01Icon, File01Icon as FileAttachmentIcon, Globe02Icon as EarthIcon, Linkedin02Icon, LinkSquare02Icon as NewsIcon, CheckmarkCircle02Icon, PresentationBarChart01Icon, GridTableIcon, Search01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { profile as profileApi } from '../../api/endpoints';
import { FormattedMarkdown } from '../formatted-markdown';

// Maps backend source type → icon (API types: pdf | slides | spreadsheet | document | dossier | attribution)
function sourceKindIcon(type) {
  const k = (type || '').toLowerCase();
  if (k === 'pdf') return FileAttachmentIcon;
  if (k === 'slides') return PresentationBarChart01Icon;
  if (k === 'spreadsheet') return GridTableIcon;
  if (k === 'document' || k === 'doc') return FileAttachmentIcon;
  if (k === 'dossier') return Search01Icon;
  if (k === 'attribution') return UserIcon;
  if (k === 'linkedin') return Linkedin02Icon;
  if (k === 'news') return NewsIcon;
  return EarthIcon;
}

/* --- Document Analysis Components --- */
import { Alert02Icon, BulbIcon } from '@hugeicons/core-free-icons';

function formatMetricValue(m) {
  if (m.value === null || m.value === undefined) return '-';
  const val = Number(m.value);
  if (isNaN(val)) return String(m.value);
  const ccy = m.ccy === 'USD' ? '$' : (m.ccy && m.ccy !== '%' && m.ccy !== 'months' ? `${m.ccy} ` : '');
  const suffix = m.ccy === '%' ? '%' : (m.ccy === 'months' ? ' months' : '');
  if (val >= 1e9) {
    return `${ccy}${(val / 1e9).toFixed(val % 1e9 === 0 ? 0 : 1)}B${suffix}`;
  }
  if (val >= 1e6) {
    return `${ccy}${(val / 1e6).toFixed(val % 1e6 === 0 ? 0 : 1)}M${suffix}`;
  }
  if (val >= 1e3 && !String(m.fieldKey).includes('customers') && !String(m.fieldKey).includes('headcount')) {
    return `${ccy}${(val / 1e3).toFixed(val % 1e3 === 0 ? 0 : 1)}k${suffix}`;
  }
  return `${ccy}${val.toLocaleString()}${suffix}`;
}

function formatMetricLabel(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function FindingList({ title, items, empty, tone }) {
  const icon = tone === 'warn' ? Alert02Icon : tone === 'accent' ? BulbIcon : CheckmarkCircle02Icon;
  const iconClass = tone === 'warn' ? 'text-amber-500' : tone === 'good' || tone === 'accent' ? 'text-primary' : 'text-muted-foreground';

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-[11px] font-semibold tracking-[0.04em] uppercase text-muted-foreground">
          {title}
        </h4>
        <span className="text-[11px] tabular-nums text-muted-foreground">{items.length}</span>
      </div>
      <ul className="divide-y divide-border/40 rounded-xl bg-secondary/20 shadow-sm border border-border/40 overflow-hidden">
        {items.length === 0 ? (
          <li className="px-3.5 py-3 text-[13px] text-muted-foreground leading-snug">{empty}</li>
        ) : (
          items.map((item, idx) => {
            const isString = typeof item === 'string';
            const labelText = isString ? item : (item.label || item.issue || item.target_section || item.title || item.name || 'Item');
            const detailText = !isString ? (item.detail || item.suggested_change || item.description || '') : '';

            return (
              <li key={item?.id || idx} className="flex items-start gap-2.5 px-3.5 py-3">
                <HugeiconsIcon icon={icon} size={14} strokeWidth={2} className={`mt-0.5 shrink-0 ${iconClass}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-foreground font-medium leading-snug">
                    {labelText}
                  </span>
                  {detailText ? (
                    <span className="mt-0.5 block text-[12px] text-muted-foreground leading-snug">
                      {detailText}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

function DocumentAnalysisContent({ analysis, documentName }) {
  if (!analysis) {
    return (
      <div className="px-1 py-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          No analysis available yet for this document.
        </p>
      </div>
    );
  }

  const detectedType = analysis.detectedType || analysis.classifiedType || 'Investor Material';
  const summary = analysis.summary ? String(analysis.summary).replace(/\{filename\}/g, documentName) : '';
  const recommendations = analysis.recommendations || [];
  const metrics = analysis.metrics || [];
  const missing = analysis.missingInformation || analysis.missing || [];
  const inconsistencies = analysis.inconsistencies || [];
  const extraction = analysis.extraction || null;

  return (
    <div className="flex flex-col gap-4 pb-2 mt-3">
      {/* Type badge + Summary */}
      <div style={{ borderRadius: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#4338ca', textTransform: 'uppercase' }}>
            {detectedType}
          </span>
          {extraction?.status && (
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, textTransform: 'capitalize' }}>
              ✓ {extraction.status}
            </span>
          )}
        </div>
        {summary && (
          <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
            {summary}
          </p>
        )}
      </div>

      {/* Extracted Metrics Grid */}
      {metrics.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Extracted Metrics ({metrics.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
            {metrics.map((m, idx) => (
              <div 
                key={idx}
                style={{
                  borderRadius: '0.5rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.625rem 0.75rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatMetricLabel(m.fieldKey)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '0.125rem' }}>
                  {formatMetricValue(m)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Cards */}
      {recommendations.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Recommendations ({recommendations.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: '0.625rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.75rem 0.875rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {rec.target_section || 'Recommendation'}
                  </span>
                  {rec.estimated_effort_min && (
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      ~{rec.estimated_effort_min} min
                    </span>
                  )}
                </div>
                {rec.issue && (
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '12.5px', fontWeight: 500, color: '#1e293b', lineHeight: '1.4' }}>
                    {rec.issue}
                  </p>
                )}
                {rec.suggested_change && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                    <span style={{ color: '#059669', fontWeight: 600 }}>Action: </span>
                    {rec.suggested_change}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Information */}
      {missing.length > 0 && (
        <FindingList title="Missing Information" items={missing} empty="No gaps detected." tone="warn" />
      )}

      {/* Inconsistencies */}
      {inconsistencies.length > 0 && (
        <FindingList title="Inconsistencies" items={inconsistencies} empty="No inconsistencies flagged." tone="warn" />
      )}

      {/* Extraction Technical Reason */}
      {extraction?.reason && (
        <div style={{ borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.625rem 0.75rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            Extraction Info ({extraction.handler || 'native'})
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {extraction.reason}
          </p>
        </div>
      )}
    </div>
  );
}

const MOCK_ANALYSIS_DATA = {
  classifiedType: 'Investor Material',
  summary: 'Uploaded document was classified as Investor Material. Extraction completed successfully.',
  found: [],
  missing: [],
  inconsistencies: [],
  recommendations: [],
  suggestions: [
    "What's missing for this document?",
    "Summarise key metrics",
    "Which recommendations should I prioritize?"
  ]
};

const THINK_STEPS = [
  'Finding the answer…',
  'Reading company data…',
  'Formulating response…',
];

function ProfileThinkingBlock({ steps = THINK_STEPS }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!steps || steps.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex(n => Math.min(n + 1, steps.length - 1));
    }, 600);
    return () => window.clearInterval(id);
  }, [steps]);

  const label = steps[index] || 'Finding the answer…';

  return (
    <div className="flex items-center gap-2.5 py-2 px-1" aria-live="polite" aria-label={label}>
      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#94a3b8', flexShrink: 0, lineHeight: 1 }}>
        ✳
      </div>
      <p key={label} style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1 }}>
        {label}
      </p>
    </div>
  );
}

export default function FieldSidePanel({
  companyId,
  fieldId,
  fieldName = '',
  readinessBreakdown = [],
  mode,
  leaving,
  onClose,
  onApplyValue,
  onRefresh,
  analysisDocName = 'Uploaded Material',
}) {
  const [draftInput, setDraftInput] = useState('');
  const [inConversation, setInConversation] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldSources, setFieldSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [applied, setApplied] = useState(false);
  const [apiFieldName, setApiFieldName] = useState('');
  const [apiSectionName, setApiSectionName] = useState('');
  const [sourceSectionKey, setSourceSectionKey] = useState('');
  const [docAnalysis, setDocAnalysis] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const scrollerRef = useRef(null);

  const isDocument = Boolean(
    docAnalysis ||
    mode === 'analysis' ||
    (fieldId && (fieldId.startsWith('document_center') || fieldId.startsWith('documents')))
  );

  const showAsk = mode === 'ask';
  const showSources = mode === 'sources';
  const showAnalysis = mode === 'analysis' || isDocument;
  const headerText = isDocument ? 'Document Analysis' : (showSources ? 'Field Sources' : 'Ask Silk AI');

  const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || '').trim());

  let rawResolvedName = apiFieldName;
  if (!rawResolvedName && fieldName) {
    const cleaned = fieldName.includes('__') ? fieldName.split('__')[1] : fieldName;
    if (!isUuid(cleaned) && !isUuid(fieldName)) {
      rawResolvedName = fieldName;
    }
  }
  if (isUuid(rawResolvedName)) {
    rawResolvedName = '';
  }

  const displayFieldName = rawResolvedName ? rawResolvedName.charAt(0).toUpperCase() + rawResolvedName.slice(1) : '';

  // Reset state when fieldId changes
  useEffect(() => {
    setMessages([]);
    setInConversation(false);
    setDraftInput('');
    setCurrentDraft(null);
    setDynamicSuggestions([]);
    setApplied(false);
    setApiFieldName('');
    setApiSectionName('');
    setSourceSectionKey('');
    setDocAnalysis(null);
    setConversationId(null);
  }, [fieldId]);

  // Fetch field sources when opening the panel for a field
  useEffect(() => {
    if (!companyId || !fieldId) return;

    const controller = new AbortController();
    let cancelled = false;

    setSourcesLoading(true);
    profileApi.fieldSources(companyId, fieldId, { signal: controller.signal })
      .then(res => {
        if (cancelled) return;
        const list = res?.sources || res?.data?.sources || res?.data || (Array.isArray(res) ? res : []);
        setFieldSources(Array.isArray(list) ? list : []);
        if (res?.draft) setCurrentDraft(res.draft);
        if (res?.suggestions && Array.isArray(res.suggestions)) {
          setDynamicSuggestions(res.suggestions);
        }
        const fetchedName = res?.fieldName || res?.data?.fieldName;
        if (fetchedName) {
          setApiFieldName(fetchedName);
        }
        const fetchedSecName = res?.sectionName || res?.data?.sectionName;
        if (fetchedSecName) {
          setApiSectionName(fetchedSecName);
        }
        const fetchedSecKey = res?.sectionKey || res?.section_key || res?.data?.sectionKey || res?.data?.section_key || (fieldId && fieldId.includes('__') ? fieldId.split('__')[0] : '');
        if (fetchedSecKey) {
          setSourceSectionKey(fetchedSecKey);
        }
        const fetchedAnalysis = res?.analysis || res?.data?.analysis;
        if (fetchedAnalysis) {
          setDocAnalysis(fetchedAnalysis);
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setFieldSources([]);
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [companyId, fieldId]);

  const extractProposedVal = (p, defaultAnswer, draftObj) => {
    if (p?.proposed_value !== undefined && p?.proposed_value !== null && String(p.proposed_value).trim() !== '') {
      return String(p.proposed_value).trim();
    }
    if (p?.value !== undefined && p?.value !== null && String(p.value).trim() !== '') {
      return String(p.value).trim();
    }
    if (p?.proposedValue !== undefined && p?.proposedValue !== null && String(p.proposedValue).trim() !== '') {
      return String(p.proposedValue).trim();
    }
    if (p?.new_value !== undefined && p?.new_value !== null && String(p.new_value).trim() !== '') {
      return String(p.new_value).trim();
    }
    if (p?.newValue !== undefined && p?.newValue !== null && String(p.newValue).trim() !== '') {
      return String(p.newValue).trim();
    }
    if (p?.val !== undefined && p?.val !== null && String(p.val).trim() !== '') {
      return String(p.val).trim();
    }
    if (p?.text !== undefined && p?.text !== null && String(p.text).trim() !== '') {
      return String(p.text).trim();
    }
    if (p?.draft !== undefined && p?.draft !== null && String(p.draft).trim() !== '') {
      return String(p.draft).trim();
    }
    if (p?.suggestion !== undefined && p?.suggestion !== null && String(p.suggestion).trim() !== '') {
      return String(p.suggestion).trim();
    }
    if (p?.replacement !== undefined && p?.replacement !== null && String(p.replacement).trim() !== '') {
      return String(p.replacement).trim();
    }
    if (p?.proposal !== undefined && p?.proposal !== null && String(p.proposal).trim() !== '') {
      return String(p.proposal).trim();
    }
    if (draftObj?.proposed_value) {
      return String(draftObj.proposed_value).trim();
    }
    if (draftObj?.value) {
      return String(draftObj.value).trim();
    }
    if (typeof draftObj === 'string' && draftObj.trim() !== '') {
      return draftObj.trim();
    }
    if (defaultAnswer && typeof defaultAnswer === 'string') {
      const matchQuote = defaultAnswer.match(/(?:shortened to|updated to|new description|suggested value|proposed description|change to|is)[:\s]+["“]([\s\S]+?)["”](?:\s*$|\s*\n)/i) ||
                         defaultAnswer.match(/["“]([\s\S]{20,}?)["”]/) ||
                         defaultAnswer.match(/```(?:markdown|text)?\s*([\s\S]+?)```/) ||
                         defaultAnswer.match(/(?:shortened to|updated to|new description|suggested value|proposed description|change to)[:\s]+([\s\S]+)/i);
      if (matchQuote && matchQuote[1]) {
        return matchQuote[1].trim().replace(/^["“]|["”]$/g, '');
      }
    }
    return '';
  };

  const send = async (e, customText) => {
    e?.preventDefault();
    const textToSend = customText || draftInput.trim();
    if (!textToSend || loading) return;

    if (!inConversation) {
      setInConversation(true);
    }

    const userMsg = { id: Date.now().toString(), role: 'user', content: textToSend };
    const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setDraftInput('');
    setLoading(true);

    try {
      const qaBody = {
        field_id: fieldId,
        question: textToSend,
        chat_history: historyForApi,
      };
      // Include conversation_id for multi-turn continuity
      if (conversationId) {
        qaBody.conversation_id = conversationId;
      }
      // Include section_key if available
      if (sourceSectionKey) {
        qaBody.section_key = sourceSectionKey;
      }

      const res = await profileApi.ask(companyId, qaBody);

      const data = res?.data || res || {};
      const botAnswer = data.answer || data.response || "Here is what I found for your query.";

      // Persist conversation_id from response for multi-turn
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Parse proposals — new spec format includes action, section_key, item_data, item_name, current_value
      const rawChanges = Array.isArray(data.proposals)
        ? data.proposals
        : (Array.isArray(data.proposedChanges)
            ? data.proposedChanges
            : (Array.isArray(data.proposed_changes)
                ? data.proposed_changes
                : (data.proposal ? [data.proposal] : (data.draft ? [{ field_id: fieldId, field_name: displayFieldName, proposed_value: data.draft.proposed_value, reason: data.draft.reasoning }] : []))));

      const proposedChanges = (Array.isArray(rawChanges) ? rawChanges : []).map((p, idx) => {
        const itemData = p.item_data || p.itemData || p.item || null;
        const itemName = p.item_name || p.itemName || p.name || (itemData && typeof itemData === 'object' ? (itemData.name || itemData.title || itemData.label || '') : '');
        const itemId = p.item_id || p.itemId || p.id || '';
        const action = p.action || 'edit';

        let proposedVal = extractProposedVal(p, botAnswer, data.draft);
        if ((!proposedVal || proposedVal === '') && itemData && typeof itemData === 'object') {
          proposedVal = Object.entries(itemData)
            .filter(([k]) => !['id', 'itemId', 'item_id', '_id'].includes(k))
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(' • ');
        }

        return {
          field_id: p.field_id || p.fieldId || fieldId,
          section_key: p.section_key || p.sectionKey || sourceSectionKey || '',
          field_name: p.field_name || p.fieldName || p.label || itemName || '',
          action,
          item_data: itemData,
          item_name: itemName,
          item_id: itemId,
          current_value: p.current_value !== undefined ? p.current_value : (p.previous_value !== undefined ? p.previous_value : p.previousValue),
          proposed_value: proposedVal,
          reason: p.reason || p.reasoning || '',
          proposal_index: idx,
          applied: false,
        };
      });

      const citations = Array.isArray(data.citations) ? data.citations : [];

      if (data.draft) {
        setCurrentDraft(data.draft);
        setApplied(false);
      }
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setDynamicSuggestions(data.suggestions);
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botAnswer,
          proposedChanges,
          citations,
          applied: false,
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I couldn't reach the AI service right now. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySingleChange = async (messageId, changeItem, messageContent) => {
    if (!changeItem) return;
    const action = changeItem.action || 'edit';
    const targetFId = changeItem.field_id || changeItem.fieldId || fieldId;
    const targetSecKey = changeItem.section_key || changeItem.sectionKey || sourceSectionKey || '';
    let targetVal = changeItem.proposed_value !== undefined && changeItem.proposed_value !== '' ? changeItem.proposed_value : changeItem.value;

    if ((!targetVal || targetVal === '') && messageContent) {
      targetVal = extractProposedVal(changeItem, messageContent, currentDraft);
    }
    if ((!targetVal || targetVal === '') && currentDraft?.proposed_value) {
      targetVal = currentDraft.proposed_value;
    }

    const itemData = changeItem.item_data || changeItem.itemData || changeItem.item;
    const itemName = changeItem.item_name || changeItem.itemName || changeItem.name;
    const itemId = changeItem.item_id || changeItem.itemId;

    if (action !== 'add' && !targetFId && !targetSecKey) return;

    let appliedViaEndpoint = false;

    // 1. Build request payload supporting add, edit, delete
    const applyPayload = {
      conversation_id: conversationId || undefined,
      proposal_index: changeItem.proposal_index ?? 0,
      action,
      section_key: targetSecKey,
      sectionKey: targetSecKey,
      proposedValue: targetVal || '',
      value: targetVal || '',
    };

    if (action === 'add') {
      if (itemData) {
        applyPayload.itemData = itemData;
        applyPayload.item = itemData;
      }
      if (itemName) {
        applyPayload.itemName = itemName;
        applyPayload.name = itemName;
      }
    } else {
      if (targetFId) {
        applyPayload.field_id = targetFId;
        applyPayload.field = targetFId;
      }
      if (itemId) {
        applyPayload.itemId = itemId;
        applyPayload.item_id = itemId;
      }
      if (itemName) {
        applyPayload.itemName = itemName;
      }
    }

    // Call the /proposals/apply endpoint
    try {
      await profileApi.applyProposal(companyId, applyPayload);
      appliedViaEndpoint = true;
    } catch {
      // Fallback: if /proposals/apply is not available or fails, use parent onApplyValue
      if (onApplyValue) {
        onApplyValue(targetFId, targetVal);
      }
    }

    // 2. Mark proposal as applied in messages
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const updatedChanges = (m.proposedChanges || []).map(p => {
        if ((p.field_id || p.fieldId || fieldId) === targetFId) {
          return { ...p, applied: true };
        }
        return p;
      });
      const allApplied = updatedChanges.every(p => p.applied);
      return { ...m, proposedChanges: updatedChanges, applied: allApplied };
    }));

    // 3. Reload profile data if applied via endpoint
    if (appliedViaEndpoint && onRefresh) {
      onRefresh();
    }
  };

  const handleApplyAllChanges = async (messageId, changesList, messageContent) => {
    if (!Array.isArray(changesList) || changesList.length === 0) return;

    // Build batch payload supporting add, edit, delete
    const proposalItems = changesList.map((p, idx) => {
      const action = p.action || 'edit';
      const fId = p.field_id || p.fieldId || fieldId;
      const secKey = p.section_key || p.sectionKey || sourceSectionKey || '';
      let val = p.proposed_value !== undefined && p.proposed_value !== '' ? p.proposed_value : p.value;
      if ((!val || val === '') && messageContent) {
        val = extractProposedVal(p, messageContent, currentDraft);
      }
      const itemData = p.item_data || p.itemData || p.item;
      const itemName = p.item_name || p.itemName || p.name;
      const itemId = p.item_id || p.itemId;

      const itemPayload = {
        proposal_index: p.proposal_index ?? idx,
        action,
        section_key: secKey,
        sectionKey: secKey,
        proposedValue: val || '',
        value: val || '',
      };

      if (action === 'add') {
        if (itemData) {
          itemPayload.itemData = itemData;
          itemPayload.item = itemData;
        }
        if (itemName) {
          itemPayload.itemName = itemName;
          itemPayload.name = itemName;
        }
      } else {
        itemPayload.field_id = fId;
        itemPayload.field = fId;
        if (itemId) {
          itemPayload.itemId = itemId;
          itemPayload.item_id = itemId;
        }
        if (itemName) {
          itemPayload.itemName = itemName;
        }
      }

      return itemPayload;
    });

    let appliedViaEndpoint = false;
    try {
      await profileApi.applyProposalBatch(companyId, {
        conversation_id: conversationId || undefined,
        proposals: proposalItems,
      });
      appliedViaEndpoint = true;
    } catch {
      // Fallback: apply individually via parent onApplyValue
      if (onApplyValue) {
        const patches = {};
        for (const p of changesList) {
          const fId = p.field_id || p.fieldId || fieldId;
          let val = p.proposed_value !== undefined && p.proposed_value !== '' ? p.proposed_value : p.value;
          if ((!val || val === '') && messageContent) {
            val = extractProposedVal(p, messageContent, currentDraft);
          }
          if (fId && val !== undefined && val !== '') {
            patches[fId] = val;
          }
        }
        if (Object.keys(patches).length > 0) {
          onApplyValue(null, patches);
        }
      }
    }

    // Mark all as applied
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const updatedChanges = (m.proposedChanges || []).map(p => ({ ...p, applied: true }));
      return { ...m, proposedChanges: updatedChanges, applied: true };
    }));

    if (appliedViaEndpoint && onRefresh) {
      onRefresh();
    }
  };

  const handleApply = async (proposedVal) => {
    let appliedViaEndpoint = false;
    // Try new endpoint for draft apply
    try {
      await profileApi.applyProposal(companyId, {
        conversation_id: conversationId || undefined,
        proposal_index: 0,
        field_id: fieldId,
        section_key: sourceSectionKey || '',
        proposedValue: proposedVal,
      });
      appliedViaEndpoint = true;
      if (onRefresh) onRefresh();
    } catch {
      // Fallback to parent handler
      if (onApplyValue && fieldId) {
        onApplyValue(fieldId, proposedVal);
      }
    }
    setApplied(true);
    if (onRefresh) onRefresh();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, inConversation, loading]);

  const readinessBreakdownBySection = useMemo(() => {
    if (!Array.isArray(readinessBreakdown)) return {};
    return Object.fromEntries(
      readinessBreakdown
        .filter(item => item && (item.sectionKey || item.section_key))
        .map(item => [item.sectionKey || item.section_key, item])
    );
  }, [readinessBreakdown]);

  const activeSuggestions = useMemo(() => {
    // 1. Dynamic suggestions from recent QA / ask response in the drawer
    if (dynamicSuggestions && dynamicSuggestions.length > 0) {
      return dynamicSuggestions;
    }

    // 2. Match Sources API sectionKey with readinessBreakdown
    if (!sourceSectionKey) return [];

    const matchedReadiness = readinessBreakdownBySection[sourceSectionKey];
    const suggestions = matchedReadiness?.suggestions ?? [];
    return Array.isArray(suggestions) ? suggestions : [];
  }, [dynamicSuggestions, sourceSectionKey, readinessBreakdownBySection]);

  const resolvedHeading = isDocument
    ? (displayFieldName || analysisDocName || 'Document Analysis')
    : (showSources
        ? (displayFieldName ? `Sources for ${displayFieldName}` : (apiSectionName ? `Sources for ${apiSectionName}` : 'Field Sources'))
        : (displayFieldName || apiSectionName || 'Field Details'));

  return (
    <aside className={`cp-side-panel ${leaving ? 'cp-side-panel--leaving' : ''}`} style={{ background: '#ffffff', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '0.625rem', padding: '0.5rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', height: '2rem', minWidth: 0, flex: 1, alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1 }}>
            {headerText}
          </div>
        </div>
        <button 
          type="button" 
          onClick={onClose} 
          aria-label="Close"
          style={{ display: 'grid', width: '2rem', height: '2rem', placeItems: 'center', borderRadius: '0.5rem', color: '#64748b', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.8} />
        </button>
      </div>

      {/* Body container (scrollable) */}
      <div ref={scrollerRef} style={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', minHeight: '100%', flexDirection: 'column' }}>
          
          {/* 1. Header, Sources & Evidence Section (Always visible at top, like Fundraising aside) */}
          <div style={{ padding: '1.5rem 1.25rem 0' }}>
            <div style={{ padding: '0 0.25rem' }}>
              <h3 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#030712', letterSpacing: '-0.03em', lineHeight: '1.375', margin: 0 }}>
                {resolvedHeading}
              </h3>
              
              {isDocument ? (
                <DocumentAnalysisContent
                  analysis={docAnalysis || MOCK_ANALYSIS_DATA}
                  documentName={displayFieldName || analysisDocName}
                />
              ) : (
                <>
                  {showSources && (
                    <p style={{ marginTop: '0.625rem', fontSize: '13px', color: '#6b7280', lineHeight: '1.625', margin: '0.625rem 0 0 0' }}>
                      Sources & signals recorded for {displayFieldName || apiSectionName || 'this field'}.
                    </p>
                  )}

                  <div style={{ marginTop: '1.25rem' }}>
                    {/* Sources Section */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#6b7280', textTransform: 'uppercase' }}>
                        Sources & Evidence
                      </span>
                      <div style={{ marginTop: '0.5rem' }}>
                        {sourcesLoading ? (
                          <div style={{ fontSize: '13px', color: '#9ca3af', padding: '0.5rem 0' }}>
                            Loading sources…
                          </div>
                        ) : fieldSources.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', minWidth: 0 }}>
                            {fieldSources.map((source, i) => {
                              const isAttribution = source.type === 'attribution';
                              return (
                                <div 
                                  key={i} 
                                  className="cp-source-chip"
                                  style={{
                                    display: 'flex',
                                    gap: '0.625rem',
                                    padding: '0.625rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    background: '#f9fafb',
                                    border: '1px solid #f3f4f6',
                                    width: '100%',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', color: '#6b7280', marginTop: '0.125rem' }}>
                                    <HugeiconsIcon icon={sourceKindIcon(source.type)} size={15} strokeWidth={2} />
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', minWidth: 0 }}>
                                      <span
                                        className="cp-source-title"
                                        style={{
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          color: '#111827',
                                          minWidth: 0,
                                          flex: 1,
                                          wordBreak: 'break-word',
                                          overflowWrap: 'anywhere',
                                          lineHeight: '1.4'
                                        }}
                                      >
                                        {source.title || (isAttribution ? 'Founder Entry' : 'Web Source')}
                                      </span>
                                      {source.url && source.url !== '#' && (
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', flexShrink: 0, marginTop: '0.125rem' }}>
                                          <HugeiconsIcon icon={ArrowUp02Icon} size={14} style={{ transform: 'rotate(45deg)' }} />
                                        </a>
                                      )}
                                    </div>
                                    <p
                                      style={{
                                        marginTop: '0.25rem',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        lineHeight: '1.45',
                                        margin: '0.25rem 0 0 0',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere',
                                        whiteSpace: 'pre-wrap'
                                      }}
                                    >
                                      {isAttribution ? 'No external source recorded (entered directly by user).' : (source.snippet || source.excerpt || 'Referenced for profile data.')}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: '#9ca3af', padding: '0.5rem 0' }}>
                            No external sources recorded. This field was set directly by the founder.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. Grounded Draft Banner (Req 6) */}
          {currentDraft && currentDraft.proposed_value && messages.length === 0 && (
            <div style={{ margin: '1rem 1.25rem 0', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#fafafa', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: 500, color: '#64748b' }}>
                {displayFieldName || 'Draft'}
              </div>
              <div style={{ padding: '14px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#1e293b', lineHeight: '1.5', fontWeight: 400 }}>
                  {currentDraft.proposed_value}
                </p>
                {currentDraft.reasoning && (
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                    {currentDraft.reasoning}
                  </p>
                )}
                <button
                  type="button"
                  disabled={applied}
                  onClick={() => handleApply(currentDraft.proposed_value)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: applied ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    background: applied ? '#f0fdf4' : '#ffffff',
                    color: applied ? '#166534' : '#0f172a',
                    cursor: applied ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {applied ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                      Applied
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. Chat Messages Flow (Streams continuously below Sources & Evidence) */}
          {messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              {messages.map((message, mIdx) => {
                const isLatestAssistant = message.role === 'assistant' && (
                  mIdx === messages.length - 1 || 
                  (mIdx === messages.length - 2 && messages[messages.length - 1]?.role === 'user')
                );

                return (
                  <div key={message.id}>
                    {message.role === 'user' ? (
                      <div style={{ marginLeft: 'auto', width: 'fit-content', maxWidth: '88%', borderRadius: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.625rem 0.875rem' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#020817', lineHeight: '1.375', whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <FormattedMarkdown content={message.content} />

                        {/* Proposed Changes Cards */}
                        {Array.isArray(message.proposedChanges) && message.proposedChanges.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.375rem' }}>
                            {message.proposedChanges.length > 1 && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  disabled={message.applied}
                                  onClick={() => handleApplyAllChanges(message.id, message.proposedChanges, message.content)}
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    borderRadius: '6px',
                                    border: message.applied ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                    background: message.applied ? '#f0fdf4' : '#ffffff',
                                    color: message.applied ? '#166534' : '#0f172a',
                                    cursor: message.applied ? 'default' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  {message.applied ? (
                                    <>
                                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                                      All Applied
                                    </>
                                  ) : (
                                    'Apply All'
                                  )}
                                </button>
                              </div>
                            )}

                            {message.proposedChanges.map((changeItem, pIdx) => {
                              // Resolve a human-readable name — avoid showing raw UUIDs
                              const isUuidStr = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || '').trim());
                              let rawName = changeItem.field_name || '';
                              if (!rawName) {
                                const fId = changeItem.field_id || '';
                                const afterPrefix = fId.includes('__') ? fId.replace(/^.*__/, '') : fId;
                                if (isUuidStr(afterPrefix)) {
                                  // UUID — use section label or displayFieldName instead
                                  const secKey = fId.includes('__') ? fId.split('__')[0] : '';
                                  rawName = displayFieldName || (secKey ? secKey.replace(/_/g, ' ') : '') || `Field ${pIdx + 1}`;
                                } else {
                                  rawName = afterPrefix || displayFieldName || `Field ${pIdx + 1}`;
                                }
                              }
                              const fName = rawName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                              const isItemApplied = message.applied || changeItem.applied;
                              const action = changeItem.action || 'edit';
                              const isDelete = action === 'delete';
                              const isAdd = action === 'add';
                              const displayVal = isDelete ? null : (changeItem.proposed_value || changeItem.value);
                              const currentVal = changeItem.current_value || changeItem.previous_value;

                              // Action badge colors
                              const badgeColor = isDelete ? '#dc2626' : isAdd ? '#059669' : '#6366f1';
                              const badgeLabel = isDelete ? 'Remove' : isAdd ? 'New Field' : 'Edit';
                              const applyLabel = isDelete ? 'Remove' : 'Apply';
                              const appliedBorder = isDelete ? '1px solid #fecaca' : '1px solid #bbf7d0';
                              const appliedBg = isDelete ? '#fef2f2' : '#f0fdf4';
                              const appliedColor = isDelete ? '#991b1b' : '#166534';
                              const btnBorder = isDelete ? '1px solid #fecaca' : '1px solid #e2e8f0';
                              const btnBg = isDelete ? '#fff5f5' : '#ffffff';
                              const btnColor = isDelete ? '#dc2626' : '#0f172a';

                              return (
                                <div
                                  key={pIdx}
                                  style={{
                                    borderRadius: '12px',
                                    border: isDelete ? '1px solid #fecaca' : (isAdd ? '1px solid #bbf7d0' : '1px solid #f1f5f9'),
                                    background: isDelete ? '#fffbfb' : (isAdd ? '#f0fdf4' : '#fafafa'),
                                    overflow: 'hidden',
                                  }}
                                >
                                  {/* Card Header with Field Name + Action Badge */}
                                  <div
                                    style={{
                                      padding: '10px 14px',
                                      borderBottom: '1px solid #f1f5f9',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      color: '#64748b',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '8px',
                                    }}
                                  >
                                    <span>{fName}</span>
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      color: badgeColor,
                                      background: isDelete ? '#fef2f2' : (isAdd ? '#ecfdf5' : '#eef2ff'),
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      lineHeight: '1.6',
                                    }}>{badgeLabel}</span>
                                  </div>

                                  {/* Card Body & Apply Button */}
                                  <div style={{ padding: '14px' }}>
                                    {/* Show current/previous value with strikethrough for edit & delete */}
                                    {currentVal && (action === 'edit' || isDelete) && (
                                      <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '8px' }}>
                                        {currentVal}
                                      </div>
                                    )}

                                    {displayVal ? (
                                      <div
                                        style={{
                                          fontSize: '14px',
                                          color: '#1e293b',
                                          fontWeight: 400,
                                          lineHeight: '1.5',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'anywhere',
                                          marginBottom: '14px',
                                        }}
                                      >
                                        {displayVal}
                                      </div>
                                    ) : null}

                                    {changeItem.reason && (
                                      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                                        {changeItem.reason}
                                      </p>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isItemApplied}
                                      onClick={() => handleApplySingleChange(message.id, changeItem, message.content)}
                                      style={{
                                        padding: '6px 14px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        borderRadius: '8px',
                                        border: isItemApplied ? appliedBorder : btnBorder,
                                        background: isItemApplied ? appliedBg : btnBg,
                                        color: isItemApplied ? appliedColor : btnColor,
                                        cursor: isItemApplied ? 'default' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      {isItemApplied ? (
                                        <>
                                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                                          {isDelete ? 'Removed' : 'Applied'}
                                        </>
                                      ) : (
                                        applyLabel
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Suggestions under assistant message */}
                        {isLatestAssistant && activeSuggestions && activeSuggestions.length > 0 && (
                          <div style={{ marginTop: '0.625rem' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '0.5rem' }}>
                              Suggestions
                            </div>
                            <div
                              style={{
                                borderRadius: '16px',
                                border: '1px solid #f1f5f9',
                                backgroundColor: '#fafafa',
                                padding: '0 16px',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              {activeSuggestions.map((item, idx) => {
                                const questionText = (typeof item === 'object' && item !== null)
                                  ? (item.question || item.label || '')
                                  : String(item || '');

                                if (!questionText) return null;
                                const isLast = idx === activeSuggestions.length - 1;

                                return (
                                  <button 
                                    key={idx}
                                    type="button" 
                                    onClick={() => send(null, questionText)}
                                    style={{
                                      display: 'flex',
                                      width: '100%',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '1rem',
                                      padding: '14px 0',
                                      textAlign: 'left',
                                      border: 'none',
                                      borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      transition: 'opacity 0.15s ease',
                                    }}
                                    onMouseOver={e => {
                                      e.currentTarget.style.opacity = '0.75';
                                    }}
                                    onMouseOut={e => {
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                  >
                                    <span style={{ minWidth: 0, flex: 1, fontSize: '14px', color: '#1e293b', lineHeight: '1.45', fontWeight: 400 }}>
                                      {questionText}
                                    </span>
                                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && <ProfileThinkingBlock />}
            </div>
          )}

          {/* 4. Suggestions Section before conversation starts (Empty State) */}
          {messages.length === 0 && activeSuggestions && activeSuggestions.length > 0 && (
            <div style={{ marginTop: 'auto', padding: '1rem 1.25rem 1.5rem' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '0.625rem' }}>
                  Suggestions
                </div>
                <div
                  style={{
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    backgroundColor: '#fafafa',
                    padding: '0 16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {activeSuggestions.map((item, idx) => {
                    const questionText = (typeof item === 'object' && item !== null)
                      ? (item.question || item.label || '')
                      : String(item || '');

                    if (!questionText) return null;
                    const isLast = idx === activeSuggestions.length - 1;

                    return (
                      <button 
                        key={idx}
                        type="button" 
                        onClick={() => send(null, questionText)}
                        style={{
                          display: 'flex',
                          width: '100%',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          padding: '14px 0',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.opacity = '0.75';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <span style={{ minWidth: 0, flex: 1, fontSize: '14px', color: '#1e293b', lineHeight: '1.45', fontWeight: 400 }}>
                          {questionText}
                        </span>
                        <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div style={{ flexShrink: 0, padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', backgroundColor: 'var(--cp-secondary)', borderRadius: '0.5rem', padding: '0.75rem 0.875rem' }}>
          <textarea
            rows={3}
            value={draftInput}
            onChange={e => setDraftInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayFieldName || apiSectionName ? `Ask about “${displayFieldName || apiSectionName}”…` : 'Ask Silk AI…'}
            className="cp-chat-input"
            style={{ flex: 1, minWidth: 0, resize: 'none', backgroundColor: 'transparent', fontSize: '13px', color: 'var(--cp-fg)', outline: 'none', border: 'none', lineHeight: '1.375' }}
          />
          <button
            type="button"
            disabled={!draftInput.trim() || loading}
            onClick={() => send()}
            className="cp-silk-ai-btn cp-silk-ai-btn--icon"
            style={{ marginBottom: '0.125rem' }}
          >
            <span className="cp-silk-ai-btn__inner">
              <HugeiconsIcon icon={ArrowUp02Icon} size={15} strokeWidth={2} className="cp-silk-ai-btn__mark" />
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
