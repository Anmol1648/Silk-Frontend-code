/**
 * FieldControl — Exact port of silkAnkit page.tsx FieldControl (line 384–541).
 * Routes field kind to the correct input type, using exact same CSS classes.
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profile as profileApi } from '../../api/endpoints';
import { useToast } from '../../context/AppContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { Linkedin02Icon, CloudUploadIcon, FileAttachmentIcon } from '@hugeicons/core-free-icons';
import {
  CURRENCIES, CURRENCY_SCALES,
  parseCurrencyValue, formatCurrencyValue, sanitizeNumeric,
  COUNTRIES, getSelectOptions,
} from './profile-utils';
import { OptionsCombobox } from '../options-combobox';
import { DatePicker } from '../date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusTag } from './KnowledgeField';
import { FileTypeBadge } from '../file-type-badge';

function SubFieldHeader({ fieldId, label, confirmedFields = [], onConfirm, onUnconfirm }) {
  const [hovered, setHovered] = useState(false);
  const [sectionKey, fieldKey] = fieldId && fieldId.includes('__') ? fieldId.split('__') : ['', fieldId];
  const isConfirmed = Boolean(
    confirmedFields.length && (
      confirmedFields.includes(fieldId) ||
      (fieldKey !== undefined && (
        confirmedFields.includes(fieldKey) ||
        confirmedFields.includes(Number(fieldKey)) ||
        confirmedFields.includes(String(fieldKey))
      ))
    )
  );

  const handleAsk = () => {
    window.dispatchEvent(new CustomEvent('open-silk-panel', {
      detail: { fieldId: fieldId || 'field', mode: 'ask' }
    }));
  };

  const handleConfirm = () => {
    const keyToUse = fieldKey !== undefined ? fieldKey : fieldId;
    if (onConfirm && keyToUse !== undefined) onConfirm(keyToUse);
  };

  const handleUnconfirm = () => {
    const keyToUse = fieldKey !== undefined ? fieldKey : fieldId;
    if (onUnconfirm && keyToUse !== undefined) onUnconfirm(keyToUse);
    else if (onConfirm && keyToUse !== undefined) onConfirm(keyToUse);
  };

  return (
    <div
      className="flex items-center justify-between gap-2 mb-1.5 min-h-[22px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {isConfirmed ? (
          <StatusTag
            label="Confirmed"
            hoverLabel="Unconfirm"
            onClick={handleUnconfirm}
          />
        ) : (
          <StatusTag label="AI Draft" tone="ai" />
        )}
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s ease',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        {!isConfirmed && (
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              handleConfirm();
            }}
            className="cp-confirm-btn"
          >
            Confirm
          </button>
        )}
        <button
          type="button"
          onClick={e => { e.preventDefault(); handleAsk(); }}
          className="cp-ask-btn"
        >
          Ask Silk
        </button>
      </div>
    </div>
  );
}

function FoundersEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const founders = Array.isArray(value) ? value : [];

  const updateFounder = (index, updates) => {
    const next = [...founders];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const addFounder = () => {
    onChange([...founders, { name: '', role: '', linkedin_url: '', is_full_time: false }]);
  };

  const removeFounder = (index) => {
    const next = [...founders];
    next.splice(index, 1);
    onChange(next);
  };

  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {founders.map((f, i) => (
        <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SubFieldHeader
                label={`Person ${i + 1}`}
                fieldId={f.id ? `founders__${f.id}` : `founders__${i}`}
                confirmedFields={confirmedFields}
                onConfirm={onConfirmField}
                onUnconfirm={onUnconfirmField}
              />
            </div>
            <button
              type="button"
              onClick={() => removeFounder(i)}
              className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={`Remove Person ${i + 1}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <label className={labelCls}>Name</label>
              <input
                className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
                placeholder="Name"
                value={f.name || ''}
                onChange={e => updateFounder(i, { name: e.target.value })}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className={labelCls}>Role</label>
              <input
                className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
                placeholder="Role"
                value={f.role || ''}
                onChange={e => updateFounder(i, { role: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Background</label>
            <textarea
              ref={el => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
              className="cp-input w-full bg-secondary border-0 min-h-[40px] p-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none resize-none overflow-hidden"
              placeholder="Background"
              value={f.background || ''}
              onChange={e => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                updateFounder(i, { background: e.target.value });
              }}
            />
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>LinkedIn URL</label>
            <div className="cp-shell-input">
              <span style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '0.375rem', padding: '0 0.75rem', fontSize: '13px', color: 'var(--cp-fg-subtle)' }}>
                <HugeiconsIcon icon={Linkedin02Icon} size={15} strokeWidth={2} />
                linkedin.com/in/
              </span>
              <input
                type="text"
                placeholder="username"
                value={(f.linkedin_url || '').replace(/^https?:\/\/(www\.)?(in\.)?linkedin\.com\/in\//i, '')}
                onChange={e => {
                  const val = e.target.value.replace(/\s+/g, '').trim();
                  updateFounder(i, { linkedin_url: val ? `https://linkedin.com/in/${val}` : '' });
                }}
                aria-label={`${f.name || 'Founder'} LinkedIn`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Checkbox
              id={`full-time-${i}`}
              checked={f.is_full_time}
              onCheckedChange={checked => updateFounder(i, { is_full_time: !!checked })}
            />
            <label htmlFor={`full-time-${i}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
              Is Full Time
            </label>
          </div>
        </div>
      ))}
      <button
        onClick={addFounder}
        className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add person
      </button>
    </div>
  );
}

/* ── TagsEditor — for array of string tags ── */
function TagsEditor({ value, onChange, placeholder = 'Add tag...' }) {
  const tags = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
  const [inputVal, setInputVal] = useState('');

  const addTag = (text) => {
    const trimmed = (text || inputVal).trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal('');
  };

  const removeTag = (index) => {
    const next = [...tags];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-foreground border border-border/40"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="cp-input flex-1 h-9 px-3 rounded-lg text-sm bg-secondary border-0"
        />
        <button
          type="button"
          onClick={() => addTag()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border-0 cursor-pointer"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ── BulletListEditor — for array of text observations / trends ── */
function BulletListEditor({ value, onChange, placeholder = 'Add item...' }) {
  const items = Array.isArray(value) ? value : (typeof value === 'string' ? value.split('\n').map(s => s.trim()).filter(Boolean) : []);

  const updateItem = (index, val) => {
    const next = [...items];
    next[index] = val;
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  const removeItem = (index) => {
    const next = [...items];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs select-none">•</span>
          <textarea
            rows={1}
            value={item}
            onChange={e => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              updateItem(i, e.target.value);
            }}
            placeholder={placeholder}
            className="cp-input flex-1 min-h-[36px] py-1.5 px-3 rounded-lg text-sm bg-secondary border-0 resize-none overflow-hidden"
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors flex-shrink-0"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border-0 cursor-pointer mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add item
      </button>
    </div>
  );
}

/* ── ProductsEditor — structured editor for products/services ── */
function ProductsEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, updates) => {
    const next = [...items];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, { name: '', category: '', description: '' }]);
  };

  const removeItem = (index) => {
    const next = [...items];
    next.splice(index, 1);
    onChange(next);
  };

  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SubFieldHeader
                label={`Product / Service ${i + 1}`}
                fieldId={item.id ? `products_services__${item.id}` : `products_services__${i}`}
                confirmedFields={confirmedFields}
                onConfirm={onConfirmField}
                onUnconfirm={onUnconfirmField}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={`Remove Product ${i + 1}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <label className={labelCls}>Product Name</label>
              <input
                className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
                placeholder="Product Name"
                value={item.name || ''}
                onChange={e => updateItem(i, { name: e.target.value })}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className={labelCls}>Category</label>
              <input
                className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
                placeholder="Category"
                value={item.category || ''}
                onChange={e => updateItem(i, { category: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className={labelCls}>Description</label>
            <textarea
              ref={el => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
              className="cp-input w-full bg-secondary border-0 min-h-[40px] p-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none resize-none overflow-hidden"
              placeholder="Description"
              value={item.description || ''}
              onChange={e => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                updateItem(i, { description: e.target.value });
              }}
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add product / service
      </button>
    </div>
  );
}

/* ── MarketsEditor — structured editor for customers & markets ── */
function MarketsEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { market: '', customer_type: '', geography: '' }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };
  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SubFieldHeader
                label={`Market ${i + 1}`}
                fieldId={item.id ? `customers_markets__${item.id}` : `customers_markets__${i}`}
                confirmedFields={confirmedFields}
                onConfirm={onConfirmField}
                onUnconfirm={onUnconfirmField}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={`Remove Market ${i + 1}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Target Market</label>
            <input
              className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
              placeholder="Market"
              value={item.market || ''}
              onChange={e => updateItem(i, { market: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <label className={labelCls}>Customer Type</label>
              <input
                className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
                placeholder="Customer Type"
                value={item.customer_type || ''}
                onChange={e => updateItem(i, { customer_type: e.target.value })}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className={labelCls}>Geography</label>
              <input
                className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
                placeholder="Geography"
                value={item.geography || ''}
                onChange={e => updateItem(i, { geography: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add market
      </button>
    </div>
  );
}

/* ── AdvantagesEditor — structured editor for competitive advantages ── */
function AdvantagesEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { title: '', description: '' }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };
  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SubFieldHeader
                label={`Advantage ${i + 1}`}
                fieldId={item.id ? `competitive_advantages__${item.id}` : `competitive_advantages__${i}`}
                confirmedFields={confirmedFields}
                onConfirm={onConfirmField}
                onUnconfirm={onUnconfirmField}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={`Remove Advantage ${i + 1}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Advantage Title</label>
            <input
              className="cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none"
              placeholder="Title"
              value={item.title || ''}
              onChange={e => updateItem(i, { title: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className={labelCls}>Description</label>
            <textarea
              ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
              className="cp-input w-full bg-secondary border-0 min-h-[40px] p-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none resize-none overflow-hidden"
              placeholder="Description"
              value={item.description || ''}
              onChange={e => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                updateItem(i, { description: e.target.value });
              }}
            />
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add advantage
      </button>
    </div>
  );
}

/* ── IndustryResearchEditor — structured editor for industry research ── */
function IndustryResearchEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const data = (typeof value === 'object' && value !== null) ? value : {};
  const update = (patch) => onChange({ ...data, ...patch });
  const updateSizing = (key, patch) => {
    const ms = data.market_sizing || {};
    onChange({ ...data, market_sizing: { ...ms, [key]: { ...(ms[key] || {}), ...patch } } });
  };

  const inputCls = "cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <SubFieldHeader label="Industry Evolution" fieldId="industry_research__industry_evolution" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.industry_evolution} onChange={v => update({ industry_evolution: v })} placeholder="Industry evolution..." />
      </div>

      <div>
        <SubFieldHeader label="Market Sizing Narrative" fieldId="industry_research__market_sizing_narrative" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.market_sizing_narrative} onChange={v => update({ market_sizing_narrative: v })} placeholder="Market sizing narrative..." />
      </div>

      <div>
        <SubFieldHeader label="Methodology" fieldId="industry_research__methodology" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.methodology} onChange={v => update({ methodology: v })} placeholder="Methodology..." />
      </div>

      {/* TAM / SAM / SOM */}
      <div>
        <SubFieldHeader label="Market Sizing Breakdown (TAM / SAM / SOM)" fieldId="industry_research__market_sizing" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <div className="flex flex-col gap-4">
          {['tam', 'sam', 'som'].map(key => {
            const s = data.market_sizing?.[key] || {};
            return (
              <div key={key} className="flex flex-col gap-2 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{key.toUpperCase()}</div>
                <div className="flex gap-3">
                  <input className={inputCls} placeholder="Value" value={s.value || ''} onChange={e => updateSizing(key, { value: e.target.value })} />
                  <input className={inputCls} placeholder="Source" value={s.source || ''} onChange={e => updateSizing(key, { source: e.target.value })} />
                </div>
                <AutoTextarea value={s.assumptions} onChange={v => updateSizing(key, { assumptions: v })} placeholder="Assumptions..." />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SubFieldHeader label="Performance Trends" fieldId="industry_research__performance_trends" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <TagsInput value={data.performance_trends} onChange={v => update({ performance_trends: v })} placeholder="Add trend..." />
      </div>

      <div>
        <SubFieldHeader label="Regulatory Developments" fieldId="industry_research__regulatory_developments" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <TagsInput value={data.regulatory_developments} onChange={v => update({ regulatory_developments: v })} placeholder="Add regulation..." />
      </div>
    </div>
  );
}

/* ── BusinessModelEditor — structured editor for business model ── */
function BusinessModelEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const data = (typeof value === 'object' && value !== null) ? value : {};
  const update = (patch) => onChange({ ...data, ...patch });

  const inputCls = "cp-input w-full bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex gap-3">
        <div className="flex-1">
          <SubFieldHeader label="Business Model Types" fieldId="business_model__business_model_types" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
          <TagsInput value={data.business_model_types} onChange={v => update({ business_model_types: v })} placeholder="Add type..." />
        </div>
        <div className="flex-1">
          <SubFieldHeader label="Customer Type" fieldId="business_model__customer_type" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
          <input className={inputCls} placeholder="Customer type" value={data.customer_type || ''} onChange={e => update({ customer_type: e.target.value })} />
        </div>
      </div>

      <div>
        <SubFieldHeader label="Value Proposition" fieldId="business_model__value_proposition" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.value_proposition} onChange={v => update({ value_proposition: v })} placeholder="Value proposition..." />
      </div>

      <div>
        <SubFieldHeader label="Delivery Model" fieldId="business_model__delivery_model" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.delivery_model} onChange={v => update({ delivery_model: v })} placeholder="Delivery model..." />
      </div>

      <div>
        <SubFieldHeader label="Pricing Model" fieldId="business_model__pricing_model" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.pricing_model} onChange={v => update({ pricing_model: v })} placeholder="Pricing model..." />
      </div>

      <div>
        <SubFieldHeader label="Sales Model" fieldId="business_model__sales_model" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.sales_model} onChange={v => update({ sales_model: v })} placeholder="Sales model..." />
      </div>

      <div>
        <SubFieldHeader label="Distribution Channels" fieldId="business_model__distribution_channels" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <TagsInput value={data.distribution_channels} onChange={v => update({ distribution_channels: v })} placeholder="Add channel..." />
      </div>
    </div>
  );
}

/* ── RevenueModelEditor — stream + share% ── */
function RevenueModelEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { stream: '', share_percent: null }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };
  const inputCls = "cp-input flex-1 bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";

  return (
    <div className="flex flex-col gap-4 w-full">
      {items.map((item, i) => {
        let displayShare = item.share_percent;
        if (displayShare !== null && displayShare !== undefined && displayShare !== '' && !isNaN(Number(displayShare))) {
          displayShare = Number(displayShare).toFixed(1);
        } else {
          displayShare = item.share_percent ?? '';
        }

        return (
          <div key={i} className="flex flex-col gap-2 pb-3 border-b border-border/40 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SubFieldHeader
                  label={`Revenue Stream ${i + 1}`}
                  fieldId={item.id ? `revenue_model__${item.id}` : `revenue_model__${i}`}
                  confirmedFields={confirmedFields}
                  onConfirm={onConfirmField}
                  onUnconfirm={onUnconfirmField}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={`Remove Revenue Stream ${i + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input className={inputCls} placeholder="Revenue Stream" value={item.stream || ''} onChange={e => updateItem(i, { stream: e.target.value })} />
              <div className="cp-shell-input" style={{ maxWidth: 140, flexShrink: 0 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Share"
                  value={displayShare}
                  onChange={e => updateItem(i, { share_percent: e.target.value })}
                  onBlur={e => {
                    const val = e.target.value;
                    if (val !== '' && !isNaN(Number(val))) {
                      updateItem(i, { share_percent: Number(Number(val).toFixed(1)) });
                    }
                  }}
                  style={{ textAlign: 'right' }}
                />
                <span className="cp-shell-suffix">%</span>
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add revenue stream
      </button>
    </div>
  );
}

/* ── MetricsEditor — metric + value + unit ── */
function MetricsEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { metric: '', value: '', unit: '' }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };
  const inputCls = "cp-input flex-1 bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";

  return (
    <div className="flex flex-col gap-4 w-full">
      {items.map((item, i) => {
        let displayVal = String(item.value || '').trim();
        const unitStr = String(item.unit || '').trim();
        if (displayVal.endsWith('%')) {
          displayVal = displayVal.replace(/%/g, '').trim();
        }
        if ((unitStr === '%' || unitStr.includes('%')) && displayVal && !isNaN(Number(displayVal))) {
          displayVal = Number(displayVal).toFixed(1);
        }

        return (
          <div key={i} className="flex flex-col gap-2 pb-3 border-b border-border/40 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SubFieldHeader
                  label={`Metric ${i + 1}`}
                  fieldId={item.id ? `company_metrics__${item.id}` : `company_metrics__${i}`}
                  confirmedFields={confirmedFields}
                  onConfirm={onConfirmField}
                  onUnconfirm={onUnconfirmField}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={`Remove Metric ${i + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input className={inputCls} placeholder="Metric name" value={item.metric || ''} onChange={e => updateItem(i, { metric: e.target.value })} />
              <input
                className={inputCls}
                style={{ maxWidth: 120, flexShrink: 0 }}
                placeholder="Value"
                value={displayVal}
                onChange={e => updateItem(i, { value: e.target.value })}
                onBlur={e => {
                  let val = e.target.value.replace(/%/g, '').trim();
                  const unit = (item.unit || '').trim();
                  if ((unit === '%' || unit.includes('%')) && val && !isNaN(Number(val))) {
                    val = Number(val).toFixed(1);
                  }
                  updateItem(i, { value: val });
                }}
              />
              <input
                className={inputCls}
                style={{ maxWidth: 100, flexShrink: 0 }}
                placeholder="Unit"
                value={item.unit || ''}
                onChange={e => {
                  const unit = e.target.value;
                  let val = String(item.value || '').replace(/%/g, '').trim();
                  if (unit.trim() === '%' && val && !isNaN(Number(val))) {
                    val = Number(val).toFixed(1);
                  }
                  updateItem(i, { unit, value: val });
                }}
              />
            </div>
          </div>
        );
      })}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add metric
      </button>
    </div>
  );
}

/* ── FinancialSummaryEditor — financials table + observations ── */
function FinancialSummaryEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const data = (typeof value === 'object' && value !== null) ? value : {};
  const financials = Array.isArray(data.financials) ? data.financials : [];
  const observations = Array.isArray(data.observations) ? data.observations : [];

  const activeCurrency = data.currency || financials[0]?.currency || 'USD';

  const setCurrency = (newCurr) => {
    const updatedFinancials = financials.map(f => ({ ...f, currency: newCurr }));
    onChange({ ...data, currency: newCurr, financials: updatedFinancials });
  };

  const updateFinancial = (i, u) => {
    const n = [...financials]; n[i] = { ...n[i], ...u };
    onChange({ ...data, financials: n });
  };
  const addFinancial = () => onChange({ ...data, financials: [...financials, { financial_year: '', is_estimate: false, revenue_m: null, ebitda_m: null, pat_m: null, yoy_revenue_growth_pct: null, currency: activeCurrency }] });
  const removeFinancial = (i) => { const n = [...financials]; n.splice(i, 1); onChange({ ...data, financials: n }); };

  const inputCls = "cp-input bg-secondary border-0 h-9 px-2 rounded-md focus:ring-1 focus:ring-foreground/5 shadow-none text-sm";
  const thCls = "text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 py-1 text-right";

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <SubFieldHeader label="Financials" fieldId="financial_summary__financials" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-3">
            <span className="text-[11px] font-medium uppercase tracking-wider">Currency:</span>
            <CurrencyPrefixSelect value={activeCurrency} onChange={setCurrency} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '8px' }}>
            <thead>
              <tr>
                <th className={thCls} style={{ textAlign: 'left', minWidth: 80 }}>Year</th>
                <th className={thCls} style={{ minWidth: 50 }}>Est?</th>
                <th className={thCls} style={{ minWidth: 105 }}>Revenue ({activeCurrency} M)</th>
                <th className={thCls} style={{ minWidth: 105 }}>EBITDA ({activeCurrency} M)</th>
                <th className={thCls} style={{ minWidth: 95 }}>PAT ({activeCurrency} M)</th>
                <th className={thCls} style={{ minWidth: 80 }}>YoY %</th>
                <th className={thCls} style={{ minWidth: 70 }}>EV/Rev</th>
                <th className={thCls} style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {financials.map((f, i) => {
                const fmt2 = (v) => (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(v).toFixed(2) : (v ?? '');
                const fmt1 = (v) => (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(v).toFixed(1) : (v ?? '');

                return (
                  <tr key={i}>
                    <td><input className={inputCls + " w-full"} value={f.financial_year || ''} onChange={e => updateFinancial(i, { financial_year: e.target.value })} /></td>
                    <td className="text-center align-middle">
                      <div className="flex justify-center items-center h-full pt-2">
                        <Checkbox checked={!!f.is_estimate} onCheckedChange={checked => updateFinancial(i, { is_estimate: !!checked })} />
                      </div>
                    </td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        value={fmt2(f.revenue_m)}
                        onChange={e => updateFinancial(i, { revenue_m: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateFinancial(i, { revenue_m: Number(Number(v).toFixed(2)) });
                        }}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        value={fmt2(f.ebitda_m)}
                        onChange={e => updateFinancial(i, { ebitda_m: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateFinancial(i, { ebitda_m: Number(Number(v).toFixed(2)) });
                        }}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        value={fmt2(f.pat_m)}
                        onChange={e => updateFinancial(i, { pat_m: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateFinancial(i, { pat_m: Number(Number(v).toFixed(2)) });
                        }}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        value={fmt1(f.yoy_revenue_growth_pct)}
                        onChange={e => updateFinancial(i, { yoy_revenue_growth_pct: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateFinancial(i, { yoy_revenue_growth_pct: Number(Number(v).toFixed(1)) });
                        }}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        value={fmt2(f.ev_revenue_multiple)}
                        onChange={e => updateFinancial(i, { ev_revenue_multiple: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateFinancial(i, { ev_revenue_multiple: Number(Number(v).toFixed(2)) });
                        }}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <button onClick={() => removeFinancial(i)} className="hover:text-foreground p-1 rounded transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addFinancial} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0 mt-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Add year
        </button>
      </div>

      <div>
        <SubFieldHeader label="Observations" fieldId="financial_summary__observations" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <TagsInput value={observations} onChange={v => onChange({ ...data, observations: v })} placeholder="Add observation..." />
      </div>
    </div>
  );
}

/* ── NewsEditor — title, date, description, source (with link icon) ── */
function NewsEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { title: '', date: '', description: '', source: '', link: '' }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };

  const inputCls = "cp-input flex-1 bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";
  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {items.map((item, i) => {
        const query = `${item.source ? `${item.source} ` : ''}${item.title || ''}`.trim();
        const googleSearchUrl = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : '';
        return (
          <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SubFieldHeader
                  label={`News Article ${i + 1}`}
                  fieldId={item.id ? `news__${item.id}` : `news__${i}`}
                  confirmedFields={confirmedFields}
                  onConfirm={onConfirmField}
                  onUnconfirm={onUnconfirmField}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={`Remove News Article ${i + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Title</span>
                {googleSearchUrl && (
                  <a
                    href={googleSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors -mt-0.5"
                    title={`Search Google for "${query}"`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </a>
                )}
              </div>
              <input
                className={inputCls + " w-full"}
                placeholder="Article Title"
                value={item.title || ''}
                onChange={e => updateItem(i, { title: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <div className={labelCls}>Date</div>
                <input className={inputCls + " w-full"} placeholder="YYYY-MM-DD" value={item.date || ''} onChange={e => updateItem(i, { date: e.target.value })} />
              </div>
              <div className="flex-1">
                <div className={labelCls}>Source</div>
                <input
                  className={inputCls + " w-full"}
                  placeholder="Publication Source"
                  value={item.source || ''}
                  onChange={e => updateItem(i, { source: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className={labelCls}>Description</div>
              <AutoTextarea value={item.description} onChange={v => updateItem(i, { description: v })} placeholder="News description..." />
            </div>
          </div>
        );
      })}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add news article
      </button>
    </div>
  );
}

/* ── CompanyStoryEditor — origin, brand, milestones, usp ── */
function CompanyStoryEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const data = (typeof value === 'object' && value !== null) ? value : {};
  const milestones = Array.isArray(data.milestones) ? data.milestones : [];

  const update = (patch) => onChange({ ...data, ...patch });
  const updateMilestone = (i, u) => { const n = [...milestones]; n[i] = { ...n[i], ...u }; update({ milestones: n }); };
  const addMilestone = () => update({ milestones: [...milestones, { date: '', title: '', description: '' }] });
  const removeMilestone = (i) => { const n = [...milestones]; n.splice(i, 1); update({ milestones: n }); };

  const inputCls = "cp-input flex-1 bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <SubFieldHeader label="Origin Story" fieldId="company_story__origin_story" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.origin_story} onChange={v => update({ origin_story: v })} placeholder="Origin story..." />
      </div>

      <div>
        <SubFieldHeader label="Brand Evolution" fieldId="company_story__brand_evolution" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.brand_evolution} onChange={v => update({ brand_evolution: v })} placeholder="Brand evolution..." />
      </div>

      <div>
        <SubFieldHeader label="Unique Selling Proposition (USP)" fieldId="company_story__usp" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.usp} onChange={v => update({ usp: v })} placeholder="USP..." />
      </div>

      {/* Milestones */}
      <div>
        <SubFieldHeader label="Milestones" fieldId="company_story__milestones" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <div className="flex flex-col gap-4">
          {milestones.map((item, i) => (
            <div key={i} className="flex flex-col gap-2 pb-3 border-b border-border/30 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">{item.title || `Milestone ${i + 1}`}</div>
                <button onClick={() => removeMilestone(i)} className="hover:text-foreground p-1 rounded transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex gap-2">
                <input className={inputCls} style={{ maxWidth: 120 }} placeholder="Date" value={item.date || ''} onChange={e => updateMilestone(i, { date: e.target.value })} />
                <input className={inputCls + " flex-1"} placeholder="Title" value={item.title || ''} onChange={e => updateMilestone(i, { title: e.target.value })} />
              </div>
              <AutoTextarea value={item.description} onChange={v => updateMilestone(i, { description: v })} placeholder="Description..." />
            </div>
          ))}
          <button onClick={addMilestone} className="w-full bg-secondary/50 hover:bg-secondary text-muted-foreground py-2 rounded-md text-xs flex items-center justify-center gap-1 transition-colors border-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add Milestone
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── InvestmentThesisEditor — opportunity, leadership, risks ── */
function InvestmentThesisEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const data = (typeof value === 'object' && value !== null) ? value : {};
  const update = (patch) => onChange({ ...data, ...patch });

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <SubFieldHeader label="Opportunity Explanation" fieldId="investment_thesis__opportunity_explanation" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.opportunity_explanation} onChange={v => update({ opportunity_explanation: v })} placeholder="Opportunity explanation..." />
      </div>

      <div>
        <SubFieldHeader label="Leadership Assessment" fieldId="investment_thesis__leadership_assessment" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <AutoTextarea value={data.leadership_assessment} onChange={v => update({ leadership_assessment: v })} placeholder="Leadership assessment..." />
      </div>

      <div>
        <SubFieldHeader label="Risks and Concerns" fieldId="investment_thesis__risks_and_concerns" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        <TagsInput value={data.risks_and_concerns} onChange={v => update({ risks_and_concerns: v })} placeholder="Add risk or concern..." />
      </div>
    </div>
  );
}

/* ── FundingHistoryEditor — rounds, amounts, investors ── */
function FundingHistoryEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { date: '', round: '', amount_usd_mn: null, pre_money_usd_mn: null, post_money_usd_mn: null, investors: [], lead_investors: [] }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };

  const inputCls = "cp-input flex-1 bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";
  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SubFieldHeader
                label={`Funding Round ${i + 1}`}
                fieldId={item.id ? `funding_history__${item.id}` : `funding_history__${i}`}
                confirmedFields={confirmedFields}
                onConfirm={onConfirmField}
                onUnconfirm={onUnconfirmField}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors ml-2"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={`Remove Funding Round ${i + 1}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className={labelCls}>Date</div>
              <input className={inputCls + " w-full"} placeholder="YYYY-MM" value={item.date || ''} onChange={e => updateItem(i, { date: e.target.value })} />
            </div>
            <div className="flex-1">
              <div className={labelCls}>Round</div>
              <input className={inputCls + " w-full"} placeholder="Series A..." value={item.round || ''} onChange={e => updateItem(i, { round: e.target.value })} />
            </div>
            <div className="flex-1">
              <div className={labelCls}>Amount ($M)</div>
              <input className={inputCls + " w-full"} type="number" step="0.01" placeholder="Amount" value={item.amount_usd_mn ?? ''} onChange={e => updateItem(i, { amount_usd_mn: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <div className={labelCls}>Pre-Money ($M)</div>
              <input className={inputCls + " w-full"} type="number" step="0.01" placeholder="Pre-Money" value={item.pre_money_usd_mn ?? ''} onChange={e => updateItem(i, { pre_money_usd_mn: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="flex-1">
              <div className={labelCls}>Post-Money ($M)</div>
              <input className={inputCls + " w-full"} type="number" step="0.01" placeholder="Post-Money" value={item.post_money_usd_mn ?? ''} onChange={e => updateItem(i, { post_money_usd_mn: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className={labelCls}>Lead Investors</div>
              <TagsInput value={item.lead_investors} onChange={v => updateItem(i, { lead_investors: v })} placeholder="Add lead investor..." />
            </div>
            <div>
              <div className={labelCls}>All Investors</div>
              <TagsInput value={item.investors} onChange={v => updateItem(i, { investors: v })} placeholder="Add investor..." />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add funding round
      </button>
    </div>
  );
}

/* ── InvestorsCapTableEditor — cap table and investors list ── */
function InvestorsCapTableEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const data = (typeof value === 'object' && value !== null) ? value : {};
  const capTable = data.cap_table_summary || {};
  const ownership = Array.isArray(capTable.ownership) ? capTable.ownership : [];
  const investorsList = Array.isArray(data.investors_list) ? data.investors_list : [];

  const updateOwnership = (i, u) => {
    const n = [...ownership]; n[i] = { ...n[i], ...u };
    onChange({ ...data, cap_table_summary: { ...capTable, ownership: n } });
  };
  const addOwnership = () => onChange({ ...data, cap_table_summary: { ...capTable, ownership: [...ownership, { stakeholder_category: '', ownership_pct: null }] } });
  const removeOwnership = (i) => { const n = [...ownership]; n.splice(i, 1); onChange({ ...data, cap_table_summary: { ...capTable, ownership: n } }); };

  const updateInvestor = (i, u) => { const n = [...investorsList]; n[i] = { ...n[i], ...u }; onChange({ ...data, investors_list: n }); };
  const addInvestor = () => onChange({ ...data, investors_list: [...investorsList, { investor_name: '', investor_type: '', funding_amount_usd_mn: null, valuation_usd_mn: null, dilution_pct: null, date: '', round: '' }] });
  const removeInvestor = (i) => { const n = [...investorsList]; n.splice(i, 1); onChange({ ...data, investors_list: n }); };

  const inputCls = "cp-input bg-secondary border-0 h-9 px-2 rounded-md focus:ring-1 focus:ring-foreground/5 shadow-none text-sm";
  const thCls = "text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1 py-1 text-left";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cap Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <SubFieldHeader label="Cap Table Ownership" fieldId="investors_cap_table__cap_table_summary" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
          </div>
          <div className="text-xs text-muted-foreground ml-3">Total: {ownership.reduce((sum, item) => sum + (Number(item.ownership_pct) || 0), 0).toFixed(1)}%</div>
        </div>
        <div className="flex flex-col gap-2">
          {ownership.map((item, i) => {
            let displayPct = item.ownership_pct;
            if (displayPct !== null && displayPct !== undefined && displayPct !== '' && !isNaN(Number(displayPct))) {
              displayPct = Number(displayPct).toFixed(1);
            } else {
              displayPct = item.ownership_pct ?? '';
            }

            return (
              <div key={i} className="flex gap-2">
                <input className={inputCls + " flex-1"} placeholder="Stakeholder Category" value={item.stakeholder_category || ''} onChange={e => updateOwnership(i, { stakeholder_category: e.target.value })} />
                <div className="cp-shell-input" style={{ width: 120 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ownership"
                    value={displayPct}
                    onChange={e => updateOwnership(i, { ownership_pct: e.target.value })}
                    onBlur={e => {
                      const val = e.target.value;
                      if (val !== '' && !isNaN(Number(val))) {
                        updateOwnership(i, { ownership_pct: Number(Number(val).toFixed(1)) });
                      }
                    }}
                    style={{ textAlign: 'right' }}
                  />
                  <span className="cp-shell-suffix">%</span>
                </div>
                <button onClick={() => removeOwnership(i)} className="hover:text-foreground p-1 rounded transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
          <button onClick={addOwnership} className="w-full bg-secondary/50 hover:bg-secondary text-muted-foreground py-1.5 rounded-md text-xs flex items-center justify-center gap-1 transition-colors border-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> Add Stakeholder
          </button>
        </div>
      </div>

      {/* Investors List */}
      <div>
        <div className="mb-2">
          <SubFieldHeader label="Investors List" fieldId="investors_cap_table__investors_list" confirmedFields={confirmedFields} onConfirm={onConfirmField} onUnconfirm={onUnconfirmField} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '8px' }}>
            <thead>
              <tr>
                <th className={thCls} style={{ minWidth: 150 }}>Investor Name</th>
                <th className={thCls} style={{ minWidth: 120 }}>Type</th>
                <th className={thCls} style={{ minWidth: 80 }}>Round</th>
                <th className={thCls} style={{ minWidth: 90 }}>Date</th>
                <th className={thCls} style={{ minWidth: 80 }}>Amount ($M)</th>
                <th className={thCls} style={{ minWidth: 80 }}>Valuation ($M)</th>
                <th className={thCls} style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {investorsList.map((f, i) => {
                const fmt2 = (v) => (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) ? Number(v).toFixed(2) : (v ?? '');

                return (
                  <tr key={i}>
                    <td><input className={inputCls + " w-full"} placeholder="Name" value={f.investor_name || ''} onChange={e => updateInvestor(i, { investor_name: e.target.value })} /></td>
                    <td><input className={inputCls + " w-full"} placeholder="VC, Angel..." value={f.investor_type || ''} onChange={e => updateInvestor(i, { investor_type: e.target.value })} /></td>
                    <td><input className={inputCls + " w-full"} placeholder="Series A" value={f.round || ''} onChange={e => updateInvestor(i, { round: e.target.value })} /></td>
                    <td><input className={inputCls + " w-full"} placeholder="YYYY-MM" value={f.date || ''} onChange={e => updateInvestor(i, { date: e.target.value })} /></td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        placeholder="Amount"
                        value={fmt2(f.funding_amount_usd_mn)}
                        onChange={e => updateInvestor(i, { funding_amount_usd_mn: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateInvestor(i, { funding_amount_usd_mn: Number(Number(v).toFixed(2)) });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className={inputCls + " w-full"}
                        type="text"
                        inputMode="decimal"
                        placeholder="Valuation"
                        value={fmt2(f.valuation_usd_mn)}
                        onChange={e => updateInvestor(i, { valuation_usd_mn: e.target.value })}
                        onBlur={e => {
                          const v = e.target.value;
                          if (v !== '' && !isNaN(Number(v))) updateInvestor(i, { valuation_usd_mn: Number(Number(v).toFixed(2)) });
                        }}
                      />
                    </td>
                    <td>
                      <button onClick={() => removeInvestor(i)} className="hover:text-foreground p-1 rounded transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button onClick={addInvestor} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0 mt-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Add investor
        </button>
      </div>
    </div>
  );
}

/* ── CompetitorsEditor — structured editor for competitors ── */
function AutoTextarea({ value, onChange, placeholder, className }) {
  return (
    <textarea
      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
      className={className || "cp-input w-full bg-secondary border-0 min-h-[40px] p-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none resize-none overflow-hidden"}
      placeholder={placeholder}
      value={value || ''}
      onChange={e => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
        onChange(e.target.value);
      }}
    />
  );
}

function TagsInput({ value, onChange, placeholder }) {
  const tags = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) { onChange([...tags, t]); }
    setDraft('');
  };

  const removeTag = (i) => { const n = [...tags]; n.splice(i, 1); onChange(n); };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-secondary text-foreground text-xs px-2 py-1 rounded-md">
            {tag}
            <button onClick={() => removeTag(i)} className="hover:text-destructive ml-0.5" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="cp-input flex-1 bg-secondary border-0 h-8 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none text-sm"
          placeholder={placeholder}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
        />
        <button onClick={addTag} className="text-xs px-3 h-8 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors" style={{ border: 'none', cursor: 'pointer' }}>Add</button>
      </div>
    </div>
  );
}

function CompetitorsEditor({ value, onChange, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, u) => { const n = [...items]; n[i] = { ...n[i], ...u }; onChange(n); };
  const addItem = () => onChange([...items, { name: '', status: 'Private', revenue: null, funding_usd_mn: null, investors: [], business_model: '', market_positioning: '', key_differentiators: [], strengths: [], weaknesses: [] }]);
  const removeItem = (i) => { const n = [...items]; n.splice(i, 1); onChange(n); };
  const [expanded, setExpanded] = useState({});
  const toggle = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const inputCls = "cp-input flex-1 bg-secondary border-0 h-10 px-3 rounded-lg focus:ring-1 focus:ring-foreground/5 shadow-none";
  const labelCls = "text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1";

  return (
    <div className="flex flex-col gap-6 w-full">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SubFieldHeader
                label={`Competitor ${i + 1}`}
                fieldId={item.id ? `competitors__${item.id}` : `competitors__${i}`}
                confirmedFields={confirmedFields}
                onConfirm={onConfirmField}
                onUnconfirm={onUnconfirmField}
              />
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={expanded[i] ? "Collapse details" : "Expand details"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: expanded[i] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {expanded[i] ? 'Less' : 'More'}
              </button>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="hover:text-foreground hover:bg-secondary p-1 rounded transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={`Remove Competitor ${i + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div>
            <div className={labelCls}>Competitor Name</div>
            <input
              className={inputCls + " w-full"}
              placeholder="Competitor Name"
              value={item.name || ''}
              onChange={e => updateItem(i, { name: e.target.value })}
            />
          </div>

          {/* Top Row: 3 Financial Metrics (Revenue, Funding, Valuation) */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className={labelCls}>Revenue ($M)</div>
              <input className={inputCls + " w-full"} type="number" placeholder="Revenue" value={item.revenue ?? ''} onChange={e => updateItem(i, { revenue: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="flex-1">
              <div className={labelCls}>Funding ($M)</div>
              <input className={inputCls + " w-full"} type="number" placeholder="Funding" value={item.funding_usd_mn ?? ''} onChange={e => updateItem(i, { funding_usd_mn: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="flex-1">
              <div className={labelCls}>Valuation ($M)</div>
              <input className={inputCls + " w-full"} type="number" placeholder="Valuation" value={item.latest_valuation_usd_mn ?? ''} onChange={e => updateItem(i, { latest_valuation_usd_mn: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          {/* Expanded details */}
          {expanded[i] && (
            <div className="flex flex-col gap-3 mt-1">
              {/* Status Edit */}
              <div>
                <div className={labelCls}>Status / Ownership</div>
                <input className={inputCls + " w-full"} placeholder="Status (e.g. Private, Public, Acquired)" value={item.status || ''} onChange={e => updateItem(i, { status: e.target.value })} />
              </div>

              {/* Investors */}
              <div>
                <div className={labelCls}>Investors</div>
                <TagsInput value={item.investors} onChange={v => updateItem(i, { investors: v })} placeholder="Add investor..." />
              </div>

              {/* Business Model */}
              <div>
                <div className={labelCls}>Business Model</div>
                <AutoTextarea value={item.business_model} onChange={v => updateItem(i, { business_model: v })} placeholder="Business model..." />
              </div>

              {/* Market Positioning */}
              <div>
                <div className={labelCls}>Market Positioning</div>
                <AutoTextarea value={item.market_positioning} onChange={v => updateItem(i, { market_positioning: v })} placeholder="Market positioning..." />
              </div>

              {/* Key Differentiators */}
              <div>
                <div className={labelCls}>Key Differentiators</div>
                <TagsInput value={item.key_differentiators} onChange={v => updateItem(i, { key_differentiators: v })} placeholder="Add differentiator..." />
              </div>

              {/* Strengths */}
              <div>
                <div className={labelCls}>Strengths</div>
                <TagsInput value={item.strengths} onChange={v => updateItem(i, { strengths: v })} placeholder="Add strength..." />
              </div>

              {/* Weaknesses */}
              <div>
                <div className={labelCls}>Weaknesses</div>
                <TagsInput value={item.weaknesses} onChange={v => updateItem(i, { weaknesses: v })} placeholder="Add weakness..." />
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={addItem} className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Add competitor
      </button>
    </div>
  );
}

/* ── Chevron icon (replaces HugeIcons UnfoldMoreIcon) ── */
const ChevronUpDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="7 15 12 20 17 15" /><polyline points="7 9 12 4 17 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Inline dropdown (replaces Radix Popover) ── */
function InlineDropdown({ open, onClose, items, value, onChange, align = 'start', width = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="cp-dropdown"
      style={{ width, [align === 'end' ? 'right' : 'left']: 0, top: '100%', marginTop: 6 }}
    >
      {items.map(item => {
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            className={`cp-dropdown-item ${selected ? 'cp-dropdown-item--selected' : ''}`}
            onClick={() => { onChange(item.value); onClose(); }}
          >
            {item.label}
            {selected && <CheckIcon />}
          </button>
        );
      })}
    </div>
  );
}

/* ── CurrencyPrefixSelect (exact from page.tsx line 231) ── */
function CurrencyPrefixSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'flex', flexShrink: 0, alignItems: 'stretch', position: 'relative' }}>
      <button type="button" className="cp-currency-prefix" onClick={() => setOpen(!open)}>
        {value} <ChevronUpDown />
      </button>
      <div className="cp-shell-divider" aria-hidden />
      <InlineDropdown
        open={open}
        onClose={() => setOpen(false)}
        items={CURRENCIES.map(c => ({ value: c, label: c }))}
        value={value}
        onChange={onChange}
        width={120}
      />
    </div>
  );
}

/* ── CurrencyScaleSelect (exact from page.tsx line 307) ── */
function CurrencyScaleSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = CURRENCY_SCALES.find(s => s.id === value) || CURRENCY_SCALES[0];
  return (
    <div style={{ display: 'flex', flexShrink: 0, alignItems: 'stretch', position: 'relative' }}>
      <div className="cp-shell-divider" aria-hidden />
      <button type="button" className="cp-scale-btn" onClick={() => setOpen(!open)}>
        <span style={{ maxWidth: '4.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? current.label : 'Scale'}
        </span>
        <ChevronUpDown />
      </button>
      <InlineDropdown
        open={open}
        onClose={() => setOpen(false)}
        items={CURRENCY_SCALES.map(s => ({ value: s.id, label: s.label }))}
        value={value}
        onChange={onChange}
        align="end"
        width={140}
      />
    </div>
  );
}

/* ── DocumentRow (ported from silkAnkit document-upload-field.tsx) ── */
function DocumentRow({ doc, onOpen, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);
  const busy = doc.status === 'uploading' || doc.status === 'processing';
  const failed = doc.status === 'error';
  const durationMs = doc.status === 'uploading' ? 1600 : 9000;

  // Hardcoded to match the mock MOCK_ANALYSIS_DATA (6 gaps) for analyzed docs
  let statusText = 'Ready';
  if (doc.status === 'uploading') statusText = 'Uploading';
  else if (doc.status === 'processing') statusText = 'Analysing';
  else if (doc.status === 'error') statusText = 'Failed';
  else statusText = '6 gaps';

  return (
    <div
      className="doc-row group/doc"
      onClick={() => {
        if (!busy && !failed && onOpen) onOpen();
      }}
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 8,
        background: 'var(--secondary, #f4f4f5)', transition: 'box-shadow 0.15s',
        cursor: (!busy && !failed && onOpen) ? 'pointer' : 'default',
        ...(failed ? { boxShadow: '0 0 0 1px rgba(225,29,72,0.3)' } : {}),
      }}
      onMouseEnter={e => {
        setIsHovered(true);
        if (!failed) e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        setIsHovered(false);
        if (!failed) e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', height: 42, alignItems: 'center', gap: 12, padding: '0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textAlign: 'left' }}>
          <FileTypeBadge name={doc.filename || doc.name || ''} size={22} />
          <span style={{ fontSize: 14, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.filename || doc.name || 'Document'}
          </span>
        </div>
        <span className="doc-row-status" style={{
          flexShrink: 0, fontSize: 12, fontVariantNumeric: 'tabular-nums',
          color: failed ? 'var(--destructive, #E11D48)' : 'var(--muted-foreground, #888)',
          transition: 'opacity 0.15s',
          opacity: isHovered && !busy && !failed ? 0 : 1,
          pointerEvents: isHovered && !busy && !failed ? 'none' : 'auto'
        }}>
          {statusText}
        </span>
        {!busy && onRemove && (
          <button
            type="button"
            aria-label="Delete document"
            className="doc-row-remove"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s, color 0.15s',
              pointerEvents: isHovered ? 'auto' : 'none',
              borderRadius: 6, padding: 6, border: 'none', background: 'transparent',
              color: 'var(--muted-foreground, #888)', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground, #888)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
          </button>
        )}
      </div>
      {busy && (
        <div style={{ position: 'absolute', inset: '0', top: 'auto', height: 1, background: 'var(--border, #e5e7eb)', overflow: 'hidden' }}>
          <div className="silk-doc-progress" style={{ height: '100%', width: '100%', background: 'var(--primary, #16a34a)', opacity: 0.4, animationDuration: `${durationMs}ms` }} />
        </div>
      )}
    </div>
  );
}

/* ── DocumentCenterEditor (silkAnkit style, 4 categories) ── */
function DocumentCenterEditor({ value, onChange, onAsk, onOpen, confirmedFields = [], onConfirmField, onUnconfirmField }) {
  const { companyId } = useParams();
  const { toast, error: toastError } = useToast();
  const docs = Array.isArray(value) ? value : [];
  const inputRefs = useRef({});
  const [draggingCat, setDraggingCat] = useState(null);

  const CATEGORIES = [
    { key: 'company_presentation', label: 'Company Presentation', placeholder: 'PDF, PPTX or DOCX' },
    { key: 'financial_model', label: 'Financial Model', placeholder: 'XLSX, CSV or PDF' },
    { key: 'annual_report', label: 'Annual Report / Financial Statements', placeholder: 'PDF, DOCX or XLSX' },
    { key: 'other', label: 'Other Documents', placeholder: 'PDF, DOCX, XLSX or CSV' },
  ];

  const handleUpload = async (catKey, files) => {
    if (!files || !files.length) return;
    const fileList = Array.from(files);
    // Immediately add placeholders with 'uploading' status
    const placeholders = fileList.map(file => ({
      id: crypto.randomUUID(),
      filename: file.name,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      category: catKey,
      status: 'uploading',
    }));
    const withPlaceholders = [...docs, ...placeholders];
    onChange(withPlaceholders);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const placeholder = placeholders[i];
      try {
        // Simulate upload time then call API
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', catKey);
        const res = await profileApi.uploadDocument(companyId, fd);
        // Replace placeholder with real response
        onChange(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map(d => d.id === placeholder.id ? { ...placeholder, ...res, status: 'analyzed', category: catKey } : d);
        });
      } catch (e) {
        // Mark as error
        onChange(prev => {
          const arr = Array.isArray(prev) ? prev : [];
          return arr.map(d => d.id === placeholder.id ? { ...d, status: 'error' } : d);
        });
        toastError(e);
      }
    }
    toast(fileList.length === 1 ? `${fileList[0].name} uploaded.` : `${fileList.length} documents uploaded.`);
  };

  const removeDoc = (docId) => {
    onChange(docs.filter(d => d.id !== docId));
  };

  return (
    <div className="flex flex-col gap-8 w-full py-2">
      {CATEGORIES.map(cat => {
        const catDocs = docs.filter(d => d.category === cat.key || d.category === cat.label || String(d.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_') === cat.key);
        const busy = catDocs.some(d => d.status === 'uploading' || d.status === 'processing');
        const hasDocs = catDocs.length > 0;
        const isDragging = draggingCat === cat.key;
        const primaryDoc = catDocs[0];
        const subfieldId = primaryDoc?.id ? `document_center__${primaryDoc.id}` : `document_center__${cat.key}`;

        return (
          <div key={cat.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1">
                <SubFieldHeader
                  label={cat.label}
                  fieldId={subfieldId}
                  confirmedFields={confirmedFields}
                  onConfirm={onConfirmField}
                  onUnconfirm={onUnconfirmField}
                />
              </div>
            </div>

            <div
              className="flex flex-col gap-2"
              onDragEnter={e => { e.preventDefault(); setDraggingCat(cat.key); }}
              onDragOver={e => { e.preventDefault(); setDraggingCat(cat.key); }}
              onDragLeave={e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setDraggingCat(null); }}
              onDrop={e => { e.preventDefault(); setDraggingCat(null); if (!busy) handleUpload(cat.key, e.dataTransfer.files); }}
            >
              {catDocs.map(d => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  onOpen={() => {
                    window.dispatchEvent(new CustomEvent('open-silk-panel', {
                      detail: {
                        fieldId: d.id ? `document_center__${d.id}` : `document_center__${cat.key}`,
                        mode: 'analysis',
                        docName: d.filename || d.name || cat.label
                      }
                    }));
                  }}
                  onRemove={() => removeDoc(d.id)}
                />
              ))}

              <input
                ref={el => inputRefs.current[cat.key] = el}
                type="file"
                multiple
                className="sr-only"
                style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
                onChange={e => { handleUpload(cat.key, e.target.files); e.target.value = ''; }}
              />

              {hasDocs ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRefs.current[cat.key]?.click()}
                  style={{
                    alignSelf: 'flex-start', paddingTop: 2,
                    fontSize: 12.5, color: 'var(--muted-foreground, #888)',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    transition: 'color 0.15s', opacity: busy ? 0.4 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground, #888)'}
                >
                  Add another
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRefs.current[cat.key]?.click()}
                  style={{
                    width: '100%', borderRadius: 8,
                    background: 'var(--secondary, #f4f4f5)',
                    padding: '28px 16px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    textAlign: 'center', border: 'none', cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                    boxShadow: isDragging ? '0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                    opacity: busy ? 0.6 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = isDragging ? '0 0 0 1px rgba(0,0,0,0.08)' : 'none'}
                >
                  <HugeiconsIcon icon={CloudUploadIcon} size={17} style={{ color: 'var(--muted-foreground, #888)' }} strokeWidth={1.8} />
                  <span style={{ fontSize: 13, color: 'rgba(var(--foreground-rgb, 0,0,0), 0.55)', marginTop: 2 }}>Drop file or browse</span>
                  <span style={{ fontSize: 11.5, color: 'var(--muted-foreground, #888)' }}>{cat.placeholder}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const comboTriggerCls = "rounded-lg border-0 bg-secondary shadow-none focus:border-0 focus:ring-1 focus:ring-foreground/5 data-[state=open]:border-0 data-[state=open]:ring-1 data-[state=open]:ring-foreground/5";

/* ── Main FieldControl (exact from page.tsx line 384–541) ── */
export default function FieldControl({ kind, value, onChange, placeholder, options, scaled, fieldId, confirmedFields = [], onConfirmField, onUnconfirmField, onAsk, onOpenAnalysis }) {
  const k = kind || 'textarea';

  if (k === 'founders_array') {
    return <FoundersEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'products_array') {
    return <ProductsEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'markets_array') {
    return <MarketsEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'advantages_array') {
    return <AdvantagesEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'competitors_array') {
    return <CompetitorsEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'industry_research_obj') {
    return <IndustryResearchEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'business_model_obj') {
    return <BusinessModelEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'funding_history_array') {
    return <FundingHistoryEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'investors_cap_table_obj') {
    return <InvestorsCapTableEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'news_array') {
    return <NewsEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'company_story_obj') {
    return <CompanyStoryEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'investment_thesis_obj') {
    return <InvestmentThesisEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'document_center_obj') {
    return <DocumentCenterEditor value={value} onChange={onChange} onAsk={onAsk} onOpen={onOpenAnalysis} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'revenue_model_array') {
    return <RevenueModelEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'company_metrics_array') {
    return <MetricsEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'financial_summary_obj') {
    return <FinancialSummaryEditor value={value} onChange={onChange} confirmedFields={confirmedFields} onConfirmField={onConfirmField} onUnconfirmField={onUnconfirmField} />;
  }

  if (k === 'country') {
    return (
      <OptionsCombobox
        fieldId={fieldId}
        value={value}
        onChange={onChange}
        options={options?.length ? options : COUNTRIES}
        placeholder={placeholder || 'Select country'}
        searchPlaceholder="Search countries..."
        triggerClassName={comboTriggerCls}
      />
    );
  }

  if (k === 'select') {
    return (
      <OptionsCombobox
        fieldId={fieldId}
        value={value}
        onChange={onChange}
        options={options || []}
        placeholder={placeholder || 'Select…'}
        triggerClassName={comboTriggerCls}
      />
    );
  }

  if (k === 'currency') {
    const { currency, amount, scale } = parseCurrencyValue(value);
    const activeScale = scaled ? (scale || 'M') : scale;
    return (
      <div className="cp-shell-input">
        <CurrencyPrefixSelect
          value={currency}
          onChange={next => onChange(formatCurrencyValue(next, amount, scaled ? activeScale : ''))}
        />
        <input
          id={fieldId}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={e =>
            onChange(
              formatCurrencyValue(
                currency,
                sanitizeNumeric(e.target.value, { decimal: true, negative: !scaled }),
                scaled ? activeScale : '',
              ),
            )
          }
          onBlur={e => {
            const val = e.target.value;
            if (val && !isNaN(Number(val))) {
              onChange(
                formatCurrencyValue(
                  currency,
                  Number(val).toFixed(2),
                  scaled ? activeScale : '',
                ),
              );
            }
          }}
          placeholder={placeholder || '0.00'}
          className="cp-input-inner"
        />
        {scaled && (
          <CurrencyScaleSelect
            value={activeScale}
            onChange={next => onChange(formatCurrencyValue(currency, amount, next))}
          />
        )}
      </div>
    );
  }

  if (k === 'percent') {
    return (
      <div className="cp-shell-input">
        <input
          id={fieldId}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => {
            const next = sanitizeNumeric(e.target.value, { decimal: true });
            if (next && Number(next) > 100) { onChange('100.0'); return; }
            onChange(next);
          }}
          onBlur={e => {
            const val = e.target.value;
            if (val && !isNaN(Number(val))) {
              onChange(Number(val).toFixed(1));
            }
          }}
          placeholder={placeholder || '0.0'}
          className="cp-input-inner"
        />
        <span className="cp-shell-suffix">%</span>
      </div>
    );
  }

  if (k === 'number') {
    return (
      <input
        id={fieldId}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(sanitizeNumeric(e.target.value, { decimal: false }))}
        placeholder={placeholder || '0'}
        className="cp-input num"
      />
    );
  }

  if (k === 'date') {
    return (
      <DatePicker
        id={fieldId}
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Pick a date'}
        className={comboTriggerCls}
      />
    );
  }

  if (k === 'tags') {
    return <TagsEditor value={value} onChange={onChange} placeholder={placeholder || 'Add type…'} />;
  }

  if (k === 'bullet_list') {
    return <BulletListEditor value={value} onChange={onChange} placeholder={placeholder || 'Add item…'} />;
  }

  if (k === 'text') {
    return (
      <input
        id={fieldId}
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="cp-input"
      />
    );
  }

  // Default: textarea
  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    onChange(e.target.value);
  };

  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      id={fieldId}
      rows={1}
      value={value}
      onChange={handleInput}
      placeholder={placeholder}
      className="cp-textarea"
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}
