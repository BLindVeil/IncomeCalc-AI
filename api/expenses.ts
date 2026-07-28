/**
 * Vercel serverless function: /api/expenses
 *
 * The signed-in user's current expense working document, so their numbers
 * follow them to a new device or a private window instead of living only in
 * one browser's localStorage.
 *
 * GET    — Read the stored document (null when none)
 * PUT    — Replace it, last-write-wins on `updatedAt`
 * DELETE — Remove it
 *
 * Auth: same header pattern as /api/entitlement and /api/pending-data
 *   Authorization: Bearer <sessionToken>
 *   X-User-Id: <userId>
 *
 * NOTE: like the other routes, this trusts X-User-Id. That is a known gap
 * tracked in api/entitlement.ts and must be closed before this is treated as
 * private storage - see that file's TODO.
 *
 * Required env vars:
 *   KV_REST_API_URL    — Upstash Redis (formerly Vercel KV)
 *   KV_REST_API_TOKEN  — Upstash Redis (formerly Vercel KV)
 */

import { kv } from "@vercel/kv";

// ── Inline types (matches entitlement.ts / pending-data.ts pattern) ───────────

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

interface ExpenseDocument {
  version: number;
  updatedAt: number;
  expenseData: Record<string, number>;
  taxRate: number;
  currentGrossIncome: number;
}

// ── KV key helper ────────────────────────────────────────────────────────────

const kvExpenses = (userId: string) => `expenses:${userId}`;

// ── Validation ───────────────────────────────────────────────────────────────

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isExpenseDocument(v: unknown): v is ExpenseDocument {
  if (!v || typeof v !== "object") return false;
  const d = v as Partial<ExpenseDocument>;
  if (
    !isFiniteNumber(d.version) ||
    !isFiniteNumber(d.updatedAt) ||
    !isFiniteNumber(d.taxRate) ||
    !isFiniteNumber(d.currentGrossIncome)
  ) {
    return false;
  }
  const e = d.expenseData;
  if (!e || typeof e !== "object" || Array.isArray(e)) return false;
  return Object.values(e as Record<string, unknown>).every(isFiniteNumber);
}

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
    if (req.method === "GET") {
      const doc = await kv.get<ExpenseDocument>(kvExpenses(userId));
      res.status(200).json({ expenses: doc ?? null });
      return;
    }

    if (req.method === "PUT") {
      const body = req.body as { expenses?: unknown } | undefined;
      const incoming = body?.expenses;

      if (!isExpenseDocument(incoming)) {
        res.status(400).json({ error: "invalid_expenses" });
        return;
      }

      // Last-write-wins, but never let a slow request overwrite a newer
      // document: two tabs can post out of order.
      const existing = await kv.get<ExpenseDocument>(kvExpenses(userId));
      if (existing && existing.updatedAt > incoming.updatedAt) {
        res.status(200).json({ ok: true, stored: existing, superseded: true });
        return;
      }

      await kv.set(kvExpenses(userId), incoming);
      res.status(200).json({ ok: true, stored: incoming, superseded: false });
      return;
    }

    if (req.method === "DELETE") {
      await kv.del(kvExpenses(userId));
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/expenses] error:", err);
    res.status(500).json({ error: "internal_error" });
  }
}
