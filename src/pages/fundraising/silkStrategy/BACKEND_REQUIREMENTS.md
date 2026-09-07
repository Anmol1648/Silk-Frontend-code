# Backend Requirements Specification: Fundraising Strategy (Phase 2 & Phase 3)

## 1. Executive Summary

This document specifies the complete backend requirements, REST API endpoints, database models, calculation engines, and verification criteria required to replace the static/mock data (`novatechCase`) in **Phase 2 (Raise & Valuation)** and **Phase 3 (Investor Match)** of the **Silk Strategy** feature.

Currently, **Phase 1 (Profile Scorecard)** is connected to the backend API (`GET /api/v1/companies/{companyId}/fundraising/phase1`), while Phase 2 and Phase 3 rely on client-side static seed data. This specification details the backend architecture necessary for full dynamic data serving and computation.

---

## 2. API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/companies/{companyId}/fundraising/phase2` | Fetches Funding Valuation, Raise Recommendations, Peer Comps & Clock. |
| `GET` | `/api/v1/companies/{companyId}/fundraising/phase3` | Fetches Investor Matching, Syndicate Book Structure, Fills & Skips. |
| `GET` | `/api/v1/companies/{companyId}/fundraising/bundle` | *(Optional)* Unified endpoint returning Phase 1, Phase 2, and Phase 3 payloads together. |
| `POST` | `/api/v1/companies/{companyId}/fundraising/phase2/preference` | Saves user-adjusted preferred raise target (locked raise amount). |
| `POST` | `/api/v1/companies/{companyId}/fundraising/phase2/ask` | Side-panel AI Assistant query handler for Phase 2 questions. |
| `POST` | `/api/v1/companies/{companyId}/fundraising/phase3/ask` | Side-panel AI Assistant query handler for Phase 3 questions. |

---

## 3. Phase 2: Funding Valuation & Raise Recommendation API

### Endpoint Specification
`GET /api/v1/companies/{companyId}/fundraising/phase2`

### Request Headers / Query Params
- **Path Parameter**: `companyId` (UUID or string ID)
- **Headers**: `Authorization: Bearer <token>`

### JSON Response Schema

