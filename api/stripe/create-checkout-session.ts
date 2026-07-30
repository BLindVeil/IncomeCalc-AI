/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout Session for the one-time Full Diagnosis purchase
 * and returns { url }. Ascentra sells exactly one thing: pay once, own it.
 *
 * Auth:
 *   Authorization: Bearer <sessionToken> — required (your app decides what “valid” means)
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY   — Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_PRICE_FULL   — Price ID of the one-time (non-recurring) $29 product
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
    userId: string; // IMPORTANT: required now
  };
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
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
  // a stale preview domain instead of the custom domain.
  const CANONICAL = "https://ascentra.finance";
  const envUrl = process.env.SITE_URL;
  const siteUrl = envUrl && !envUrl.includes(".vercel.app") ? envUrl : CANONICAL;

  if (!stripeSecret) {
    res.status(500).json({ error: "Stripe not configured: missing STRIPE_SECRET_KEY" });
    return;
  }

  const priceId = process.env.STRIPE_PRICE_FULL;
  if (!priceId) {
    res.status(500).json({
      error:
        "Stripe not configured: missing STRIPE_PRICE_FULL (one-time price ID for the Full Diagnosis product)",
    });
    return;
  }

  const { userId } = (req.body ?? {}) as Partial<Req["body"]>;

  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-02-25.clover" });

  try {
    const session = await stripe.checkout.sessions.create({
      // One-time payment — Ascentra has no subscriptions.
      mode: "payment",

      // client_reference_id links the payment to the user for the webhook
      client_reference_id: userId,

      // redundancy: webhook can also read it from metadata
      metadata: { product: "full_diagnosis", userId },

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
