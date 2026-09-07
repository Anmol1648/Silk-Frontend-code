import {
  Building03Icon,
  Analytics01Icon,
  Briefcase01Icon,
  ChartLineData01Icon,
  Coins01Icon,
  JusticeScale01Icon,
  BulbIcon,
  FileAttachmentIcon,
} from '@hugeicons/core-free-icons'

export type ItemStatus = 'analyzed' | 'needs_input' | 'not_started'
export type Impact = 'high' | 'medium' | 'low'
export type FieldKind =
  | 'text'
  | 'textarea'
  | 'upload'
  | 'number'
  | 'currency'
  | 'percent'
  | 'months'
  | 'select'
  | 'country'
  | 'founders'

export type FieldSource = {
  id: string
  title: string
  url: string
  excerpt?: string
  kind: 'website' | 'linkedin' | 'registry' | 'news' | 'filing' | 'document'
}

export type ReadinessItem = {
  id: string
  name: string
  status: ItemStatus
  impact: Impact
  kind?: FieldKind
  value?: string
  placeholder?: string
  hint?: string
  aiFilled?: boolean
  updated?: string
  sources?: FieldSource[]
  /** Options for `select` fields. */
  options?: readonly string[]
  /** Soft max for percent fields (default 100). */
  max?: number
  /** When true on `currency`, show K/M/B/T scale (stored as CODE|amount|scale). */
  scaled?: boolean
}

export type Subsection = {
  id: string
  label: string
  items: ReadinessItem[]
}

export type Category = {
  id: string
  label: string
  icon: typeof Building03Icon
  blurb: string
  subsections: Subsection[]
}

const D = '1 Aug 2026'

const SECTORS = [
  'B2B SaaS',
  'Consumer',
  'Fintech',
  'Healthtech',
  'Edtech',
  'Climate / CleanTech',
  'Marketplace',
  'Developer tools',
  'Design tooling',
  'AI / ML',
  'Hardware',
  'Deep tech',
  'Other',
] as const

const BUSINESS_MODELS = [
  'B2B SaaS',
  'B2C subscription',
  'Marketplace',
  'Transaction / take-rate',
  'Usage-based',
  'Services',
  'Hardware + software',
  'Advertising',
  'Open core',
  'Other',
] as const

const REVENUE_MODELS = [
  'Subscription (recurring)',
  'Usage-based',
  'Seat-based',
  'Transaction fees',
  'Licensing',
  'Professional services',
  'Hybrid',
  'Other',
] as const

const ROUND_STAGES = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth',
  'Bridge',
  'Other',
] as const

const ENTITY_TYPES = [
  'Private Limited',
  'C-Corp',
  'LLC',
  'LLP',
  'Public Limited',
  'OPC',
  'Other',
] as const

const CUSTOMER_COUNT_RANGES = [
  '0',
  '1–10',
  '11–50',
  '51–100',
  '101–500',
  '501–1,000',
  '1,001–5,000',
  '5,000+',
] as const

const t = (
  partial: Omit<ReadinessItem, 'kind'> & { kind?: FieldKind },
): ReadinessItem => ({
  kind: 'textarea',
  ...partial,
})

