import type { KnowledgeLink, UploadedDocument } from './types'

export type DocumentFieldSource = {
  id: string
  title: string
  url: string
  excerpt?: string
  kind: 'document'
}

export type FieldConflict = {
  fieldId: string
  documentId: string
  documentName: string
  documentValue: string
  existingValue: string
  excerpt: string
}

function normalizeComparable(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase()
}

function valuesConflict(existing: string, next: string): boolean {
  const a = normalizeComparable(existing)
  const b = normalizeComparable(next)
  if (!a || !b) return false
  if (a === b) return false
  if (a.includes('|') || b.includes('|')) {
    const amountA = a.split('|')[1] ?? a
    const amountB = b.split('|')[1] ?? b
    return amountA !== amountB
  }
  if (a.includes(b) || b.includes(a)) return false
  return true
}

export function documentFieldSource(doc: UploadedDocument, excerpt?: string): DocumentFieldSource {
  return {
    id: `doc-${doc.id}`,
    title: doc.name,
    url: doc.previewUrl || `#document-${doc.id}`,
    excerpt: excerpt ?? doc.analysis?.summary,
    kind: 'document',
  }
}

/**
 * Link document extracts into the Knowledge Base without overwriting
 * founder-approved or conflicting public drafts (BRD §7).
 */
export function applyKnowledgeLinks(args: {
  links: KnowledgeLink[]
  document: UploadedDocument
  values: Record<string, string>
  confirmed: Record<string, boolean>
  sources: Record<string, DocumentFieldSource[]>
  conflicts: Record<string, FieldConflict>
}): {
  values: Record<string, string>
  confirmed: Record<string, boolean>
  sources: Record<string, DocumentFieldSource[]>
  conflicts: Record<string, FieldConflict>
  populated: string[]
  conflicted: string[]
} {
  const values = { ...args.values }
  const confirmed = { ...args.confirmed }
  const sources = { ...args.sources }
  const conflicts = { ...args.conflicts }
  const populated: string[] = []
  const conflicted: string[] = []

  for (const link of args.links) {
    const existing = values[link.fieldId] ?? ''
    const source = documentFieldSource(args.document, link.excerpt)
    const prevSources = sources[link.fieldId] ?? []
    sources[link.fieldId] = [
      ...prevSources.filter(s => s.id !== source.id),
      source,
    ]

    if (!existing.trim()) {
      values[link.fieldId] = link.value
      delete confirmed[link.fieldId]
      populated.push(link.fieldId)
      delete conflicts[link.fieldId]
      continue
    }

    if (valuesConflict(existing, link.value)) {
      conflicts[link.fieldId] = {
        fieldId: link.fieldId,
        documentId: args.document.id,
        documentName: args.document.name,
        documentValue: link.value,
        existingValue: existing,
        excerpt: link.excerpt,
      }
      conflicted.push(link.fieldId)
      continue
    }

    delete conflicts[link.fieldId]
  }

  return { values, confirmed, sources, conflicts, populated, conflicted }
}
