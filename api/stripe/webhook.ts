/**
 * Vercel serverless function: POST /api/stripe/webhook
 *
 * Verifies Stripe webhook signatures and persists entitlements to Vercel KV
 * when a checkout.session.completed event fires.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY       — Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET   — Webhook endpoint secret (whsec_...)
 *   KV_REST_API_URL         — Set automatically by Vercel KV
 *   KV_REST_API_TOKEN       — Set automatically by Vercel KV
 */

import Stripe from "stripe";
import { kv } from "@vercel/kv";
import type { IncomingMessage, ServerResponse } from "node:http";

// Disable Vercel's auto body parsing — Stripe signature verification needs the raw body.
export const config = { api: { bodyParser: false } };

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanTier = "free" | "pro" | "premium";
type BillingPeriod = "monthly" | "yearly";

interface EntitlementRecord {
  user_id: string;
  plan: PlanTier;
  billing_period: BillingPeriod;
  stripe_session_id: string | null;
  status: "active" | "expired";
  created_at: string;
  expires_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

function getExpiresAt(billingPeriod: BillingPeriod): string {
  const days = billingPeriod === "yearly" ? 366 : 31;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Stripe not configured" }));
    return;
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" });

  // Read raw body before any parsing
  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing stripe-signature header" }));
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Webhook signature error: ${message}` }));
    return;
  }

  // Only handle checkout completion; acknowledge all other events with 200
  if (event.type !== "checkout.session.completed") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;

  if (!userId) {
    // Payment not linked to a user — cannot grant entitlement
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No client_reference_id on session" }));
    return;
  }

  const rawPlan = (session.metadata?.planTier ?? "").toLowerCase();
  const plan: PlanTier = rawPlan === "premium" ? "premium" : rawPlan === "pro" ? "pro" : "free";
  const rawBilling = (session.metadata?.billingPeriod ?? "").toLowerCase();
  const billingPeriod: BillingPeriod = rawBilling === "yearly" ? "yearly" : "monthly";

  const record: EntitlementRecord = {
    user_id: userId,
    plan,
    billing_period: billingPeriod,
    stripe_session_id: session.id,
    status: "active",
    created_at: new Date().toISOString(),
    expires_at: getExpiresAt(billingPeriod),
  };

  try {
    await kv.set(`entitlement:${userId}`, record);
  } catch (err) {
    console.error("[webhook] KV write failed:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to persist entitlement" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true, plan, userId }));
}
