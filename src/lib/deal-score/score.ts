import {
  LEAF_SCORE,
  bandFromScore,
  dealBandFromScore,
  nextLeafBand,
  roundScore,
} from './bands'
import { nextBandLabel, scoreLeaf } from './rubric'
import type {
  DealInput,
  DealMove,
  DealReport,
  LeafBand,
  LeafEvidence,
  ScoreNode,
  ScoredBranch,
  ScoredLeaf,
  ScoredRow,
} from './types'
import { DEAL_FRAMEWORK } from './framework'

export function isBranch(row: ScoredRow): row is ScoredBranch {
  return 'children' in row
}

function rollupSentence(children: ScoredRow[]) {
  const scored = children.filter((c): c is ScoredRow & { score: number } => c.score != null)
  if (!scored.length) return null
  const best = scored.reduce((a, b) => (a.score >= b.score ? a : b))
  const worst = scored.reduce((a, b) => (a.score <= b.score ? a : b))
  if (best.id === worst.id) {
    return `${best.name} is ${(best.band ?? 'unscored').toLowerCase()}.`
  }
  if (best.score >= 8 && worst.score <= 5) {
    return `${best.name} carries this. ${worst.name} does not.`
  }
  if (worst.score <= 5) {
    return `${worst.name} is the drag.`
  }
  return `${best.name} leads. ${worst.name} is the constraint.`
}

function scoreNode(
  node: ScoreNode,
  depth: number,
  evidence: Record<string, LeafEvidence>,
): ScoredRow {
  if (node.children?.length) {
    const children = node.children.map(child => scoreNode(child, depth + 1, evidence))
    const usable = children.filter(child => child.score != null)
    const weightSum = usable.reduce((sum, child) => sum + child.weight, 0)

    for (const child of children) {
      child.appliedWeight = child.score == null || !weightSum ? 0 : child.weight / weightSum
      child.shareOfParent = child.appliedWeight
    }

    const score =
      usable.length === 0
        ? null
        : usable.reduce((sum, child) => sum + (child.score ?? 0) * child.appliedWeight, 0)

    const branch: ScoredBranch = {
      id: node.id,
      name: node.name,
      depth,
      weight: node.weight,
      appliedWeight: 0,
      score: score == null ? null : roundScore(score),
      band: score == null ? null : bandFromScore(score),
      notEnoughInformation: score == null,
      sentence: rollupSentence(children),
      children,
      shareOfParent: 0,
      shareOfDeal: 0,
    }
    return branch
  }

  const fact = evidence[node.id]
  const judged = fact
    ? scoreLeaf({ rubric: node.rubric, band: fact.band, measured: fact.measured })
    : null
  const band = judged?.band ?? null
  const next = band ? nextLeafBand(band) : null

  const leaf: ScoredLeaf = {
    id: node.id,
    name: node.name,
    depth,
    weight: node.weight,
    appliedWeight: 0,
    score: judged ? judged.score : null,
    band,
    notEnoughInformation: judged == null,
    reasoning: fact?.reasoning ?? null,
    soWhat: fact?.soWhat ?? null,
    diligenceAsk: fact?.diligenceAsk ?? null,
    nextBand: next,
    nextBandLabel: nextBandLabel(node.rubric, next),
    measured: fact?.measured ?? null,
    citations: fact?.citations ?? [],
    evidenceTier: fact?.evidenceTier ?? null,
    confidence: fact?.confidence ?? null,
    flag: fact?.flag ?? null,
    rubric: node.rubric,
    shareOfParent: 0,
    shareOfDeal: 0,
  }
  return leaf
}

function assignDealShare(rows: ScoredRow[], parentShare: number) {
  for (const row of rows) {
    row.shareOfDeal = parentShare * row.appliedWeight
    if (isBranch(row)) assignDealShare(row.children, row.shareOfDeal)
  }
}

export function collectLeaves(rows: ScoredRow[], into: ScoredLeaf[] = []) {
  for (const row of rows) {
    if (isBranch(row)) collectLeaves(row.children, into)
    else into.push(row)
  }
  return into
}

function dealScoreFromTree(tree: ScoredRow[]) {
  const usable = tree.filter(row => row.score != null)
  const weightSum = usable.reduce((sum, row) => sum + row.weight, 0)
  if (!usable.length || !weightSum) return 0
  return roundScore(
    usable.reduce(
      (sum, row) => sum + (row.score ?? 0) * (row.weight / weightSum),
      0,
    ),
  )
}

