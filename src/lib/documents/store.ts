import type { DocumentAnalysis, DocumentStatus, UploadedDocument } from './types'

const KEY = 'silk_documents'

type StoredDocument = Omit<UploadedDocument, 'previewUrl'>

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function readDocuments(): Record<string, UploadedDocument[]> {
  if (!canUseStorage()) return {}
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, StoredDocument[]>
    const out: Record<string, UploadedDocument[]> = {}
    for (const [fieldId, list] of Object.entries(parsed)) {
      if (!Array.isArray(list)) continue
      out[fieldId] = list.map(d => ({ ...d }))
    }
    return out
  } catch {
    return {}
  }
}

export function writeDocuments(byField: Record<string, UploadedDocument[]>) {
  if (!canUseStorage()) return
  const serialisable: Record<string, StoredDocument[]> = {}
  for (const [fieldId, list] of Object.entries(byField)) {
    serialisable[fieldId] = list.map(doc => {
      const { previewUrl, ...rest } = doc
      void previewUrl
      return rest
    })
  }
  sessionStorage.setItem(KEY, JSON.stringify(serialisable))
}

export function documentsForField(
  byField: Record<string, UploadedDocument[]>,
  fieldId: string,
): UploadedDocument[] {
  return byField[fieldId] ?? []
}

export function fieldHasAnalyzedDocument(
  byField: Record<string, UploadedDocument[]>,
  fieldId: string,
): boolean {
  return documentsForField(byField, fieldId).some(d => d.status === 'analyzed')
}

export function patchDocument(
  byField: Record<string, UploadedDocument[]>,
  fieldId: string,
  docId: string,
  patch: Partial<UploadedDocument>,
): Record<string, UploadedDocument[]> {
  const list = documentsForField(byField, fieldId)
  return {
    ...byField,
    [fieldId]: list.map(d => (d.id === docId ? { ...d, ...patch } : d)),
  }
}

export function upsertDocument(
  byField: Record<string, UploadedDocument[]>,
  fieldId: string,
  doc: UploadedDocument,
): Record<string, UploadedDocument[]> {
  const list = documentsForField(byField, fieldId)
  const idx = list.findIndex(d => d.id === doc.id)
  const next = [...list]
  if (idx >= 0) next[idx] = doc
  else next.push(doc)
  return { ...byField, [fieldId]: next }
}

export function removeDocument(
  byField: Record<string, UploadedDocument[]>,
  fieldId: string,
  docId: string,
): Record<string, UploadedDocument[]> {
  const list = documentsForField(byField, fieldId).filter(d => d.id !== docId)
  const next = { ...byField }
  if (list.length) next[fieldId] = list
  else delete next[fieldId]
  return next
}

export function nextVersion(
  byField: Record<string, UploadedDocument[]>,
  fieldId: string,
): number {
  const list = documentsForField(byField, fieldId)
  return list.reduce((max, d) => Math.max(max, d.version), 0) + 1
}

export function createUploadingDocument(args: {
  fieldId: string
  fieldName: string
  file: File
  version: number
  previewUrl?: string
}): UploadedDocument {
  return {
    id: crypto.randomUUID(),
    fieldId: args.fieldId,
    fieldName: args.fieldName,
    name: args.file.name,
    mimeType: args.file.type || 'application/octet-stream',
    size: args.file.size,
    version: args.version,
    uploadedAt: new Date().toISOString(),
    status: 'uploading',
    previewUrl: args.previewUrl,
  }
}

export function setDocStatus(
  doc: UploadedDocument,
  status: DocumentStatus,
  extras: { analysis?: DocumentAnalysis; error?: string } = {},
): UploadedDocument {
  return { ...doc, status, ...extras }
}