```json
{
  "company_id": "novatech-123",
  "raise": {
    "low": 50.0,
    "high": 60.0,
    "working": 55.0,
    "sentence": "Cash is nil, so the band has to plug the hole and still leave 18–24 months to the next print. Smaller leaves the process exposed. Larger takes dilution this profile cannot defend yet."
  },
  "range": {
    "low": 350.0,
    "high": 500.0
  },
  "dilution": {
    "low": 15.0,
    "high": 20.0
  },
  "runway_after": {
    "low": 18.0,
    "high": 24.0
  },
  "clock": {
    "months_low": 5,
    "months_high": 7,
    "phases": [
      {
        "id": "preparation",
        "name": "Preparation",
        "weeks": 3,
        "why": "Settle cash and the open flags before outreach."
      },
      {
        "id": "outreach",
        "name": "Outreach",
        "weeks": 6,
        "why": "Open the process once the hole is gone."
      },
      {
        "id": "meetings",
        "name": "Meetings",
        "weeks": 4,
        "why": "Defend the range against the peer set."
      }
    ]
  },
  "frame": {
    "sector": "Healthtech",
    "stage": "Series B"
  },
  "median_multiple": 21.8,
  "multiple_kind": "EV/Revenue",
  "revenue_cr": 27.24,
  "implied_at_median": 594.0,
  "premium_or_discount": -0.412,
  "ask_cr": 350.0,
  "peers": [
    {
      "id": "beato",
      "name": "BeatO",
      "year": 2022,
      "stage": "Series B",
      "revenue_cr": 180.0,
      "multiple": 18.4,
      "source": "Tracxn",
      "why": "Same chronic-care, India. Last raise before the re-rating.",
      "fragility": "Four years old. Drop it and the median moves.",
      "journey": [
        {
          "year": 2019,
          "month": 3,
          "stage": "Seed",
          "revenue_cr": 4.0,
          "multiple": null,
          "raise_cr": 11.75,
          "ev_cr": null,
          "source": "Entrackr"
        },
        {
          "year": 2021,
          "month": 6,
          "stage": "Series A",
          "revenue_cr": 25.0,
          "multiple": null,
          "raise_cr": null,
          "ev_cr": null,
          "source": "Entrackr"
        },
        {
          "year": 2022,
          "month": 11,
          "stage": "Series B",
          "revenue_cr": 180.0,
          "multiple": 18.4,
          "raise_cr": 270.0,
          "ev_cr": null,
          "source": "Tracxn"
        }
      ]
    },
    {
      "id": "pb-health",
      "name": "PB Health",
      "year": 2025,
      "stage": "Seed",
      "revenue_cr": 42.0,
      "multiple": 28.0,
      "source": "PitchBook",
      "why": "Closest model. Recent capital event with Fitterfly.",
      "fragility": null,
      "journey": [
        {
          "year": 2025,
          "month": 5,
          "stage": "Seed",
          "revenue_cr": 42.0,
          "multiple": 28.0,
          "raise_cr": 1900.0,
          "ev_cr": null,
          "source": "PitchBook"
        }
      ]
    }
  ],
  "argument": "What this peer set can defend today on FY26 revenue. The median is generous because several prints predate the healthtech re-rating.",
  "use_of_funds": "Stated uses are growth. Almost none goes to debt. Cash was nil at year end, so economically part of the round will plug working capital whatever the deck says.",
  "blocked_by": {
    "parameter_id": "B.7",
    "name": "Runway on liquid cash",
    "summary": "FY26 closing cash is negative. Runway on liquid cash is nil."
  },
  "provisional": true,
  "headline": {
    "kind": "once-settled",
    "raise_low": 50.0,
    "raise_high": 60.0,
    "hole": "Runway on liquid cash"
  },
  "moves": [
    {
      "id": "move-block",
      "name": "Runway on liquid cash",
      "step": "Blocks this raise",
      "action": "FY26 closing cash is negative. Runway on liquid cash is nil.",
      "pointer_id": "B.7"
    },
    {
      "id": "move-peer-beato",
      "name": "BeatO print",
      "step": "Moves the median",
      "action": "Four years old. Drop it and the median moves.",
      "pointer_id": "peer:beato"
    }
  ]
}
```

---

## 4. Phase 3: Investor Matching API

### Endpoint Specification
`GET /api/v1/companies/{companyId}/fundraising/phase3`

### JSON Response Schema

