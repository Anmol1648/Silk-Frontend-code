import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Title-case a company name for display (e.g. "acme corp" → "Acme Corp"). */
export function formatCompanyName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Title-case a person name for display (e.g. "ankit jain" → "Ankit Jain"). */
export function formatPersonName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
