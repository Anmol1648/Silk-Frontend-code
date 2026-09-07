import type { DocumentExpectation } from './types'

/** Investor-material expectations by readiness field slot (BRD §3C). */
const teaser: DocumentExpectation[] = [
  { id: 'overview', label: 'Company overview', patterns: [/overview/, /about\s+(us|the\s+company)/, /who\s+we\s+are/, /company/] },
  { id: 'problem', label: 'Problem statement', patterns: [/problem/, /pain\s*point/, /challenge/, /friction/] },
  { id: 'solution', label: 'Solution', patterns: [/solution/, /product/, /platform/, /how\s+it\s+works/] },
  { id: 'market', label: 'Market / opportunity', patterns: [/market/, /\btam\b/, /\bsam\b/, /\bsom\b/, /opportunity/] },
  { id: 'traction', label: 'Traction signals', patterns: [/traction/, /customers?/, /revenue/, /\barr\b/, /growth/, /users?/] },
  { id: 'ask', label: 'Fundraising ask', patterns: [/raising/, /raise/, /the\s+ask/, /seeking/, /round/, /series/] },
]

const deck: DocumentExpectation[] = [
  ...teaser,
  { id: 'business-model', label: 'Business model', patterns: [/business\s+model/, /monetisation|monetization/, /pricing/, /go[- ]to[- ]market|\bgtm\b/] },
  { id: 'team', label: 'Team', patterns: [/team/, /founders?/, /leadership/, /ceo|cto|coo/] },
  { id: 'financials', label: 'Financial snapshot', patterns: [/financial/, /projections?/, /forecast/, /\bebitda\b/, /burn/, /runway/] },
]

const im: DocumentExpectation[] = [
  ...deck,
  { id: 'risks', label: 'Risk factors', patterns: [/risk/, /disclaimer/, /forward[- ]looking/] },
  { id: 'use-of-proceeds', label: 'Use of proceeds', patterns: [/use\s+of\s+proceeds/, /allocation/, /proceeds/] },
]

const businessPlan: DocumentExpectation[] = [
  { id: 'exec-summary', label: 'Executive summary', patterns: [/executive\s+summary/, /summary/] },
  { id: 'strategy', label: 'Strategy / GTM', patterns: [/strateg/, /go[- ]to[- ]market|\bgtm\b/, /roadmap/] },
  { id: 'operations', label: 'Operations', patterns: [/operations?/, /organisation|organization/, /hiring/] },
  ...deck.filter(e => ['problem', 'solution', 'market', 'financials', 'team'].includes(e.id)),
]

const onePager: DocumentExpectation[] = teaser

const financialModel: DocumentExpectation[] = [
  { id: 'revenue', label: 'Revenue projections', patterns: [/revenue/, /\barr\b/, /\bmrr\b/, /sales/] },
  { id: 'costs', label: 'Cost structure', patterns: [/cost/, /opex|operating\s+expense/, /cogs|cost\s+of\s+goods/] },
  { id: 'burn-runway', label: 'Burn / runway', patterns: [/burn/, /runway/, /cash\s+flow|cashflow/] },
  { id: 'unit-economics', label: 'Unit economics', patterns: [/\bcac\b/, /\bltv\b/, /gross\s+margin/, /churn/, /unit\s+econ/] },
  { id: 'assumptions', label: 'Key assumptions', patterns: [/assumption/, /driver/, /scenario/] },
]

const financialStatements: DocumentExpectation[] = [
  { id: 'pl', label: 'Profit & loss / income', patterns: [/profit\s*(and|&)\s*loss|\bp\s*&\s*l\b/, /income\s+statement/, /revenue/, /expense/] },
  { id: 'balance', label: 'Balance sheet', patterns: [/balance\s+sheet/, /assets?/, /liabilit/] },
  { id: 'cashflow', label: 'Cash flow', patterns: [/cash\s*flow/, /operating\s+activities/] },
  { id: 'period', label: 'Reporting period', patterns: [/fy\s*\d{2,4}|year\s+ended|as\s+at|period|q[1-4]/i] },
]

const mgmtAccounts: DocumentExpectation[] = [
  { id: 'actuals', label: 'Actuals vs plan', patterns: [/actual/, /budget/, /variance/, /ytd|year[- ]to[- ]date/] },
  { id: 'revenue', label: 'Revenue lines', patterns: [/revenue/, /sales/, /\barr\b/] },
  { id: 'opex', label: 'Operating expenses', patterns: [/opex|operating/, /expense/, /payroll|salary|salaries/] },
]

const bank: DocumentExpectation[] = [
  { id: 'account', label: 'Account identity', patterns: [/account/, /iban|sort\s+code|routing/] },
  { id: 'balances', label: 'Balances / transactions', patterns: [/balance/, /deposit|withdrawal|debit|credit/, /transaction/] },
  { id: 'period', label: 'Statement period', patterns: [/statement/, /from|period|opening|closing/] },
]

