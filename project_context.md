# IncomeCalc AI — Project Context

Use this document to restore full codebase context in a new AI chat session.

## Tech Stack

- **Framework**: React 19 + TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4 + Radix UI primitives (but all component code uses inline styles, not Tailwind classes)
- **Build**: Vite (rolldown-vite), TypeScript 5.8
- **State**: Zustand v5
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts v2.15
- **Toasts**: Sonner v2
- **Backend**: Vercel serverless functions (`api/*.ts`)
- **Payments**: Stripe
- **Analytics**: PostHog
- **Error tracking**: Sentry
- **Icons**: Lucide React

## Project Structure

```
├── api/
│   ├── ai.ts                 # AI endpoint (POST /api/ai)
│   └── entitlement.ts        # Plan verification endpoint
├── src/
│   ├── routes/
│   │   └── index.tsx          # Monolithic main app (~8000+ lines, all pages)
│   ├── lib/
│   │   ├── app-shared.ts      # Shared types, themes, constants, helpers
│   │   ├── calc.ts            # Core calculation engine (ExpenseData, CalcOutput)
│   │   ├── diagnosis-types.ts # AI diagnosis types & JSON parser
│   │   ├── entitlements.ts    # Plan tier logic (free/pro/premium + dev override)
│   │   ├── stabilityMetrics.ts# Income gap, runway, alerts
│   │   ├── auth-store.ts      # User/session management
│   │   ├── forecast.ts        # 12-month cashflow projection
│   │   ├── fireCalc.ts        # FIRE retirement estimator
│   │   ├── debt.ts            # Debt payoff (snowball/avalanche)
│   │   ├── fi.ts              # Financial independence date
│   │   ├── planRules.ts       # Deterministic Q&A fallback
│   │   ├── analytics.ts       # PostHog event tracking
│   │   ├── stripe-entitlements.ts
│   │   ├── sentry.ts
│   │   └── utils.ts
│   ├── components/
│   │   ├── pages/
│   │   │   ├── ResultsPage.tsx    # Main results display (AI components, premium gates)
│   │   │   ├── CheckoutPage.tsx   # Stripe payment flow
│   │   │   ├── SimulatorPage.tsx  # Scenario comparison
│   │   │   └── CheckInPage.tsx    # Monthly snapshot tracking
│   │   ├── ai/
│   │   │   ├── AIFinancialInsights.tsx     # 3 insights + risk + optimization + projection
│   │   │   ├── AIBudgetInsights.tsx        # 4 budget optimization tips
│   │   │   ├── AIIncomeIdeas.tsx           # 4 income ideas with difficulty
│   │   │   ├── AIChat.tsx                  # Multi-turn advisor modal
│   │   │   ├── FinancialDiagnosisSection.tsx  # Premium diagnosis wrapper
│   │   │   ├── FinancialDiagnosisCard.tsx     # Diagnosis result renderer
│   │   │   └── DiagnosisToneSelector.tsx      # Direct/Supportive/Disciplined picker
│   │   ├── ui/                 # ~45 shadcn/Radix components
│   │   └── Header.tsx
│   └── styles.css              # Global CSS (locked overlays, glass effects, buttons)
├── vercel.json
└── package.json
```

## Core Data Model

### ExpenseData (src/lib/calc.ts)

```ts
interface ExpenseData {
  housing: number; food: number; transport: number; healthcare: number;
  utilities: number; entertainment: number; clothing: number; savings: number; other: number;
}
```

### CalcOutput (src/lib/calc.ts)

Returned by `computeForExpenses(data, taxRate)`:

```ts
interface CalcOutput {
  monthlyExpensesTotal: number;
  annualGrossRequired: number;
  grossMonthlyRequired: number;
  hourlyRequired: number;
  emergencyFundTarget: number;
  taxMonthly: number;
  fragilityScore: number;        // 0-100
  healthScore: number;           // 0-100
  healthLabel: string;           // "Excellent" | "Good" | "Fair" | "Needs Work"
  ratios: { rentRatio, debtRatio, transportRatio, savingsRatio, entertainmentRatio };
  subScores: { cashflowStability, debtRisk, savingsStrength, incomeFragility };
}
```

### FinancialDiagnosis (src/lib/diagnosis-types.ts)

