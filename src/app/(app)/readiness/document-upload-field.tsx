'use client'

import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CloudUploadIcon, Delete02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { FileTypeBadge } from '@/components/file-type-badge'
import {
  analyseDocument,
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_BYTES,
  type UploadedDocument,
} from '@/lib/documents'

const UPLOAD_MS = 1600
const ANALYSE_MS = 9000

function wait(ms: number) {
  return new Promise<void>(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function quietStatus(doc: UploadedDocument) {
  if (doc.status === 'uploading') return 'Uploading'
  if (doc.status === 'processing') return 'Analysing'
  if (doc.status === 'error') return 'Failed'
  const gaps = doc.analysis?.missing.length ?? 0
  if (gaps > 0) return `${gaps} gap${gaps === 1 ? '' : 's'}`
  return 'Ready'
}

function DocumentRow({
  doc,
  active,
  onOpen,
  onRemove,
  onRetry,
}: {
  doc: UploadedDocument
  active: boolean
  onOpen: () => void
  onRemove: () => void
  onRetry: () => void
}) {
  const busy = doc.status === 'uploading' || doc.status === 'processing'
  const failed = doc.status === 'error'
  const durationMs = doc.status === 'uploading' ? UPLOAD_MS : ANALYSE_MS

  return (
    <div
      className={cn(
        'group/doc relative overflow-hidden rounded-lg bg-secondary transition-colors',
        failed
          ? 'ring-1 ring-destructive/30'
          : active
            ? 'ring-1 ring-foreground/8'
            : 'hover:ring-1 hover:ring-foreground/5',
      )}
    >
      <div className="flex h-[42px] items-center gap-3 px-3">
        <button
          type="button"
          onClick={() => {
            if (failed) onRetry()
            else if (!busy) onOpen()
          }}
          className="min-w-0 flex-1 text-left outline-none"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <FileTypeBadge name={doc.name} mimeType={doc.mimeType} size={20} />
            <span className="truncate text-[14px] text-foreground">{doc.name}</span>
          </span>
        </button>

        <span
          className={cn(
            'shrink-0 text-[12px] tabular-nums transition-opacity',
            failed ? 'text-destructive' : 'text-foreground-subtle',
            !busy && !failed && 'group-hover/doc:opacity-0',
          )}
        >
          {quietStatus(doc)}
        </span>

        {!busy && (
          <div
            className={cn(
              'absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center',
              'opacity-0 transition-opacity group-hover/doc:opacity-100 group-focus-within/doc:opacity-100',
            )}
          >
            {failed ? (
              <button
                type="button"
                onClick={onRetry}
                className="px-1.5 text-[12px] font-medium text-foreground/55 hover:text-foreground"
              >
                Retry
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Delete document"
              onClick={onRemove}
              className="rounded-md p-1.5 text-foreground-subtle transition-colors hover:bg-muted hover:text-destructive"
            >
              <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {busy && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-border overflow-hidden">
          <div
            key={`${doc.id}-${doc.status}-${doc.version}`}
            className="silk-doc-progress h-full w-full bg-primary/40"
            style={{ animationDuration: `${durationMs}ms` }}
          />
        </div>
      )}
    </div>
  )
}

export function DocumentUploadField({
  fieldId,
  fieldName,
  placeholder,
  documents,
  activeDocId,
  onDocumentsChange,
  onAnalyzed,
  onOpenAnalysis,
}: {
  fieldId: string
  fieldName: string
  placeholder?: string
  documents: UploadedDocument[]
  activeDocId: string | null
  onDocumentsChange: (next: UploadedDocument[]) => void
  onAnalyzed: (doc: UploadedDocument) => void
  onOpenAnalysis: (docId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const busy = documents.some(d => d.status === 'uploading' || d.status === 'processing')
  const hasDocs = documents.length > 0

  const commit = (next: UploadedDocument[]) => onDocumentsChange(next)

  const runPipeline = async (file: File, existing?: UploadedDocument) => {
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error('File too large', { description: 'Maximum upload size is 100 MB.' })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const version = existing
      ? existing.version + 1
      : (documents.reduce((m, d) => Math.max(m, d.version), 0) || 0) + 1

    const draft: UploadedDocument = {
      id: existing?.id ?? crypto.randomUUID(),
      fieldId,
      fieldName,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      version,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      previewUrl,
    }

    const withoutOld = existing
      ? documents.map(d => (d.id === existing.id ? draft : d))
      : [...documents, draft]
    commit(withoutOld)

    await wait(UPLOAD_MS)

    const processing = withoutOld.map(d =>
      d.id === draft.id ? { ...d, status: 'processing' as const } : d,
    )
    commit(processing)

    try {
      const [analysis] = await Promise.all([
        analyseDocument({ file, fieldId, fieldName }),
        wait(ANALYSE_MS),
      ])
      const analyzed: UploadedDocument = {
        ...draft,
        status: 'analyzed',
        analysis,
        error: undefined,
        previewUrl,
      }
      commit(processing.map(d => (d.id === draft.id ? analyzed : d)))
      onAnalyzed(analyzed)
      onOpenAnalysis(draft.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      commit(
        processing.map(d =>
          d.id === draft.id ? { ...d, status: 'error' as const, error: message } : d,
        ),
      )
      toast.error('Could not analyse document', { description: message })
    }
  }

  const onFiles = (list: FileList | File[] | null) => {
    if (!list) return
    const files = Array.from(list)
    void (async () => {
      for (const file of files) await runPipeline(file)
    })()
  }

  const pickReplacement = (doc: UploadedDocument) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = DOCUMENT_ACCEPT
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void runPipeline(file, doc)
    }
    input.click()
  }

  const removeDoc = (doc: UploadedDocument) => {
    if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl)
    commit(documents.filter(d => d.id !== doc.id))
  }

  return (
    <div
      className="flex flex-col gap-2"
      onDragEnter={e => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragOver={e => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={e => {
        e.preventDefault()
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setDragging(false)
      }}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        if (!busy) onFiles(e.dataTransfer.files)
      }}
    >
      {documents.map(doc => (
        <DocumentRow
          key={doc.id}
          doc={doc}
          active={activeDocId === doc.id}
          onOpen={() => onOpenAnalysis(doc.id)}
          onRemove={() => removeDoc(doc)}
          onRetry={() => pickReplacement(doc)}
        />
      ))}

      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        multiple
        className="sr-only"
        onChange={e => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {hasDocs ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'self-start pt-0.5 text-[12.5px] transition-colors',
            dragging ? 'text-secondary-foreground' : 'text-foreground-subtle hover:text-secondary-foreground',
            'disabled:opacity-40',
          )}
        >
          Add another
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full rounded-lg bg-secondary transition-colors',
            'py-8 flex flex-col items-center justify-center gap-1 text-center',
            dragging ? 'ring-1 ring-foreground/8' : 'hover:ring-1 hover:ring-foreground/5',
            busy && 'pointer-events-none opacity-60',
          )}
        >
          <HugeiconsIcon icon={CloudUploadIcon} size={17} className="text-foreground-subtle" strokeWidth={1.8} />
          <span className="text-[13px] text-foreground/55">Drop file or browse</span>
          <span className="text-[11.5px] text-foreground-subtle">
            {placeholder ?? 'PDF, DOCX, XLSX or CSV'}
          </span>
        </button>
      )}
    </div>
  )
}
