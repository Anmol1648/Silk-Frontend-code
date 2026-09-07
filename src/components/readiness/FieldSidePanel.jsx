import React, { useState, useRef, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ArrowUp02Icon, ArrowUpRight01Icon, File01Icon as FileAttachmentIcon, Globe02Icon as EarthIcon, Linkedin02Icon, LinkSquare02Icon as NewsIcon, CheckmarkCircle02Icon, PresentationBarChart01Icon, GridTableIcon, Search01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { profile as profileApi } from '../../api/endpoints';

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

/* --- Mock Document Analysis Types & Components --- */
import { Alert02Icon, BulbIcon } from '@hugeicons/core-free-icons';

function FindingList({ title, items, empty, tone }) {
  const icon = tone === 'warn' ? Alert02Icon : tone === 'accent' ? BulbIcon : CheckmarkCircle02Icon;
  const iconClass = tone === 'warn' ? 'text-amber-500' : tone === 'good' || tone === 'accent' ? 'text-primary' : 'text-muted-foreground';

  return (
    <section className="mb-6">
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
          items.map(item => (
            <li key={item.id} className="flex items-start gap-2.5 px-3.5 py-3">
              <HugeiconsIcon icon={icon} size={14} strokeWidth={2} className={`mt-0.5 shrink-0 ${iconClass}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-foreground font-medium leading-snug">{item.label}</span>
                {item.detail && (
                  <span className="mt-0.5 block text-[12px] text-muted-foreground leading-snug">
                    {item.detail}
                  </span>
                )}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function DocumentAnalysisContent({ analysis, documentName }) {
  if (!analysis) {
    return (
      <div className="px-1 py-6">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          No analysis yet for this document.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-2">
      <div className="rounded-xl bg-background/50 border border-border/40 px-3.5 py-3 mb-6 shadow-sm">
        <div className="text-[12px] font-semibold text-foreground mb-1">{analysis.classifiedType}</div>
        <p className="text-[13px] text-foreground/80 leading-relaxed m-0">{analysis.summary.replace('{filename}', documentName)}</p>
      </div>

      <FindingList title="Covered" items={analysis.found} empty="No expected sections detected yet." tone="good" />
      <FindingList title="Missing information" items={analysis.missing} empty="No gaps detected for this document type." tone="warn" />
      <FindingList title="Inconsistencies" items={analysis.inconsistencies} empty="No inconsistencies flagged." tone="warn" />
      <FindingList title="Recommendations" items={analysis.recommendations} empty="No recommendations right now." tone="accent" />
    </div>
  );
}

const MOCK_ANALYSIS_DATA = {
  classifiedType: 'Executive Teaser',
  summary: '{filename} was classified as Executive Teaser. Text could not be extracted from this file format, so section coverage is unverified until a searchable export is provided or contents are reviewed manually.',
  found: [],
  missing: [
    { id: 'm1', label: 'Company overview', detail: 'Could not verify from file contents — extraction unavailable for this format.' },
    { id: 'm2', label: 'Problem statement', detail: 'Could not verify from file contents — extraction unavailable for this format.' },
  ],
  inconsistencies: [],
  recommendations: [],
  suggestions: [
    "What's missing for investors?",
    "Summarise the key risks",
    "Which readiness fields should I confirm first?"
  ]
};

const THINK_STEPS = [
  'Reading company data…',
  'Weighing evidence…',
  'Formulating response…',
];

function ProfileThinkingBlock({ steps = THINK_STEPS }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!steps || steps.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex(n => Math.min(n + 1, steps.length - 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [steps]);

  const label = steps[index] || 'Reading company data…';

  return (
    <div className="flex items-center gap-2.5 py-2 px-1">
      <div className="w-[20px] h-[20px] rounded-[5px] bg-[#030712]/[0.08] flex items-center justify-center text-[11px] font-semibold text-[#030712] silk-think-mark shrink-0 leading-none">
        ✳
      </div>
      <p key={label} className="silk-think-text text-[13.5px] font-normal leading-none flex items-center text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function FieldSidePanel({
  companyId,
  fieldId,
  fieldName = 'Company description',
  mode,
  leaving,
  onClose,
  onApplyValue,
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
  const scrollerRef = useRef(null);

  const showAsk = mode === 'ask';
  const showSources = mode === 'sources';
  const showAnalysis = mode === 'analysis';
  const headerText = showSources ? 'Field Sources' : showAnalysis ? 'Document Analysis' : 'Ask Silk AI';

  const displayFieldName = fieldName ? fieldName.charAt(0).toUpperCase() + fieldName.slice(1) : '';

  // Req 5: Fetch field sources when in sources mode
  useEffect(() => {
    if (!showSources || !companyId || !fieldId) return;

    const controller = new AbortController();
    let cancelled = false;

    setSourcesLoading(true);
    profileApi.fieldSources(companyId, fieldId, { signal: controller.signal })
      .then(res => {
        if (cancelled) return;
        const list = res?.sources || res?.data?.sources || res?.data || [];
        setFieldSources(Array.isArray(list) ? list : []);
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
  }, [showSources, companyId, fieldId]);

  // Req 6: Fetch initial grounded draft when opening ask mode on a field (if no messages yet)
  useEffect(() => {
    if (showAsk && companyId && fieldId && messages.length === 0 && !loading) {
      setLoading(true);
      profileApi.ask(companyId, { field_id: fieldId })
        .then(res => {
          const data = res?.data || res || {};
          if (data.draft) {
            setCurrentDraft(data.draft);
          }
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setDynamicSuggestions(data.suggestions);
          }
          if (data.answer) {
            setInConversation(true);
            setMessages([{ id: Date.now().toString(), role: 'assistant', content: data.answer }]);
          }
        })
        .catch(err => {
          console.warn('Draft QA fetch failed:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [showAsk, companyId, fieldId]);

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
      const res = await profileApi.ask(companyId, {
        field_id: fieldId,
        question: textToSend,
        chat_history: historyForApi,
      });

      const data = res?.data || res || {};
      const botAnswer = data.answer || data.response || "Here is what I found for your query.";
      
      if (data.draft) {
        setCurrentDraft(data.draft);
        setApplied(false);
      }
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setDynamicSuggestions(data.suggestions);
      }

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: botAnswer }
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

  const handleApply = (proposedVal) => {
    if (onApplyValue && fieldId) {
      onApplyValue(fieldId, proposedVal);
      setApplied(true);
    }
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

  const defaultSuggestions = [
    `What's missing for ${displayFieldName || 'this field'}?`,
    "Summarise key highlights",
    "Which fields should I confirm next?"
  ];

  const activeSuggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : defaultSuggestions;

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
          
          {/* Grounded Draft Banner (Req 6) */}
          {currentDraft && currentDraft.proposed_value && (
            <div style={{ margin: '1rem 1.25rem 0', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid #e0e7ff', background: '#f5f7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#3730a3', textTransform: 'uppercase' }}>
                  Proposed AI Draft
                </span>
                <button
                  type="button"
                  disabled={applied}
                  onClick={() => handleApply(currentDraft.proposed_value)}
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: applied ? '#059669' : '#4338ca',
                    color: '#ffffff',
                    cursor: applied ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {applied ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                      Applied & Confirmed
                    </>
                  ) : (
                    'Apply to Field'
                  )}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e1b4b', lineHeight: '1.4', fontWeight: 500 }}>
                {currentDraft.proposed_value}
              </p>
              {currentDraft.reasoning && (
                <p style={{ margin: '0.375rem 0 0', fontSize: '12px', color: '#4338ca', lineHeight: '1.3' }}>
                  {currentDraft.reasoning}
                </p>
              )}
            </div>
          )}

          {inConversation ? (
            /* Chat Messages */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div style={{ marginLeft: 'auto', width: 'fit-content', maxWidth: '88%', borderRadius: '0.75rem', backgroundColor: '#f1f5f9', padding: '0.625rem 0.875rem' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#020817', lineHeight: '1.375', whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#020817', lineHeight: '1.625', whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {loading && <ProfileThinkingBlock />}
            </div>
          ) : (
            /* Empty State / Sources State / Analysis State */
            <div style={{ marginTop: 'auto', padding: '1.5rem 1.25rem' }}>
              <div style={{ padding: '0 0.25rem' }}>
                <h3 style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#030712', letterSpacing: '-0.03em', lineHeight: '1.375', margin: 0 }}>
                  {showAnalysis ? `Analysis – ${MOCK_ANALYSIS_DATA.classifiedType}` : (showSources ? `Sources for ${displayFieldName}` : displayFieldName)}
                </h3>
                
                {showAnalysis && (
                  <div className="mt-4">
                    <DocumentAnalysisContent analysis={MOCK_ANALYSIS_DATA} documentName={analysisDocName} />
                  </div>
                )}
                {showSources && (
                  <p style={{ marginTop: '0.625rem', fontSize: '13px', color: '#6b7280', lineHeight: '1.625', margin: '0.625rem 0 0 0' }}>
                    Sources & signals recorded for {displayFieldName || 'this field'}.
                  </p>
                )}
              </div>
              
              <div style={{ marginTop: '2.5rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.04em', color: '#9ca3af' }}>
                  {showSources ? 'Sources' : 'Suggestions'}
                </span>

                <div style={{ marginTop: '0.625rem' }}>
                  {showSources ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {sourcesLoading ? (
                        <div style={{ fontSize: '13px', color: '#9ca3af', padding: '0.5rem 0' }}>
                          Loading sources…
                        </div>
                      ) : fieldSources.length > 0 ? (
                        fieldSources.map((source, i) => {
                          const isAttribution = source.type === 'attribution';
                          return (
                            <div 
                              key={i} 
                              className="cp-source-chip"
                              style={{ display: 'flex', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', background: '#f9fafb', border: '1px solid #f3f4f6' }}
                            >
                              <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', color: '#6b7280', marginTop: '0.125rem' }}>
                                <HugeiconsIcon icon={sourceKindIcon(source.type)} size={15} strokeWidth={2} />
                              </div>
                              <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span className="cp-source-title" style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                                    {source.title || (isAttribution ? 'Founder Entry' : 'Web Source')}
                                  </span>
                                  {source.url && source.url !== '#' && (
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280' }}>
                                      <HugeiconsIcon icon={ArrowUp02Icon} size={14} style={{ transform: 'rotate(45deg)' }} />
                                    </a>
                                  )}
                                </div>
                                <p style={{ marginTop: '0.125rem', fontSize: '12px', color: '#6b7280', lineHeight: '1.375', margin: '0.125rem 0 0 0' }}>
                                  {isAttribution ? 'No external source recorded (entered directly by user).' : (source.snippet || source.excerpt || 'Referenced for profile data.')}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ fontSize: '13px', color: '#9ca3af', padding: '0.5rem 0' }}>
                          No external sources recorded. This field was set directly by the founder.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Suggestions List */
                    <div style={{ overflow: 'hidden', borderRadius: '0.75rem', backgroundColor: '#f4f4f5', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {activeSuggestions.map((prompt, idx) => (
                        <button 
                          key={idx}
                          type="button" 
                          onClick={() => send(null, prompt)}
                          style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', textAlign: 'left', border: 'none', background: '#ffffff', cursor: 'pointer', transition: 'background 0.15s ease' }}
                          onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
                        >
                          <span style={{ minWidth: 0, flex: 1, fontSize: '13px', color: '#374151', lineHeight: '1.375' }}>
                            {prompt}
                          </span>
                          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
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
            placeholder={displayFieldName ? `Ask about “${displayFieldName}”…` : 'Ask Silk AI…'}
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
