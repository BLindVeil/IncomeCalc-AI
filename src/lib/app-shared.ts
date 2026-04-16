/**
 * app-shared.ts
 * All non-React shared types, constants, and helpers used across page components.
 * Import from here instead of index.tsx to enable tree-shaking and code-splitting.
 */

import type { ComponentType } from "react";
import { Home, Car, Utensils, Heart, Wifi, Plane, ShoppingBag, TrendingUp, DollarSign } from "lucide-react";
import { calculate, type CalcOutput } from "@/lib/calc";

// ─── Re-exports from calc ──────────────────────────────────────────────────
export type { CalcOutput };
export type { ExpenseData } from "@/lib/calc";

// ─── Types ─────────────────────────────────────────────────────────────────

export type Page =
  | "landing"
  | "calculator"
  | "results"
  | "guided"
  | "checkout"
  | "simulator"
  | "checkin"
  | "fire"
  | "forecast"
  | "debt"
  | "fi"
  | "dev-access"
  | "dashboard"
  | "share"
  | "digest-preview";

export type UserTier = "free" | "pro" | "premium";
export type PlanId = "pro" | "premium";

export interface ThemeConfig {
  name: string;
  icon: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  accent: string;
  bg: string;
  cardBg: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  borderStrong: string;
  headerBg: string;
  success: string;
  warning: string;
  danger: string;
}

export interface Scenario {
  id: string;
  name: string;
  expenses: import("@/lib/calc").ExpenseData;
  taxRate: number;
}

export interface CheckInSnapshot {
  id: string;
  date: string; // ISO string
  expenses: import("@/lib/calc").ExpenseData;
  taxRate: number;
  outputs: CalcOutput;
  note?: string;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  badge?: string;
  features: PlanFeature[];
}

// ─── Evergreen Palette ─────────────────────────────────────────────────────

export const EV_50  = "#F1FAF4";
export const EV_100 = "#D8F3DC";
export const EV_200 = "#B7E4C7";
export const EV_300 = "#95D5B2";
export const EV_400 = "#74C69D";
export const EV_500 = "#52B788";
export const EV_600 = "#40916C";
export const EV_700 = "#2D6A4F";
export const EV_800 = "#1B4332"; // PRIMARY
export const EV_900 = "#081C15";

export const MONO_FONT_STACK =
  "'Geist Mono', 'SF Mono', 'Menlo', ui-monospace, monospace";

const EVERGREEN_LIGHT: ThemeConfig = {
  name: "Evergreen",
  icon: "▲",
  primary: EV_800,
  primaryHover: EV_700,
  primarySoft: EV_100,
  accent: EV_500,
  bg: "#F6F7F5",
  cardBg: "#FFFFFF",
  text: "#0F1A14",
  muted: "#6B7570",
  subtle: "#9CA49E",
  border: "#E8E9E5",
  borderStrong: "#D4D7D0",
  headerBg: "rgba(246,247,245,0.92)",
  success: "#40916C",
  warning: "#D97706",
  danger: "#DC2626",
};

const EVERGREEN_DARK: ThemeConfig = {
  name: "Evergreen",
  icon: "▲",
  primary: EV_500,
  primaryHover: EV_400,
  primarySoft: "rgba(82, 183, 136, 0.15)",
  accent: EV_400,
  bg: "#0A0F0B",
  cardBg: "#111A13",
  text: "#E8F5EC",
  muted: "#8B9A8F",
  subtle: "#5C6B63",
  border: "#1E2A22",
  borderStrong: "#2A3A30",
  headerBg: "rgba(10,15,11,0.88)",
  success: EV_500,
  warning: "#F59E0B",
  danger: "#EF4444",
};

export function buildTheme(isDark: boolean): ThemeConfig {
  return isDark ? EVERGREEN_DARK : EVERGREEN_LIGHT;
}

// ─── Expense fields config ──────────────────────────────────────────────────

export type ExpenseKey = keyof import("@/lib/calc").ExpenseData;