function recomputeBranch(branch: ScoredBranch) {
  const usable = branch.children.filter(child => child.score != null)
  const weightSum = usable.reduce((sum, child) => sum + child.weight, 0)

  for (const child of branch.children) {
    child.appliedWeight = child.score == null || !weightSum ? 0 : child.weight / weightSum
    child.shareOfParent = child.appliedWeight
  }

  const score =
    usable.length === 0
      ? null
      : usable.reduce((sum, child) => sum + (child.score ?? 0) * child.appliedWeight, 0)

  branch.score = score == null ? null : roundScore(score)
  branch.band = score == null ? null : bandFromScore(score)
}

function bumpLeafBand(tree: ScoredRow[], leafId: string, to: LeafBand): boolean {
  for (const row of tree) {
    if (isBranch(row)) {
      if (bumpLeafBand(row.children, leafId, to)) {
        recomputeBranch(row)
        return true
      }
      continue
    }
    if (row.id !== leafId) continue
    row.score = LEAF_SCORE[to]
    row.band = to
    return true
  }
  return false
}

function categoryIdOf(tree: ScoredRow[], leafId: string): string | null {
  const walk = (nodes: ScoredRow[], path: string[]): string | null => {
    for (const row of nodes) {
      if (row.id === leafId) return path[0] ?? row.id
      if (isBranch(row)) {
        const found = walk(row.children, [...path, row.id])
        if (found) return found
      }
    }
    return null
  }
  return walk(tree, [])
}

export function projectedMoveLift(report: DealReport, move: Pick<DealMove, 'parameterId' | 'to'>) {
  const tree = structuredClone(report.tree) as ScoredRow[]
  if (!bumpLeafBand(tree, move.parameterId, move.to)) return 0
  return Math.max(0, roundScore(dealScoreFromTree(tree) - report.score))
}

/** Score gain within the leaf's top-level category (Team, Financials, etc.). */
export function projectedCategoryLift(
  report: DealReport,
  move: Pick<DealMove, 'parameterId' | 'to'>,
) {
  const categoryId = categoryIdOf(report.tree, move.parameterId)
  if (!categoryId) return 0
  const before = findRow(report.tree, categoryId)
  const tree = structuredClone(report.tree) as ScoredRow[]
  if (!bumpLeafBand(tree, move.parameterId, move.to)) return 0
  const after = findRow(tree, categoryId)
  if (!before || !after || !isBranch(before) || !isBranch(after)) return 0
  return Math.max(0, roundScore((after.score ?? 0) - (before.score ?? 0)))
}

export function scoreDeal(
  input: DealInput,
  framework: ScoreNode[] = DEAL_FRAMEWORK,
): DealReport {
  const tree = framework.map(node => scoreNode(node, 0, input.evidence))
  const usable = tree.filter(row => row.score != null)
  const weightSum = usable.reduce((sum, row) => sum + row.weight, 0)

  for (const row of tree) {
    row.appliedWeight = row.score == null || !weightSum ? 0 : row.weight / weightSum
    row.shareOfParent = row.appliedWeight
  }
  assignDealShare(tree, 1)

  const score =
    usable.length === 0
      ? 0
      : usable.reduce((sum, row) => sum + (row.score ?? 0) * row.appliedWeight, 0)

  const leaves = collectLeaves(tree)

  const flags = leaves
    .filter(leaf => leaf.flag)
    .map(leaf => ({
      parameterId: leaf.id,
      name: leaf.name,
      kind: leaf.flag!.kind,
      summary: leaf.flag!.summary,
    }))

  const moves = leaves
    .flatMap(leaf => {
      if (leaf.score == null || !leaf.band || !leaf.nextBand) return []
      const ask = leaf.diligenceAsk
      const askIsReal =
        ask &&
        !ask.startsWith('No specific evidence gap') &&
        !ask.startsWith('Already at the top band')
      const action = askIsReal
        ? ask
        : leaf.nextBandLabel
          ? `${leaf.nextBand} is ${leaf.nextBandLabel}`
          : leaf.soWhat
      if (!action) return []
      return [
        {
          parameterId: leaf.id,
          name: leaf.name,
          from: leaf.band,
          to: leaf.nextBand,
          action,
          lift: (LEAF_SCORE[leaf.nextBand] - leaf.score) * leaf.shareOfDeal,
        },
      ]
    })
    .sort((a, b) => b.lift - a.lift)

  return {
    mandate: input.mandate,
    memo: input.memo,
    score: roundScore(score),
    band: dealBandFromScore(score),
    tree,
    flags,
    moves,
  }
}

export function findRow(rows: ScoredRow[], id: string): ScoredRow | null {
  for (const row of rows) {
    if (
      row.id === id ||
      (row as any).ref === id ||
      (row as any).key === id ||
      (row as any).inputKey === id ||
      (row as any).code === id ||
      (row.name && id && row.name.toLowerCase() === id.toLowerCase())
    ) {
      return row
    }
    if (isBranch(row)) {
      const found = findRow(row.children, id)
      if (found) return found
    }
  }
  return null
}
