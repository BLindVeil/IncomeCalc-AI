/**
 * Vercel serverless function: POST /api/auth
 *
 * Handles signup and login with server-side user storage in Vercel KV.
 * Passwords are hashed with SHA-256 via crypto.subtle before storage.
 *
 * Request body:
 *   { action: "signup" | "login", email: string, password: string }
 *
 * Response:
 *   Success: { ok: true, userId: string, email: string, plan?: "free" | "pro" | "premium" }
 *   Error:   { ok: false, error: string }
 *
 * On login, also reads entitlement:<userId> from KV to return the user's plan.
 *
 * KV key format: user:<email>
 * KV value: { userId, email, passwordHash, createdAt }
 *
 * Required env vars:
 *   KV_REST_API_URL   — Set automatically by Vercel KV
 *   KV_REST_API_TOKEN — Set automatically by Vercel KV
 */

import { kv } from "@vercel/kv";

// ── Types ────────────────────────────────────────────────────────────────────

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

interface AuthRequestBody {
  action: "signup" | "login";
  email: string;
  password: string;
}

interface KVUser {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function kvKey(email: string): string {
  return `user:${email.toLowerCase().trim()}`;
}

function isValidBody(body: unknown): body is AuthRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    (b.action === "signup" || b.action === "login") &&
    typeof b.email === "string" &&
    b.email.length > 0 &&
    typeof b.password === "string" &&
    b.password.length > 0
  );
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = req.body;
  if (!isValidBody(body)) {
    res.status(400).json({ ok: false, error: "Invalid request body" });
    return;
  }

  const { action, email, password } = body;
  const normalizedEmail = email.toLowerCase().trim();

  if (password.length < 6) {
    res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    return;
  }

  try {
    if (action === "signup") {
      // Check if user already exists
      const existing = await kv.get<KVUser>(kvKey(normalizedEmail));
      if (existing) {
        res.status(409).json({
          ok: false,
          error: "An account with this email already exists. Please sign in.",
        });
        return;
      }

      const passwordHash = await hashPassword(password);
      const userId = genId();
      const record: KVUser = {
        userId,
        email: normalizedEmail,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      await kv.set(kvKey(normalizedEmail), record);

      res.status(200).json({ ok: true, userId, email: normalizedEmail });
    } else {
      // Login
      const record = await kv.get<KVUser>(kvKey(normalizedEmail));
      if (!record) {
        res.status(401).json({ ok: false, error: "No account found with this email." });
        return;
      }

      const passwordHash = await hashPassword(password);
      if (record.passwordHash !== passwordHash) {
        res.status(401).json({ ok: false, error: "Incorrect password." });
        return;
      }

      // Read entitlement to return plan alongside login response
      let plan: "free" | "pro" | "premium" = "free";
      const entKey = `entitlement:${record.userId}`;
      console.log(`[auth/login] email=${normalizedEmail} userId=${record.userId} entKey=${entKey}`);
      try {
        const ent = await kv.get<Record<string, unknown>>(entKey);
        console.log(`[auth/login] entitlement raw:`, JSON.stringify(ent));
        if (ent) {
          const isActive = ent.status === "active";
          const expiresAt = typeof ent.expires_at === "string" ? ent.expires_at : null;
          const isNotExpired = !expiresAt || new Date(expiresAt) > new Date();
          console.log(`[auth/login] isActive=${isActive} expiresAt=${expiresAt} isNotExpired=${isNotExpired}`);
          if (isActive && isNotExpired) {
            if (ent.plan === "pro" || ent.plan === "premium") {
              plan = ent.plan;
            }
          }
        }
      } catch (entErr) {
        console.error(`[auth/login] entitlement read FAILED for ${entKey}:`, entErr);
      }
      console.log(`[auth/login] final plan=${plan}`);

      res.status(200).json({ ok: true, userId: record.userId, email: record.email, plan });
    }
  } catch (err) {
    console.error("[auth] KV operation failed:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
