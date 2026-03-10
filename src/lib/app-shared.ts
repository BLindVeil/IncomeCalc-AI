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
export type Theme = "default" | "ocean" | "forest" | "sunset" | "lavender";
export type PlanId = "pro" | "premium";

export interface ThemeConfig {
  name: string;
  icon: string;
  primary: string;
  accent: string;
  bg: string;
  cardBg: string;
  text: string;
  muted: string;
  border: string;
  headerBg: string;
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

// ─── Themes ────────────────────────────────────────────────────────────────

export const THEMES: Record<Theme, ThemeConfig> = {
  default: {
    name: "Cinematic",
    icon: "◼",
    primary: "#5E5CE6",
    accent: "#8E44FF",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  ocean: {
    name: "Deep Sea",
    icon: "◆",
    primary: "#5E5CE6",
    accent: "#50D4DC",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  forest: {
    name: "Aurora",
    icon: "◇",
    primary: "#5E5CE6",
    accent: "#34D399",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  sunset: {
    name: "Ember",
    icon: "●",
    primary: "#5E5CE6",
    accent: "#F97316",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
  lavender: {
    name: "Prism",
    icon: "◈",
    primary: "#8E44FF",
    accent: "#5E5CE6",
    bg: "#0F1115",
    cardBg: "rgba(255,255,255,0.06)",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    headerBg: "rgba(15,17,21,0.85)",
  },
};

export const DARK_OVERRIDES = {
  bg: "#0F1115",
  cardBg: "rgba(255,255,255,0.06)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.08)",
  headerBg: "rgba(15,17,21,0.85)",
};

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
    price: 19,
    yearlyPrice: 149,
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

export function applyDark(theme: ThemeConfig, isDark: boolean): ThemeConfig {
  if (!isDark) return theme;
  return { ...theme, ...DARK_OVERRIDES };
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
