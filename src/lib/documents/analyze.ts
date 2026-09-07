import { classifiedTypeForField, expectationsForField } from './expectations'
import { extractTextFromFile, isReadableText } from './extract'
import type {
  AnalysisFinding,
  DocumentAnalysis,
  ExtractedMetric,
  ExtractionMethod,
  KnowledgeLink,
} from './types'

function extOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Map expectation section → readiness field id. */
const SECTION_FIELD: Record<string, { fieldId: string; label: string }> = {
  overview: { fieldId: 'company-description', label: 'Company description' },
  problem: { fieldId: 'problem', label: 'Problem statement' },
  solution: { fieldId: 'solution', label: 'Solution' },
  market: { fieldId: 'market-landscape', label: 'Market landscape' },
  traction: { fieldId: 'major-customers', label: 'Major customers' },
  ask: { fieldId: 'round-details', label: 'Round details' },
  'business-model': { fieldId: 'business-model', label: 'Business model' },
  financials: { fieldId: 'revenue', label: 'Revenue' },
  'use-of-proceeds': { fieldId: 'use-of-funds', label: 'Use of funds' },
  strategy: { fieldId: 'gtm-strategy', label: 'GTM strategy' },
  product: { fieldId: 'products', label: 'Products' },
  audience: { fieldId: 'customer-segments', label: 'Customer segments' },
  value: { fieldId: 'positioning', label: 'Positioning' },
  customer: { fieldId: 'major-customers', label: 'Major customers' },
  challenge: { fieldId: 'problem', label: 'Problem statement' },
  outcome: { fieldId: 'social-proof', label: 'Social proof' },
  structure: { fieldId: 'org-structure', label: 'Organisation structure' },
  holders: { fieldId: 'existing-investors', label: 'Existing investors' },
  pool: { fieldId: 'esop', label: 'ESOP pool' },
}

const METRIC_FIELD: Record<string, { fieldId: string; label: string; kind: 'currency' | 'percent' | 'months' | 'text' }> = {
  arr: { fieldId: 'arr', label: 'ARR', kind: 'currency' },
  mrr: { fieldId: 'mrr', label: 'MRR', kind: 'currency' },
  revenue: { fieldId: 'revenue', label: 'Revenue', kind: 'currency' },
  ebitda: { fieldId: 'ebitda', label: 'EBITDA', kind: 'currency' },
  burn: { fieldId: 'burn', label: 'Burn', kind: 'currency' },
  runway: { fieldId: 'runway', label: 'Runway', kind: 'months' },
  gmv: { fieldId: 'revenue', label: 'Revenue', kind: 'currency' },
  'gross margin': { fieldId: 'gross-margin', label: 'Gross margin', kind: 'percent' },
  churn: { fieldId: 'churn', label: 'Churn', kind: 'percent' },
  cac: { fieldId: 'cac', label: 'CAC', kind: 'currency' },
  ltv: { fieldId: 'ltv', label: 'LTV', kind: 'currency' },
}

function scaleChar(raw?: string): '' | 'K' | 'M' | 'B' | 'T' {
  const c = (raw ?? '').toUpperCase()
  if (c === 'K' || c === 'M' || c === 'B' || c === 'T') return c
  return ''
}

function toCurrencyValue(amount: string, scaleRaw?: string): string {
  const clean = amount.replace(/,/g, '')
  const scale = scaleChar(scaleRaw)
  return scale ? `USD|${clean}|${scale}` : `USD|${clean}`
}

function snippetNear(text: string, pattern: RegExp, maxLen = 220): string | null {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
  const m = re.exec(text)
  if (!m || m.index == null) return null
  const start = Math.max(0, text.lastIndexOf('.', Math.max(0, m.index - 20)) + 1)
  let end = m.index + m[0].length + 160
  const nextStop = text.indexOf('.', m.index + m[0].length)
  if (nextStop > m.index && nextStop < end + 80) end = nextStop + 1
  const slice = text.slice(start, Math.min(text.length, end)).replace(/\s+/g, ' ').trim()
  if (!isReadableText(slice, 24)) return null
  return slice.length > maxLen ? `${slice.slice(0, maxLen - 1).trim()}…` : slice
}

function extractMetrics(text: string): ExtractedMetric[] {
  if (!text) return []
  const metrics: ExtractedMetric[] = []
  const seen = new Set<string>()

  const push = (label: string, value: string) => {
    const key = `${label}:${value}`
    if (seen.has(key)) return
    seen.add(key)
    metrics.push({ label, value })
  }

  const money =
    /\b(ARR|MRR|Revenue|EBITDA|Burn|Runway|GMV|CAC|LTV)\b\s*[:\-]?\s*\$?\s*([\d,.]+)\s*([KkMmBbTt])?/gi
  let m: RegExpExecArray | null
  while ((m = money.exec(text))) {
    const label = m[1]
    const scale = m[3] ? m[3].toUpperCase() : ''
    push(label, `$${m[2]}${scale}`)
    if (metrics.length >= 10) break
  }

  const pct = /\b(gross\s+margin|churn)\s*[:\-]?\s*([\d.]+)\s*%/gi
  while ((m = pct.exec(text))) {
    push(m[1].replace(/\b\w/g, c => c.toUpperCase()), `${m[2]}%`)
    if (metrics.length >= 12) break
  }

  return metrics
}