```ts
type DiagnosisTone = "direct" | "supportive" | "disciplined";
type DiagnosisAction = { title: string; explanation: string; impact: "low"|"medium"|"high"; difficulty: "easy"|"moderate"|"hard" };
type FinancialDiagnosis = {
  mainIssue: string; summary: string; riskLevel: "low"|"medium"|"high";
  topMoves: DiagnosisAction[];
  ifUnchanged30d: string; ifOptimized30d: string; ifUnchanged12m: string; ifOptimized12m: string;
  verdict: string; cutFirst?: string[]; hiddenStrength?: string; toneUsed: DiagnosisTone;
};
```

`parseDiagnosis(raw)` validates AI JSON into this shape, returning `null` on failure.

## Pages & Navigation

All pages rendered via `page` state string in the main App component (`src/routes/index.tsx`):

`landing` | `calculator` | `results` | `checkout` | `simulator` | `checkin` | `fire` | `forecast` | `debt` | `fi` | `dashboard` | `share` | `dev-access` | `digest-preview`

## ResultsPage Architecture

**File**: `src/components/pages/ResultsPage.tsx`

**Key props**: `data`, `taxRate`, `currentGrossIncome`, `userTier`, `onUpgrade`, `isDark`, `currentTheme`, plus navigation callbacks.

**Computation**: Calls `computeForExpenses(data, taxRate)` at the top to derive all financial metrics.

**AI component render order** (after main results hero):
1. `FinancialDiagnosisSection` — Premium diagnosis with tone selector, KPI snapshot, signals, gated sections
2. `AIFinancialInsights` — 3 insights + risk warning + optimization + 10yr projection
3. `AIBudgetInsights` — 4 budget tips
4. `AIIncomeIdeas` — 4 income ideas with range/difficulty

## AI Endpoint (api/ai.ts)

**POST /api/ai** with `{ feature, input }`.

Features:
| Feature | Provider Preference | Output |
|---|---|---|
| `incomeIdeas` | Anthropic | `{ ideas: IncomeIdea[] }` |
| `budgetInsights` | Anthropic | `{ insights: string[] }` |
| `financialInsights` | Anthropic | `{ insights, riskWarning, optimization, projection }` |
| `financialDiagnosis` | Anthropic (1200 tokens) | `FinancialDiagnosis` JSON |
| `advisor` | OpenAI (gpt-4.1) | `{ reply: string }` |

Helper functions: `callAI(system, user, preferOpenAI, maxTokens)`, `callAnthropic(system, msgs, maxTokens)`, `callOpenAI(msgs)`.

## AI Component Pattern

All AI components follow this pattern:
1. Local state: `loading`, `generated`, `error`, `result`
2. SessionStorage cache with 5-minute TTL
3. Fetch `/api/ai` on button click
4. Three UI states: not-generated (button), loading (spinner), success (rendered sections)
5. Error state with retry button
6. Refresh/regenerate button in header after generation

## AI Financial Diagnosis Feature

**Premium flagship feature** with monetization gate.

**Components**:
- `FinancialDiagnosisSection` — Outer wrapper: tone selector, generate button, loading/error states, passes `userTier`/`onUpgrade` through
- `FinancialDiagnosisCard` — Result renderer with premium gating:
  - **All users see**: Financial Snapshot (grid), Risk Badge, Main Issue, Why This Matters, Diagnosis Signals (derived pills), first action
  - **Free users**: Preview progress bar ("1 of 6 insights shown") + blurred locked overlay with upgrade CTA
  - **Premium users**: Full actions, scenario comparison (30d/12m), cut first, hidden strength, verdict, copy button

**Diagnosis Signals**: Derived client-side from financial data (housing %, savings rate, fixed expense ratio, surplus sign, income vs savings ratio). No AI call needed.

## Tier & Premium Gating

**Types**: `UserTier = "free" | "pro" | "premium"`, `PlanId = "pro" | "premium"`

**Entitlements** (`src/lib/entitlements.ts`):
- `getPlan()` — returns tier (dev override via `localStorage.dev_override` wins)
- `hasProAccess()` — pro or premium
- `hasPremiumAccess()` — premium only

