import {
  CATEGORIES,
  fieldHasValue,
  type ReadinessItem,
} from '@/app/(app)/readiness/readiness-data'
import type { FieldProposal, SuggestContext } from './types'

function val(values: Record<string, string>, id: string): string {
  return (values[id] ?? '').trim()
}

function firstSentence(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const match = text.match(/^.+?[.!?](?:\s|$)/)
  return (match ? match[0] : text).trim()
}

function uncapitalize(raw: string): string {
  if (!raw) return raw
  return raw.charAt(0).toLowerCase() + raw.slice(1)
}

function companyLabel(name: string): string {
  return name.trim() || 'The company'
}

/** Draft empty / weak fields from knowledge already on the form and workspace. */
const DRAFTERS: Record<string, (ctx: SuggestContext) => string | null> = {
  vision: ({ companyName, values }) => {
    const solution = val(values, 'solution')
    const products = val(values, 'products')
    const desc = val(values, 'company-description')
    const who = companyLabel(companyName)
    if (solution) {
      return `A world where ${uncapitalize(firstSentence(solution).replace(/\.$/, ''))} is the default — not a weekly reconciliation tax.`
    }
    if (products) {
      return `${who} exists to make ${uncapitalize(firstSentence(products).replace(/\.$/, ''))} ordinary for every product team.`
    }
    if (desc) {
      return `Become the system of record behind “${firstSentence(desc).replace(/\.$/, '')}”.`
    }
    return null
  },

  mission: ({ companyName, values }) => {
    const problem = val(values, 'problem')
    const solution = val(values, 'solution')
    const who = companyLabel(companyName)
    if (problem && solution) {
      return `${who} exists to remove this: ${firstSentence(problem)} We do it with ${uncapitalize(firstSentence(solution))}`
    }
    if (solution) return `Ship ${uncapitalize(firstSentence(solution))}`
    if (problem) return `Make “${firstSentence(problem).replace(/\.$/, '')}” a solved problem for product teams.`
    return null
  },

  services: ({ values }) => {
    const products = val(values, 'products')
    if (products) {
      return `Optional implementation and design-system audits for teams adopting the platform. Core motion is product-led — ${firstSentence(products).replace(/\.$/, '')}.`
    }
    const solution = val(values, 'solution')
    if (solution) {
      return `Onboarding and system-migration support around ${uncapitalize(firstSentence(solution).replace(/\.$/, ''))}. Not a services business.`
    }
    return null
  },

  'org-structure': ({ values }) => {
    const leadership = val(values, 'leadership')
    const timeline = val(values, 'company-timeline')
    const hq = val(values, 'locations')
    const parts: string[] = []
    if (leadership) parts.push(`Founder-led (${leadership})`)
    if (timeline) parts.push(firstSentence(timeline).replace(/\.$/, ''))
    if (hq) parts.push(`${hq} HQ`)
    if (!parts.length) return null
    return `${parts.join(' · ')}. Product and engineering as the core, with a small customer-success pod around design-system deployments.`
  },

  'key-hires': ({ values }) => {
    const products = val(values, 'products')
    const timeline = val(values, 'company-timeline')
    const next = products
      ? 'a Head of Engineering and a founding Account Executive to take deployments into larger product orgs'
      : 'a senior engineering lead and a first go-to-market hire'
    if (timeline) {
      return `Next ${next}. ${firstSentence(timeline)}`
    }
    return `Planned with this round: ${next}.`
  },

  esop: () => '10',

  'advisors-board': ({ values }) => {
    const sector = val(values, 'sector')
    const model = val(values, 'business-model')
    const lane = [sector, model].filter(Boolean).join(' / ')
    return lane
      ? `No formal board yet. Informal advisors across ${lane}.`
      : 'No formal board yet. Informal operators advising on product and early enterprise design-system rollouts.'
  },

  culture: ({ values }) => {
    const mission = val(values, 'mission')
    const desc = val(values, 'company-description')
    if (mission) {
      return `Craft, consistency, and shipping. ${firstSentence(mission)}`
    }
    if (desc) {
      return `A small team that treats the product as the design system — ${uncapitalize(firstSentence(desc))}`
    }
    return 'Craft over ceremony. Ship the system, then talk about it.'
  },

  'company-description': ({ companyName, values }) => {
    const problem = val(values, 'problem')
    const solution = val(values, 'solution')
    const who = companyLabel(companyName)
    if (problem && solution) {
      return `${who} is building ${uncapitalize(firstSentence(solution).replace(/\.$/, ''))} so teams stop losing time to this: ${firstSentence(problem)}`
    }
    return null
  },

  problem: ({ values }) => {
    const desc = val(values, 'company-description')
    const products = val(values, 'products')
    if (desc) {
      return `The cost of inconsistent interfaces compounds as teams scale — ${uncapitalize(firstSentence(desc).replace(/\.$/, ''))} exists because that tax is still paid weekly.`
    }
    if (products) {
      return `Product orgs still reconcile design systems by hand instead of running ${uncapitalize(firstSentence(products).replace(/\.$/, ''))}.`
    }
    return null
  },

  solution: ({ values }) => {
    const problem = val(values, 'problem')
    const products = val(values, 'products')
    if (products && problem) {
      return `${firstSentence(products).replace(/\.$/, '')} — built to retire “${firstSentence(problem).replace(/\.$/, '')}”.`
    }
    return null
  },

  products: ({ values }) => {
    const solution = val(values, 'solution')
    if (solution) return firstSentence(solution)
    return null
  },
}

