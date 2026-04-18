/**
 * Vercel serverless function: GET /api/entitlement
 *
 * Returns the server-verified plan for the authenticated user.
 *
 * Auth:
 *   Authorization: Bearer <sessionToken>  — required in all environments
 *   X-User-Id: <userId>                   — required (client-side auth)
 *
 * TODO: Replace X-User-Id with a real server-side identity mechanism
 * (signed JWT, HttpOnly session cookie, or OAuth access token) before
 * scaling to production with sensitive data.
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

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers["authorization"];
  const userIdHeader = req.headers["x-user-id"];
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
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
