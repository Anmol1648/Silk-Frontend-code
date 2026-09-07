import { novatechCase } from './cases/novatech'
import { scoreDeal } from './score'
import type { ScoredBranch, ScoredRow } from './types'

function isBranch(row: ScoredRow): row is ScoredBranch {
  return 'children' in row
}

function printTree(rows: ScoredRow[], pad = '') {
  for (const row of rows) {
    const mark = row.notEnoughInformation ? '—' : String(row.score)
    const extra = isBranch(row) && row.sentence ? `  ${row.sentence}` : ''
    console.log(`${pad}${row.id}  ${row.name.padEnd(36)} ${mark}${extra}`)
    if (isBranch(row)) printTree(row.children, `${pad}  `)
  }
}

const report = scoreDeal(novatechCase)

console.log(report.mandate.company)
console.log(`${report.score}  ${report.band}`)
console.log('')
printTree(report.tree)
console.log('\nFlags')
for (const flag of report.flags) {
  console.log(`- ${flag.name}: ${flag.summary}`)
}
console.log('\nMoves')
for (const move of report.moves.slice(0, 5)) {
  console.log(
    `- ${move.name}  ${move.from} → ${move.to}  lift ${move.lift.toFixed(3)}`,
  )
  console.log(`  ${move.action}`)
}
