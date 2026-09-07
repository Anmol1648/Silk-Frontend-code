import type { DealBand, LeafBand } from './types'

export const LEAF_SCORE: Record<LeafBand, number> = {
  Excellent: 9,
  Good: 7,
  Fair: 5,
  Poor: 3,
}

const LEAF_ORDER: LeafBand[] = ['Poor', 'Fair', 'Good', 'Excellent']

export function bandFromScore(score: number): LeafBand {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Fair'
  return 'Poor'
}

export function dealBandFromScore(score: number): DealBand {
  if (score >= 8) return 'Excellent'
  if (score >= 7) return 'Very Good'
  if (score >= 6) return 'Good'
  if (score >= 5) return 'Fair'
  return 'Poor'
}

export function nextLeafBand(band: LeafBand): LeafBand | null {
  const i = LEAF_ORDER.indexOf(band)
  if (i < 0 || i === LEAF_ORDER.length - 1) return null
  return LEAF_ORDER[i + 1] ?? null
}

const DEAL_ORDER: DealBand[] = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export const DEAL_BAND_CUT: Record<DealBand, number> = {
  Excellent: 8,
  'Very Good': 7,
  Good: 6,
  Fair: 5,
  Poor: 0,
}

export function nextDealBand(band: DealBand): DealBand | null {
  const i = DEAL_ORDER.indexOf(band)
  if (i < 0 || i === DEAL_ORDER.length - 1) return null
  return DEAL_ORDER[i + 1] ?? null
}

export function roundScore(score: number) {
  return Math.round(score * 100) / 100
}
