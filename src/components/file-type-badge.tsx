import { cn } from '@/lib/utils'

type FileKind =
  | 'pdf'
  | 'doc'
  | 'xls'
  | 'ppt'
  | 'csv'
  | 'zip'
  | 'image'
  | 'video'
  | 'file'

const KIND_META: Record<FileKind, { label: string; bg: string; accent: string }> = {
  pdf: { label: 'PDF', bg: '#FDECEE', accent: '#E11D48' },
  doc: { label: 'DOC', bg: '#E8F1FE', accent: '#2563EB' },
  xls: { label: 'XLS', bg: '#E7F8EF', accent: '#059669' },
  ppt: { label: 'PPT', bg: '#FFF1E8', accent: '#EA580C' },
  csv: { label: 'CSV', bg: '#E8F8F4', accent: '#0D9488' },
  zip: { label: 'ZIP', bg: '#F3EEFF', accent: '#7C3AED' },
  image: { label: 'IMG', bg: '#F3E8FF', accent: '#9333EA' },
  video: { label: 'VID', bg: '#FFE8F1', accent: '#DB2777' },
  file: { label: 'FILE', bg: '#F3F4F6', accent: '#6B7280' },
}

function resolveKind(name: string, mimeType = ''): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const mime = mimeType.toLowerCase()

  if (ext === 'pdf' || mime.includes('pdf')) return 'pdf'
  if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'doc'
  if (['xls', 'xlsx'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) {
    return 'xls'
  }
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) return 'ppt'
  if (ext === 'csv' || mime.includes('csv')) return 'csv'
  if (ext === 'zip' || mime.includes('zip')) return 'zip'
  if (
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return 'image'
  }
  if (['mp4', 'mov', 'webm', 'm4v'].includes(ext) || mime.startsWith('video/')) {
    return 'video'
  }
  return 'file'
}

/** Compact colored format badge for document rows. */
export function FileTypeBadge({
  name,
  mimeType = '',
  className,
  size = 18,
}: {
  name: string
  mimeType?: string
  className?: string
  size?: number
}) {
  const kind = resolveKind(name, mimeType)
  const meta = KIND_META[kind]

  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
      title={meta.label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.25 2.5h7.1L15.75 6.9V16.5A1.75 1.75 0 0 1 14 18.25H6A1.75 1.75 0 0 1 4.25 16.5V2.5Z"
          fill={meta.bg}
        />
        <path
          d="M11.2 2.5v3.15c0 .76.62 1.38 1.38 1.38h3.17"
          fill={meta.accent}
          fillOpacity="0.18"
        />
        <path
          d="M11.35 2.65v3c0 .69.56 1.25 1.25 1.25h3"
          stroke={meta.accent}
          strokeOpacity="0.55"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <path
          d="M11.35 2.65 15.6 6.9h-2.75c-.69 0-1.25-.56-1.25-1.25V2.65Z"
          fill={meta.accent}
        />
        <rect x="3.1" y="10.35" width="13.8" height="5.4" rx="1.2" fill={meta.accent} />
        <text
          x="10"
          y="14.15"
          textAnchor="middle"
          fill="#fff"
          fontSize="4.2"
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
          letterSpacing="0.04em"
        >
          {meta.label}
        </text>
      </svg>
    </span>
  )
}
