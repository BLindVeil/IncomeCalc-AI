/**
 * Vercel serverless function: /api/pending-data
 *
 * Manages pre-signup expense data snapshots attached to user accounts.
 *
 * POST  — Attach pending signup data to a userId + initialize welcome_seen=false
 * GET   — Read the user's pending data + welcome_seen flag
 * PATCH — Mark welcome_seen=true
 *
 * Auth: same header pattern as /api/entitlement
 *   Authorization: Bearer <sessionToken>
 *   X-User-Id: <userId>
 *
 * Required env vars:
 *   KV_REST_API_URL    — Set automatically by Vercel KV
 *   KV_REST_API_TOKEN  — Set automatically by Vercel KV
 */

import { kv } from "@vercel/kv";

// ── Inline types (matches entitlement.ts pattern) ────────────────────────────

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

interface PendingDataPayload {
  expenseData: Record<string, number>;
  taxRate: number;
  currentGrossIncome: number;
  grossMonthlyRequired: number;
  healthScore: number;
  capturedAt: number;
  intent?: "afford" | "stress_test" | "life_change" | "curious" | null;
}

// ── KV key helpers ───────────────────────────────────────────────────────────

const kvPendingData = (userId: string) => `pending_data:${userId}`;
const kvWelcomeSeen = (userId: string) => `welcome_seen:${userId}`;
const kvDashboardWelcomeSeen = (userId: string) => `dashboard_welcome_seen:${userId}`;

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  const authHeader = req.headers["authorization"];
  const userIdHeader = req.headers["x-user-id"];
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
  const userId = typeof userIdHeader === "string" ? userIdHeader.trim() : "";

  if (!token || !userId) {
    res.status(401).json({ error: "Unauthorized: missing credentials" });
    return;
  }

  try {
    if (req.method === "POST") {
      const body = req.body as { pending_data?: PendingDataPayload } | undefined;
      const pendingData = body?.pending_data;

      if (!pendingData) {
        res.status(400).json({ error: "missing_pending_data" });
        return;
      }

      await kv.set(kvPendingData(userId), pendingData);
      await kv.set(kvWelcomeSeen(userId), false);
      await kv.set(kvDashboardWelcomeSeen(userId), false);

      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "GET") {
      const pendingData = await kv.get(kvPendingData(userId));
      const welcomeSeen = await kv.get(kvWelcomeSeen(userId));
      const dashboardWelcomeSeen = await kv.get(kvDashboardWelcomeSeen(userId));

      res.status(200).json({
        pending_data: pendingData ?? null,
        welcome_seen: welcomeSeen === true,
        dashboard_welcome_seen: dashboardWelcomeSeen === true,
      });
      return;
    }

    if (req.method === "PATCH") {
      const body = req.body as { flag?: string } | undefined;
      const flag = body?.flag;

      if (!flag || flag === "welcome_seen") {
        await kv.set(kvWelcomeSeen(userId), true);
      } else if (flag === "dashboard_welcome_seen") {
        await kv.set(kvDashboardWelcomeSeen(userId), true);
      } else {
        res.status(400).json({ error: "invalid_flag" });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/pending-data] error:", err);
    res.status(500).json({ error: "internal_error" });
  }
}
