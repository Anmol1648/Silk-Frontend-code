/** Platform document model for Stage 1 – Investor Readiness (BRD §6.3–6.4). */

export type DocumentStatus = 'uploading' | 'processing' | 'analyzed' | 'error'

export type ExtractionMethod = 'plain' | 'pdf-streams' | 'fallback' | 'none'

export type AnalysisFinding = {
  id: string
  label: string
  detail?: string
}

export type ExtractedMetric = {
  label: string
  value: string
}

/** Proposal to populate / conflict-check a Company Knowledge Base field. */
export type KnowledgeLink = {
  fieldId: string
  label: string
  value: string
  excerpt: string
}

export type DocumentAnalysis = {
  classifiedType: string
  summary: string
  extractionMethod: ExtractionMethod
  extractedMetrics: ExtractedMetric[]
  found: AnalysisFinding[]
  missing: AnalysisFinding[]
  inconsistencies: AnalysisFinding[]
  recommendations: AnalysisFinding[]
  /** Structured extracts ready to link into readiness fields. */
  knowledgeLinks: KnowledgeLink[]
  processedAt: string
}

export type UploadedDocument = {
  id: string
  fieldId: string
  fieldName: string
  name: string
  mimeType: string
  size: number
  version: number
  uploadedAt: string
  status: DocumentStatus
  /** Object URL for in-session preview; not persisted. */
  previewUrl?: string
  analysis?: DocumentAnalysis
  error?: string
}

export type DocumentExpectation = {
  id: string
  label: string
  /** Patterns matched against extracted text (case-insensitive). */
  patterns: RegExp[]
  detail?: string
}

export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.webm,.zip'

export const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024