**Locked overlay pattern** (used in ResultsPage and DiagnosisCard):
```tsx
<div style={{ position: "relative", overflow: "hidden" }}>
  <div style={{ filter: "blur(5px)", pointerEvents: "none" }}>{content}</div>
  <div className="atv-locked-overlay" style={{ position: "absolute", inset: 0 }}>
    <Lock className="atv-lock-icon-glow" />
    <button onClick={() => onUpgrade("premium")} className="atv-btn-primary">Unlock</button>
  </div>
</div>
```

**CSS classes**: `atv-locked-overlay`, `atv-lock-icon-glow`, `atv-btn-primary`, `atv-glass`, `atv-glass-static`, `atv-accent-bar` (defined in `src/styles.css`)

## Theme System

**Themes**: `default` (Cinematic), `ocean` (Deep Sea), `forest` (Aurora), `sunset` (Ember), `lavender` (Prism)

**ThemeConfig shape**: `{ name, primary, accent, bg, cardBg, text, muted, border, headerBg }`

Every component receives `t: ThemeConfig` and `isDark: boolean`. Dark mode applies via `applyDark(theme, isDark)`.

## Styling Pattern

**All component code uses inline CSS** (`style={}` props), not Tailwind utility classes. New components must match this pattern. Theme colors are applied via the `t` object (e.g., `t.cardBg`, `t.border`, `t.text`, `t.muted`).

## Storage Keys

| Key | Storage | Purpose |
|---|---|---|
| `incomecalc-tier` | localStorage | User plan tier |
| `dev_override` | localStorage | Dev tier override |
| `incomecalc-scenarios` | localStorage | Saved scenarios |
| `incomecalc-snapshots` | localStorage | Check-in history |
| `incomecalc-user` | localStorage | Current user |
| `ai_cache_*` | sessionStorage | 5-min AI response cache |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production build |
| `npm run check` | TS + lint + format |
| `npm run test` | Vitest tests |
| `npm run dev:local` | Vercel local dev |

## Known Issues

- Pre-existing TS error in `src/routes/index.tsx` (~line 2983): `signOut` does not exist on `auth-store` — unrelated to AI features, does not block build.

## Key Constraints for Editing

1. **Do not bloat `src/routes/index.tsx`** — prefer creating focused components in `src/components/`
2. **Match inline style pattern** — no Tailwind classes in components
3. **Reuse `computeForExpenses()`** as the single source of truth for calculations
4. **Reuse existing AI endpoint** (`/api/ai`) by adding new feature cases
5. **Follow the AI component pattern**: local state, sessionStorage cache, fetch on click, loading/error/success states
6. **Use existing premium gate pattern**: blur + `atv-locked-overlay` + `atv-btn-primary`
7. **Pass theme via props** (`t: ThemeConfig`, `isDark: boolean`)

## Product Strategy

IncomeCalc AI is focused on one core value: financial clarity.

The product should avoid expanding into a full financial dashboard or budgeting platform.

The core engine is the AI Financial Diagnosis.

Development priorities:

1. Improve diagnosis clarity and insight quality
2. Improve conversion from free preview to premium
3. Improve scenario exploration (simulator)

Avoid adding unrelated financial tools such as:

- account syncing
- investment tracking
- budgeting dashboards
- complex financial planning systems

If a feature does not improve financial clarity, diagnosis quality, or premium conversion, it should not be added.

## UI Design System

The UI follows a consistent visual language designed for clarity and financial insight.

### Layout Style

The interface prioritizes:

- clear financial data presentation
- structured sections
- readable financial insights
- minimal visual noise

Components typically use:

- rounded containers
- subtle borders
- light gradients for emphasis
- clear section separation

Avoid overly complex layouts.

---

### Styling Approach

All components use **inline style objects**, not Tailwind classes.

Example pattern:

```ts
const style = {
  padding: "16px",
  borderRadius: "12px",
  background: t.cardBg,
  border: `1px solid ${t.border}`,
};
```

Maintain this pattern when creating new components.

---

### Section Structure

Most UI sections follow this pattern:

1. Section label
2. Primary insight or metric
3. Supporting explanation
4. Optional action items

Example sections:

- Financial Snapshot
- Main Issue
- Why This Matters
- Highest-Impact Actions
- Scenario Comparison

---

### Financial Data Presentation

Financial information should be:

- easy to scan
- structured
- visually separated

Preferred patterns:

- KPI strips
- small stat blocks
- signal tags/pills
- ranked lists of actions

