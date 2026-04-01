/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session and returns { url }.
 *
 * Auth:
 *   Authorization: Bearer <sessionToken> — required (your app decides what “valid” means)
 *
 * NOTE:
 * For now we accept userId from the body so checkout works in production.
 * The real “correct” version is: derive userId server-side from the Bearer token / cookie.
 */

import Stripe from "stripe";

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: {
    planTier: "pro" | "premium";
    billingPeriod: "monthly" | "yearly";
    userId: string; // IMPORTANT: required now
  };
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

type PlanTier = "pro" | "premium";
type BillingPeriod = "monthly" | "yearly";

const PRICE_IDS: Record<`${PlanTier}_${BillingPeriod}`, string> = {
  pro_monthly: "price_1T4UrT1ntfmgKEH73GB7UDLx",
  premium_monthly: "price_1T4UrT1ntfmgKEH7zPqb6onD",
  pro_yearly: "price_1T4UrT1ntfmgKEH7li54UHRm",
  premium_yearly: "price_1T4UrT1ntfmgKEH7rA1HwIIz",
};

function getPriceId(plan: PlanTier, billing: BillingPeriod): string | null {
  const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`;
  return process.env[envKey] ?? PRICE_IDS[`${plan}_${billing}`] ?? null;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Require Authorization header (you can relax this later if you want)
  const authHeader = req.headers["authorization"];
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized: missing Authorization Bearer token" });
    return;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  // Always use the canonical domain. Ignore SITE_URL env var if it points to a
  // *.vercel.app preview URL — that caused Stripe's back-arrow to redirect to
  // the old income-calc-ai.vercel.app domain instead of the custom domain.
  const CANONICAL = "https://incomecalcai.com";
  const envUrl = process.env.SITE_URL;
  const siteUrl = envUrl && !envUrl.includes(".vercel.app") ? envUrl : CANONICAL;

  if (!stripeSecret) {
    res.status(500).json({ error: "Stripe not configured: missing STRIPE_SECRET_KEY" });
    return;
  }

  const { planTier, billingPeriod, userId } = (req.body ?? {}) as Partial<Req["body"]>;

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
    res.status(500).json({ error: `Price ID not configured for ${planTier}/${billingPeriod}` });
    return;
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-02-25.clover" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      // ✅ THIS fixes your webhook error: client_reference_id will no longer be null
      client_reference_id: userId,

      // ✅ redundancy: webhook can also read it from metadata
      metadata: { planTier, billingPeriod, userId },

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