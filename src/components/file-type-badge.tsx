import React from 'react'
import { cn } from '@/lib/utils'

export type FileKind =
  | 'pdf'
  | 'doc'
  | 'xls'
  | 'ppt'
  | 'csv'
  | 'zip'
  | 'image'
  | 'video'
  | 'file'

export function resolveFileKind(name: string, mimeType = ''): FileKind {
  const ext = (name || '').split('.').pop()?.toLowerCase() ?? ''
  const mime = (mimeType || '').toLowerCase()

  if (ext === 'pdf' || mime.includes('pdf')) return 'pdf'
  if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessing')) return 'doc'
  if (['xls', 'xlsx'].includes(ext) || mime.includes('sheet') || mime.includes('excel') || mime.includes('officedocument.spreadsheet')) return 'xls'
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint') || mime.includes('officedocument.presentation')) return 'ppt'
  if (ext === 'csv' || mime.includes('csv')) return 'csv'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) return 'zip'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || mime.startsWith('image/')) return 'image'
  if (['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv'].includes(ext) || mime.startsWith('video/')) return 'video'
  return 'file'
}

/* ── Microsoft Word 365 Official Icon ── */
function DocIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background card with 4 horizontal color stripes */}
      <path d="M17 5 H38 A4 4 0 0 1 42 9 V15 H13 V9 A4 4 0 0 1 17 5 Z" fill="#41A5EE" />
      <rect x="13" y="15" width="29" height="9" fill="#2B7CD3" />
      <rect x="13" y="24" width="29" height="9" fill="#185ABD" />
      <path d="M13 33 H42 V39 A4 4 0 0 1 38 43 H17 A4 4 0 0 1 13 39 Z" fill="#103F91" />

      {/* Shadow */}
      <rect x="4.5" y="12.5" width="22" height="24" rx="3.5" fill="#000000" fillOpacity="0.25" />

      {/* Front tile with 'W' */}
      <rect x="4" y="11.5" width="22" height="24" rx="3.5" fill="#185ABD" />
      <path
        d="M8.2 17.5H10.6L12.7 25.8L14.7 17.5H16.7L18.7 25.8L20.8 17.5H23.1L20.3 28.5H17.8L15.7 20.8L13.6 28.5H11.1L8.2 17.5Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/* ── Microsoft Excel 365 Official Icon ── */
function XlsIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background card with 2x4 grid cells in green hues */}
      <path d="M17 5 H27 V15 H13 V9 A4 4 0 0 1 17 5 Z" fill="#23A366" />
      <path d="M27 5 H38 A4 4 0 0 1 42 9 V15 H27 Z" fill="#33C481" />

      <rect x="13" y="15" width="14" height="9" fill="#107C41" />
      <rect x="27" y="15" width="15" height="9" fill="#188E4F" />

      <rect x="13" y="24" width="14" height="9" fill="#0E6B37" />
      <rect x="27" y="24" width="15" height="9" fill="#107C41" />

      <path d="M13 33 H27 V43 H17 A4 4 0 0 1 13 39 Z" fill="#094B24" />
      <path d="M27 33 H42 V39 A4 4 0 0 1 38 43 H27 Z" fill="#0C592C" />

      {/* Shadow */}
      <rect x="4.5" y="12.5" width="22" height="24" rx="3.5" fill="#000000" fillOpacity="0.25" />

      {/* Front tile with 'X' */}
      <rect x="4" y="11.5" width="22" height="24" rx="3.5" fill="#107C41" />
      <path
        d="M9.8 17.5H12.6L15.1 22.3L17.7 17.5H20.5L16.6 23.3L20.7 28.5H17.9L15.1 24.3L12.3 28.5H9.5L13.6 23.3L9.8 17.5Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/* ── Microsoft PowerPoint 365 Official Icon ── */
function PptIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background circle divided into 4 quadrants in orange tones */}
      {/* Top-Left quadrant */}
      <path d="M29 6 A18 18 0 0 0 11 24 L29 24 Z" fill="#FF8356" />
      {/* Top-Right quadrant */}
      <path d="M29 6 A18 18 0 0 1 47 24 L29 24 Z" fill="#FF5722" />
      {/* Bottom-Right quadrant */}
      <path d="M47 24 A18 18 0 0 1 29 42 L29 24 Z" fill="#D3380B" />
      {/* Bottom-Left quadrant */}
      <path d="M29 42 A18 18 0 0 1 11 24 L29 24 Z" fill="#EA4312" />

      {/* Shadow */}
      <rect x="4.5" y="12.5" width="22" height="24" rx="3.5" fill="#000000" fillOpacity="0.25" />

      {/* Front tile with 'P' */}
      <rect x="4" y="11.5" width="22" height="24" rx="3.5" fill="#C43415" />
      <path
        d="M10.8 17.5H15.8C17.6 17.5 18.9 18.8 18.9 20.6C18.9 22.4 17.6 23.7 15.8 23.7H13.2V28.5H10.8V17.5ZM13.2 19.6V21.6H15.5C16.3 21.6 16.7 21.2 16.7 20.6C16.7 20 16.3 19.6 15.5 19.6H13.2Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/* ── Adobe PDF Official Icon ── */
function PdfIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="pdf-grad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="100%" stopColor="#D70015" />
        </linearGradient>
      </defs>
      <rect x="6" y="5" width="36" height="38" rx="6" fill="url(#pdf-grad)" />
      <path
        d="M29.7 26.8C28.7 25.9 26.7 25.3 24.8 25.6C23.4 24.3 22.2 22.3 21.4 20.4C21.7 19 21.9 17.7 21.6 16.8C21.1 15.4 20 15 19.1 15.3C18.2 15.6 17.7 16.5 17.9 17.8C18.2 19.5 19.2 21.7 20.9 24.3C20.2 26.1 19.5 28 18.6 29.7C17.1 30.4 15.6 31.5 14.7 32.5C14 33.4 14 34.3 14.4 34.9C14.8 35.4 15.8 35.4 16.8 34.8C18.3 34 20.2 32.4 22 30.6C24.1 30 26.5 29.7 28.8 29.5C30.3 30.6 31.8 31.2 32.8 31C33.6 30.9 34 30.3 34 29.5C33.9 28.6 32.5 27.6 29.7 26.8ZM19.2 17.1C19.3 17 19.8 17 19.9 17.4C20.1 17.8 19.9 18.7 19.7 19.8C19.2 18.6 19.1 17.5 19.2 17.1ZM15.8 34C15.5 34 15.3 33.7 15.5 33.4C15.8 32.8 16.7 32.1 17.9 31.3C17.1 32.7 16.4 33.7 15.8 34ZM23 28C22.5 26.8 21.9 25.6 21.4 24.6C22.5 23.4 23.5 22.5 24.4 21.7C24.9 22.9 25.6 24.1 26.5 25C25.2 25.9 24.1 27 23 28ZM32.8 29.8C32.4 30 31.6 29.7 30.7 28.9C32.1 28.9 33 29.4 33 29.7C33 29.8 32.9 29.8 32.8 29.8Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

/* ── CSV Official Style Icon ── */
function CsvIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M17 5 H27 V15 H13 V9 A4 4 0 0 1 17 5 Z" fill="#00A88F" />
      <path d="M27 5 H38 A4 4 0 0 1 42 9 V15 H27 Z" fill="#26A69A" />

      <rect x="13" y="15" width="14" height="9" fill="#00897B" />
      <rect x="27" y="15" width="15" height="9" fill="#009688" />

      <rect x="13" y="24" width="14" height="9" fill="#00796B" />
      <rect x="27" y="24" width="15" height="9" fill="#00897B" />

      <path d="M13 33 H27 V43 H17 A4 4 0 0 1 13 39 Z" fill="#004D40" />
      <path d="M27 33 H42 V39 A4 4 0 0 1 38 43 H27 Z" fill="#00695C" />

      {/* Shadow */}
      <rect x="4.5" y="12.5" width="22" height="24" rx="3.5" fill="#000000" fillOpacity="0.25" />

      {/* Front tile with 'CSV' */}
      <rect x="4" y="11.5" width="22" height="24" rx="3.5" fill="#00796B" />
      <text x="15" y="27.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.01em">CSV</text>
    </svg>
  )
}

