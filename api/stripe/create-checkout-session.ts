/**
 * Vercel serverless function: POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the requested plan and returns the
 * Stripe-hosted checkout URL for the browser to redirect to.
 *
 * The session embeds client_reference_id (userId) and metadata (planTier,
 * billingPeriod) so the webhook can map the completed payment to a user.
 *
 * Auth:
 *   Authorization: Bearer <sessionToken>  — required in all environments
 *   X-User-Id: <userId>                   — DEV ONLY (see note below)
 *
 * ── SECURITY NOTE: X-User-Id is a temporary dev shim ────────────────────────
 * Accepting a user ID from a client-supplied header is NOT safe in production
 * because any caller can forge it and link a payment to an arbitrary account.
 * This header is intentionally blocked when NODE_ENV === "production". Before
 * going to production, replace X-User-Id with a real server-side identity
 * mechanism — e.g. a signed JWT validated against a secret, an HttpOnly
 * session cookie, or an OAuth access token — then extract the userId from
 * that verified credential instead of from a client header.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY            — Stripe secret key
 *   STRIPE_PRICE_PRO_MONTHLY     — Stripe Price ID for Pro monthly
 *   STRIPE_PRICE_PRO_YEARLY      — Stripe Price ID for Pro yearly
 *   STRIPE_PRICE_PREMIUM_MONTHLY — Stripe Price ID for Premium monthly
 *   STRIPE_PRICE_PREMIUM_YEARLY  — Stripe Price ID for Premium yearly
 *   SITE_URL                     — Base URL of the app (e.g. https://app.example.com)
 */

import Stripe from "stripe";

// ── Inline types (matches api/ai.ts pattern — no @vercel/node import needed) ──

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: {
    planTier: "pro" | "premium";
    billingPeriod: "monthly" | "yearly";
    userId: string;
  };
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

// ── Price ID map ──────────────────────────────────────────────────────────────

type PlanTier = "pro" | "premium";
type BillingPeriod = "monthly" | "yearly";

function getPriceId(plan: PlanTier, billing: BillingPeriod): string | null {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`;
  return process.env[key] ?? null;
}

// Vercel envs: "production" | "preview" | "development"
// We only want to block the X-User-Id dev shim on the real production domain.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers["authorization"];
  const userIdHeader = req.headers["x-user-id"];
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";

  // X-User-Id is a dev-only shim. Block it unconditionally in production —
  // real auth must derive the user identity server-side before this can work.
  if (IS_PRODUCTION && userIdHeader) {
    res.status(401).json({
      error: "X-User-Id header is not accepted in production. Implement server-side auth.",
    });
    return;
  }

  const headerUserId = typeof userIdHeader === "string" ? userIdHeader.trim() : "";

  if (!token || !headerUserId) {
    res.status(401).json({ error: "Unauthorized: missing credentials" });
    return;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.SITE_URL ?? "";

  if (!stripeSecret) {
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }

  const { planTier, billingPeriod, userId } = req.body ?? {};

  if (!planTier || !billingPeriod || !userId) {
    res.status(400).json({ error: "Missing planTier, billingPeriod, or userId" });
    return;
  }

  if (!["pro", "premium"].includes(planTier)) {
    res.status(400).json({ error: "planTier must be 'pro' or 'premium'" });
    return;
  }

  if (!["monthly", "yearly"].includes(billingPeriod)) {
    res.status(400).json({ error: "billingPeriod must be 'monthly' or 'yearly'" });
    return;
  }

  const priceId = getPriceId(planTier, billingPeriod);
  if (!priceId) {
    res
      .status(500)
      .json({ error: `Price ID not configured for ${planTier}/${billingPeriod}` });
    return;
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: userId,
      metadata: { planTier, billingPeriod },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/billing/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    res.status(500).json({ error: message });
  }
}
