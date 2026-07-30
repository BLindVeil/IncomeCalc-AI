# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed primary audiences, served by the same core calculation:

1. **People with variable or self-employed income** — freelancers, contractors, gig and commission workers with no fixed salary, who need to know what they must earn to stay solvent rather than what they happened to spend last month.
2. **People facing a specific financial decision** — weighing a job offer, a move, a career switch, or going independent, who need to know whether the numbers work *before* committing.

Both arrive with a question that has a numeric answer, not a desire to browse dashboards. No other audience has been confirmed.

## Product Purpose

Ascentra turns a person's real expenses into the single gross income figure they actually need, plus a stability read on their current position and a ranked next action.

Success is a user reaching a defensible number and one concrete next move in a single short session, without connecting external accounts.

## Positioning

The product returns **one number and one ranked next move**, rather than a set of dashboards the user must interpret themselves. Ranking every possible change by real dollar impact — so effort goes where it actually shifts the number — is the mechanism a general budgeting app does not offer.

The stated contrast in existing product copy is against spreadsheets and multi-dashboard budgeting apps.

## Operating Context

- Runs entirely in the browser as a static SPA with serverless functions; no install, no account required to reach a first result.
- Users arrive with expense figures either known or estimable from memory, and enter them manually.
- Sessions are short and decision-driven. The landing surface claims a first answer in about 60 seconds, measured from a blank start with no account.
- Results are revisited over time through a monthly check-in and saved scenarios.

## Capabilities and Constraints

**Confirmed capabilities**

- Required monthly gross income derived from rent, debt, food, savings target and an estimated tax rate.
- Financial health and stability score, composed from runway, debt ratio and savings rate.
- Top move ranked by dollar impact.
- Scenario comparison and simulation before committing to a change.
- Twelve-month cashflow forecast; debt payoff modelling (snowball and avalanche); FIRE / financial-independence estimation.
- AI features: income ideas, budget insights, multi-turn advisor chat, and a financial diagnosis with a selectable tone (direct / supportive / disciplined).
- Monthly check-in for tracking a position over time; saved and shareable scenarios.

**Confirmed constraints**

- Two access levels — Free ($0) and the one-time Full Diagnosis purchase ($29, via Stripe). There is no subscription; "pay once, no subscription" is a headline positioning claim. Feature access is gated free vs. paid.
- AI features depend on an external provider key (OpenAI and/or Anthropic). With neither configured they degrade to an explicit "AI not configured" state rather than failing silently. Any design work must treat the unconfigured state as a real, reachable state.
- Tax handling is an *estimated* rate, not a filing-accurate computation. Do not present it as tax advice or as a filed figure.
- Published legal surfaces exist and are binding: privacy policy, terms, refund policy.

**Explicitly undecided**

- **Bank linking.** The product does not link bank accounts or perform credit pulls today, and current copy leans on this. This is a description of the present state, **not** a durable promise — account connection may be added later. Future work must not hard-commit the product to never linking accounts, or build positioning that would break if it did.

## Brand Commitments

- Name: **Ascentra**. Existing logo, wordmark, favicon, OG and social assets are committed and documented in `public/BRAND_ASSETS.md`.
- Established palette: evergreen `#1B4332` → `#52B788`, with brand green reserved for data and marks rather than general decoration.
- Typeface: Geist Sans.
- These are existing identity facts. No aesthetic direction was captured during init by design.

## Evidence on Hand

**The product is pre-launch. There are no real users yet.**

There are no testimonials, no customer names or logos, no user counts, no retention or outcome metrics, and no press. Nothing of that kind may be written, implied, or designed as placeholder-that-looks-real on any surface.

What genuinely exists and may be used:

- The working product itself and its real computed outputs.
- Committed brand assets (`public/BRAND_ASSETS.md`).
- Published legal pages (privacy, terms, refund policy).

Any figure appearing in marketing surfaces — sample incomes, stability scores, dollar deltas — is illustrative product output and must be presented as such, never as a real user's result.

## Product Principles

1. **One answer, then one action.** Every surface resolves to a number the user can act on and a single next move. Additional detail is available, never the entry point.
2. **Earned trust, not borrowed trust.** With no users to cite, credibility comes from the transparency and defensibility of the calculation — showing how a figure was reached — not from social proof.
3. **Honest about precision.** Estimates are labelled as estimates. The product does not imply filing-grade tax accuracy or guaranteed outcomes.
4. **Low commitment to first value.** A user reaches a real result without an account, an install, or connecting external services.
5. **Positioning that survives the roadmap.** Claims are built on the ranked-next-move mechanism, which is durable, rather than on the absence of bank linking, which is not.

## Accessibility & Inclusion

No formal conformance target (such as a specific WCAG level) has been established — this is an open decision, not a confirmed absence of need.

One behaviour is already established in code and should be preserved: motion is gated on `prefers-reduced-motion`, and the landing surface falls back to static imagery when reduced motion is requested.
