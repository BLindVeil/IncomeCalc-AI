import { useState, useRef, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusPillVariant } from "@/components/ui/StatusPill";
import { BudgetEditModal } from "@/components/ui/BudgetEditModal";
import { SetAllBudgetsModal } from "@/components/ui/SetAllBudgetsModal";

// ─── Recommended thresholds ─────────────────────────────────────────────────

const THRESHOLDS: Record<string, { recommended: number; label: string }> = {
  "Housing / Rent": { recommended: 0.3, label: "30% of income" },
  "Food & Groceries": { recommended: 0.12, label: "12% of income" },
  Transportation: { recommended: 0.1, label: "10% of income" },
  Healthcare: { recommended: 0.08, label: "8% of income" },
  "Utilities & Internet": { recommended: 0.05, label: "5% of income" },
  Entertainment: { recommended: 0.05, label: "5% of income" },
  "Clothing & Personal": { recommended: 0.05, label: "5% of income" },
  "Savings & Investments": { recommended: 0.2, label: "20% of income" },
  "Debt Payments": { recommended: 0.1, label: "10% of income" },
  "Other Expenses": { recommended: 0.05, label: "5% of income" },
};

const DEFAULT_THRESHOLD = { recommended: 0.1, label: "10% of income" };

// ─── SVG Icons ──────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getThreshold(category: string) {
  return THRESHOLDS[category] ?? DEFAULT_THRESHOLD;
}

function getRecommendedBudget(category: string, grossMonthlyIncome: number): number {
  return grossMonthlyIncome * getThreshold(category).recommended;
}

function getBudgetAmount(category: string, grossMonthlyIncome: number, customBudgets: Record<string, number>): number {
  return customBudgets[category] ?? getRecommendedBudget(category, grossMonthlyIncome);
}

function getStatus(actual: number, budget: number): { variant: StatusPillVariant; label: string } {
  if (actual <= budget) return { variant: "good", label: "On track" };
  if (actual <= budget * 1.2) return { variant: "warning", label: "Need attention" };
  return { variant: "danger", label: "Exceeded" };
}

function statusColor(variant: StatusPillVariant, t: ThemeConfig): string {
  if (variant === "good") return EV_500;
  if (variant === "warning") return t.warning;
  return t.danger;
}

function fmtCompact(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

// ─── Mini Donut ─────────────────────────────────────────────────────────────

function MiniDonut({ percentage, color, t }: { percentage: number; color: string; t: ThemeConfig }) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const capped = Math.min(percentage, 100);
  const dasharray = `${(capped / 100) * circumference} ${circumference}`;

  return (
    <svg width={64} height={64} viewBox="0 0 64 64">
      <circle cx={32} cy={32} r={r} fill="none" stroke={t.border} strokeWidth={8} />
      <circle
        cx={32} cy={32} r={r}
        fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={dasharray}
        transform="rotate(-90 32 32)"
      />
      <text
        x={32} y={32}
        textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 600, fontFamily: MONO_FONT_STACK, fill: t.text }}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
}

// ─── Half-Donut Gauge ───────────────────────────────────────────────────────

function HalfDonutGauge({ spent, total, t }: { spent: number; total: number; t: ThemeConfig }) {
  const r = 70;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 95;
  const halfCircumference = Math.PI * r;
  const pct = total > 0 ? Math.min(spent / total, 1) : 0;
  const dasharray = `${pct * halfCircumference} ${halfCircumference}`;
  const remaining = Math.max(total - spent, 0);

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={200} height={120} viewBox="0 0 200 120">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={t.border} strokeWidth={strokeWidth} strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={EV_500} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={dasharray}
        />
        <text x={cx} y={72} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO_FONT_STACK, fill: t.text }}>
          {Math.round(pct * 100)}%
        </text>
        <text x={cx} y={88} textAnchor="middle" style={{ fontSize: 10, fill: t.muted }}>used</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: -4, padding: "0 12px" }}>
        <span style={{ fontSize: 12, color: t.muted, fontFamily: MONO_FONT_STACK }}>{fmtCompact(spent)} spent</span>
        <span style={{ fontSize: 12, color: t.muted, fontFamily: MONO_FONT_STACK }}>{fmtCompact(remaining)} left</span>
      </div>
    </div>
  );
}

// ─── Category Budget Card ───────────────────────────────────────────────────

interface CategoryCardProps {
  category: string;
  amount: number;
  grossMonthlyIncome: number;
  customBudgets: Record<string, number>;
  t: ThemeConfig;
  onEdit: () => void;
}

