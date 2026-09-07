import type { SilkAiReply } from '@/lib/silk-ai'
import {
  beatsForLeaf,
  findMove,
  formatScore,
  judgmentLine,
  lookSentence,
  lookWord,
  nextMoves,
  printMoveAction,
  printName,
  profileSuggestions,
} from './reading'
import { findRow, isBranch } from './score'
import type { DealReport, ScoredLeaf } from './types'

export function replyToScoreAsk({
  text,
  report,
  leaf,
}: {
  text: string
  report: DealReport
  leaf: ScoredLeaf | null
}): SilkAiReply {
  const look = lookWord(report.score)
  const asked = text.toLowerCase()

  if (leaf) {
    return {
      intent: 'explain',
      thinking: [
        `Reading ${printName(leaf)}…`,
        'Checking the cut it landed on…',
        'Finding the answer…',
      ],
      content: answerForLeaf(asked, report, leaf),
      proposals: [],
      followUps: followUpsForLeaf(asked, leaf),
    }
  }

  return {
    intent: 'explain',
    thinking: [
      'Reading the profile score…',
      'Looking at the holes…',
      'Finding the answer…',
    ],
    content: answerForProfile(asked, report, look),
    proposals: [],
    followUps: profileSuggestions(look),
  }
}

function answerForLeaf(asked: string, report: DealReport, leaf: ScoredLeaf) {
  const move = findMove(report, leaf.id)
  const beats = beatsForLeaf(leaf, move)
  const name = printName(leaf)
  const score = leaf.score == null ? 'unscored' : formatScore(leaf.score)
  const band = leaf.band?.toLowerCase() ?? 'unscored'
  const profile = `${formatScore(report.score)}, ${lookWord(report.score)}`

  if (/settle/.test(asked) && leaf.flag) {
    return [
      beats.wrong ?? `${name} is flagged.`,
      beats.raise ?? 'Put the missing fact in the knowledge base.',
    ].join(' ')
  }

  if (/fragile/.test(asked)) {
    if (leaf.flag) {
      return `${name} is ${score}, ${band}, but the flag still sits on it. ${leaf.flag.summary}`
    }
    if (leaf.band === 'Excellent' || leaf.band === 'Good') {
      return `${name} is ${score}, ${band}. The band holds on what you uploaded. It moves if that fact is wrong.`
    }
    return `${name} is ${score}, ${band}. ${beats.raise ?? 'The next cut is what makes this less fragile.'}`
  }

  if (/investor/.test(asked)) {
    return beats.wrong
      ? `An investor will find this first. ${beats.wrong}`
      : `${name} is ${score}, ${band}. ${beats.why}`
  }

  if (/what if|if this were|happens to the score/.test(asked)) {
    const next = leaf.nextBand?.toLowerCase() ?? 'the next band'
    return `If ${name} cleared ${next}, the profile would still read from the live tree first. This page does not rewrite the score until you keep it as an override. Today it is ${profile}.`
  }

  if (/cut did we|what cut/.test(asked)) {
    return beats.why
  }

  if (/improv|next cut|raise|how can/.test(asked)) {
    return [beats.raise, beats.why].filter(Boolean).join(' ')
  }

  return [beats.why, beats.wrong, beats.raise].filter(Boolean).join('\n\n')
}

function answerForProfile(asked: string, report: DealReport, look: ReturnType<typeof lookWord>) {
  const judgment = judgmentLine(report)
  const moves = nextMoves(report)
  const first = moves[0]
  const profile = `${lookSentence(look)} ${formatScore(report.score)} overall, ${report.band.toLowerCase()} on the rail.`

  if (/hole|fix first|first/.test(asked) && first) {
    return [
      judgment ?? profile,
      `${printName({ id: first.parameterId, name: first.name })} first. ${printMoveAction(first, report)}`,
    ].join(' ')
  }

  if (/move us a band|move a band/.test(asked) && first) {
    return `The next band needs ${printName({ id: first.parameterId, name: first.name })} to move. ${printMoveAction(first, report)}`
  }

  return [profile, judgment, first ? first.action : null].filter(Boolean).join(' ')
}

function followUpsForLeaf(asked: string, leaf: ScoredLeaf) {
  const name = printName(leaf)
  if (/improv|next cut/.test(asked) && leaf.nextBand) {
    return [
      `If ${name} were ${leaf.nextBand.toLowerCase()}, what happens to the score?`,
      `What would an investor still ask about ${name}?`,
    ]
  }
  if (leaf.flag) {
    return [
      `How can ${name} be improved?`,
      `If ${name} were settled, what happens to the score?`,
    ]
  }
  if (leaf.band === 'Good' || leaf.band === 'Excellent') {
    return []
  }
  return [
    `Is ${name} fragile?`,
    `What would an investor still ask about ${name}?`,
  ]
}

export function isScoreLeaf(row: ReturnType<typeof findRow>): row is ScoredLeaf {
  return Boolean(row) && !isBranch(row!)
}