export const CATEGORIES: Category[] = [
  {
    id: 'company',
    label: 'Company & Team',
    icon: Building03Icon,
    blurb: 'Who you are, who’s building it, and how you’re organised.',
    subsections: [
      {
        id: 'company-profile',
        label: 'Company',
        items: [
          t({
            id: 'company-description',
            name: 'Company description',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value:
              'A design-tooling company helping product teams ship consistent interfaces faster. Founded 2024, headquartered in India, ~14 employees.',
            placeholder: 'What the company does, for whom, and why it exists.',
          }),
          t({
            id: 'vision',
            name: 'Vision',
            status: 'needs_input',
            impact: 'high',
            placeholder: 'The world you’re trying to create in 10 years.',
            hint: 'Investors read this first. Silk couldn’t infer it reliably.',
          }),
          t({
            id: 'mission',
            name: 'Mission',
            status: 'needs_input',
            impact: 'high',
            placeholder: 'What you do every day to get there.',
          }),
          t({
            id: 'problem',
            name: 'Problem statement',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value: 'Product teams lose time reconciling design systems across tools and releases.',
            placeholder: 'The customer pain you solve.',
          }),
          t({
            id: 'solution',
            name: 'Solution',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value: 'A live design-system layer that keeps components synced across the product stack.',
            placeholder: 'How you solve that pain.',
          }),
          t({
            id: 'products',
            name: 'Products',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value: 'AI-assisted design-system management with live component sync.',
            placeholder: 'Core products and what’s live today.',
          }),
          t({
            id: 'services',
            name: 'Services',
            status: 'not_started',
            impact: 'low',
            placeholder: 'Any services offered alongside the product (if applicable).',
          }),
        ],
      },
      {
        id: 'team',
        label: 'Team',
        items: [
          t({
            id: 'leadership',
            name: 'Leadership',
            status: 'analyzed',
            impact: 'high',
            kind: 'founders',
            aiFilled: true,
            updated: D,
            value: 'session',
            placeholder: 'Add founders with name, role, and LinkedIn.',
            hint: 'Synced with your workspace founding team.',
          }),
          t({
            id: 'org-structure',
            name: 'Organisation structure',
            status: 'needs_input',
            impact: 'medium',
            placeholder: 'How the team is organised across functions.',
          }),
          t({
            id: 'key-hires',
            name: 'Key hires',
            status: 'needs_input',
            impact: 'medium',
            placeholder: 'Critical roles hired or planned with this round.',
          }),
          t({
            id: 'esop',
            name: 'ESOP pool',
            status: 'needs_input',
            impact: 'medium',
            kind: 'percent',
            placeholder: '10',
            hint: 'Total option pool as a % of fully diluted equity.',
          }),
          t({
            id: 'advisors-board',
            name: 'Advisors & board',
            status: 'not_started',
            impact: 'low',
            placeholder: 'Advisors, board members and notable backers.',
          }),
          t({
            id: 'culture',
            name: 'Culture & values',
            status: 'not_started',
            impact: 'low',
            placeholder: 'What you stand for as a team.',
          }),
          t({
            id: 'locations',
            name: 'Headquarters',
            status: 'analyzed',
            impact: 'low',
            kind: 'country',
            aiFilled: true,
            updated: D,
            value: 'India',
            placeholder: 'Select country',
          }),
          t({
            id: 'company-timeline',
            name: 'Company timeline',
            status: 'analyzed',
            impact: 'low',
            aiFilled: true,
            updated: D,
            value: 'Incorporated Q1 2024 · First customers Q3 2024 · Team scaled to 14 by mid-2026.',
            placeholder: 'Key milestones from founding to today.',
          }),
        ],
      },
    ],
  },
  {
    id: 'market',
    label: 'Market & Competition',
    icon: Analytics01Icon,
    blurb: 'The size of the prize and where you sit in it.',
    subsections: [
      {
        id: 'market',
        label: 'Market',
        items: [
          t({
            id: 'sector',
            name: 'Industry & sector',
            status: 'analyzed',
            impact: 'medium',
            kind: 'select',
            options: SECTORS,
            aiFilled: true,
            updated: D,
            value: 'Design tooling',
            placeholder: 'Select sector',
          }),
          t({
            id: 'tam',
            name: 'TAM',
            status: 'analyzed',
            impact: 'high',
            kind: 'currency',
            scaled: true,
            aiFilled: true,
            updated: D,
            value: 'USD|12|B',
            placeholder: '0',
            hint: 'Total addressable market.',
          }),
          t({
            id: 'sam',
            name: 'SAM',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            scaled: true,
            placeholder: '0',
            hint: 'Serviceable addressable market.',
          }),
          t({
            id: 'som',
            name: 'SOM',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            scaled: true,
            placeholder: '0',
            hint: 'Serviceable obtainable market.',
          }),
          t({
            id: 'market-landscape',
            name: 'Market landscape',
            status: 'analyzed',
            impact: 'medium',
            aiFilled: true,
            updated: D,
            value: 'Shift toward AI-assisted product design and centralised system-of-record for UI.',
            placeholder: 'How the category is evolving.',
          }),
          t({
            id: 'geography',
            name: 'Primary market',
            status: 'needs_input',
            impact: 'medium',
            kind: 'country',
            placeholder: 'Select country',
            hint: 'Where you sell or plan to sell first.',
          }),
          t({
            id: 'customer-segments',
            name: 'Customer segments',
            status: 'needs_input',
            impact: 'high',
            placeholder: 'Which segments you’re prioritising and why.',
          }),
          t({
            id: 'trends',
            name: 'Market trends',
            status: 'not_started',
            impact: 'low',
            placeholder: 'Tailwinds shaping your market.',
          }),
        ],
      },
      {
        id: 'competition',
        label: 'Competition',
        items: [
          t({
            id: 'competitors',
            name: 'Competitive landscape',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value: 'Mapped against Figma, Framer and emerging AI-design entrants.',
            placeholder: 'Who else serves this buyer.',
          }),
          t({
            id: 'positioning',
            name: 'Positioning',
            status: 'analyzed',
            impact: 'medium',
            aiFilled: true,
            updated: D,
            value: 'Positioned as the design-system layer for AI-assisted product teams.',
            placeholder: 'How you want to be remembered vs alternatives.',
          }),
          t({
            id: 'moat',
            name: 'Moat & differentiation',
            status: 'needs_input',
            impact: 'high',
            placeholder: 'What makes you hard to copy.',
          }),
        ],
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase01Icon,
    blurb: 'What you sell and how you make money.',
    subsections: [
      {
        id: 'model',
        label: 'Model & pricing',
        items: [
          t({
            id: 'business-model',
            name: 'Business model',
            status: 'analyzed',
            impact: 'high',
            kind: 'select',
            options: BUSINESS_MODELS,
            aiFilled: true,
            updated: D,
            value: 'B2B SaaS',
            placeholder: 'Select model',
          }),
          t({
            id: 'revenue-model',
            name: 'Revenue model',
            status: 'analyzed',
            impact: 'high',
            kind: 'select',
            options: REVENUE_MODELS,
            aiFilled: true,
            updated: D,
            value: 'Seat-based',
            placeholder: 'Select revenue model',
          }),
          t({
            id: 'pricing',
            name: 'Pricing',
            status: 'analyzed',
            impact: 'medium',
            kind: 'text',
            aiFilled: true,
            updated: D,
            value: 'Free tier, $18/seat Pro, custom Enterprise.',
            placeholder: 'Current pricing and packaging.',
          }),
        ],
      },
      {
        id: 'gtm',
        label: 'Go-to-market',
        items: [
          t({
            id: 'gtm-strategy',
            name: 'GTM strategy',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value: 'Bottoms-up, designer-led adoption expanding to teams.',
            placeholder: 'How you acquire and expand customers.',
          }),
          t({
            id: 'partnerships',
            name: 'Key partnerships',
            status: 'needs_input',
            impact: 'medium',
            placeholder: 'Integrations or channel partners that matter.',
          }),
          t({
            id: 'roadmap',
            name: 'Product roadmap',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Where the product is heading over 12–18 months.',
          }),
          t({
            id: 'tech-stack',
            name: 'Technology stack',
            status: 'analyzed',
            impact: 'low',
            aiFilled: true,
            updated: D,
            value: 'Modern web stack inferred from public engineering signals; details to confirm.',
            placeholder: 'Core technologies (where relevant to investors).',
          }),
        ],
      },
    ],
  },
  {
    id: 'traction',
    label: 'Traction & Financials',
    icon: ChartLineData01Icon,
    blurb: 'The numbers that prove it’s working.',
    subsections: [
      {
        id: 'customers',
        label: 'Customers',
        items: [
          t({
            id: 'customers-total',
            name: 'Number of customers',
            status: 'needs_input',
            impact: 'high',
            kind: 'select',
            options: CUSTOMER_COUNT_RANGES,
            placeholder: 'Select range',
            hint: 'Total customers (define active if needed).',
          }),
          t({
            id: 'customers-paying',
            name: 'Paying customers',
            status: 'needs_input',
            impact: 'high',
            kind: 'select',
            options: CUSTOMER_COUNT_RANGES,
            placeholder: 'Select range',
          }),
          t({
            id: 'customers-enterprise',
            name: 'Enterprise customers',
            status: 'needs_input',
            impact: 'medium',
            kind: 'select',
            options: CUSTOMER_COUNT_RANGES,
            placeholder: 'Select range',
          }),
          t({
            id: 'customer-concentration',
            name: 'Customer concentration',
            status: 'needs_input',
            impact: 'high',
            kind: 'percent',
            placeholder: '0',
            hint: '% of revenue from top customers.',
          }),
          t({
            id: 'major-customers',
            name: 'Major customers',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Notable logos or reference customers (if shareable).',
          }),
        ],
      },
      {
        id: 'financials',
        label: 'Financials',
        items: [
          t({
            id: 'revenue',
            name: 'Revenue',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            aiFilled: true,
            updated: D,
            value: '',
            placeholder: '0',
            hint: 'Public signals suggest paid traction — confirm the exact figure and period.',
          }),
          t({
            id: 'arr',
            name: 'ARR',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            placeholder: '0',
          }),
          t({
            id: 'mrr',
            name: 'MRR',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            placeholder: '0',
          }),
          t({
            id: 'ebitda',
            name: 'EBITDA',
            status: 'not_started',
            impact: 'medium',
            kind: 'currency',
            placeholder: '0',
            hint: 'Use 0 or negative if pre-profit.',
          }),
          t({
            id: 'burn',
            name: 'Monthly burn',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            placeholder: '0',
          }),
          t({
            id: 'runway',
            name: 'Runway',
            status: 'needs_input',
            impact: 'high',
            kind: 'months',
            placeholder: '0',
          }),
          t({
            id: 'gross-margin',
            name: 'Gross margin',
            status: 'needs_input',
            impact: 'high',
            kind: 'percent',
            placeholder: '0',
          }),
          t({
            id: 'cac',
            name: 'CAC',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            placeholder: '0',
          }),
          t({
            id: 'ltv',
            name: 'LTV',
            status: 'needs_input',
            impact: 'high',
            kind: 'currency',
            placeholder: '0',
          }),
          t({
            id: 'churn',
            name: 'Churn',
            status: 'needs_input',
            impact: 'high',
            kind: 'percent',
            placeholder: '0',
            hint: 'Logo or revenue churn, annualised.',
          }),
        ],
      },
    ],
  },
  {
    id: 'fundraising',
    label: 'Fundraising',
    icon: Coins01Icon,
    blurb: 'The round you’re raising and ownership behind it.',
    subsections: [
      {
        id: 'round',
        label: 'Round',
        items: [
          t({
            id: 'round-details',
            name: 'Round stage',
            status: 'analyzed',
            impact: 'high',
            kind: 'select',
            options: ROUND_STAGES,
            aiFilled: true,
            updated: D,
            value: 'Seed',
            placeholder: 'Select stage',
          }),
          t({
            id: 'use-of-funds',
            name: 'Use of funds',
            status: 'needs_input',
            impact: 'high',
            placeholder: 'How you’ll deploy the capital.',
          }),
          t({
            id: 'prior-rounds',
            name: 'Prior rounds',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Any previous financing.',
          }),
        ],
      },
      {
        id: 'shareholding',
        label: 'Shareholding',
        items: [
          t({
            id: 'cap-table',
            name: 'Cap table',
            status: 'needs_input',
            impact: 'high',
            placeholder: 'Current ownership split.',
          }),
          t({
            id: 'existing-investors',
            name: 'Existing investors',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Current investors and instruments.',
          }),
          t({
            id: 'board-members',
            name: 'Board members',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Board composition.',
          }),
        ],
      },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & Compliance',
    icon: JusticeScale01Icon,
    blurb: 'The foundations investors diligence first.',
    subsections: [
      {
        id: 'entity',
        label: 'Entity & licences',
        items: [
          t({
            id: 'incorporation',
            name: 'Entity type',
            status: 'analyzed',
            impact: 'high',
            kind: 'select',
            options: ENTITY_TYPES,
            aiFilled: true,
            updated: D,
            value: 'Private Limited',
            placeholder: 'Select entity type',
          }),
          t({
            id: 'subsidiaries',
            name: 'Subsidiaries',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Any subsidiaries or group structure.',
          }),
          t({
            id: 'licences',
            name: 'Licences',
            status: 'not_started',
            impact: 'medium',
            placeholder: 'Material licences or permits.',
          }),
        ],
      },
      {
        id: 'ip-risk',
        label: 'IP, litigation & compliance',
        items: [
          t({
            id: 'ip',
            name: 'IP',
            status: 'analyzed',
            impact: 'high',
            aiFilled: true,
            updated: D,
            value: 'Trademark filing on record for the brand name.',
            placeholder: 'Patents, trademarks, and who owns IP.',
          }),
          t({
            id: 'litigation',
            name: 'Litigation',
            status: 'not_started',
            impact: 'high',
            placeholder: 'Material disputes or litigation (or none).',
          }),
          t({
            id: 'compliance',
            name: 'Compliance',
            status: 'analyzed',
            impact: 'medium',
            aiFilled: true,
            updated: D,
            value: 'No adverse filings detected.',
            placeholder: 'Regulatory posture and material obligations.',
          }),
        ],
      },
    ],
  },
  {
    id: 'story',
    label: 'Story & Signals',
    icon: BulbIcon,
    blurb: 'Narrative and public proof points.',
    subsections: [
      {
        id: 'narrative',
        label: 'Narrative',
        items: [
          t({
            id: 'founding-story',
            name: 'Founding story',
            status: 'analyzed',
            impact: 'medium',
            aiFilled: true,
            updated: D,
            value: 'Founders previously worked together at a design-tooling company.',
            placeholder: 'Why this company exists.',
          }),
          t({
            id: 'milestones',
            name: 'Milestones',
            status: 'analyzed',
            impact: 'medium',
            aiFilled: true,
            updated: D,
            value: 'Product launch and first enterprise logo noted.',
            placeholder: 'Proof points worth mentioning.',
          }),
          t({
            id: 'thought-leadership',
            name: 'Thought leadership',
            status: 'needs_input',
            impact: 'low',
            placeholder: 'Talks, essays or content from the team.',
          }),
        ],
      },
      {
        id: 'signals',
        label: 'Signals',
        items: [
          t({
            id: 'press',
            name: 'Press & media',
            status: 'analyzed',
            impact: 'low',
            aiFilled: true,
            updated: D,
            value: 'Featured in two industry newsletters in 2026.',
            placeholder: 'Notable coverage.',
          }),
          t({
            id: 'social-proof',
            name: 'Social proof',
            status: 'analyzed',
            impact: 'low',
            aiFilled: true,
            updated: D,
            value: 'Growing community and positive user testimonials.',
            placeholder: 'Customers, community, testimonials.',
          }),
          t({
            id: 'awards',
            name: 'Awards & recognition',
            status: 'analyzed',
            impact: 'low',
            kind: 'text',
            aiFilled: true,
            updated: D,
            value: 'Shortlisted for a design-tooling award.',
            placeholder: 'Awards or notable recognition.',
          }),
          t({
            id: 'digital-presence',
            name: 'Digital presence',
            status: 'analyzed',
            impact: 'low',
            aiFilled: true,
            updated: D,
            value: 'Active product site and professional social presence.',
            placeholder: 'Web, social, community presence.',
          }),
          t({
            id: 'hiring-trends',
            name: 'Hiring trends',
            status: 'analyzed',
            impact: 'low',
            aiFilled: true,
            updated: D,
            value: 'Public listings suggest growth in engineering and design roles.',
            placeholder: 'What open roles signal about priorities.',
          }),
        ],
      },
    ],
  },
  {
    id: 'documents',
    label: 'Documents & Materials',
    icon: FileAttachmentIcon,
    blurb: 'Artefacts investors will ask you to share.',
    subsections: [
      {
        id: 'investment-docs',
        label: 'Investment material',
        items: [
          t({ id: 'doc-teaser', name: 'Executive teaser', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Short teaser PDF.' }),
          t({ id: 'doc-deck', name: 'Investor presentation', status: 'not_started', impact: 'high', kind: 'upload', placeholder: 'Pitch deck (PDF).' }),
          t({ id: 'doc-im', name: 'Information memorandum', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'IM if available.' }),
          t({ id: 'doc-business-plan', name: 'Business plan', status: 'not_started', impact: 'low', kind: 'upload', placeholder: 'Business plan document.' }),
          t({ id: 'doc-one-pager', name: 'One pager', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'One-pager PDF.' }),
        ],
      },
      {
        id: 'financial-docs',
        label: 'Financial',
        items: [
          t({ id: 'doc-model', name: 'Financial model', status: 'not_started', impact: 'high', kind: 'upload', placeholder: 'Spreadsheet with projections.' }),
          t({ id: 'doc-audited', name: 'Audited financial statements', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Audited statements if available.' }),
          t({ id: 'doc-mgmt-accounts', name: 'Management accounts', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Latest management accounts.' }),
          t({ id: 'doc-bank', name: 'Bank statements', status: 'not_started', impact: 'low', kind: 'upload', placeholder: 'As needed for diligence.' }),
          t({ id: 'doc-budget', name: 'Budget', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Operating budget.' }),
        ],
      },
      {
        id: 'legal-docs',
        label: 'Legal',
        items: [
          t({ id: 'doc-sha', name: 'SHA', status: 'not_started', impact: 'high', kind: 'upload', placeholder: 'Shareholders’ agreement.' }),
          t({ id: 'doc-ssa', name: 'SSA', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Share subscription agreement.' }),
          t({ id: 'doc-term-sheets', name: 'Previous term sheets', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Prior term sheets.' }),
          t({ id: 'doc-esop-plan', name: 'ESOP plan', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'ESOP plan document.' }),
          t({ id: 'doc-cap-table', name: 'Cap table export', status: 'not_started', impact: 'high', kind: 'upload', placeholder: 'Export from your equity tool.' }),
        ],
      },
      {
        id: 'company-docs',
        label: 'Company',
        items: [
          t({ id: 'doc-brochure', name: 'Product brochure', status: 'not_started', impact: 'low', kind: 'upload', placeholder: 'Product brochure.' }),
          t({ id: 'doc-demo', name: 'Product demo', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Demo recording or link sheet.' }),
          t({ id: 'doc-org-chart', name: 'Organisation chart', status: 'not_started', impact: 'low', kind: 'upload', placeholder: 'Org chart.' }),
          t({ id: 'doc-case-studies', name: 'Customer case studies', status: 'not_started', impact: 'medium', kind: 'upload', placeholder: 'Case studies.' }),
          t({ id: 'doc-other', name: 'Other supporting documents', status: 'not_started', impact: 'low', kind: 'upload', placeholder: 'Anything else useful.' }),
        ],
      },
    ],
  },
]

export const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const CURRENCY_SCALES = [
  { id: '', label: '—' },
  { id: 'K', label: 'Thousand' },
  { id: 'M', label: 'Million' },
  { id: 'B', label: 'Billion' },
  { id: 'T', label: 'Trillion' },
] as const
export type CurrencyScale = (typeof CURRENCY_SCALES)[number]['id']

/** Currency fields store `CODE|amount` or scaled `CODE|amount|K|M|B|T`. */
export function parseCurrencyValue(raw: string): {
  currency: CurrencyCode
  amount: string
  scale: CurrencyScale
} {
  const match = raw.match(/^([A-Z]{3})\|([^|]*)(?:\|([KMBT]?))?$/)
  if (match && (CURRENCIES as readonly string[]).includes(match[1])) {
    const scale = (match[3] ?? '') as CurrencyScale
    return {
      currency: match[1] as CurrencyCode,
      amount: match[2] ?? '',
      scale: scale === 'K' || scale === 'M' || scale === 'B' || scale === 'T' ? scale : '',
    }
  }
  // Legacy / plain number
  if (raw && !raw.includes('|') && /^[\d.,\s-]+$/.test(raw.trim())) {
    return { currency: 'USD', amount: raw.trim(), scale: '' }
  }
  return { currency: 'USD', amount: '', scale: '' }
}

export function formatCurrencyValue(
  currency: CurrencyCode,
  amount: string,
  scale: CurrencyScale = '',
): string {
  if (scale) return `${currency}|${amount}|${scale}`
  return `${currency}|${amount}`
}

export function currencyFieldHasValue(raw: string): boolean {
  return Boolean(parseCurrencyValue(raw).amount.trim())
}

export function fieldHasValue(item: ReadinessItem, raw: string): boolean {
  if (item.kind === 'currency') return currencyFieldHasValue(raw)
  // Upload completion is driven by live document state in the page, not static item.status.
  if (item.kind === 'upload') return Boolean(raw.trim())
  if (item.kind === 'founders') return Boolean(raw.trim())
  return Boolean(raw.trim())
}

export type FieldCompletionState = {
  value: string
  confirmed: boolean
  hasConflict: boolean
  docDraft: boolean
  hasAnalyzedDocument: boolean
}

export function fieldIsComplete(item: ReadinessItem, state: FieldCompletionState): boolean {
  if (item.kind === 'upload') return state.hasAnalyzedDocument
  if (!fieldHasValue(item, state.value)) return false
  if (state.hasConflict) return false
  if (item.aiFilled || state.docDraft) return state.confirmed
  return true
}

export type NextActionKind = 'confirm' | 'resolve' | 'fill' | 'upload'

export type NextReadinessAction = {
  id: string
  categoryId: string
  name: string
  kind: NextActionKind
  reason: string
  primaryLabel: string
}

function nextActionKind(item: ReadinessItem, state: FieldCompletionState): NextActionKind {
  if (state.hasConflict) return 'resolve'
  const filled =
    item.kind === 'upload'
      ? state.hasAnalyzedDocument || fieldHasValue(item, state.value)
      : fieldHasValue(item, state.value)
  if (filled && !state.confirmed && (item.aiFilled || state.docDraft)) return 'confirm'
  if (item.kind === 'upload') return 'upload'
  return 'fill'
}

function nextActionReason(item: ReadinessItem, kind: NextActionKind): string {
  if (kind === 'confirm') {
    return 'Silk drafted this and it’s still waiting on a founder check.'
  }
  if (kind === 'resolve') {
    return 'An uploaded document disagrees with the current value.'
  }
  if (item.hint) return item.hint
  if (kind === 'upload') return 'Not in the data room yet.'
  return 'Still empty.'
}

function nextActionLabels(item: ReadinessItem, kind: NextActionKind) {
  if (kind === 'confirm') return { primaryLabel: 'Confirm' }
  if (kind === 'resolve') return { primaryLabel: 'Review' }
  if (kind === 'upload') return { primaryLabel: 'Upload' }
  const noun = item.name.trim()
  return {
    primaryLabel: noun.length <= 18 ? `Add ${noun.toLowerCase()}` : 'Add',
  }
}

/** First unfinished fields in form order — the closest things the founder can do next. */
export function nextReadinessActions(
  stateFor: (item: ReadinessItem) => FieldCompletionState,
  limit = 2,
): NextReadinessAction[] {
  const actions: NextReadinessAction[] = []
  for (const cat of CATEGORIES) {
    for (const item of categoryItems(cat)) {
      const state = stateFor(item)
      if (fieldIsComplete(item, state)) continue
      const kind = nextActionKind(item, state)
      actions.push({
        id: item.id,
        categoryId: cat.id,
        name: item.name,
        kind,
        reason: nextActionReason(item, kind),
        ...nextActionLabels(item, kind),
      })
      if (actions.length >= limit) return actions
    }
  }
  return actions
}

/** Compact controls sit two-across; narratives / uploads / founder lists stay full width. */
export function isCompactField(item: ReadinessItem): boolean {
  const kind = item.kind ?? 'textarea'
  return (
    kind === 'number' ||
    kind === 'currency' ||
    kind === 'percent' ||
    kind === 'months' ||
    kind === 'select' ||
    kind === 'country'
  )
}

/** Pack consecutive compact fields into rows of up to 2; full-width fields alone. */
export function layoutFieldRows(items: ReadinessItem[]): ReadinessItem[][] {
  const rows: ReadinessItem[][] = []
  let compact: ReadinessItem[] = []

  const flushCompact = () => {
    for (let i = 0; i < compact.length; i += 2) {
      rows.push(compact.slice(i, i + 2))
    }
    compact = []
  }

  for (const item of items) {
    if (isCompactField(item)) {
      compact.push(item)
    } else {
      flushCompact()
      rows.push([item])
    }
  }
  flushCompact()
  return rows
}

export function categoryItems(cat: Category): ReadinessItem[] {
  return cat.subsections.flatMap(s => s.items)
}

export function allItems(): ReadinessItem[] {
  return CATEGORIES.flatMap(categoryItems)
}

/** Resolve citation sources for a field — prefers attached sources, else derives from workspace signals. */
export function resolveFieldSources(
  item: ReadinessItem,
  ctx: { website?: string; founders?: { name: string; linkedin?: string }[] } = {},
): FieldSource[] {
  if (item.sources?.length) return item.sources
  if (!item.aiFilled) return []

  const sources: FieldSource[] = []
  const website = ctx.website?.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  if (website) {
    sources.push({
      id: `${item.id}-website`,
      title: website,
      url: `https://${website}`,
      excerpt: `Public company site used to infer “${item.name}”.`,
      kind: 'website',
    })
  }
  for (const f of ctx.founders ?? []) {
    if (!f.linkedin) continue
    const handle = f.linkedin.replace(/^https?:\/\//i, '').replace(/^www\./, '')
    sources.push({
      id: `${item.id}-li-${f.name}`,
      title: f.name,
      url: handle.startsWith('http') ? handle : `https://${handle}`,
      excerpt: `LinkedIn profile referenced for team and company signals.`,
      kind: 'linkedin',
    })
  }
  return sources
}

export function counts(cat: Category) {
  const items = categoryItems(cat)
  const done = items.filter(i => i.status === 'analyzed').length
  return { done, total: items.length, complete: done === items.length }
}

export function overall() {
  const items = allItems()
  const done = items.filter(i => i.status === 'analyzed').length
  const total = items.length
  return { done, total, score: Math.round((done / total) * 100) }
}

export const READINESS_LADDER = ['Not ready', 'Getting there', 'Fundable', 'Investor-ready'] as const

export function ladderIndex(score: number) {
  if (score < 25) return 0
  if (score < 50) return 1
  if (score < 75) return 2
  return 3
}