```json
{
  "company_id": "novatech-123",
  "lead": {
    "name": "Healthcare VCs",
    "role": "lead"
  },
  "book": {
    "working": 55.0,
    "sentence": "One healthcare lead and two follows. Not a list of everyone who has ever written a healthtech cheque."
  },
  "raise": {
    "low": 50.0,
    "high": 60.0
  },
  "frame": {
    "sector": "Healthtech",
    "stage": "Series B"
  },
  "types": [
    {
      "id": "healthcare-vc",
      "name": "Healthcare VCs",
      "thesis": "sector",
      "role": "lead",
      "check_cr": { "low": 20.0, "high": 40.0 },
      "sentence": "₹20–40 Cr. They underwrite clinical risk.",
      "why": "India healthcare funds that write Series A and B. This company sells care-management software to enterprises and insurers.",
      "fragile": "Cash is nil. Some of these funds still take a first meeting. They will not term-sheet on this runway.",
      "next": "One of these writes ₹25–35 Cr and sets the terms. If we cannot get a healthcare lead, the book becomes a generalist lead and a slower clock."
    },
    {
      "id": "series-b-generalist",
      "name": "Series B generalists",
      "thesis": "stage",
      "role": "follow",
      "check_cr": { "low": 20.0, "high": 40.0 },
      "sentence": "₹20–40 Cr. They come in after a healthcare lead is in.",
      "why": "They can write the cheque. They do not want to be first on a healthtech story with a 6.8 look and nil cash.",
      "fragile": "If cash settles and a healthcare name is in, they fill ₹15–20 Cr. Without that, they bounce.",
      "next": "Promote them to lead only if the healthcare book is empty. The clock gets longer."
    },
    {
      "id": "family-office",
      "name": "Family offices",
      "thesis": "family",
      "role": "follow",
      "check_cr": { "low": 5.0, "high": 15.0 },
      "sentence": "₹5–15 Cr. The last slice.",
      "why": "Cheques that close a book, not open it. Useful once a lead is in.",
      "fragile": "They do not set terms. Building the process around them wastes the clock.",
      "next": "Keep them for ₹10–15 Cr at the end. Do not put them in the first two weeks of outreach."
    }
  ],
  "skips": [
    {
      "id": "angels",
      "name": "Angels",
      "thesis": "angel",
      "role": "skip",
      "check_cr": { "low": 0.25, "high": 2.0 },
      "sentence": "A ₹1 Cr cheque does not move this book.",
      "why": "Angels write ₹25 L to ₹2 Cr. Right for seed. Wrong for a ₹55 Cr Series B.",
      "fragile": "Founders still take these meetings because they are easy to get.",
      "next": "Do not spend the clock here."
    },
    {
      "id": "micro-vc",
      "name": "Micro VCs",
      "thesis": "micro",
      "role": "skip",
      "check_cr": { "low": 3.0, "high": 8.0 },
      "sentence": "Typical ₹3–8 Cr. They lead seed. They cannot lead this.",
      "why": "India micro VCs write early cheques. A ₹8 Cr cheque is 15% of this raise.",
      "fragile": "They can take the last ₹5 Cr.",
      "next": "Skip them for outreach."
    }
  ],
  "fills": [
    {
      "type_id": "healthcare-vc",
      "label": "Healthcare lead",
      "low": 25.0,
      "high": 35.0
    },
    {
      "type_id": "series-b-generalist",
      "label": "Generalist follow",
      "low": 15.0,
      "high": 20.0
    },
    {
      "type_id": "family-office",
      "label": "Family and existing",
      "low": 10.0,
      "high": 15.0
    }
  ],
  "argument": "A healthcare specialist opens a ₹50–60 Cr Series B in chronic care. Generalists can write the same cheque...",
  "blocked_by": {
    "parameter_id": "B.7",
    "name": "Runway on liquid cash",
    "summary": "FY26 closing cash is negative. Runway on liquid cash is nil."
  },
  "provisional": true,
  "headline": {
    "kind": "once-settled",
    "lead_name": "Healthcare VCs",
    "hole": "Runway on liquid cash"
  },
  "moves": [
    {
      "id": "move-block",
      "name": "Runway on liquid cash",
      "step": "Binds the second meeting",
      "action": "FY26 closing cash is negative. Runway on liquid cash is nil.",
      "pointer_id": "B.7"
    }
  ]
}
```

---

## 5. Backend Engine & Calculation Rules

The backend calculation engine must execute the following logic when computing Phase 2 & 3:

### Rule 1: Blocking Hole Evaluation
1. Evaluate leaf `B.7` (Runway on liquid cash) from Phase 1.
2. If `measured.value <= 0` or `band == 'Poor'` or `B.7` has a critical flag:
   - Set `blocked_by = { parameter_id: "B.7", name: "Runway on liquid cash", summary: "..." }`
   - Set `provisional = true`

### Rule 2: Headline Determination
- **Phase 2 Headline**:
  - `overall_score < 5.0` $\rightarrow$ `kind: "cannot"`
  - `overall_score < 7.0` OR `blocked_by != null` $\rightarrow$ `kind: "once-settled"` (hole = `blocked_by.name` or `"the open hole"`)
  - `overall_score >= 7.0` AND `blocked_by == null` $\rightarrow$ `kind: "can-take"` (hole = `null`)

- **Phase 3 Headline**:
  - `overall_score < 5.0` $\rightarrow$ `kind: "cannot"`
  - `lead == null` $\rightarrow$ `kind: "no-lead"`
  - `overall_score < 7.0` OR `blocked_by != null` $\rightarrow$ `kind: "once-settled"`
  - `overall_score >= 7.0` AND `lead != null` AND `blocked_by == null` $\rightarrow$ `kind: "can-lead"`

