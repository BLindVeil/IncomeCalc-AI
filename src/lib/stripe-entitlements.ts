// ─── Stripe Entitlement Helpers ────────────────────────────────────────────
// Client-side entitlement verification + persistence layer.
// Uses the Creao ORM when available, falls back to localStorage.
//
// WARNING: This app uses Stripe Payment Links (not Checkout Sessions with
// server-side verification). Full server-side verification of payment is
// limited. We persist entitlement on the success page using query params
// and cross-check with localStorage. For production, add webhook handling
// on a backend to call setUserEntitlementByUserId after payment.

import {
  UserEntitlementORM,
  UserEntitlementPlanTier,
  UserEntitlementBillingPeriod,
  type UserEntitlementModel,
} from "@/sdk/database/orm/orm_user_entitlement";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "premium";
export type BillingPeriod = "monthly" | "yearly";

export interface Entitlement {
  planTier: PlanTier;
  billingPeriod: BillingPeriod;
  stripeSessionId: string | null;
  expiresAt: string | null; // ISO
}

// ─── Enum <-> string mappers ────────────────────────────────────────────────

function tierToEnum(t: PlanTier): UserEntitlementPlanTier {
  switch (t) {
    case "pro": return UserEntitlementPlanTier.Pro;
    case "premium": return UserEntitlementPlanTier.Premium;
    default: return UserEntitlementPlanTier.Free;
  }
}

function enumToTier(e: UserEntitlementPlanTier): PlanTier {
  switch (e) {
    case UserEntitlementPlanTier.Pro: return "pro";
    case UserEntitlementPlanTier.Premium: return "premium";
    default: return "free";
  }
}

function billingToEnum(b: BillingPeriod): UserEntitlementBillingPeriod {
  return b === "yearly" ? UserEntitlementBillingPeriod.Yearly : UserEntitlementBillingPeriod.Monthly;
}

function enumToBilling(e: UserEntitlementBillingPeriod): BillingPeriod {
  return e === UserEntitlementBillingPeriod.Yearly ? "yearly" : "monthly";
}

// ─── localStorage fallback ──────────────────────────────────────────────────

const LS_KEY = "incomecalc-entitlement";

function saveToLocal(userId: string, ent: Entitlement): void {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    data[userId] = ent;
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    // Also persist tier for the existing getPlan() system
    localStorage.setItem("incomecalc-tier", ent.planTier);
  } catch {
    // ignore
  }
}

function loadFromLocal(userId: string): Entitlement | null {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return data[userId] ?? null;
  } catch {
    return null;
  }
}

// ─── ORM operations ─────────────────────────────────────────────────────────

export async function grantEntitlement(
  userId: string,
  planTier: PlanTier,
  billingPeriod: BillingPeriod,
  stripeSessionId?: string
): Promise<void> {
  const now = new Date();
  const expiresAt = billingPeriod === "monthly"
    ? new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000).toISOString();

  const ent: Entitlement = {
    planTier,
    billingPeriod,
    stripeSessionId: stripeSessionId ?? null,
    expiresAt,
  };

  // Always save to localStorage as primary source for the SPA
  saveToLocal(userId, ent);

  // Try ORM persistence (server-backed)
  try {
    const orm = UserEntitlementORM.getInstance();
    const existing = await orm.getUserEntitlementByUserId(userId);

    if (existing.length > 0) {
      const record = existing[0];
      const updated: UserEntitlementModel = {
        ...record,
        plan_tier: tierToEnum(planTier),
        billing_period: billingToEnum(billingPeriod),
        stripe_session_id: stripeSessionId ?? null,
        expires_at: expiresAt,
      };
      await orm.setUserEntitlementByUserId(userId, updated);
    } else {
      await orm.insertUserEntitlement([{
        id: "",
        data_creator: "",
        data_updater: "",
        create_time: "",
        update_time: "",
        user_id: userId,
        plan_tier: tierToEnum(planTier),
        billing_period: billingToEnum(billingPeriod),
        stripe_session_id: stripeSessionId ?? null,
        expires_at: expiresAt,
      }]);
    }
  } catch (err) {
    console.warn("[Entitlements] ORM save failed, localStorage only:", err);
  }
}

export async function checkEntitlement(userId: string): Promise<Entitlement | null> {
  // Try ORM first
  try {
    const orm = UserEntitlementORM.getInstance();
    const records = await orm.getUserEntitlementByUserId(userId);
    if (records.length > 0) {
      const r = records[0];
      const ent: Entitlement = {
        planTier: enumToTier(r.plan_tier),
        billingPeriod: enumToBilling(r.billing_period),
        stripeSessionId: r.stripe_session_id ?? null,
        expiresAt: r.expires_at ?? null,
      };
      // Sync to localStorage
      saveToLocal(userId, ent);
      return ent;
    }
  } catch {
    // Fall through to localStorage
  }

  return loadFromLocal(userId);
}

export async function revokeEntitlement(userId: string): Promise<void> {
  const ent: Entitlement = {
    planTier: "free",
    billingPeriod: "monthly",
    stripeSessionId: null,
    expiresAt: null,
  };
  saveToLocal(userId, ent);

  try {
    const orm = UserEntitlementORM.getInstance();
    const existing = await orm.getUserEntitlementByUserId(userId);
    if (existing.length > 0) {
      const record = existing[0];
      await orm.setUserEntitlementByUserId(userId, {
        ...record,
        plan_tier: UserEntitlementPlanTier.Free,
        billing_period: UserEntitlementBillingPeriod.Unspecified,
        stripe_session_id: null,
        expires_at: null,
      });
    }
  } catch {
    // ignore
  }
}

// ─── Restore Purchase ───────────────────────────────────────────────────────
// Looks up entitlement by user email using the ORM.
// Since Payment Links don't give us server verification, we check if
// the user has an active entitlement in the ORM datastore.

export async function restorePurchase(userId: string): Promise<Entitlement | null> {
  try {
    const orm = UserEntitlementORM.getInstance();
    const records = await orm.getUserEntitlementByUserId(userId);
    if (records.length > 0) {
      const r = records[0];
      if (r.plan_tier !== UserEntitlementPlanTier.Free) {
        const ent: Entitlement = {
          planTier: enumToTier(r.plan_tier),
          billingPeriod: enumToBilling(r.billing_period),
          stripeSessionId: r.stripe_session_id ?? null,
          expiresAt: r.expires_at ?? null,
        };
        saveToLocal(userId, ent);
        return ent;
      }
    }
  } catch {
    // Check localStorage as final fallback
    const local = loadFromLocal(userId);
    if (local && local.planTier !== "free") return local;
  }
  return null;
}