const budget: DocumentExpectation[] = [
  { id: 'categories', label: 'Budget categories', patterns: [/budget/, /department|category|line\s+item/] },
  { id: 'timeline', label: 'Time horizon', patterns: [/monthly|quarterly|annual|fy\s*\d{2,4}|202\d/] },
  { id: 'headcount', label: 'Headcount / opex plan', patterns: [/headcount|hiring|payroll|opex|operating/] },
]

const legal: DocumentExpectation[] = [
  { id: 'parties', label: 'Parties', patterns: [/party|parties|between|shareholder|subscriber/] },
  { id: 'terms', label: 'Key terms', patterns: [/term|clause|whereas|shall|agreement/] },
  { id: 'governance', label: 'Governance / rights', patterns: [/board|voting|prefer|drag|tag|anti[- ]dilution|vesting/] },
]

const esop: DocumentExpectation[] = [
  { id: 'pool', label: 'Option pool', patterns: [/pool|option|esop|equity\s+incentive/] },
  { id: 'vesting', label: 'Vesting', patterns: [/vest(ing|ed)?|cliff|grant/] },
  { id: 'eligibility', label: 'Eligibility / plan rules', patterns: [/eligible|participant|plan|exercise/] },
]

const capTable: DocumentExpectation[] = [
  { id: 'holders', label: 'Shareholders / holders', patterns: [/shareholder|holder|investor|founder|stockholder/] },
  { id: 'ownership', label: 'Ownership %', patterns: [/ownership|percent|%|fully[- ]diluted|fd%/] },
  { id: 'share-classes', label: 'Share classes', patterns: [/common|preferred|class\s+[a-z]|ordinary|preference/] },
]

const product: DocumentExpectation[] = [
  { id: 'product', label: 'Product description', patterns: [/product|feature|platform|solution|demo/] },
  { id: 'audience', label: 'Target audience', patterns: [/customer|user|persona|segment|audience/] },
  { id: 'value', label: 'Value proposition', patterns: [/value|benefit|outcome|differenti/] },
]

const org: DocumentExpectation[] = [
  { id: 'structure', label: 'Org structure', patterns: [/organisation|organization|team|department|report/] },
  { id: 'roles', label: 'Roles / leadership', patterns: [/ceo|cto|coo|head\s+of|director|manager|founder/] },
]

const caseStudy: DocumentExpectation[] = [
  { id: 'customer', label: 'Customer context', patterns: [/customer|client|company|case\s+study/] },
  { id: 'challenge', label: 'Challenge', patterns: [/challenge|problem|before|pain/] },
  { id: 'outcome', label: 'Outcome / results', patterns: [/result|outcome|impact|roi|improved|increased|reduced/] },
]

const generic: DocumentExpectation[] = [
  { id: 'substance', label: 'Substantive content', patterns: [/[a-z]{4,}/] },
  { id: 'company-ref', label: 'Company reference', patterns: [/company|we|our|inc|ltd|llc|corp/] },
]

const BY_FIELD: Record<string, DocumentExpectation[]> = {
  'doc-teaser': teaser,
  'doc-deck': deck,
  'doc-im': im,
  'doc-business-plan': businessPlan,
  'doc-one-pager': onePager,
  'doc-model': financialModel,
  'doc-audited': financialStatements,
  'doc-mgmt-accounts': mgmtAccounts,
  'doc-bank': bank,
  'doc-budget': budget,
  'doc-sha': legal,
  'doc-ssa': legal,
  'doc-term-sheets': legal,
  'doc-esop-plan': esop,
  'doc-cap-table': capTable,
  'doc-brochure': product,
  'doc-demo': product,
  'doc-org-chart': org,
  'doc-case-studies': caseStudy,
  'doc-other': generic,
}

const TYPE_LABEL: Record<string, string> = {
  'doc-teaser': 'Executive Teaser',
  'doc-deck': 'Investor Presentation',
  'doc-im': 'Information Memorandum',
  'doc-business-plan': 'Business Plan',
  'doc-one-pager': 'One Pager',
  'doc-model': 'Financial Model',
  'doc-audited': 'Audited Financial Statements',
  'doc-mgmt-accounts': 'Management Accounts',
  'doc-bank': 'Bank Statements',
  'doc-budget': 'Budget',
  'doc-sha': 'Shareholders’ Agreement',
  'doc-ssa': 'Share Subscription Agreement',
  'doc-term-sheets': 'Term Sheet',
  'doc-esop-plan': 'ESOP Plan',
  'doc-cap-table': 'Cap Table',
  'doc-brochure': 'Product Brochure',
  'doc-demo': 'Product Demo',
  'doc-org-chart': 'Organisation Chart',
  'doc-case-studies': 'Customer Case Study',
  'doc-other': 'Supporting Document',
}

export function expectationsForField(fieldId: string): DocumentExpectation[] {
  return BY_FIELD[fieldId] ?? generic
}

export function classifiedTypeForField(fieldId: string, fieldName: string): string {
  return TYPE_LABEL[fieldId] ?? fieldName
}