/** Investor-tighter rewrites of an existing value, still grounded in sibling fields. */
const IMPROVERS: Record<string, (ctx: SuggestContext) => string | null> = {
  'company-description': ({ companyName, values }) => {
    const current = val(values, 'company-description')
    const problem = val(values, 'problem')
    const solution = val(values, 'solution')
    const who = companyLabel(companyName)
    if (solution && problem) {
      return `${who} builds ${uncapitalize(firstSentence(solution).replace(/\.$/, ''))}. It exists because ${uncapitalize(firstSentence(problem))}`
    }
    if (current) {
      return `${who}: ${uncapitalize(current)}`
    }
    return null
  },

  vision: ({ values }) => {
    const current = val(values, 'vision')
    const solution = val(values, 'solution')
    if (solution) {
      return `Every product team ships from one live system of record — ${uncapitalize(firstSentence(solution).replace(/\.$/, ''))} is invisible infrastructure, not a project.`
    }
    return current
      ? current.replace(/\.$/, '') + ' — default, not a programme.'
      : null
  },

  mission: ({ companyName, values }) => {
    const current = val(values, 'mission')
    const solution = val(values, 'solution')
    const who = companyLabel(companyName)
    if (solution) {
      return `${who} puts ${uncapitalize(firstSentence(solution).replace(/\.$/, ''))} under every product team’s daily workflow.`
    }
    return current || null
  },

  problem: ({ values }) => {
    const current = val(values, 'problem')
    if (!current) return null
    return `${firstSentence(current).replace(/\.$/, '')} — and the cost shows up as slower releases, broken UI, and design-eng thrash.`
  },

  solution: ({ values }) => {
    const current = val(values, 'solution')
    const products = val(values, 'products')
    if (products) return firstSentence(products)
    return current || null
  },
}

export function draftField(fieldId: string, ctx: SuggestContext): string | null {
  const drafter = DRAFTERS[fieldId]
  if (!drafter) return null
  const next = drafter(ctx)?.replace(/\s+/g, ' ').trim()
  return next || null
}

export function improveField(fieldId: string, ctx: SuggestContext): string | null {
  const improver = IMPROVERS[fieldId]
  if (improver) {
    const next = improver(ctx)?.replace(/\s+/g, ' ').trim()
    if (next) return next
  }
  return draftField(fieldId, ctx)
}

export function companyItems(): ReadinessItem[] {
  const cat = CATEGORIES.find(c => c.id === 'company')
  return cat?.subsections.flatMap(s => s.items) ?? []
}

export function itemsForCategory(categoryId: string): ReadinessItem[] {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  return cat?.subsections.flatMap(s => s.items) ?? []
}

export function findItem(fieldId: string): ReadinessItem | undefined {
  for (const cat of CATEGORIES) {
    for (const sub of cat.subsections) {
      const hit = sub.items.find(i => i.id === fieldId)
      if (hit) return hit
    }
  }
  return undefined
}

export function emptyFillableItems(
  items: ReadinessItem[],
  values: Record<string, string>,
): ReadinessItem[] {
  return items.filter(item => {
    if (item.kind === 'upload' || item.kind === 'founders') return false
    if (!DRAFTERS[item.id]) return false
    return !fieldHasValue(item, values[item.id] ?? '')
  })
}

export function proposalFor(
  item: ReadinessItem,
  value: string,
  rationale?: string,
): FieldProposal {
  return {
    fieldId: item.id,
    fieldName: item.name,
    value,
    rationale,
    status: 'proposed',
  }
}
