import type { ExtractionMethod } from './types'

export type ExtractResult = {
  text: string
  method: ExtractionMethod
}

/** Keep letters, digits, and common punctuation only. */
function stripControlChars(text: string): string {
  return text.replace(/[^\t\n\r\x20-\x7E\u00A0-\u024F]/g, ' ')
}

export function isReadableText(text: string, minLen = 12): boolean {
  const cleaned = stripControlChars(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length < minLen) return false

  const sample = cleaned.slice(0, 600)
  let letters = 0
  let weird = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i)
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) letters++
    // Control leftovers / private-use / surrogate weirdness shouldn't appear after strip,
    // but reject strings that look like high-byte noise re-encoded as latin1.
    if (c >= 0x80 && c <= 0xff) weird++
  }

  const letterRatio = letters / sample.length
  const weirdRatio = weird / sample.length
  // Prefer sentences with real words
  const words = sample.split(/\s+/).filter(Boolean)
  const wordish = words.filter(w => /^[A-Za-z][A-Za-z0-9'’.-]{1,}$/.test(w)).length
  const wordRatio = words.length ? wordish / words.length : 0

  return letterRatio >= 0.45 && weirdRatio <= 0.08 && wordRatio >= 0.35
}

function isMostlyPrintable(text: string): boolean {
  if (!text.trim()) return false
  const sample = text.slice(0, 4000)
  let printable = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i)
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127) || c >= 160) printable++
  }
  return printable / sample.length > 0.75
}

function decodePdfStrings(raw: string): string {
  const parts: string[] = []
  const paren = /\((?:\\.|[^\\)]){2,}\)/g
  let match: RegExpExecArray | null
  while ((match = paren.exec(raw))) {
    const decoded = match[0]
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\(\d{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)))

    const cleaned = stripControlChars(decoded).replace(/\s+/g, ' ').trim()
    if (cleaned.length < 3) continue
    // Reject binary stream fragments that only coincidentally contain letters
    if (!isReadableText(cleaned, 3) && !/^[A-Za-z0-9 $%,.+\-/%:]{3,80}$/.test(cleaned)) {
      continue
    }
    parts.push(cleaned)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function finalizeText(text: string, method: ExtractionMethod): ExtractResult {
  const cleaned = stripControlChars(text).replace(/\s+/g, ' ').trim()
  if (!cleaned || !isReadableText(cleaned, 24)) {
    return { text: '', method: 'none' }
  }
  return { text: cleaned, method }
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const buffer = await file.arrayBuffer()
  const raw = new TextDecoder('latin1').decode(buffer)
  return finalizeText(decodePdfStrings(raw), 'pdf-streams')
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const type = file.type.toLowerCase()

  if (
    type.startsWith('text/') ||
    ['txt', 'csv', 'md', 'json', 'html', 'htm', 'tsv'].includes(ext)
  ) {
    const text = await file.text()
    return finalizeText(text, 'plain')
  }

  if (ext === 'pdf' || type === 'application/pdf') {
    return extractPdf(file)
  }

  // Light fallback for small office/export files that may include readable XML/text
  if (file.size <= 4 * 1024 * 1024) {
    try {
      const text = await file.text()
      if (isMostlyPrintable(text) && text.trim().length >= 40) {
        return finalizeText(text, 'fallback')
      }
    } catch {
      /* binary */
    }
  }

  return { text: '', method: 'none' }
}