function CategoryBudgetCard({ category, amount, grossMonthlyIncome, customBudgets, t, onEdit }: CategoryCardProps) {
  const threshold = getThreshold(category);
  const budgetAmount = getBudgetAmount(category, grossMonthlyIncome, customBudgets);
  const percentage = budgetAmount > 0 ? (amount / budgetAmount) * 100 : 0;
  const status = getStatus(amount, budgetAmount);
  const color = statusColor(status.variant, t);
  const isCustom = category in customBudgets;

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: 20,
        position: "relative",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{category}</span>
          {isCustom && (
            <span style={{ fontSize: 10, fontWeight: 500, background: t.primarySoft, color: t.primary, padding: "2px 6px", borderRadius: 4 }}>
              Custom
            </span>
          )}
        </div>
        <span onClick={onEdit} style={{ color: t.muted, cursor: "pointer", flexShrink: 0 }}><PencilIcon /></span>
      </div>

      {/* Middle: donut + amounts */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <MiniDonut percentage={percentage} color={color} t={t} />
        <div>
          <div style={{ fontSize: 11, color: t.muted, marginBottom: 2 }}>Spent</div>
          <FormattedNumber value={amount} fontSize={20} fontWeight={600} showCents={false} color={t.text} />
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
            of {fmtCompact(budgetAmount)}
          </div>
        </div>
      </div>

      {/* Bottom: status + threshold label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusPill label={status.label} variant={status.variant} />
        <span style={{ fontSize: 11, color: t.muted }}>{isCustom ? "Custom limit" : threshold.label}</span>
      </div>
    </div>
  );
}

// ─── Sort options ────────────────────────────────────────────────────────────

type BudgetSortValue = "default" | "amount_high" | "amount_low" | "name" | "status";

const BUDGET_SORT_OPTIONS: Array<{ value: BudgetSortValue; label: string }> = [
  { value: "default", label: "Default" },
  { value: "amount_high", label: "Highest spend" },
  { value: "amount_low", label: "Lowest spend" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
];

// ─── BudgetPage ─────────────────────────────────────────────────────────────

export interface BudgetPageProps {
  t: ThemeConfig;
  isDark: boolean;
  expenses: Array<{ category: string; amount: number; icon?: string }>;
  totalExpenses: number;
  grossMonthlyIncome: number;
  onBack?: () => void;
  customBudgets?: Record<string, number>;
  onSetCustomBudget?: (category: string, amount: number) => void;
  onClearCustomBudget?: (category: string) => void;
  onClearAllCustomBudgets?: () => void;
}

export function BudgetPage({
  t,
  isDark,
  expenses,
  totalExpenses,
  grossMonthlyIncome,
  onBack,
  customBudgets = {},
  onSetCustomBudget,
  onClearCustomBudget,
  onClearAllCustomBudgets,
}: BudgetPageProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showSetAll, setShowSetAll] = useState(false);
  const [sortBy, setSortBy] = useState<BudgetSortValue>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Click-outside to close sort dropdown
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const rawActiveExpenses = expenses.filter((e) => e.amount > 0);

  // Sort active expenses
  const activeExpenses = [...rawActiveExpenses].sort((a, b) => {
    if (sortBy === "amount_high") return b.amount - a.amount;
    if (sortBy === "amount_low") return a.amount - b.amount;
    if (sortBy === "name") return a.category.localeCompare(b.category);
    if (sortBy === "status") {
      const statusOrder = (cat: string, amt: number) => {
        const budget = getBudgetAmount(cat, grossMonthlyIncome, customBudgets);
        const s = getStatus(amt, budget);
        return s.variant === "danger" ? 0 : s.variant === "warning" ? 1 : 2;
      };
      return statusOrder(a.category, a.amount) - statusOrder(b.category, b.amount);
    }
    return 0; // default order
  });
  const isEmpty = activeExpenses.length === 0;

  // Overall status
  const overallOnTrack = totalExpenses < grossMonthlyIncome * 0.8;
  const overallStatus: { variant: StatusPillVariant; label: string } = overallOnTrack
    ? { variant: "good", label: "On track" }
    : totalExpenses <= grossMonthlyIncome
      ? { variant: "warning", label: "Tight" }
      : { variant: "danger", label: "Over budget" };

  // Top 5 for summary
  const ranked = [...activeExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Precompute recommended budgets map for the "set all" modal
  const recommendedBudgets: Record<string, number> = {};
  for (const e of activeExpenses) {
    recommendedBudgets[e.category] = getRecommendedBudget(e.category, grossMonthlyIncome);
  }

  const chipStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13,
    color: t.muted,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
  };

  // Editing state helpers
  const editingExpense = editingCategory ? activeExpenses.find((e) => e.category === editingCategory) : null;
  const editingRecommended = editingCategory ? getRecommendedBudget(editingCategory, grossMonthlyIncome) : 0;
  const editingBudget = editingCategory ? getBudgetAmount(editingCategory, grossMonthlyIncome, customBudgets) : 0;

  // ─── Empty state ────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>
          No expenses entered yet
        </div>
        <div style={{ fontSize: 14, color: t.muted, marginBottom: 24 }}>
          Enter your monthly expenses to see how they compare to recommended limits
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
            }}
          >
            Enter expenses →
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* ─── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>
            Budget
          </h2>
          <p style={{ fontSize: 14, color: t.muted, margin: "4px 0 0" }}>
            How your spending compares to {Object.keys(customBudgets).length > 0 ? "your custom" : "recommended"} limits
          </p>
        </div>
        <button
          onClick={() => setShowSetAll(true)}
          style={{
            background: "transparent",
            border: `1px solid ${t.border}`,
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            color: t.muted,
            cursor: "pointer",
          }}
        >
          + Set custom budget
        </button>
      </div>

      {/* ─── Filter row ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <span
          style={{
            ...chipStyle,
            background: t.primarySoft ?? "rgba(82,183,136,0.1)",
            color: t.primary,
            border: "none",
            cursor: "default",
          }}
        >
          <CalendarIcon /> {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <div ref={sortRef} style={{ position: "relative" }}>
          <button style={chipStyle} onClick={() => setSortOpen(!sortOpen)}>
            Sort by: {BUDGET_SORT_OPTIONS.find((o) => o.value === sortBy)?.label} <ChevronDownIcon />
          </button>
          {sortOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: 4,
                zIndex: 20,
                minWidth: 170,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              {BUDGET_SORT_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  style={{
                    padding: "8px 12px",
                    fontSize: 13,
                    color: sortBy === opt.value ? t.primary : t.text,
                    fontWeight: sortBy === opt.value ? 600 : 400,
                    cursor: "pointer",
                    borderRadius: 8,
                    background: sortBy === opt.value ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : "transparent",
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <span style={{ fontSize: 13, color: t.muted, marginLeft: 4 }}>
          {activeExpenses.length} categories
        </span>
      </div>

      {/* ─── Main content: cards grid + summary ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>

        {/* Category cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {activeExpenses.map((expense) => (
            <CategoryBudgetCard
              key={expense.category}
              category={expense.category}
              amount={expense.amount}
              grossMonthlyIncome={grossMonthlyIncome}
              customBudgets={customBudgets}
              t={t}
              onEdit={() => setEditingCategory(expense.category)}
            />
          ))}
        </div>

        {/* Monthly Summary Card */}
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Monthly budget</span>
            <StatusPill label={overallStatus.label} variant={overallStatus.variant} />
          </div>

          <div style={{ marginBottom: 4 }}>
            <FormattedNumber value={grossMonthlyIncome} fontSize={28} fontWeight={600} showCents={false} color={t.text} />
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 20 }}>
            total gross income
          </div>

          <HalfDonutGauge spent={totalExpenses} total={grossMonthlyIncome} t={t} />

          {/* Most expenses ranked list */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 12 }}>Most expenses</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ranked.map((expense) => {
                const pctOfTotal = totalExpenses > 0 ? (expense.amount / totalExpenses) * 100 : 0;
                const budgetAmount = getBudgetAmount(expense.category, grossMonthlyIncome, customBudgets);
                const isOver = expense.amount > budgetAmount;

                return (
                  <div key={expense.category} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: isOver ? t.danger : EV_500,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: t.text, flex: 1 }}>{expense.category}</span>
                    <span style={{ fontSize: 13, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'", color: t.text, fontWeight: 500 }}>
                      {fmtCompact(expense.amount)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: MONO_FONT_STACK,
                        color: isOver ? t.danger : EV_500,
                        fontWeight: 500,
                        minWidth: 42,
                        textAlign: "right",
                      }}
                    >
                      {isOver ? "↑" : "↓"} {pctOfTotal.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Edit single category modal ──────────────────────────────────── */}
      {editingCategory && (
        <BudgetEditModal
          t={t}
          isDark={isDark}
          isOpen
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          currentBudget={editingBudget}
          actualSpent={editingExpense?.amount ?? 0}
          recommendedBudget={editingRecommended}
          grossMonthlyIncome={grossMonthlyIncome}
          onSave={(amount) => onSetCustomBudget?.(editingCategory, amount)}
          onReset={() => onClearCustomBudget?.(editingCategory)}
        />
      )}

      {/* ─── Set all budgets modal ───────────────────────────────────────── */}
      {showSetAll && (
        <SetAllBudgetsModal
          t={t}
          isDark={isDark}
          isOpen
          onClose={() => setShowSetAll(false)}
          expenses={activeExpenses}
          currentBudgets={customBudgets}
          recommendedBudgets={recommendedBudgets}
          grossMonthlyIncome={grossMonthlyIncome}
          onSaveAll={(budgets) => {
            // Clear all first, then set each
            onClearAllCustomBudgets?.();
            for (const [cat, amt] of Object.entries(budgets)) {
              onSetCustomBudget?.(cat, amt);
            }
          }}
        />
      )}
    </div>
  );
}
