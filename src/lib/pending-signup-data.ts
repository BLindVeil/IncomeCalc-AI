// ─── Pre-signup data persistence ──────────────────────────────────────────────
// Captures expense snapshot to sessionStorage BEFORE the auth modal opens,
// then attaches it to the account via /api/pending-data after signup.

import type { ExpenseData } from "@/lib/app-shared";
import type { UserIntent } from "@/lib/intent";

const PENDING_KEY = "ascentra-pending-signup-data";
const WELCOME_SEEN_KEY_PREFIX = "ascentra-welcome-seen-";
const DASHBOARD_WELCOME_SEEN_KEY_PREFIX = "ascentra-dashboard-welcome-seen-";

export interface PendingSignupData {
  expenseData: ExpenseData;
  taxRate: number;
  currentGrossIncome: number;
  grossMonthlyRequired: number;
  healthScore: number;
  capturedAt: number;
  intent?: UserIntent | null;
}

// ─── SessionStorage: capture / read / clear ──────────────────────────────────

export function capturePendingData(data: PendingSignupData): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage can fail in private browsing or quota-exceeded
  }
}

export function readPendingData(): PendingSignupData | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSignupData;
  } catch {
    return null;
  }
}

export function clearPendingData(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

// ─── Server attach: POST pending data to KV ─────────────────────────────────

export async function attachPendingDataToAccount(
  userId: string,
  sessionToken: string,
  data: PendingSignupData,
): Promise<boolean> {
  try {
    const res = await fetch("/api/pending-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
        "X-User-Id": userId,
      },
      body: JSON.stringify({ pending_data: data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Welcome-seen flag (client + server) ─────────────────────────────────────

export function markWelcomeSeen(userId: string): void {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY_PREFIX + userId, "true");
  } catch {
    // ignore
  }
}

export function hasSeenWelcome(userId: string): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY_PREFIX + userId) === "true";
  } catch {
    return false;
  }
}

export async function markWelcomeSeenServer(
  userId: string,
  sessionToken: string,
): Promise<void> {
  try {
    await fetch("/api/pending-data", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "X-User-Id": userId,
      },
    });
  } catch {
    // ignore — client flag still set
  }
}

export async function checkWelcomeSeenServer(
  userId: string,
  sessionToken: string,
): Promise<{ welcomeSeen: boolean; hasPendingData: boolean }> {
  try {
    const res = await fetch("/api/pending-data", {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "X-User-Id": userId,
      },
    });
    if (res.ok) {
      const json = await res.json();
      return {
        welcomeSeen: json.welcome_seen === true,
        hasPendingData: json.pending_data != null,
      };
    }
  } catch {
    // ignore
  }
  return { welcomeSeen: true, hasPendingData: false };
}

// ─── Dashboard-welcome-seen flag (client + server) ──────────────────────────

export function markDashboardWelcomeSeen(userId: string): void {
  try {
    localStorage.setItem(DASHBOARD_WELCOME_SEEN_KEY_PREFIX + userId, "true");
  } catch {
    // ignore
  }
}

export function hasSeenDashboardWelcome(userId: string): boolean {
  try {
    return localStorage.getItem(DASHBOARD_WELCOME_SEEN_KEY_PREFIX + userId) === "true";
  } catch {
    return false;
  }
}

export async function markDashboardWelcomeSeenServer(
  userId: string,
  sessionToken: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/pending-data", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
        "X-User-Id": userId,
      },
      body: JSON.stringify({ flag: "dashboard_welcome_seen" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hasSeenDashboardWelcomeServer(
  userId: string,
  sessionToken: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/pending-data", {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "X-User-Id": userId,
      },
    });
    if (!res.ok) return true;
    const json = await res.json();
    // No pending_data record = existing user = treat as already seen
    if (json.pending_data === null) return true;
    return json.dashboard_welcome_seen === true;
  } catch {
    return true; // Fail closed — don't show banner on error
  }
}
