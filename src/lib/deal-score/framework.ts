import type { ScoreNode } from './types'

/** Deal-attractiveness taxonomy from the Stage 2 scorecard.
 *  Weights and rubrics are the platform rules. They are not company data.
 */
export const DEAL_FRAMEWORK: ScoreNode[] = [
  {
    id: "A",
    name: "Team",
    weight: 0.2,
    children: [
      {
        id: "A.1",
        name: "Founder Profile",
        weight: 0.55,
        children: [
          {
            id: "A.1.a",
            name: "Founder Education",
            weight: 0.2,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Degree directly in the domain from a top-tier institution (IIT / IIM / ISB / NIT / BITS / equivalent global), or a professional qualification that is a licence to operate in this sector.",
        Good: "Top-tier institution but adjacent field, OR domain-specific degree from a credible non-tier-1 institution, OR a recognised domain certification earned while operating.",
        Fair: "Graduate in an unrelated field with no domain qualification, but no evidence the gap has hurt execution.",
        Poor: "No relevant formal education and no substitute credential, in a sector where technical or regulatory literacy is a precondition.",
      },
    },
          },
          {
            id: "A.1.b",
            name: "Founder Industry Network",
            weight: 0.2,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 3, unit: "Count" },
        good: { value: 2, unit: "Count" },
        fair: { value: 1, unit: "Count" },
      },
      labels: {
        Excellent: "≥ 3 Count",
        Good: "≥ 2 Count",
        Fair: "≥ 1 Count",
        Poor: "Fails the Fair cut",
      },
    },
          },
          {
            id: "A.1.c",
            name: "Co-Founder Relationship",
            weight: 0.2,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 6, unit: "Years" },
        good: { value: 4, unit: "Years" },
        fair: { value: 2, unit: "Years" },
      },
      labels: {
        Excellent: "≥ 6 Years",
        Good: "≥ 4 Years",
        Fair: "≥ 2 Years",
        Poor: "Fails the Fair cut",
      },
    },
          },
          {
            id: "A.1.d",
            name: "Founder Industry Experience",
            weight: 0.2,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 10, unit: "Years" },
        good: { value: 6, unit: "Years" },
        fair: { value: 3, unit: "Years" },
      },
      labels: {
        Excellent: "≥ 10 Years",
        Good: "≥ 6 Years",
        Fair: "≥ 3 Years",
        Poor: "Fails the Fair cut",
      },
    },
          },
          {
            id: "A.1.e",
            name: "Prior Startup Experience",
            weight: 0.2,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Founded a prior venture with a realised exit, or scaled one past INR 100 Cr revenue — has been through a full cycle and knows what breaks.",
        Good: "Founded a prior venture that reached institutional funding, whatever the outcome; or a documented, well-handled failure with clear lessons.",
        Fair: "Was among the first 20 employees of a funded startup, or held a senior role through a scaling phase, but has not founded before.",
        Poor: "No startup exposure at all — career entirely in large corporates, government, or family business with no comparable operating stress.",
      },
    },
          }
        ],
      },
      {
        id: "A.2",
        name: "Leadership Team",
        weight: 0.25,
        children: [
          {
            id: "A.2.a",
            name: "Product & technology",
            weight: 0.25,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Full-time product or engineering leader, in seat more than 12 months, has already shipped and scaled a comparable product at the next stage of scale. Owns the roadmap outright — the founder is genuinely free of the function.",
        Good: "Full-time, credible product or tech leader with relevant domain experience, but either under 12 months in seat or running the function for the first time at this scale.",
        Fair: "Interim, fractional or agency-based product and engineering cover — or the founder is still acting CTO/CPO while an active search runs.",
        Poor: "Vacant with no active search, or filled by someone plainly under-qualified, in a company whose product is its primary differentiator.",
      },
    },
          },
          {
            id: "A.2.b",
            name: "Sales & GTM",
            weight: 0.25,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Full-time revenue leader, in seat more than 12 months, has built and quota-carried a team through the next revenue band. Pipeline and forecast discipline are demonstrably theirs, not the founder's.",
        Good: "Full-time, credible sales or GTM leader with relevant channel experience, but either under 12 months in seat or scaling a team for the first time.",
        Fair: "Fractional CRO, commission-only consultants, or the founder is still the primary closer while an active search runs.",
        Poor: "Vacant with no active search, or filled by someone with no experience of this buyer or channel, in a company that must sell its way to the next round.",
      },
    },
          },
          {
            id: "A.2.c",
            name: "Finance",
            weight: 0.25,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Full-time CFO or finance head, in seat more than 12 months, has taken a company through audit, diligence and a funding round. MIS closes monthly without founder involvement.",
        Good: "Full-time, credible finance leader, but either under 12 months in seat or without prior transaction and diligence exposure.",
        Fair: "Outsourced accountant or fractional CFO handling compliance only — no management reporting discipline, or the founder still owns the numbers.",
        Poor: "Vacant with no active search, or books maintained only for statutory filing, in a company already carrying institutional capital.",
      },
    },
          },
          {
            id: "A.2.d",
            name: "Operations",
            weight: 0.25,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Full-time operations leader, in seat more than 12 months, has run this function at several times current volume. Unit economics and service levels are owned and instrumented by them.",
        Good: "Full-time, credible operations leader with relevant sector experience, but either under 12 months in seat or without experience of the next volume step.",
        Fair: "Interim or vendor-managed operations cover, or the founder is still resolving day-to-day exceptions while an active search runs.",
        Poor: "Vacant with no active search, or filled without relevant sector experience, in a business whose margin depends on operational execution.",
      },
    },
          }
        ],
      },
      {
        id: "A.3",
        name: "Board, advisors & investors",
        weight: 0.2,
        children: [
          {
            id: "A.3.a",
            name: "Formal Board",
            weight: 0.333333333333333,
          },
          {
            id: "A.3.b",
            name: "Advisor Quality",
            weight: 0.333333333333333,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 3, unit: "Count" },
        good: { value: 2, unit: "Count" },
        fair: { value: 1, unit: "Count" },
      },
      labels: {
        Excellent: "≥ 3 Count",
        Good: "≥ 2 Count",
        Fair: "≥ 1 Count",
        Poor: "Fails the Fair cut",
      },
    },
          },
          {
            id: "A.3.c",
            name: "Investor Quality",
            weight: 0.333333333333333,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 3, unit: "Count" },
        good: { value: 2, unit: "Count" },
        fair: { value: 1, unit: "Count" },
      },
      labels: {
        Excellent: "≥ 3 Count",
        Good: "≥ 2 Count",
        Fair: "≥ 1 Count",
        Poor: "Fails the Fair cut",
      },
    },
          }
        ],
      }
    ],
  },
  {
    id: "B",
    name: "Financials",
    weight: 0.2,
    children: [
      {
        id: "B.1",
        name: "Revenue Scale",
        weight: 0.1,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 75, unit: "INR Cr" },
        good: { value: 40, unit: "INR Cr" },
        fair: { value: 15, unit: "INR Cr" },
      },
      labels: {
        Excellent: "≥ 75 INR Cr",
        Good: "≥ 40 INR Cr",
        Fair: "≥ 15 INR Cr",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.2",
        name: "Revenue Growth",
        weight: 0.15,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 100, unit: "%" },
        good: { value: 70, unit: "%" },
        fair: { value: 40, unit: "%" },
      },
      labels: {
        Excellent: "≥ 100 %",
        Good: "≥ 70 %",
        Fair: "≥ 40 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.3",
        name: "Gross Margin CM1",
        weight: 0.15,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 55, unit: "%" },
        good: { value: 40, unit: "%" },
        fair: { value: 25, unit: "%" },
      },
      labels: {
        Excellent: "≥ 55 %",
        Good: "≥ 40 %",
        Fair: "≥ 25 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.4",
        name: "Contribution Margin CM2",
        weight: 0.15,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 30, unit: "%" },
        good: { value: 18, unit: "%" },
        fair: { value: 5, unit: "%" },
      },
      labels: {
        Excellent: "≥ 30 %",
        Good: "≥ 18 %",
        Fair: "≥ 5 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.5",
        name: "EBITDA Margin",
        weight: 0.15,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 5, unit: "%" },
        good: { value: -5, unit: "%" },
        fair: { value: -25, unit: "%" },
      },
      labels: {
        Excellent: "≥ 5 %",
        Good: "≥ -5 %",
        Fair: "≥ -25 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.6",
        name: "PAT Margin",
        weight: 0.1,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 0, unit: "%" },
        good: { value: -10, unit: "%" },
        fair: { value: -30, unit: "%" },
      },
      labels: {
        Excellent: "≥ 0 %",
        Good: "≥ -10 %",
        Fair: "≥ -30 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.7",
        name: "Cash Runway",
        weight: 0.075,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 24, unit: "Months" },
        good: { value: 18, unit: "Months" },
        fair: { value: 12, unit: "Months" },
      },
      labels: {
        Excellent: "≥ 24 Months",
        Good: "≥ 18 Months",
        Fair: "≥ 12 Months",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.8",
        name: "Working Capital Cycle",
        weight: 0.075,
        rubric: {
      kind: 'threshold',
      higherIsBetter: false,
      cuts: {
        excellent: { value: 15, unit: "Days" },
        good: { value: 40, unit: "Days" },
        fair: { value: 70, unit: "Days" },
      },
      labels: {
        Excellent: "≤ 15 Days",
        Good: "≤ 40 Days",
        Fair: "≤ 70 Days",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "B.9",
        name: "Debt Level",
        weight: 0.05,
        rubric: {
      kind: 'threshold',
      higherIsBetter: false,
      cuts: {
        excellent: { value: 10, unit: "%" },
        good: { value: 20, unit: "%" },
        fair: { value: 40, unit: "%" },
      },
      labels: {
        Excellent: "≤ 10 %",
        Good: "≤ 20 %",
        Fair: "≤ 40 %",
        Poor: "Fails the Fair cut",
      },
    },
      }
    ],
  },
  {
    id: "C",
    name: "Business Quality",
    weight: 0.1,
    children: [
      {
        id: "C.1",
        name: "Company Age",
        weight: 0.1,
      },
      {
        id: "C.2",
        name: "Revenue Predictability",
        weight: 0.2,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 65, unit: "%" },
        good: { value: 45, unit: "%" },
        fair: { value: 20, unit: "%" },
      },
      labels: {
        Excellent: "≥ 65 %",
        Good: "≥ 45 %",
        Fair: "≥ 20 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "C.3",
        name: "Competitive Moat",
        weight: 0.2,
        children: [
          {
            id: "C.3.a",
            name: "IP & technology",
            weight: 0.2,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Granted patents or registered IP central to the product, or a proprietary data asset a competitor could not rebuild — and the company has shown willingness to enforce it.",
        Good: "Filed applications, or genuinely proprietary technology giving a lead time of more than 12 months, with the core know-how held in-house.",
        Fair: "Accumulated know-how and process advantage that a well-funded competitor could replicate within 6–12 months.",
        Poor: "Off-the-shelf or licensed stack with nothing proprietary; the product is a configuration of tools anyone can buy.",
      },
    },
          },
          {
            id: "C.3.b",
            name: "Network Effects",
            weight: 0.2,
            rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "Each additional user measurably improves the product for the rest, evidenced by cohort retention improving and CAC falling as the base grows.",
        Good: "Real cross-side benefit with marketplace liquidity established in the core geography or category, though not yet visible in CAC.",
        Fair: "Network effects are local or one-sided — they exist within a city or a category but do not travel.",
        Poor: "No network effect. Growth is bought, and the tenth thousand customer gets no more value than the first.",
      },
    },
          },
          {
            id: "C.3.c",
            name: "Brand Strength",
            weight: 0.2,
          },
          {
            id: "C.3.d",
            name: "Customer Stickiness",
            weight: 0.2,
          },
          {
            id: "C.3.e",
            name: "Scale & Cost Advantage",
            weight: 0.2,
          }
        ],
      },
      {
        id: "C.4",
        name: "Scalability",
        weight: 0.15,
      },
      {
        id: "C.5",
        name: "Pricing Power",
        weight: 0.1,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 300, unit: "bps" },
        good: { value: 100, unit: "bps" },
        fair: { value: 0, unit: "bps" },
      },
      labels: {
        Excellent: "≥ 300 bps",
        Good: "≥ 100 bps",
        Fair: "≥ 0 bps",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "C.6",
        name: "Client Concentration",
        weight: 0.1,
        rubric: {
      kind: 'threshold',
      higherIsBetter: false,
      cuts: {
        excellent: { value: 45, unit: "%" },
        good: { value: 65, unit: "%" },
        fair: { value: 80, unit: "%" },
      },
      labels: {
        Excellent: "≤ 45 %",
        Good: "≤ 65 %",
        Fair: "≤ 80 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "C.7",
        name: "Supplier Concentration",
        weight: 0.1,
      },
      {
        id: "C.8",
        name: "Government Regulation",
        weight: 0.05,
        rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "No licensing regime, no price control, no pending adverse legislation; regulation is, if anything, a tailwind.",
        Good: "Light-touch registration or self-certification only, with a stable regime and nothing material in the pipeline.",
        Fair: "A licensed sector with periodic compliance obligations, or a known change in the pipeline whose impact is not yet clear.",
        Poor: "Price-controlled or heavily licensed, dependent on a subsidy or approval that could be withdrawn, or facing live adverse regulatory action.",
      },
    },
      }
    ],
  },
  {
    id: "D",
    name: "Deal Dynamics",
    weight: 0.1,
    children: [
      {
        id: "D.1",
        name: "Raise vs Last Round",
        weight: 0.15,
      },
      {
        id: "D.2",
        name: "Raise vs Total Raised",
        weight: 0.15,
      },
      {
        id: "D.3",
        name: "Existing Investor Contribution",
        weight: 0.2,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 40, unit: "%" },
        good: { value: 25, unit: "%" },
        fair: { value: 10, unit: "%" },
      },
      labels: {
        Excellent: "≥ 40 %",
        Good: "≥ 25 %",
        Fair: "≥ 10 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "D.4",
        name: "Valuation Expectations",
        weight: 0.15,
        rubric: {
      kind: 'threshold',
      higherIsBetter: false,
      cuts: {
        excellent: { value: 0, unit: "%" },
        good: { value: 25, unit: "%" },
        fair: { value: 60, unit: "%" },
      },
      labels: {
        Excellent: "≤ 0 %",
        Good: "≤ 25 %",
        Fair: "≤ 60 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "D.5",
        name: "Founder Dilution",
        weight: 0.1,
      },
      {
        id: "D.6",
        name: "Founder Process Discipline",
        weight: 0.05,
      },
      {
        id: "D.7",
        name: "Use of Proceeds",
        weight: 0.1,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 80, unit: "%" },
        good: { value: 60, unit: "%" },
        fair: { value: 40, unit: "%" },
      },
      labels: {
        Excellent: "≥ 80 %",
        Good: "≥ 60 %",
        Fair: "≥ 40 %",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "D.8",
        name: "Seller Motivation",
        weight: 0.1,
        rubric: {
      kind: 'qualitative',
      labels: {
        Excellent: "A specific, time-bound, board-approved use for the money (committed capex, a signed contract to fund, a defined market entry) with more than 12 months of runway — raising from strength.",
        Good: "A credible growth need with a coherent plan, and enough runway that the timetable is not being set by the bank balance.",
        Fair: "Vague or opportunistic — 'raising because the market is open' — with no specific plan for deployment.",
        Poor: "Distress: under 6 months of runway, or an undisclosed motive such as founder fatigue, a shareholder dispute or a quiet search for an exit.",
      },
    },
      }
    ],
  },
  {
    id: "E",
    name: "Sector Attractiveness",
    weight: 0.1,
    children: [
      {
        id: "E.1",
        name: "Market Size & Growth",
        weight: 0.2,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 10, unit: "US$ Bn" },
        good: { value: 3, unit: "US$ Bn" },
        fair: { value: 1, unit: "US$ Bn" },
      },
      labels: {
        Excellent: "≥ 10 US$ Bn",
        Good: "≥ 3 US$ Bn",
        Fair: "≥ 1 US$ Bn",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "E.2",
        name: "Deal Velocity",
        weight: 0.175,
      },
      {
        id: "E.3",
        name: "Deal Ticket Size",
        weight: 0.175,
      },
      {
        id: "E.4",
        name: "Peer Tenor",
        weight: 0.075,
        rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 8, unit: "Years" },
        good: { value: 5, unit: "Years" },
        fair: { value: 3, unit: "Years" },
      },
      labels: {
        Excellent: "≥ 8 Years",
        Good: "≥ 5 Years",
        Fair: "≥ 3 Years",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "E.5",
        name: "Peer Raise Recency",
        weight: 0.075,
        rubric: {
      kind: 'threshold',
      higherIsBetter: false,
      cuts: {
        excellent: { value: 9, unit: "Months" },
        good: { value: 18, unit: "Months" },
        fair: { value: 30, unit: "Months" },
      },
      labels: {
        Excellent: "≤ 9 Months",
        Good: "≤ 18 Months",
        Fair: "≤ 30 Months",
        Poor: "Fails the Fair cut",
      },
    },
      },
      {
        id: "E.6",
        name: "Active Investors",
        weight: 0.175,
      },
      {
        id: "E.7",
        name: "News Flow & Sentiment",
        weight: 0.125,
        children: [
          {
            id: "E.7.a",
            name: "Peer News Flow",
            weight: 0.5,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 5, unit: "Count" },
        good: { value: 3, unit: "Count" },
        fair: { value: 1, unit: "Count" },
      },
      labels: {
        Excellent: "≥ 5 Count",
        Good: "≥ 3 Count",
        Fair: "≥ 1 Count",
        Poor: "Fails the Fair cut",
      },
    },
          },
          {
            id: "E.7.b",
            name: "Sector News Flow",
            weight: 0.5,
            rubric: {
      kind: 'threshold',
      higherIsBetter: true,
      cuts: {
        excellent: { value: 3, unit: "x" },
        good: { value: 1.5, unit: "x" },
        fair: { value: 0.8, unit: "x" },
      },
      labels: {
        Excellent: "≥ 3 x",
        Good: "≥ 1.5 x",
        Fair: "≥ 0.8 x",
        Poor: "Fails the Fair cut",
      },
    },
          }
        ],
      }
    ],
  },
  {
    id: "F",
    name: "Sub-Sector Attractiveness",
    weight: 0.2,
    children: [
      {
        id: "F.1",
        name: "Market Size & Growth",
        weight: 0.2,
        rubric: {
          kind: 'threshold',
          higherIsBetter: true,
          cuts: {
            excellent: { value: 10, unit: 'US$ Bn' },
            good: { value: 3, unit: 'US$ Bn' },
            fair: { value: 1, unit: 'US$ Bn' },
          },
          labels: {
            Excellent: '≥ 10 US$ Bn',
            Good: '≥ 3 US$ Bn',
            Fair: '≥ 1 US$ Bn',
            Poor: 'Fails the Fair cut',
          },
        },
      },
      {
        id: "F.2",
        name: "Deal Velocity",
        weight: 0.2,
      },
      {
        id: "F.3",
        name: "Deal Ticket Size",
        weight: 0.2,
      },
      {
        id: "F.4",
        name: "Peer Tenor",
        weight: 0.1,
        rubric: {
          kind: 'threshold',
          higherIsBetter: true,
          cuts: {
            excellent: { value: 8, unit: 'Years' },
            good: { value: 5, unit: 'Years' },
            fair: { value: 3, unit: 'Years' },
          },
          labels: {
            Excellent: '≥ 8 Years',
            Good: '≥ 5 Years',
            Fair: '≥ 3 Years',
            Poor: 'Fails the Fair cut',
          },
        },
      },
      {
        id: "F.5",
        name: "Peer Raise Recency",
        weight: 0.1,
        rubric: {
          kind: 'threshold',
          higherIsBetter: false,
          cuts: {
            excellent: { value: 9, unit: 'Months' },
            good: { value: 18, unit: 'Months' },
            fair: { value: 30, unit: 'Months' },
          },
          labels: {
            Excellent: '≤ 9 Months',
            Good: '≤ 18 Months',
            Fair: '≤ 30 Months',
            Poor: 'Fails the Fair cut',
          },
        },
      },
      {
        id: "F.6",
        name: "Active Investors",
        weight: 0.2,
      }
    ],
  },
  {
    id: 'G',
    name: 'Mandate',
    weight: 0.1,
    children: [
      { id: 'G.1', name: 'Sector knowledge & relationships', weight: 0.2 },
      { id: 'G.2', name: 'GTM timeline', weight: 0.2 },
      { id: 'G.3', name: 'Timeline to close', weight: 0.2 },
      { id: 'G.4', name: 'Team capacity', weight: 0.2 },
      { id: 'G.5', name: 'Deal size', weight: 0.2 },
    ],
  },
]