function knowledgeLinksFromText(
  text: string,
  foundSectionIds: string[],
  expectations: { id: string; patterns: RegExp[] }[],
): KnowledgeLink[] {
  const links: KnowledgeLink[] = []
  const seenFields = new Set<string>()

  const push = (link: KnowledgeLink) => {
    if (!link.value.trim() || seenFields.has(link.fieldId)) return
    seenFields.add(link.fieldId)
    links.push(link)
  }

  // Metric-backed fields
  const money =
    /\b(ARR|MRR|Revenue|EBITDA|Burn|Runway|GMV|CAC|LTV)\b\s*[:\-]?\s*\$?\s*([\d,.]+)\s*([KkMmBbTt])?/gi
  let m: RegExpExecArray | null
  while ((m = money.exec(text))) {
    const key = m[1].toLowerCase()
    const meta = METRIC_FIELD[key]
    if (!meta) continue
    const amount = m[2].replace(/,/g, '')
    const scale = m[3]
    let value = amount
    if (meta.kind === 'currency') value = toCurrencyValue(amount, scale)
    else if (meta.kind === 'months') value = amount
    push({
      fieldId: meta.fieldId,
      label: meta.label,
      value,
      excerpt: m[0].trim(),
    })
  }

  const pct = /\b(gross\s+margin|churn)\s*[:\-]?\s*([\d.]+)\s*%/gi
  while ((m = pct.exec(text))) {
    const key = m[1].toLowerCase()
    const meta = METRIC_FIELD[key]
    if (!meta) continue
    push({
      fieldId: meta.fieldId,
      label: meta.label,
      value: m[2],
      excerpt: m[0].trim(),
    })
  }

  const esop = /\b(?:ESOP|option\s+pool)\b[^%]{0,40}?([\d.]+)\s*%/i.exec(text)
  if (esop) {
    push({
      fieldId: 'esop',
      label: 'ESOP pool',
      value: esop[1],
      excerpt: esop[0].trim(),
    })
  }

  // Narrative sections that matched expectations
  for (const sectionId of foundSectionIds) {
    const target = SECTION_FIELD[sectionId]
    if (!target) continue
    const exp = expectations.find(e => e.id === sectionId)
    if (!exp) continue
    let snippet: string | null = null
    for (const p of exp.patterns) {
      snippet = snippetNear(text, p)
      if (snippet) break
    }
    // Link the section even when the surrounding extract isn't human-readable
    push({
      fieldId: target.fieldId,
      label: target.label,
      value: snippet ?? `${target.label} detected in uploaded document.`,
      excerpt: snippet ?? 'Detected in uploaded document.',
    })
  }

  return links
}

function buildSummary(args: {
  fileName: string
  classifiedType: string
  method: ExtractionMethod
  found: AnalysisFinding[]
  missing: AnalysisFinding[]
  size: number
  linkCount: number
}): string {
  const { fileName, classifiedType, method, found, missing, size, linkCount } = args
  if (method === 'none') {
    return `${fileName} (${formatBytes(size)}) was classified as ${classifiedType}. Text could not be extracted from this file format, so section coverage is unverified until a searchable export is provided or contents are reviewed manually.`
  }
  const foundLabels = found.slice(0, 4).map(f => f.label.toLowerCase())
  const missingLabels = missing.slice(0, 3).map(f => f.label.toLowerCase())
  const foundPart = foundLabels.length
    ? `Detected coverage for ${foundLabels.join(', ')}.`
    : 'Little expected section coverage was detected in the extracted text.'
  const missingPart = missingLabels.length
    ? ` Still missing or weak: ${missingLabels.join(', ')}.`
    : ' Expected sections look present.'
  const linkPart = linkCount
    ? ` ${linkCount} signal${linkCount === 1 ? '' : 's'} ready to link into the Company Knowledge Base.`
    : ''
  return `${fileName} analysed as ${classifiedType}. ${foundPart}${missingPart}${linkPart}`
}

function filenameHintsMismatch(fileName: string, fieldId: string): string | null {
  const n = fileName.toLowerCase()
  const hintPairs: [RegExp, string[]][] = [
    [/deck|pitch|presentation/, ['doc-deck']],
    [/teaser|one[-_\s]?pager|1[-_\s]?pager/, ['doc-teaser', 'doc-one-pager']],
    [/im\b|memorandum/, ['doc-im']],
    [/model|projection|forecast/, ['doc-model']],
    [/cap[-_\s]?table|captable/, ['doc-cap-table']],
    [/esop|option\s*plan/, ['doc-esop-plan']],
    [/term[-_\s]?sheet/, ['doc-term-sheets']],
    [/sha\b|shareholders?/, ['doc-sha']],
  ]
  for (const [re, ids] of hintPairs) {
    if (re.test(n) && !ids.includes(fieldId)) {
      return `Filename suggests a different document type than this readiness slot.`
    }
  }
  return null
}