Avoid large paragraphs of text.

---

### Premium Gating

Premium content is visually gated using:

- blur overlays
- lock icons
- upgrade CTA buttons

Free users should always see **a preview of value before the gate**.

This is important for conversion.

---

### Color Meaning

Colors communicate financial meaning:

Green:
positive financial health

Amber:
warning / improvement opportunity

Red:
financial risk or imbalance

Purple gradient:
AI insight / premium features

These colors should remain consistent across the app.

---

### AI Content Presentation

AI-generated content should always be:

- structured
- broken into sections
- easy to scan

Avoid dumping raw AI paragraphs into the UI.

Instead present insights as:

- headlines
- bullet points
- ranked lists
- signal tags

## React Component Editing Guidelines

When modifying React components in this project, follow these rules.

### Prefer modifying existing components

Before creating new components, check whether functionality belongs in:

- ResultsPage
- FinancialDiagnosisSection
- FinancialDiagnosisCard

Avoid unnecessary component splitting.

---

### Keep financial logic outside UI components

Financial calculations must remain in:

src/lib/

Examples include:

- calc.ts
- fireCalc.ts
- forecast.ts
- stabilityMetrics.ts

UI components should only display calculated values.

---

### Maintain the section layout pattern

Most insight sections follow this structure:

1. Section label
2. Primary insight or metric
3. Supporting explanation
4. Optional action items

Avoid rendering large AI-generated paragraphs directly in the UI.

---

### Avoid large component rewrites

When editing components:

- change the smallest possible amount of code
- maintain the existing structure
- avoid rewriting entire files unless explicitly instructed

---

### Keep AI-related UI inside the AI components folder

AI insight components belong in:

src/components/ai/

Examples:

- FinancialDiagnosisSection
- FinancialDiagnosisCard
- DiagnosisToneSelector

Do not place AI insight UI in unrelated components.

---

### Preserve premium gating behavior

Premium gating is critical to the product.

Do not remove or bypass:

- blur overlays
- lock overlays
- upgrade prompts
- free preview limits

Free users must always see a preview before gated content.

---

### Preserve the inline styling pattern

All components use inline style objects.

Example pattern:

```ts
const style = {
  padding: "16px",
  borderRadius: "12px",
  background: t.cardBg,
  border: `1px solid ${t.border}`,
};
```

Do not replace this pattern with Tailwind utility classes.

## Protected Systems — Do Not Modify Without Explicit Approval

The following systems are considered high-risk and must not be changed unless explicitly instructed.

### Stripe / Billing (protected)

Do not modify any Stripe-related logic unless the task is specifically about billing or checkout.

Protected areas include:

- checkout session creation
- pricing plan mapping
- premium entitlement logic
- purchase restore logic
- webhook handling
- billing redirects
- Stripe-related environment variables
- auth headers used by billing endpoints

Examples of protected files and logic include:

- api routes related to Stripe
- stripe entitlement helpers
- purchase restore helpers
- checkout handlers
- pricing / plan tier mapping

Rules:

- Do not rename Stripe-related functions
- Do not change request payload shapes
- Do not change success/cancel redirect behavior
- Do not change premium entitlement behavior
- Do not refactor Stripe code during unrelated tasks
- Do not "clean up" billing code unless explicitly instructed
- If another task appears to require a Stripe change, stop and explain why before editing

### Auth / Session (protected)

Do not modify authentication, session, or user identity logic unless explicitly instructed.

Protected areas include:

- auth store logic
- sign-in / sign-out behavior
- session tokens
- authorization headers
- user tier lookup
- premium access checks

Rules:

- Do not change auth flows during unrelated feature work
- Do not remove or rename auth helpers
- Do not change token/header behavior unless the task is explicitly auth-related

### Vercel API Routing (protected)

Do not modify serverless route structure unless explicitly instructed.

Protected areas include:

- `api/ai.ts`
- Stripe-related serverless endpoints
- endpoint paths used by frontend fetch calls

Rules:

- Do not rename endpoints
- Do not change route paths
- Do not split or merge endpoints unless explicitly instructed

## Local Development Note

AI and other `/api` routes do not work under plain `npm run dev` because Vite serves the frontend only.

Use:

- `npm run dev` for frontend-only UI work
- `npx vercel dev` for AI, Stripe, and any serverless API route testing
