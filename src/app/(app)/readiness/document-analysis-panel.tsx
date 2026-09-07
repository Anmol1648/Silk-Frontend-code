'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  BulbIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import type { AnalysisFinding, UploadedDocument } from '@/lib/documents'

function FindingList({
  title,
  items,
  empty,
  tone,
}: {
  title: string
  items: AnalysisFinding[]
  empty: string
  tone: 'neutral' | 'warn' | 'good' | 'accent'
}) {
  const icon =
    tone === 'warn'
      ? Alert02Icon
      : tone === 'accent'
        ? BulbIcon
        : CheckmarkCircle02Icon
  const iconClass =
    tone === 'warn'
      ? 'text-amber-600'
      : tone === 'good' || tone === 'accent'
        ? 'text-primary'
        : 'text-foreground-subtle'

  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-foreground-subtle">
          {title}
        </h4>
        <span className="text-[11px] tabular-nums text-foreground-subtle">{items.length}</span>
      </div>
      <ul className="mt-2 divide-y divide-border rounded-xl bg-secondary/80 ring-1 ring-border">
        {items.length === 0 ? (
          <li className="px-3.5 py-3 text-[13px] text-foreground-subtle leading-snug">{empty}</li>
        ) : (
          items.map(item => (
            <li key={item.id} className="flex items-start gap-2.5 px-3.5 py-3">
              <HugeiconsIcon
                icon={icon}
                size={14}
                strokeWidth={2}
                className={cn('mt-0.5 shrink-0', iconClass)}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-popover-foreground leading-snug">{item.label}</span>
                {item.detail && (
                  <span className="mt-0.5 block text-[12px] text-foreground-subtle leading-snug">
                    {item.detail}
                  </span>
                )}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

function isDisplayableExcerpt(text: string): boolean {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 8) return false
  let letters = 0
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned.charCodeAt(i)
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) letters++
  }
  return letters / cleaned.length >= 0.45 && !/[\u0080-\u00FF]{3,}/.test(cleaned)
}

/** Analysis body rendered inside the Ask Silk side panel. */
export function DocumentAnalysisContent({
  document,
  prompts = [],
  onPrompt,
}: {
  document: UploadedDocument
  prompts?: string[]
  onPrompt?: (prompt: string) => void
}) {
  const analysis = document.analysis

  if (!analysis) {
    return (
      <div className="px-1 py-6">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {document.status === 'error'
            ? document.error ?? 'Analysis failed.'
            : document.status === 'processing' || document.status === 'uploading'
              ? 'Silk is extracting and classifying this document…'
              : 'No analysis yet for this document.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="rounded-xl bg-secondary/80 ring-1 ring-border px-3.5 py-3">
        <div className="text-[12px] font-medium text-foreground">{analysis.classifiedType}</div>
        <p className="mt-1.5 text-[13px] text-foreground/55 leading-relaxed">{analysis.summary}</p>
      </div>

      {analysis.extractedMetrics.length > 0 && (
        <section>
          <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-foreground-subtle">
            Extracted metrics
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {analysis.extractedMetrics.map(m => (
              <div
                key={`${m.label}-${m.value}`}
                className="rounded-lg border border-border bg-secondary/80 px-2.5 py-2"
              >
                <div className="text-[11px] text-foreground-subtle truncate">{m.label}</div>
                <div className="mt-0.5 text-[13px] font-medium tabular-nums text-foreground">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {analysis.knowledgeLinks.length > 0 && (
        <section>
          <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-foreground-subtle">
            Knowledge base links
          </h4>
          <ul className="mt-2 divide-y divide-border rounded-xl bg-secondary/80 ring-1 ring-border">
            {analysis.knowledgeLinks.map(link => {
              const excerpt = isDisplayableExcerpt(link.excerpt)
                ? link.excerpt
                : 'Detected in uploaded document.'
              return (
                <li key={link.fieldId} className="px-3.5 py-3">
                  <div className="text-[13px] text-popover-foreground leading-snug">{link.label}</div>
                  <div className="mt-0.5 text-[12px] text-foreground-subtle leading-snug line-clamp-2">
                    {excerpt}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <FindingList
        title="Covered"
        items={analysis.found}
        empty="No expected sections detected yet."
        tone="good"
      />
      <FindingList
        title="Missing information"
        items={analysis.missing}
        empty="No gaps detected for this document type."
        tone="warn"
      />
      <FindingList
        title="Inconsistencies"
        items={analysis.inconsistencies}
        empty="No inconsistencies flagged."
        tone="warn"
      />
      <FindingList
        title="Recommendations"
        items={analysis.recommendations}
        empty="No recommendations right now."
        tone="accent"
      />

      {prompts.length > 0 && (
        <section>
          <h4 className="text-[11px] font-medium tracking-[0.04em] uppercase text-foreground-subtle">
            Suggestions
          </h4>
          <div className="mt-2 divide-y divide-border rounded-xl bg-secondary/80 ring-1 ring-border">
            {prompts.map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPrompt?.(prompt)}
                className={cn(
                  'group/chip flex w-full items-center gap-3 px-3.5 py-3 text-left',
                  'first:rounded-t-xl last:rounded-b-xl',
                  'transition-colors hover:bg-background',
                )}
              >
                <span className="min-w-0 flex-1 text-[13px] text-secondary-foreground leading-snug group-hover/chip:text-foreground">
                  {prompt}
                </span>
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={14}
                  strokeWidth={2}
                  className="shrink-0 text-foreground/20 transition-colors group-hover/chip:text-primary"
                />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