export async function analyseDocument(args: {
  file: File
  fieldId: string
  fieldName: string
}): Promise<DocumentAnalysis> {
  const { file, fieldId, fieldName } = args
  const classifiedType = classifiedTypeForField(fieldId, fieldName)
  const expectations = expectationsForField(fieldId)
  const { text, method } = await extractTextFromFile(file)
  const haystack = text.toLowerCase()

  const found: AnalysisFinding[] = []
  const missing: AnalysisFinding[] = []

  for (const exp of expectations) {
    const hit =
      method !== 'none' && exp.patterns.some(p => p.test(haystack) || p.test(text))
    if (hit) {
      found.push({ id: exp.id, label: exp.label, detail: exp.detail })
    } else if (method === 'none') {
      missing.push({
        id: exp.id,
        label: exp.label,
        detail: 'Could not verify from file contents — extraction unavailable for this format.',
      })
    } else {
      missing.push({
        id: exp.id,
        label: exp.label,
        detail: exp.detail ?? 'Not clearly present in extracted text.',
      })
    }
  }

  const inconsistencies: AnalysisFinding[] = []
  const ext = extOf(file.name)
  const imageLike = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
  const videoLike = ['mp4', 'mov', 'webm'].includes(ext)
  const spreadsheetFields = new Set(['doc-model', 'doc-budget', 'doc-cap-table', 'doc-mgmt-accounts'])
  const deckFields = new Set(['doc-deck', 'doc-teaser', 'doc-one-pager', 'doc-im', 'doc-business-plan'])

  if (spreadsheetFields.has(fieldId) && !['xlsx', 'xls', 'csv', 'pdf'].includes(ext)) {
    inconsistencies.push({
      id: 'format-slot',
      label: 'Unexpected file format for this slot',
      detail: `Investors usually expect a spreadsheet or PDF here; received .${ext || 'unknown'}.`,
    })
  }
  if (deckFields.has(fieldId) && (imageLike || videoLike || ext === 'zip')) {
    inconsistencies.push({
      id: 'format-investors',
      label: 'Format may hinder investor review',
      detail: 'Narrative investment materials are typically shared as PDF or Office documents.',
    })
  }
  if (method === 'none' && ext === 'pdf') {
    inconsistencies.push({
      id: 'scanned-pdf',
      label: 'Limited text extraction',
      detail: 'This PDF may be scanned or encoded in a way that blocks text analysis. Prefer a searchable PDF.',
    })
  }
  const nameMismatch = filenameHintsMismatch(file.name, fieldId)
  if (nameMismatch) {
    inconsistencies.push({
      id: 'filename-mismatch',
      label: 'Filename may not match category',
      detail: nameMismatch,
    })
  }

  const knowledgeLinks =
    method === 'none' ? [] : knowledgeLinksFromText(text, found.map(f => f.id), expectations)

  const recommendations: AnalysisFinding[] = []
  if (missing.length) {
    recommendations.push({
      id: 'fill-gaps',
      label: 'Strengthen missing sections before sharing with investors',
      detail: `Address: ${missing
        .slice(0, 4)
        .map(m => m.label)
        .join(', ')}.`,
    })
  }
  if (method === 'none') {
    recommendations.push({
      id: 'searchable-export',
      label: 'Upload a searchable / text-based export',
      detail: 'Searchable PDFs or CSV/XLSX exports enable extraction, metrics, and knowledge-base linking.',
    })
  }
  if (knowledgeLinks.length) {
    recommendations.push({
      id: 'review-links',
      label: 'Review linked knowledge-base fields',
      detail: `${knowledgeLinks.length} field${knowledgeLinks.length === 1 ? '' : 's'} were updated or flagged from this document. Confirm drafts; resolve conflicts without overwriting founder-approved values.`,
    })
  }
  if (inconsistencies.some(i => i.id === 'filename-mismatch')) {
    recommendations.push({
      id: 'confirm-category',
      label: 'Confirm this file belongs in this category',
      detail: 'Misfiled materials can pollute readiness scoring and downstream Stage 2 inputs.',
    })
  }
  if (!recommendations.length) {
    recommendations.push({
      id: 'link-kb',
      label: 'Confirm extracted signals into the Company Knowledge Base',
      detail: 'Review metrics and coverage, then confirm related readiness fields so AI drafts stay founded on this material.',
    })
  }

  return {
    classifiedType,
    summary: buildSummary({
      fileName: file.name,
      classifiedType,
      method,
      found,
      missing,
      size: file.size,
      linkCount: knowledgeLinks.length,
    }),
    extractionMethod: method,
    extractedMetrics: extractMetrics(text),
    found,
    missing,
    inconsistencies,
    recommendations,
    knowledgeLinks,
    processedAt: new Date().toISOString(),
  }
}
