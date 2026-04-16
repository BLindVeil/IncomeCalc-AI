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

**Single evergreen identity + light/dark mode.** The 5-theme picker (Cinematic, Deep Sea, Aurora, Ember, Prism) was removed in the Phase 1 visual identity overhaul; theme picker UI and `Theme` / `THEMES` exports are gone.

**Evergreen palette constants** (exported from `src/lib/app-shared.ts`):

| Token | Hex |
|---|---|
| `EV_50`  | `#F1FAF4` |
| `EV_100` | `#D8F3DC` |
| `EV_200` | `#B7E4C7` |
| `EV_300` | `#95D5B2` |
| `EV_400` | `#74C69D` |
| `EV_500` | `#52B788` |
| `EV_600` | `#40916C` |
| `EV_700` | `#2D6A4F` |
| `EV_800` | `#1B4332` (PRIMARY) |
| `EV_900` | `#081C15` |

**ThemeConfig shape** (now expanded): `{ name, icon, primary, primaryHover, primarySoft, accent, bg, cardBg, text, muted, subtle, border, borderStrong, headerBg, success, warning, danger }`.

**Typography**: Geist Sans body / Geist Mono for numeric displays (loaded via Google Fonts in `src/styles.css`). The `MONO_FONT_STACK` constant is exported from `app-shared.ts` for Phase 2 rollout.

**Theme resolution**: `buildTheme(isDark)` returns the evergreen `ThemeConfig` for the current mode. `applyDark(theme, isDark)` is preserved as a backwards-compatible alias that delegates to `buildTheme`. Every component still receives `t: ThemeConfig` and `isDark: boolean`.

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

IncomeCalc AI is not a generic AI finance app, a budgeting dashboard, or a broad personal finance platform.

It is a **financial clarity and scenario engine** focused on one core value:

**helping users understand what their life actually costs, what they can afford, and what to change next.**

### Core Thesis

The product should become the **decision-support layer for lifestyle affordability and financial clarity**.

The goal is to help users quickly understand:

- what their current lifestyle costs
- what income they need
- what is making their situation harder
- which changes improve their position the most
- what realistic next steps make sense

### Job To Be Done

The core user job is not:

- “calculate my finances”
- “track my budget”
- “use an AI tool”

The real job is:

**“Help me know whether my current or desired life is financially realistic, and show me what to change.”**

Every feature should support that job.

### Product Experience Standard

The core product experience should feel like:

**Diagnosis → Simulation → Decision**

Not just:

**Input → Output**

The product should help the user:

1. enter their real situation
2. understand where they stand
3. test meaningful scenarios
4. see which changes matter most
5. leave with more confidence about what to do next

### Current Product Wedge

The current best wedge is **consumer financial clarity**.

The product should help individuals make decisions around:

- affordability
- income targets
- expense tradeoffs
- savings pressure
- debt pressure
- lifestyle changes
- “can I afford this?” decisions

This is stronger than building a generic finance tool.

### What To Optimize For

Prioritize features that improve one or more of these:

1. **Clarity**  
   The result should be instantly understandable. Users should quickly see where they stand, what hurts most, and what helps most.

2. **Diagnosis quality**  
   The AI Financial Diagnosis is the flagship feature and should feel sharp, useful, and specific.

3. **Scenario depth**  
   Users should be able to test meaningful life changes, not just view static numbers.

4. **Repeat usage**  
   The product should give users reasons to come back and compare new scenarios over time.

5. **Trust**  
   Outputs should feel grounded, structured, and safe enough to rely on for planning decisions.

6. **Premium conversion**  
   Premium should unlock deeper insight, stronger comparisons, and more valuable decision support.

### What Not To Build

Avoid expanding into unrelated financial software categories such as:

- account syncing
- investment tracking
- budgeting dashboards
- full financial planning suites
- generic AI assistant features
- broad productivity features
- anything that adds complexity without improving decisions

Do not chase “AI for everyone.”

Do not build vague automation or shallow AI wrappers.

### Feature Filter

A feature is worth building only if it improves one or more of these:

- financial clarity
- diagnosis quality
- scenario exploration
- trust in the output
- repeat usage
- premium conversion

If it does not strengthen the core job, it is likely a distraction.

### Strategic Direction

The current best path is:

**consumer wedge first → stronger scenario engine → deeper premium value → professional enablement later**

Do not build for professionals first.

The longer-term opportunity may include tools for:

- financial coaches
- advisors
- accountants
- real estate teams
- relocation advisors
- debt consultants

But that comes later, after the consumer product proves strong demand and repeat use.

### Product Moat Direction

The moat is not “we use AI.”

The moat should become:

- a better diagnosis flow
- a stronger reveal moment
- more useful scenario comparisons
- saved context and history
- action-oriented outputs
- trusted decision support
- eventually, advisor/client workflow

### Operating Principle

**IncomeCalc AI should become the fastest, clearest way for someone to understand what their life costs, what they can afford, and what to do next.**