### Rule 3: Investor Role Allocation Algorithm
Given `working_raise` (midpoint of raise range in ₹ Cr):
For each investor type in candidate pool:
1. Calculate max share ratio: $\text{share} = \frac{\text{check\_cr.high}}{\text{working\_raise}}$
2. Role Assignment:
   - If `thesis == 'angel'` OR $\text{share} < 0.15$ $\rightarrow$ Role = `'skip'`
   - If `thesis == 'micro'` AND $\text{share} < 0.20$ $\rightarrow$ Role = `'skip'`
   - If `thesis == 'sector'` AND $\text{share} \ge 0.35$ $\rightarrow$ Role = `'lead'`
   - If `thesis == 'stage'` AND $\text{share} \ge 0.35$ AND no sector lead exists $\rightarrow$ Role = `'lead'`
   - Otherwise $\rightarrow$ Role = `'follow'`

---

## 6. Database Schema Design (SQL DDL)

```sql
-- Phase 2 Valuation Seeds & Comps
CREATE TABLE fundraising_valuation_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    raise_low_cr NUMERIC(10,2) NOT NULL,
    raise_high_cr NUMERIC(10,2) NOT NULL,
    range_low_cr NUMERIC(10,2) NOT NULL,
    range_high_cr NUMERIC(10,2) NOT NULL,
    dilution_low_pct NUMERIC(5,2) NOT NULL,
    dilution_high_pct NUMERIC(5,2) NOT NULL,
    runway_after_low_months INT NOT NULL,
    runway_after_high_months INT NOT NULL,
    clock_months_low INT NOT NULL,
    clock_months_high INT NOT NULL,
    median_multiple NUMERIC(6,2) NOT NULL,
    multiple_kind VARCHAR(30) DEFAULT 'EV/Revenue',
    raise_sentence TEXT,
    argument TEXT,
    use_of_funds TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE valuation_peer_comps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valuation_seed_id UUID NOT NULL REFERENCES fundraising_valuation_seeds(id) ON DELETE CASCADE,
    peer_code VARCHAR(50) NOT NULL,
    peer_name VARCHAR(100) NOT NULL,
    comp_year INT NOT NULL,
    stage VARCHAR(50),
    why_comparable TEXT,
    revenue_cr NUMERIC(10,2),
    multiple NUMERIC(6,2),
    source VARCHAR(100),
    fragility TEXT
);

CREATE TABLE valuation_peer_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peer_comp_id UUID NOT NULL REFERENCES valuation_peer_comps(id) ON DELETE CASCADE,
    round_year INT NOT NULL,
    round_month INT,
    stage VARCHAR(50) NOT NULL,
    revenue_cr NUMERIC(10,2),
    multiple NUMERIC(6,2),
    raise_cr NUMERIC(10,2),
    ev_cr NUMERIC(10,2),
    source VARCHAR(100)
);

-- Phase 3 Investor Matching Seeds
CREATE TABLE fundraising_investor_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    book_sentence TEXT,
    argument TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE investor_type_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_seed_id UUID NOT NULL REFERENCES fundraising_investor_seeds(id) ON DELETE CASCADE,
    type_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    thesis VARCHAR(30) NOT NULL, -- 'sector', 'stage', 'family', 'existing', 'angel', 'micro', 'strategic'
    check_low_cr NUMERIC(10,2) NOT NULL,
    check_high_cr NUMERIC(10,2) NOT NULL,
    sentence TEXT,
    why TEXT,
    fragile TEXT,
    next_action TEXT
);

CREATE TABLE investor_fill_seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_seed_id UUID NOT NULL REFERENCES fundraising_investor_seeds(id) ON DELETE CASCADE,
    type_code VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    fill_low_cr NUMERIC(10,2) NOT NULL,
    fill_high_cr NUMERIC(10,2) NOT NULL
);
```

---

## 7. Verification & Acceptance Criteria

1. **Phase 2 Endpoint (`/phase2`)**:
   - Must return valid JSON conforming to the Phase 2 schema.
   - Dynamic calculation of `revenue_cr` * `median_multiple` matches `implied_at_median`.
   - Peer comps array returns historical round points for peer journey curves.
2. **Phase 3 Endpoint (`/phase3`)**:
   - Must assign roles (`lead`, `follow`, `skip`) dynamically based on total raise size and cheque size ranges.
   - Categorizes skip types and active syndicate types into `types` and `skips` arrays.
3. **Response Headers & Security**:
   - Requires valid `Authorization: Bearer <token>` header.
   - Validates that `companyId` exists and belongs to the authenticated user/account scope.
