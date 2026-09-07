import { LEAF_SCORE } from './bands'
import type { LeafBand, MeasuredFact, Rubric, ThresholdRubric } from './types'

function meetsCut(value: number, cut: number, higherIsBetter: boolean) {
  return higherIsBetter ? value >= cut : value <= cut
}

export function bandFromThreshold(
  rubric: ThresholdRubric,
  measured: MeasuredFact,
): LeafBand {
  const { higherIsBetter, cuts } = rubric
  if (meetsCut(measured.value, cuts.excellent.value, higherIsBetter)) return 'Excellent'
  if (meetsCut(measured.value, cuts.good.value, higherIsBetter)) return 'Good'
  if (meetsCut(measured.value, cuts.fair.value, higherIsBetter)) return 'Fair'
  return 'Poor'
}

export function scoreLeaf(input: {
  rubric?: Rubric
  band?: LeafBand
  measured?: MeasuredFact
}): { band: LeafBand; score: number } | null {
  const { rubric, band, measured } = input

  if (rubric?.kind === 'threshold' && measured) {
    const judged = bandFromThreshold(rubric, measured)
    return { band: judged, score: LEAF_SCORE[judged] }
  }

  if (band) return { band, score: LEAF_SCORE[band] }

  return null
}

export function nextBandLabel(rubric: Rubric | undefined, next: LeafBand | null) {
  if (!next || !rubric) return null
  return rubric.labels[next]
}
