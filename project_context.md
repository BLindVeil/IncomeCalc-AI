# Ascentra — Project Context (Strategy & Market)

**Last validated: July 2026.** If more than ~6 months have passed, re-verify the market section before making strategic decisions from this doc.

This document is the *why* behind Ascentra. For guardrails and coding rules, see `CLAUDE.md` (auto-loaded). For codebase reference, see `ARCHITECTURE.md`.

---

## Core purpose

Ascentra tells financially anxious people where they actually stand and the single next move that matters — one honest diagnosis, paid once, no subscription, no tracking homework.

It is a **financial clarity and diagnosis engine**, not a finance app. The experience is:

**Diagnosis → Simulation → Decision** (not Input → Output)

## The job to be done

The real user job is not "calculate my finances," "track my budget," or "use an AI tool." It is:

**"Tell me if my life is financially realistic, what's actually hurting me, and what to change first."**

Every feature, copy decision, and prompt must serve that job.

## Business model — SETTLED

**One-time payment. Pay once, get your full diagnosis.** This decision is final for the current phase.

- The subscription tier system (free/pro/premium) is legacy. The codebase still contains tier logic mid-migration — see the refactor spec. Do not extend it; migrate away from it.
- One-time pricing is a *positioning weapon*, not a compromise: every major competitor (Monarch, Copilot, Rocket Money, YNAB) is a subscription tracker, and subscription fatigue is a documented complaint against all of them. "Pay once, no subscription" is a headline differentiator, not fine print.
- "Repeat usage" is no longer a top-level optimization goal. A user can return for a fresh diagnosis after life changes, but the product does not need engagement loops to justify recurring billing — because there is none.

## Current phase — distribution-first

No new feature work during this window. The recurring bottleneck across all of Jack's ventures is distribution, not build capacity. The product is sufficient; the audience is not.

Allowed work: bug fixes, conversion-critical funnel fixes, copy, PostHog instrumentation, and assets serving the TikTok content flywheel.

Milestone gate: consistent revenue ($3–5K/month) is the prerequisite before institutional investor outreach (Z Fellows is the immediate target before that bar).

---

## Market context (July 2026) — why this product, why now

### The pain is massive and emotional, not informational

- 63% of Americans live paycheck to paycheck; 90% of those have less than $500/mo left after expenses (CNBC/SurveyMonkey, July 2026).
- 53% worry about money daily, up from 44% in 2021 (Ramsey State of Personal Finance, 2026).
- 88% of US adults reported financial stress entering 2026; 77% had a financial setback in 2025 (NEFE).
- Financial stress hits people who *look* stable on paper — even $150K+ households report living paycheck to paycheck (BofA via Fortune, 2026). The press is calling the paper-vs-feelings gap "money dysmorphia." **That gap is literally a diagnostic problem. That is our lane.**

### The hierarchy insight — who we build for

MX Research (March 2026) frames a "Hierarchy of Financial Health": **stability** (covering bills) → **progress** (debt, credit, first savings) → **long-term security** (investing, wealth). Most fintech builds for the top. The mass market is stuck at the bottom two levels — and only 12% of consumers achieved all their 2025 financial goals.

**Ascentra's user lives at stability/progress.** Top 2026 consumer resolutions: pay down debt (42%), follow a budget (39%), improve credit (36%) — plain, unsexy goals. Write copy and diagnosis prompts for this person, not for FIRE optimizers.

The gap for this user is not information. It's that they don't know **where they actually stand** or **what to fix first**. The winning move per Ramsey's own framing: money success is ~80% behavior, ~20% knowledge. Jack's psychology background is the credibility asset here — no competitor in the Mint-successor tier owns "behavioral diagnostic."

### Competitive landscape

- Mint is dead (shut down early 2024). Weekly personal finance app usage is at an all-time high (~38% of US adults per Fed surveys via TechBullion, 2026). The audience got absorbed by Monarch, Copilot, Rocket Money, YNAB, Empower, and Apple Wallet.
- All of those are **subscription trackers**. Ascentra is not competing to be the 13th dashboard. It is the *checkup* you take before/instead of committing to a dashboard.
- Origin's documented weaknesses (see competitor research) remain the sharpest direct-positioning contrast.
- Consumers want proactive guidance, not data display — but demand transparency and "human guardrails" when money is involved (Plaid 2026 trends). Trust and explainability beat AI magic. Structured, grounded diagnosis output is the moat direction, not chat.

### Regulatory tailwind (watch, don't build yet)

CFPB Section 1033 data-portability rules begin phased implementation in 2026, giving consumers an enforceable right to share financial data with third-party apps. This may eventually lower the cost of an *optional* one-shot data import for diagnosis. It does NOT change the no-tracker rule — if ever used, it would be a single snapshot import, never continuous syncing. Not for this phase.

---

## What to optimize for (in order)

1. **Clarity** — instantly understandable results: where you stand, what hurts most, what helps most
2. **Diagnosis quality** — the AI Financial Diagnosis is the flagship; it must feel sharp, specific, and personal
3. **One-time conversion** — the diagnosis reveal must justify the one-time price on its own
4. **Trust** — grounded, structured, explainable outputs safe enough to act on
5. **Scenario depth** — test meaningful life changes, not static numbers

## What NOT to build

Account syncing, budgeting dashboards, investment tracking, subscription tiers, generic AI assistants, full planning suites, professional/advisor tools (deferred), broad productivity features. Do not chase "AI for everyone." Do not build vague automation or shallow AI wrappers.

**Feature filter:** a feature earns its place only if it strengthens clarity, diagnosis quality, scenario exploration, trust, or one-time conversion. Otherwise it is a distraction — including good ideas.

## Strategic sequence

Consumer wedge (now, distribution-first) → stronger diagnosis + reveal moment → deeper scenario engine → professional enablement *later*, only after consumer demand is proven with revenue.

## Operating principle

**Ascentra should be the fastest, clearest way for someone to understand what their life costs, what they can afford, and what to do next — for a single honest price.**

---

## Maintenance rule for this document

When Claude Code proposes something this doc can't cleanly rule in or out, that's a missing line — add one line, then. Re-validate the market section every ~6 months. Update "Last validated" date on every meaningful edit.
