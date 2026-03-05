/**
 * Vercel serverless function: GET /api/entitlement
 *
 * Returns the server-verified plan for the authenticated user.
 *
 * Auth:
 *   Authorization: Bearer <sessionToken>  — required in all environments
 *   X-User-Id: <userId>                   — DEV ONLY (see note below)
 *
 * ── SECURITY NOTE: X-User-Id is a temporary dev shim ────────────────────────
 * Accepting a user ID from a client-supplied header is NOT safe in production
 * because any caller can forge it. This header is intentionally blocked when
 * NODE_ENV === "production". Before going to production, replace X-User-Id
 * with a real server-side identity mechanism — e.g. a signed JWT validated
 * against a secret, an HttpOnly session cookie, or an OAuth access token.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Response schema:
 *   { user_id, plan, status, created_at }
 *
 * Required env vars:
 *   KV_REST_API_URL    — Set automatically by Vercel KV
 *   KV_REST_API_TOKEN  — Set automatically by Vercel KV
 */

import { kv } from "@vercel/kv";

// ── Inline types ──────────────────────────────────────────────────────────────

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

interface EntitlementRecord {
  user_id: string;
  plan: "free" | "pro" | "premium";
  billing_period: "monthly" | "yearly";
  stripe_session_id: string | null;
  status: "active" | "expired";
  created_at: string;
  expires_at: string;
}

// Vercel envs: "production" | "preview" | "development"
// We only want to block the X-User-Id dev shim on the real production domain.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "GET") {
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

  const userId = typeof userIdHeader === "string" ? userIdHeader.trim() : "";

  if (!token || !userId) {
    res.status(401).json({ error: "Unauthorized: missing credentials" });
    return;
  }

  try {
    const record = await kv.get<EntitlementRecord>(`entitlement:${userId}`);

    if (!record) {
      res.status(200).json({
        user_id: userId,
        plan: "free",
        status: "none",
        created_at: null,
      });
      return;
    }

    // Determine if the entitlement is still active
    const isExpired = record.expires_at
      ? new Date(record.expires_at) < new Date()
      : false;

    res.status(200).json({
      user_id: record.user_id,
      plan: isExpired ? "free" : record.plan,
      status: isExpired ? "expired" : record.status,
      created_at: record.created_at,
    });
  } catch (err) {
    console.error("[entitlement] KV read failed:", err);
    res.status(500).json({ error: "Failed to read entitlement" });
  }
}