/* ── Archive / ZIP Icon ── */
function ZipIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="zip-grad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <rect x="7" y="5" width="34" height="38" rx="6" fill="url(#zip-grad)" />
      <rect x="21" y="5" width="6" height="38" fill="#5B21B6" />
      <rect x="21" y="9" width="3" height="3" rx="0.75" fill="#DDD6FE" />
      <rect x="24" y="12" width="3" height="3" rx="0.75" fill="#DDD6FE" />
      <rect x="21" y="15" width="3" height="3" rx="0.75" fill="#DDD6FE" />
      <rect x="24" y="18" width="3" height="3" rx="0.75" fill="#DDD6FE" />
      <rect x="21" y="21" width="3" height="3" rx="0.75" fill="#DDD6FE" />
      <rect x="20" y="25" width="8" height="10" rx="2" fill="#F59E0B" />
      <rect x="22.5" y="28" width="3" height="4" rx="0.75" fill="#78350F" />
    </svg>
  )
}

/* ── Image Icon ── */
function ImageIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="img-grad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      <rect x="7" y="5" width="34" height="38" rx="6" fill="url(#img-grad)" />
      <circle cx="17" cy="16" r="4" fill="#FDE047" />
      <path d="M10 36L19 25L26 32L31 27L38 36H10Z" fill="#FFFFFF" fillOpacity="0.88" />
    </svg>
  )
}

/* ── Video Icon ── */
function VideoIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="vid-grad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      <rect x="7" y="5" width="34" height="38" rx="6" fill="url(#vid-grad)" />
      <path d="M19 16L33 24L19 32V16Z" fill="#FFFFFF" />
    </svg>
  )
}

/* ── Generic File Icon ── */
function GenericFileIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M10 7C10 5.34315 11.3431 4 13 4H27.5858C28.3815 4 29.1447 4.31607 29.7071 4.87868L37.1213 12.2929C37.6839 12.8553 38 13.6185 38 14.4142V41C38 42.6569 36.6569 44 35 44H13C11.3431 44 10 42.6569 10 41V7Z" fill="#94A3B8" />
      <path d="M28 4V13C28 13.5523 28.4477 14 29 14H38L28 4Z" fill="#CBD5E1" />
      <rect x="16" y="21" width="16" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.85" />
      <rect x="16" y="27" width="16" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.65" />
      <rect x="16" y="33" width="10" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.65" />
    </svg>
  )
}

/** Original Microsoft 365 / Adobe branded format badge for document rows. */
export function FileTypeBadge({
  name,
  mimeType = '',
  className,
  size = 24,
}: {
  name: string
  mimeType?: string
  className?: string
  size?: number
}) {
  const kind = resolveFileKind(name, mimeType)

  const renderIcon = () => {
    switch (kind) {
      case 'ppt':
        return <PptIcon />
      case 'xls':
        return <XlsIcon />
      case 'doc':
        return <DocIcon />
      case 'pdf':
        return <PdfIcon />
      case 'csv':
        return <CsvIcon />
      case 'zip':
        return <ZipIcon />
      case 'image':
        return <ImageIcon />
      case 'video':
        return <VideoIcon />
      default:
        return <GenericFileIcon />
    }
  }

  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      title={name || kind.toUpperCase()}
    >
      {renderIcon()}
    </span>
  )
}
