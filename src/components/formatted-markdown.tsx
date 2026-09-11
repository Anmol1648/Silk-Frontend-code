import React from 'react'
import { cn } from '@/lib/utils'

export function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return []

  // Tokenize string by matching markdown tokens:
  // 1. **bold**
  // 2. `code`
  // 3. [text](url)
  // 4. *italic* or _italic_
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*(?!\*)[^*]+\*|_(?!_)[^_]+_)/g
  const parts = text.split(tokenRegex)

  return parts.map((part, idx) => {
    if (!part) return null

    // Bold **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }

    // Inline Code `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      )
    }

    // Italic *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2 && !part.startsWith('__'))
    ) {
      return (
        <em key={idx} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      )
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

export function FormattedMarkdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  if (!content) return null

  // Split into paragraphs / sections by 2+ newlines
  const blocks = content.split(/\n\n+/)

  return (
    <div className={cn('space-y-2.5 text-[13px] leading-relaxed text-foreground', className)}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        const lines = trimmed.split('\n')
        const hasBullets = lines.some(line => /^\s*([*\-•+]|\d+\.)\s+/.test(line.trim()))

        if (hasBullets) {
          const elements: React.ReactNode[] = []
          let currentList: React.ReactNode[] = []

          lines.forEach((line, lIdx) => {
            const bulletMatch = line.trim().match(/^([*\-•+]|\d+\.)\s+(.*)$/)
            if (bulletMatch) {
              const itemContent = bulletMatch[2]
              currentList.push(
                <li key={`li-${lIdx}`} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-foreground/60 dark:bg-foreground/70" />
                  <div className="flex-1 min-w-0">{renderInlineMarkdown(itemContent)}</div>
                </li>
              )
            } else {
              if (currentList.length > 0) {
                elements.push(
                  <ul key={`ul-${lIdx}`} className="space-y-2 pl-0.5 list-none my-1.5">
                    {currentList}
                  </ul>
                )
                currentList = []
              }
              if (line.trim()) {
                elements.push(
                  <p key={`p-${lIdx}`} className="my-1 text-[13px] leading-relaxed">
                    {renderInlineMarkdown(line.trim())}
                  </p>
                )
              }
            }
          })

          if (currentList.length > 0) {
            elements.push(
              <ul key={`ul-end-${bIdx}`} className="space-y-2 pl-0.5 list-none my-1.5">
                {currentList}
              </ul>
            )
          }

          return <div key={bIdx} className="space-y-1.5">{elements}</div>
        }

        // Check for headings
        if (/^###\s+/.test(trimmed)) {
          return (
            <h4 key={bIdx} className="pt-1 text-[13.5px] font-semibold text-foreground">
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
            </h4>
          )
        }
        if (/^##\s+/.test(trimmed)) {
          return (
            <h3 key={bIdx} className="pt-1.5 text-[14px] font-semibold text-foreground">
              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
            </h3>
          )
        }
        if (/^#\s+/.test(trimmed)) {
          return (
            <h2 key={bIdx} className="pt-2 text-[15px] font-bold text-foreground">
              {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
            </h2>
          )
        }

        // Regular paragraph
        return (
          <p key={bIdx} className="text-[13px] leading-relaxed">
            {renderInlineMarkdown(trimmed)}
          </p>
        )
      })}
    </div>
  )
}