export const EXPENSE_FIELDS: {
  name: ExpenseKey;
  label: string;
  icon: ComponentType<{ size?: number; style?: React.CSSProperties }>;
}[] = [
  { name: "housing", label: "Housing / Rent", icon: Home },
  { name: "food", label: "Food & Groceries", icon: Utensils },
  { name: "transport", label: "Transportation", icon: Car },
  { name: "healthcare", label: "Healthcare", icon: Heart },
  { name: "utilities", label: "Utilities & Internet", icon: Wifi },
  { name: "entertainment", label: "Entertainment", icon: Plane },
  { name: "clothing", label: "Clothing & Personal", icon: ShoppingBag },
  { name: "savings", label: "Savings & Investments", icon: TrendingUp },
  { name: "other", label: "Other Expenses", icon: DollarSign },
];

// ─── Plan definitions ───────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 4.99,
    yearlyPrice: 49,
    description: "Clarity & Control — know exactly what you need to earn and where it goes.",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Historical analytics dashboard", included: true },
      { text: "Retirement goal planner", included: true },
      { text: "Branded PDF report export", included: true },
      { text: "Compare 3 income scenarios", included: true },
      { text: "AI-powered recommendations", included: false },
      { text: "Multi-person household planning", included: false },
      { text: "Cloud sync across devices", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    yearlyPrice: 99,
    description: "Financial Growth & Long-Term Strategy — advanced planning, forecasting, and wealth optimization.",
    badge: "Most Popular",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited scenario comparisons", included: true },
      { text: "12-Month cashflow forecast", included: true },
      { text: "FIRE Retirement Estimator", included: true },
      { text: "Stability history tracking", included: true },
      { text: "Advanced AI Advisor", included: true },
      { text: "AI-powered spending recommendations", included: true },
      { text: "Multi-person household planning", included: true },
      { text: "Cloud sync across devices", included: true },
      { text: "Priority email support", included: true },
      { text: "Export to CSV / Google Sheets", included: true },
      { text: "Household multi-income modeling", included: true },
    ],
  },
];

export const DEFAULT_EXPENSES: import("@/lib/calc").ExpenseData = {
  housing: 0,
  food: 0,
  transport: 0,
  healthcare: 0,
  utilities: 0,
  entertainment: 0,
  clothing: 0,
  savings: 0,
  other: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// Backwards-compatible: components still call applyDark(currentTheme, isDark).
// In the single-theme world, the `theme` argument is the light variant; we
// swap to the dark variant when isDark is true. The first parameter is kept
// for source compatibility with existing call sites.
export function applyDark(_theme: ThemeConfig, isDark: boolean): ThemeConfig {
  return buildTheme(isDark);
}

export function computeForExpenses(expenses: import("@/lib/calc").ExpenseData, taxRate: number): CalcOutput {
  return calculate({ expenses, taxRate });
}

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem("incomecalc-scenarios");
    return raw ? JSON.parse(raw) as Scenario[] : [];
  } catch { return []; }
}

export function saveScenarios(scenarios: Scenario[]) {
  localStorage.setItem("incomecalc-scenarios", JSON.stringify(scenarios));
}

export function loadSnapshots(): CheckInSnapshot[] {
  try {
    const raw = localStorage.getItem("incomecalc-snapshots");
    return raw ? JSON.parse(raw) as CheckInSnapshot[] : [];
  } catch { return []; }
}

export function saveSnapshots(snapshots: CheckInSnapshot[]) {
  localStorage.setItem("incomecalc-snapshots", JSON.stringify(snapshots));
}

export function loadUserTier(): UserTier {
  try {
    const raw = localStorage.getItem("incomecalc-tier");
    if (raw === "pro" || raw === "premium") return raw;
    return "free";
  } catch { return "free"; }
}

export function getScenarioLimit(tier: UserTier): number {
  if (tier === "premium") return 999;
  if (tier === "pro") return 3;
  return 1;
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function generateICS(): string {
  const now = new Date();
  const dtStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IncomeCalc//Monthly Check-In//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmtDate(dtStart)}`,
    `DTEND:${fmtDate(new Date(dtStart.getTime() + 30 * 60000))}`,
    "RRULE:FREQ=MONTHLY;BYMONTHDAY=1",
    "SUMMARY:IncomeCalc Monthly Check-In",
    "DESCRIPTION:Time to update your IncomeCalc numbers! Review expenses\\, check your fragility score\\, and adjust your plan.",
    `UID:incomecalc-checkin-${Date.now()}@incomecalc`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
