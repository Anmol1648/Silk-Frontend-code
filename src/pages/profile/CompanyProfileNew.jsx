import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { profile as profileApi, config as configApi } from '../../api/endpoints';
import { useToast } from '../../context/AppContext';
import { useLookups } from '../../context/LookupsContext';

import {
  PROFILE_CATEGORIES,
  fieldHasValue,
  ladderIndex,
  READINESS_LADDER,
  timeGreeting,
} from '../../components/readiness/profile-utils';

import FieldSidePanel from '../../components/readiness/FieldSidePanel';
import ReadinessInsightCard from '../../components/readiness/ReadinessInsightCard';
import './CompanyProfileNew.css';

import { ProfileThinkingBlock, scrollChildInto } from './ProfileHelpers';
import { buildReadinessData, getSectionCandidateKeys, SECTION_SUBFIELDS } from './ProfileDataBuilder';
import ProfileTabs from './ProfileTabs';
import ProfileSectionCard from './ProfileSectionCard';
import GeneratingDialog from './GeneratingDialog';

export default function CompanyProfileNew() {
  const { companyId } = useParams();
  const { toastError, toast } = useToast();
  const lookups = useLookups();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('thinking');

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) setPhase('ready');
    }, 1260);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  // readiness state
  const [selected, setSelected] = useState('company');
  const [values, setValues] = useState({});
  const [savedValues, setSavedValues] = useState({});
  const [savingSubId, setSavingSubId] = useState(null);
  const [confirmed, setConfirmed] = useState({});
  const [categories, setCategories] = useState(PROFILE_CATEGORIES.map(c => ({ ...c, subsections: [] })));

  // panel state
  const [panelFieldId, setPanelFieldId] = useState(null);
  const [panelMode, setPanelMode] = useState('ask');
  const [panelDocName, setPanelDocName] = useState('Uploaded Material');
  const [panelOpen, setPanelOpen] = useState(false);
  const [drawerShown, setDrawerShown] = useState(false);

  // refs
  const scrollRef = useRef(null);
  const tabsRef = useRef(null);
  const ignoreSpy = useRef(false);
  const [tabsStuck, setTabsStuck] = useState(false);

  const [countries, setCountries] = useState([]);

  // Backend-driven score & readiness stage (Req 4)
  const [backendScore, setBackendScore] = useState(0);
  const [readinessStage, setReadinessStage] = useState('just getting started');
  const [completenessPct, setCompletenessPct] = useState(0);

  // 1. Fetch data
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await profileApi.read(companyId);
      // Use lookups countries if available, else fall back to config endpoint
      let fetchedCountries = lookups.countries || [];
      if (!fetchedCountries.length) {
        try {
          const countriesRes = await configApi.countries();
          fetchedCountries = countriesRes.items || [];
        } catch { /* ignore */ }
      }
      setCountries(fetchedCountries);
      setData(res);
      // Store backend score (Req 4)
      setBackendScore(res?.score ?? 0);
      setReadinessStage(res?.readiness_stage || 'just getting started');
      setCompletenessPct(res?.completenessPct ?? 0);

      // Use extracted builder
      const result = buildReadinessData(res, fetchedCountries, lookups);
      if (result) {
        setCategories(result.categories);
        setValues(result.values);
        setSavedValues(result.values);
        setConfirmed(result.confirmed);
      }

      return res;
    } catch (e) {
      toastError(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [companyId, toastError, lookups.countries]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll if it's generating or draft
  useEffect(() => {
    if (data?.status !== 'generating' && data?.status !== 'draft') {
      return undefined;
    }
    const t = setInterval(async () => {
      const res = await load(true); // silent load
      if (res && res.status !== 'generating' && res.status !== 'draft') {
        clearInterval(t);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [data?.status, load]);

  // Check if a subsection has modified/unsaved changes
  const isSectionDirty = (sub) => {
    return sub.items.some(i => {
      const current = values[i.id];
      const saved = savedValues[i.id];
      return JSON.stringify(current) !== JSON.stringify(saved);
    });
  };

  // Revert a subsection back to last saved state
  const handleCancelSection = (sub) => {
    setValues(prev => {
      const next = { ...prev };
      sub.items.forEach(i => {
        if (savedValues[i.id] !== undefined) {
          next[i.id] = savedValues[i.id];
        }
      });
      return next;
    });
  };

  // Save subsection to API
  const handleSaveSection = async (sub, secKey) => {
    setSavingSubId(sub.id);
    try {
      const section = data?.sections?.[secKey];
      const sectionData = section?.data;

      let payloadData;
      if (Array.isArray(sectionData) || secKey === 'founders' || secKey === 'products_services' || secKey === 'customers_markets' || secKey === 'competitive_advantages' || secKey === 'competitors' || secKey === 'revenue_model' || secKey === 'company_metrics' || secKey === 'funding_history' || secKey === 'news') {
        payloadData = values[`${secKey}__array`] || [];
      } else if (secKey === 'document_center') {
        payloadData = { documents: values[`${secKey}__documents`] || [] };
      } else if (typeof sectionData === 'object' && sectionData !== null) {
        payloadData = values[`${secKey}__obj`] || {};
      } else {
        const obj = {};
        sub.items.forEach(item => {
          const [, fKey] = item.id.split('__');
          if (fKey) obj[fKey] = values[item.id];
        });
        payloadData = obj;
      }

      const confirmedFieldKeys = section?.confirmed_fields || [];
      await profileApi.saveSection(companyId, secKey, {
        data: payloadData,
        confirmed_fields: confirmedFieldKeys,
      });

      setSavedValues(prev => {
        const next = { ...prev };
        sub.items.forEach(i => {
          next[i.id] = values[i.id];
        });
        return next;
      });

      if (toast) toast('Saved section successfully.');
      await load(true);
    } catch (err) {
      toastError(err);
    } finally {
      setSavingSubId(null);
    }
  };

  // 3. Scroll spy & sticky tabs logic
  useEffect(() => {
    if (panelOpen) { setDrawerShown(true); return; }
    if (!drawerShown) return;
    const t = window.setTimeout(() => setDrawerShown(false), 700);
    return () => window.clearTimeout(t);
  }, [panelOpen, drawerShown]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const updatePort = () => {
      root.style.setProperty('--readiness-port', `${root.clientHeight}px`);
      root.style.setProperty('--readiness-tabs', `${tabsRef.current?.offsetHeight || 0}px`);
    };

    const onScroll = () => {
      // 1. Stuck hairline border state
      const rootTop = root.getBoundingClientRect().top;
      const tabsTop = tabsRef.current ? tabsRef.current.getBoundingClientRect().top : 0;
      const scrollPos = Math.max(root.scrollTop || 0, window.scrollY || 0, document.documentElement.scrollTop || 0);
      const isStuck = scrollPos > 5 || tabsTop <= rootTop + 2;

      setTabsStuck(prev => (prev !== isStuck ? isStuck : prev));

      // 2. Scroll spy active tab tracking
      if (ignoreSpy.current) return;
      const tabsBottom = tabsRef.current ? tabsRef.current.getBoundingClientRect().bottom : 120;
      let current = null;

      for (const cat of categories) {
        if (!cat.subsections || !cat.subsections.length) continue;
        const el = document.getElementById(`cat-${cat.id}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= tabsBottom + 120) {
          current = cat.id;
        }
      }

      if (current) {
        setSelected(prev => (prev === current ? prev : current));
      }
    };

    const onResize = () => { updatePort(); onScroll(); };

    updatePort();
    onScroll();

    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [categories, phase, loading]);

  // 4. Stats logic — prioritize readinessTotals from API response
  const stats = useMemo(() => {
    const totals = data?.readinessTotals || data?.readiness_totals;
    if (totals) {
      const done = Number(totals.confirmed) || 0;
      const total = Number(totals.fields !== undefined ? totals.fields : totals.populated) || 0;
      return { done, total, score: backendScore, completenessPct };
    }

    const breakdown = data?.readinessBreakdown || data?.readiness_breakdown;
    if (breakdown && Array.isArray(breakdown) && breakdown.length > 0) {
      const done = breakdown.reduce((sum, b) => sum + (Number(b.confirmed) || 0), 0);
      const total = breakdown.reduce((sum, b) => sum + (Number(b.fields !== undefined ? b.fields : (b.populated !== undefined ? Math.max(b.populated, b.confirmed) : 0)) || 0), 0);
      return { done, total, score: backendScore, completenessPct };
    }

    let done = 0, total = 0;
    for (const c of categories) {
      for (const sub of c.subsections) {
        for (const item of sub.items) {
          total++;
          if (fieldHasValue(item.kind, values[item.id]) && confirmed[item.id]) {
            done++;
          }
        }
      }
    }
    return { done, total, score: backendScore, completenessPct };
  }, [data, categories, values, confirmed, backendScore, completenessPct]);

  const ladderPos = readinessStage || data?.readiness_stage || data?.readinessStage || READINESS_LADDER[ladderIndex(stats.score)] || 'just getting started';

  // 5. Actions
  const openPanel = (id, mode) => {
    if (panelOpen && panelFieldId === id && panelMode === mode) {
      setPanelOpen(false); setPanelFieldId(null); return;
    }
    setPanelFieldId(id);
    setPanelMode(mode);
    setPanelOpen(true);
  };

  useEffect(() => {
    if (panelOpen) {
      setDrawerShown(true);
      return undefined;
    }
    if (!drawerShown) return undefined;
    const t = window.setTimeout(() => setDrawerShown(false), 700);
    return () => window.clearTimeout(t);
  }, [panelOpen, drawerShown]);

  useEffect(() => {
    const handleOpenSilk = (e) => {
      const detail = e.detail || {};
      setPanelFieldId(detail.fieldId || null);
      setPanelMode(detail.mode || 'ask');
      setPanelOpen(true);
    };
    window.addEventListener('open-silk-panel', handleOpenSilk);
    window.addEventListener('silk:open-ai-panel', handleOpenSilk);
    return () => {
      window.removeEventListener('open-silk-panel', handleOpenSilk);
      window.removeEventListener('silk:open-ai-panel', handleOpenSilk);
    };
  }, []);

  const closePanel = () => {
    setPanelOpen(false);
    setPanelFieldId(null);
  };

  const setValue = (id, v) => {
    setValues(prev => ({ ...prev, [id]: v }));
    // Req 3: do NOT auto-confirm on typing — confirmation is explicit click only
  };

  // Req 3: Auto-PATCH confirmed_fields on confirm/unconfirm click
  const confirmField = async (id) => {
    // Optimistic UI
    setConfirmed(prev => ({ ...prev, [id]: true }));

    // Determine section key and field key
    const [sectionKey, fieldKey] = id.split('__');
    const section = data?.sections?.[sectionKey];
    if (!section) return;

    // Build candidate keys to cover all section schema types
    const candidates = getSectionCandidateKeys(sectionKey, fieldKey);

    // Build the full confirmed_fields array
    const currentConfirmed = section.confirmed_fields || [];
    const next = [...new Set([...currentConfirmed, ...candidates])];

    // Optimistically update data and totals
    setData(prev => {
      if (!prev) return prev;
      const breakdown = prev.readinessBreakdown || prev.readiness_breakdown;
      const updatedBreakdown = breakdown ? breakdown.map(b => {
        if (b.sectionKey === sectionKey) {
          return { ...b, confirmed: next.length };
        }
        return b;
      }) : breakdown;

      const totalConfirmed = updatedBreakdown ? updatedBreakdown.reduce((sum, b) => sum + (Number(b.confirmed) || 0), 0) : next.length;
      const updatedTotals = prev.readinessTotals ? {
        ...prev.readinessTotals,
        confirmed: totalConfirmed,
      } : prev.readinessTotals;

      return {
        ...prev,
        readinessTotals: updatedTotals,
        readinessBreakdown: updatedBreakdown,
        sections: {
          ...prev.sections,
          [sectionKey]: { ...prev.sections?.[sectionKey], confirmed_fields: next },
        },
      };
    });

    try {
      const res = await profileApi.saveSection(companyId, sectionKey, { confirmed_fields: next });
      if (res?.score !== undefined) setBackendScore(res.score);
      if (res?.readiness_stage) setReadinessStage(res.readiness_stage);
      await load(true);
    } catch (e) {
      // Rollback on failure
      setConfirmed(prev => {
        const reverted = { ...prev };
        delete reverted[id];
        return reverted;
      });
      toastError(e);
      await load(true);
    }
  };

  const unconfirmField = async (id) => {
    // Optimistic UI
    const prevConfirmed = { ...confirmed };
    setConfirmed(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const [sectionKey, fieldKey] = id.split('__');
    const section = data?.sections?.[sectionKey];
    if (!section) return;

    const candidatesSet = new Set(getSectionCandidateKeys(sectionKey, fieldKey));
    const next = (section.confirmed_fields || []).filter(k => !candidatesSet.has(k) && k !== fieldKey && k !== String(fieldKey) && k !== Number(fieldKey));

    // Optimistically update data and totals
    setData(prev => {
      if (!prev) return prev;
      const breakdown = prev.readinessBreakdown || prev.readiness_breakdown;
      const updatedBreakdown = breakdown ? breakdown.map(b => {
        if (b.sectionKey === sectionKey) {
          return { ...b, confirmed: next.length };
        }
        return b;
      }) : breakdown;

      const totalConfirmed = updatedBreakdown ? updatedBreakdown.reduce((sum, b) => sum + (Number(b.confirmed) || 0), 0) : next.length;
      const updatedTotals = prev.readinessTotals ? {
        ...prev.readinessTotals,
        confirmed: totalConfirmed,
      } : prev.readinessTotals;

      return {
        ...prev,
        readinessTotals: updatedTotals,
        readinessBreakdown: updatedBreakdown,
        sections: {
          ...prev.sections,
          [sectionKey]: { ...prev.sections?.[sectionKey], confirmed_fields: next },
        },
      };
    });

    try {
      const res = await profileApi.saveSection(companyId, sectionKey, { confirmed_fields: next });
      if (res?.score !== undefined) setBackendScore(res.score);
      if (res?.readiness_stage) setReadinessStage(res.readiness_stage);
      await load(true);
    } catch (e) {
      // Rollback
      setConfirmed(prevConfirmed);
      toastError(e);
      await load(true);
    }
  };

  const scrollToCategory = (id) => {
    const root = scrollRef.current;
    const el = document.getElementById(`cat-${id}`);
    if (!root || !el) return;
    const tabsH = tabsRef.current?.getBoundingClientRect().height || 0;
    scrollChildInto(root, el, { offset: tabsH });
  };

  const handleTabSelect = (catId) => {
    ignoreSpy.current = true;
    setSelected(catId);
    scrollToCategory(catId);
    setTimeout(() => { ignoreSpy.current = false; }, 900);
  };

  const readinessActions = useMemo(() => {
    const actions = [];
    for (const cat of categories) {
      if (actions.length >= 2) break;
      for (const sub of cat.subsections) {
        if (actions.length >= 2) break;
        for (const item of sub.items) {
          if (actions.length >= 2) break;

          const [secKey, fieldKey] = item.id.split('__');
          if (fieldKey === 'obj' && SECTION_SUBFIELDS[secKey]) {
            const confirmedFields = data?.sections?.[secKey]?.confirmed_fields || [];
            const secVal = values[item.id] || {};
            for (const subField of SECTION_SUBFIELDS[secKey]) {
              if (actions.length >= 2) break;
              const subId = `${secKey}__${subField.key}`;
              const isConf = Boolean(confirmed[subId]) || confirmedFields.includes(subField.key) || confirmedFields.includes(secKey) || confirmedFields.includes('obj');
              const val = secVal[subField.key];
              const hasVal = Array.isArray(val) ? val.length > 0 : (val !== null && val !== undefined && val !== '');
              if (hasVal && !isConf) {
                actions.push({
                  id: subId,
                  fieldId: subId,
                  catId: cat.id,
                  name: subField.name,
                  kind: 'confirm',
                  reason: 'Silk drafted this and it\u2019s still waiting on a founder check.',
                  primaryLabel: 'Confirm',
                });
              }
            }
          } else {
            const hasVal = fieldHasValue(item.kind, values[item.id]);
            const isConf = Boolean(confirmed[item.id]);

            if (hasVal && !isConf && item.aiFilled) {
              actions.push({
                id: item.id,
                fieldId: item.id,
                catId: cat.id,
                name: item.name,
                kind: 'confirm',
                reason: 'Silk drafted this and it\u2019s still waiting on a founder check.',
                primaryLabel: 'Confirm',
              });
            } else if (!hasVal) {
              const noun = item.name.trim();
              const label = noun.length <= 18 ? `Add ${noun.toLowerCase()}` : 'Add';
              let hint = item.hint;
              if (!hint) {
                if (item.name.toLowerCase().includes('vision')) hint = "Investors read this first. Silk couldn't infer it reliably.";
                else if (item.name.toLowerCase().includes('description')) hint = "Core company summary for investors.";
                else hint = "Silk couldn't infer it reliably.";
              }

              actions.push({
                id: item.id,
                fieldId: item.id,
                catId: cat.id,
                name: item.name,
                kind: 'fill',
                reason: hint,
                primaryLabel: label,
              });
            }
          }
        }
      }
    }
    return actions;
  }, [categories, values, confirmed, data]);

  const insightOpen = !panelOpen;

  let activeItemName = '';
  if (panelFieldId) {
    const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s).trim());
    const [secKey, rawFieldKey] = panelFieldId.includes('__') ? panelFieldId.split('__') : ['', panelFieldId];

    // 1. Direct item match in subsections
    for (const cat of categories) {
      for (const sub of cat.subsections) {
        for (const item of sub.items) {
          if (item.id === panelFieldId) {
            activeItemName = item.name;
          }
        }
      }
    }

    // 2. If not found and section key exists, look inside array data (e.g. founders, products, markets, advantages, documents, etc.)
    if (!activeItemName && secKey) {
      const arr = values[`${secKey}__array`] || values[`${secKey}__documents`] || values[`${secKey}__obj`] || data?.sections?.[secKey]?.data?.documents || data?.sections?.[secKey]?.data;
      if (Array.isArray(arr)) {
        const found = arr.find((elem, idx) => elem?.id === rawFieldKey || String(idx) === rawFieldKey);
        if (found) {
          activeItemName = found.filename || found.name || found.title || found.metric || found.market || found.stream || found.round || '';
        }
      }
    }

    // 3. If still not found and rawFieldKey is not a UUID, humanize it
    if (!activeItemName && rawFieldKey && !isUuid(rawFieldKey)) {
      activeItemName = rawFieldKey.replace(/_/g, ' ');
    }
  }
  const panelItemName = activeItemName || (panelDocName !== 'Uploaded Material' ? panelDocName : '');
  const maxCls = 'mx-auto w-full max-w-[1100px]';

  if (loading || phase === 'thinking') {
    return <ProfileThinkingBlock />;
  }

  return (
    <div className="cp-shell">
      <div
        ref={scrollRef}
        className="cp-main"
        style={{
          paddingLeft: '2.5rem',
          paddingBottom: '2rem',
          paddingRight: panelOpen ? 'calc(2.5rem + var(--cp-aside, 340px))' : '2.5rem',
          transition: 'padding-right 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className={`pt-8 ${maxCls}`}>
          <header className="mb-8 flex items-start justify-between gap-6" style={{ border: 'none' }}>
            <div className="min-w-0">
              <p className="cp-greeting">
                {timeGreeting()}
              </p>
              <h1 className="cp-headline">
                Your knowledge base is{' '}
                <span className="cp-headline-underline">
                  {ladderPos}
                </span>.
              </h1>
            </div>
          </header>
        </div>

        {/* Tabs */}
        <ProfileTabs
          categories={categories}
          selected={selected}
          tabsRef={tabsRef}
          tabsStuck={tabsStuck}
          onSelect={handleTabSelect}
          maxCls={maxCls}
        />

        {/* Content */}
        <div className={`pt-6 ${maxCls}`}>
          <div className="grid items-start gap-8 grid-cols-[1fr_340px]">
            <div className="flex w-full max-w-[760px] flex-col gap-10">
              {categories.map((cat, catIdx) => {
                if (!cat.subsections.length) return null;
                return (
                  <section key={cat.id} id={`cat-${cat.id}`} style={{ scrollMarginTop: '3.5rem' }}>
                    <div className="cp-cat-sections">
                      {cat.subsections.map((sub, subIdx) => (
                        <ProfileSectionCard
                          key={sub.id}
                          sub={sub}
                          catIdx={catIdx}
                          subIdx={subIdx}
                          values={values}
                          confirmed={confirmed}
                          data={data}
                          savingSubId={savingSubId}
                          panelFieldId={panelFieldId}
                          panelMode={panelMode}
                          isSectionDirty={isSectionDirty(sub)}
                          onCancelSection={handleCancelSection}
                          onSaveSection={handleSaveSection}
                          onSetValue={setValue}
                          onConfirmField={confirmField}
                          onUnconfirmField={unconfirmField}
                          onOpenPanel={openPanel}
                          readinessBreakdown={data?.readinessBreakdown || data?.readiness_breakdown}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <ReadinessInsightCard
              score={stats.score}
              done={stats.done}
              total={stats.total}
              ladder={ladderPos}
              open={insightOpen}
              className="sticky top-[calc(var(--readiness-tabs,0px)+12px)]"
              actions={readinessActions}
              onPrimary={(act) => {
                if (act.kind === 'confirm' && act.fieldId) {
                  confirmField(act.fieldId);
                }
                if (act.catId) {
                  ignoreSpy.current = true;
                  setSelected(act.catId);
                  scrollToCategory(act.catId);
                  setTimeout(() => {
                    ignoreSpy.current = false;
                    if (act.fieldId) {
                      const targetEl = document.querySelector(`[data-field-id="${act.fieldId}"] input, [data-field-id="${act.fieldId}"] textarea`);
                      if (targetEl) {
                        targetEl.focus();
                      }
                    }
                  }, 350);
                }
              }}
            />
          </div>
        </div>
      </div>

      {drawerShown && (
        <FieldSidePanel
          companyId={companyId}
          fieldId={panelFieldId}
          fieldName={panelItemName}
          mode={panelMode}
          leaving={!panelOpen}
          analysisDocName={panelDocName}
          onClose={closePanel}
          onApplyValue={async (targetFieldId, proposedVal) => {
            if (!targetFieldId) return;
            setValue(targetFieldId, proposedVal);
            confirmField(targetFieldId);

            // Also trigger section save with updated value
            const [sectionKey, fieldKey] = targetFieldId.split('__');
            const section = data?.sections?.[sectionKey];
            if (sectionKey && fieldKey) {
              try {
                const sectionData = section?.data || {};
                const updatedData = typeof sectionData === 'object' && !Array.isArray(sectionData)
                  ? { ...sectionData, [fieldKey]: proposedVal }
                  : sectionData;
                
                const confirmedFields = [...new Set([...(section?.confirmed_fields || []), fieldKey])];
                await profileApi.saveSection(companyId, sectionKey, {
                  data: updatedData,
                  confirmed_fields: confirmedFields,
                });
                if (toast) toast('Applied & confirmed AI draft!');
                await load(true);
              } catch (e) {
                toastError(e);
              }
            }
          }}
        />
      )}

      {/* Generating Status Dialog */}
      <GeneratingDialog data={data} />
    </div>
  );
}
