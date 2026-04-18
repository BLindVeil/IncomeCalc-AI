import { useState, useRef, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import {
  EV_200, EV_300, EV_400, EV_500, EV_600, EV_700, EV_800, EV_900,
  MONO_FONT_STACK,
} from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ComingSoonToast } from "@/components/ui/ComingSoonToast";

// ─── Props ──────────────────────────────────────────────────────────────────

export interface AnalyticsPageProps {
  t: ThemeConfig;
  isDark: boolean;
  grossMonthlyIncome: number;
  netMonthlyIncome: number;
  totalExpenses: number;
  expenses: Array<{ category: string; amount: number }>;
  healthScore: number;
  taxRate: number;
  annualRequired: number;
  currentAnnualIncome: number;
  onBack?: () => void;
  onExportCsv?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCompact(n: number): string {
  return "$" + Math.round(Math.abs(n)).toLocaleString();
}

function ratioColor(value: number, green: number, warn: number, invert = false): string {
  if (invert) return value <= green ? "#22c55e" : value <= warn ? "#f59e0b" : "#ef4444";
  return value >= green ? "#22c55e" : value >= warn ? "#f59e0b" : "#ef4444";
}

const DONUT_COLORS = [EV_800, EV_600, EV_500, EV_400, EV_300, EV_700, EV_200, EV_900];

// ─── SVG Icons ──────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const DownloadIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const GridSmIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);
const PlusIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Simulated monthly data ─────────────────────────────────────────────────

function generateMonthlyData(gross: number, expenses: number, months: number) {
  const data: Array<{ month: string; income: number; expense: number }> = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    // slight realistic variance
    const factor = 1 + (Math.sin(i * 1.7) * 0.04);
    const eFactor = 1 + (Math.cos(i * 2.1) * 0.06);
    data.push({
      month: label,
      income: Math.round(gross * factor),
      expense: Math.round(expenses * eFactor),
    });
  }
  return data;
}

function generateLinePoints(base: number, count: number) {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const variance = 1 + (Math.sin(i * 1.3 + 0.5) * 0.05);
    points.push(Math.round(base * variance));
  }
  return points;
}

// ─── Income Overview Line Chart ─────────────────────────────────────────────

type ChartMode = "balance" | "income" | "expenses";

function IncomeLineChart({ t, grossMonthlyIncome, totalExpenses }: { t: ThemeConfig; grossMonthlyIncome: number; totalExpenses: number }) {
  const [chartMode, setChartMode] = useState<ChartMode>("balance");
  const [overviewPeriod, setOverviewPeriod] = useState<string>("this_month");

  const baseValue = chartMode === "income"
    ? grossMonthlyIncome
    : chartMode === "expenses"
      ? totalExpenses
      : grossMonthlyIncome - totalExpenses;

  const count = 8;
  const points = generateLinePoints(Math.abs(baseValue), count);
  const maxVal = Math.max(...points) * 1.1;
  const minVal = 0;
  const chartW = 600;
  const chartH = 180;

  // SVG path
  const coords = points.map((v, i) => {
    const x = (i / (count - 1)) * chartW;
    const y = chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, v };
  });
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${chartW} ${chartH} L 0 ${chartH} Z`;

  // Y-axis labels
  const ySteps = 5;
  const yLabels: number[] = [];
  for (let i = 0; i <= ySteps; i++) yLabels.push(Math.round(minVal + ((maxVal - minVal) / ySteps) * i));
  yLabels.reverse();

  // X-axis dates
  const now = new Date();
  const xLabels = Array.from({ length: count }, (_, i) => {
    const day = Math.round(1 + (i / (count - 1)) * 28);
    return `${now.toLocaleString("default", { month: "short" })} ${day}`;
  });

  // Tooltip on highest point
  const highIdx = points.indexOf(Math.max(...points));
  const tip = coords[highIdx];

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, margin: 0 }}>Income overview</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {([
            { label: "This month", value: "this_month" },
            { label: "Same period last year", value: "last_year" },
            { label: "This year", value: "this_year" },
          ]).map((item) => {
            const isActive = overviewPeriod === item.value;
            return (
              <span
                key={item.value}
                onClick={() => setOverviewPeriod(item.value)}
                style={{
                  background: isActive ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : "transparent",
                  color: isActive ? t.primary : t.muted,
                  border: isActive ? "none" : `1px solid ${t.border}`,
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Toggle row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([
          { label: "Total balance", mode: "balance" as ChartMode },
          { label: "Income", mode: "income" as ChartMode },
          { label: "Expenses", mode: "expenses" as ChartMode },
        ]).map((item) => {
          const isActive = chartMode === item.mode;
          return (
            <span
              key={item.mode}
              onClick={() => setChartMode(item.mode)}
              style={{
                background: isActive ? t.primary : "transparent",
                color: isActive ? "#fff" : t.muted,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                border: isActive ? "none" : `1px solid ${t.border}`,
              }}
            >
              {item.label}
            </span>
          );
        })}
      </div>

      {/* Chart area */}
      <div style={{ position: "relative", display: "flex", gap: 8 }}>
        {/* Y-axis */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: chartH, flexShrink: 0, width: 52 }}>
          {yLabels.map((v, i) => (
            <span key={i} style={{ fontSize: 11, color: t.muted, fontFamily: MONO_FONT_STACK, textAlign: "right" }}>
              {fmtCompact(v)}
            </span>
          ))}
        </div>

        {/* SVG Chart */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Grid lines */}
          {Array.from({ length: ySteps + 1 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${(i / ySteps) * 100}%`,
                left: 0,
                right: 0,
                borderBottom: `1px dashed ${t.border}`,
              }}
            />
          ))}

          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            style={{ width: "100%", height: chartH, display: "block", position: "relative", zIndex: 1 }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EV_500} stopOpacity="0.2" />
                <stop offset="100%" stopColor={EV_500} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#lineAreaGrad)" />
            <path d={linePath} fill="none" stroke={EV_500} strokeWidth={2.5} />
            {/* Data points */}
            {coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={3} fill={EV_500} />
            ))}
          </svg>

          {/* Tooltip */}
          {tip && (
            <div
              style={{
                position: "absolute",
                left: `${(tip.x / chartW) * 100}%`,
                top: `${(tip.y / chartH) * 100}%`,
                transform: "translate(-50%, -130%)",
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: MONO_FONT_STACK,
                color: t.text,
                whiteSpace: "nowrap",
                zIndex: 2,
              }}
            >
              {fmtCompact(tip.v)}
            </div>
          )}

          {/* X-axis */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {xLabels.map((label) => (
              <span key={label} style={{ fontSize: 11, color: t.muted }}>{label}</span>
            ))}
          </div>
        </div>
      </div>
      {overviewPeriod !== "this_month" && (
        <div style={{ fontSize: 12, color: t.muted, fontStyle: "italic", marginTop: 8 }}>
          Historical data will be available after your first month of use
        </div>
      )}
    </div>
  );
}

// ─── Bar Chart: Income vs Expenses ──────────────────────────────────────────

const COMPARE_OPTIONS = [
  { value: "this_year", label: "This year" },
  { value: "last_6", label: "Last 6 months" },
  { value: "last_3", label: "Last 3 months" },
];

function IncomeExpenseBarChart({ t, isDark, grossMonthlyIncome, totalExpenses }: { t: ThemeConfig; isDark: boolean; grossMonthlyIncome: number; totalExpenses: number }) {
  const [compareRange, setCompareRange] = useState<string>("this_year");
  const [compareOpen, setCompareOpen] = useState(false);
  const compareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compareOpen) return;
    const handler = (e: MouseEvent) => {
      if (compareRef.current && !compareRef.current.contains(e.target as Node)) setCompareOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [compareOpen]);

  const data = generateMonthlyData(grossMonthlyIncome, totalExpenses, 7);
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense])) * 1.15;

  // Y-axis in $500 or $1000 increments
  const step = maxVal > 8000 ? 2000 : maxVal > 4000 ? 1000 : 500;
  const yMax = Math.ceil(maxVal / step) * step;
  const ySteps: number[] = [];
  for (let v = yMax; v >= 0; v -= step) ySteps.push(v);

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: 24,
        flex: 1,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, margin: 0 }}>Comparing income and expenses</h3>
        <div ref={compareRef} style={{ position: "relative" }}>
          <span
            onClick={() => setCompareOpen(!compareOpen)}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              color: t.muted,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {COMPARE_OPTIONS.find((o) => o.value === compareRange)?.label} <ChevronDownIcon />
          </span>
          {compareOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: 4,
                zIndex: 20,
                minWidth: 160,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              {COMPARE_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => { setCompareRange(opt.value); setCompareOpen(false); }}
                  style={{
                    padding: "8px 12px",
                    fontSize: 13,
                    color: compareRange === opt.value ? t.primary : t.text,
                    fontWeight: compareRange === opt.value ? 600 : 400,
                    cursor: "pointer",
                    borderRadius: 8,
                    background: compareRange === opt.value ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : "transparent",
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: EV_800 }} /> Income
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: isDark ? "rgba(82,183,136,0.3)" : EV_200 }} /> Expense
        </span>
      </div>

      {/* Chart */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* Y-axis */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 180, flexShrink: 0, width: 48 }}>
          {ySteps.map((v) => (
            <span key={v} style={{ fontSize: 10, color: t.muted, fontFamily: MONO_FONT_STACK, textAlign: "right" }}>
              {fmtCompact(v)}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, height: 180, position: "relative" }}>
          {/* Horizontal grid */}
          {ySteps.map((v) => (
            <div
              key={v}
              style={{
                position: "absolute",
                bottom: `${(v / yMax) * 100}%`,
                left: 0,
                right: 0,
                borderBottom: `1px dashed ${t.border}`,
              }}
            />
          ))}

          {data.map((d) => {
            const incH = (d.income / yMax) * 100;
            const expH = (d.expense / yMax) * 100;
            const exceeded = d.expense > d.income;
            return (
              <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 160 }}>
                  <div
                    style={{
                      width: 16,
                      height: `${incH}%`,
                      background: `linear-gradient(180deg, ${EV_500}, ${EV_800})`,
                      borderRadius: "4px 4px 0 0",
                      minHeight: 4,
                    }}
                  />
                  <div
                    style={{
                      width: 16,
                      height: `${expH}%`,
                      background: exceeded ? "#ef4444" : isDark ? "rgba(82,183,136,0.3)" : EV_200,
                      borderRadius: "4px 4px 0 0",
                      minHeight: 4,
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>
      {compareRange !== "this_year" && (
        <div style={{ fontSize: 12, color: t.muted, fontStyle: "italic", marginTop: 8 }}>
          Historical data will be available after your first month of use
        </div>
      )}
    </div>
  );
}

// ─── Statistics Donut ───────────────────────────────────────────────────────

function StatisticsDonut({ t, expenses, totalExpenses }: { t: ThemeConfig; expenses: Array<{ category: string; amount: number }>; totalExpenses: number }) {
  const sorted = [...expenses].filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount);
  const top5 = sorted.slice(0, 5);
  const otherTotal = sorted.slice(5).reduce((s, e) => s + e.amount, 0);
  const slices = [...top5.map((e, i) => ({ label: e.category, value: e.amount, color: DONUT_COLORS[i % DONUT_COLORS.length] }))];
  if (otherTotal > 0) slices.push({ label: "Other", value: otherTotal, color: EV_200 });

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;

  let accumulated = 0;
  const arcs = slices.map((sl) => {
    const pct = total > 0 ? sl.value / total : 0;
    const dasharray = `${pct * circumference} ${circumference}`;
    const rotation = (accumulated / total) * 360;
    accumulated += sl.value;
    return { ...sl, dasharray, rotation, pct };
  });

  const overThreshold = sorted.filter((e) => {
    const pct = totalExpenses > 0 ? e.amount / totalExpenses : 0;
    return pct > 0.25;
  }).length;
  const subtitleText = overThreshold > 0
    ? `${overThreshold} categor${overThreshold === 1 ? "y" : "ies"} above 25% of your total expenses`
    : "Your expenses are well distributed across categories";

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: 24,
        minWidth: 0,
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, margin: "0 0 4px" }}>Statistics</h3>
      <p style={{ fontSize: 12, color: t.muted, margin: "0 0 20px" }}>{subtitleText}</p>

      {/* Donut */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={16}
              strokeDasharray={arc.dasharray}
              transform={`rotate(${-90 + arc.rotation} ${cx} ${cy})`}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 9, fill: t.muted }}>This month</text>
          <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO_FONT_STACK, fill: t.text }}>
            {fmtCompact(total)}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {arcs.map((arc) => (
          <div key={arc.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: arc.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: t.text, flex: 1 }}>{arc.label}</span>
            <span style={{ fontSize: 12, fontFamily: MONO_FONT_STACK, color: t.muted, fontWeight: 500 }}>
              {(arc.pct * 100).toFixed(0)}%
            </span>
            <span style={{ fontSize: 12, fontFamily: MONO_FONT_STACK, color: t.text, fontWeight: 500, minWidth: 60, textAlign: "right" }}>
              {fmtCompact(arc.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Key Ratios ─────────────────────────────────────────────────────────────

interface RatioItemProps {
  label: string;
  value: string;
  color: string;
  t: ThemeConfig;
}

function RatioItem({ label, value, color, t }: RatioItemProps) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: t.muted, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'", color }}>
        {value}
      </div>
      <div style={{ width: 32, height: 3, borderRadius: 2, background: color, marginTop: 6, opacity: 0.6 }} />
    </div>
  );
}

// ─── AnalyticsPage ──────────────────────────────────────────────────────────

export function AnalyticsPage({
  t,
  isDark,
  grossMonthlyIncome,
  netMonthlyIncome,
  totalExpenses,
  expenses,
  healthScore,
  taxRate,
  annualRequired,
  currentAnnualIncome,
  onBack,
  onExportCsv,
}: AnalyticsPageProps) {
  const monthlyNet = netMonthlyIncome - totalExpenses;
  const annualNet = monthlyNet * 12;
  const surplus = grossMonthlyIncome - totalExpenses;
  const expenseRatio = grossMonthlyIncome > 0 ? (totalExpenses / grossMonthlyIncome) * 100 : 0;
  const savingsRate = netMonthlyIncome > 0 ? ((expenses.find((e) => e.category === "Savings & Investments")?.amount ?? 0) / netMonthlyIncome) * 100 : 0;
  const housingAmount = expenses.find((e) => e.category === "Housing / Rent")?.amount ?? 0;
  const housingRatio = grossMonthlyIncome > 0 ? (housingAmount / grossMonthlyIncome) * 100 : 0;
  const incomeGap = annualRequired - currentAnnualIncome;

  // Toast states for "coming soon" buttons
  const [showWidgetToast, setShowWidgetToast] = useState(false);
  const [showAddWidgetToast, setShowAddWidgetToast] = useState(false);
  const [showCurrencyToast, setShowCurrencyToast] = useState(false);

  const fireToast = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

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

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 980;

  return (
    <div>
      {onBack && (
        <div onClick={onBack} style={{ fontSize: 14, color: t.muted, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to Dashboard
        </div>
      )}
      {/* ─── Page Header ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>Analytics</h2>
          <p style={{ fontSize: 14, color: t.muted, margin: "4px 0 0" }}>Detailed overview of your financial situation</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
          <button style={chipStyle} onClick={onExportCsv}><DownloadIcon /> Export CSV</button>
          {!isMobile && (
            <div style={{ position: "relative" }}>
              <button style={chipStyle} onClick={() => fireToast(setShowWidgetToast)}><GridSmIcon /> Manage widgets</button>
              <ComingSoonToast show={showWidgetToast} message="Widget customization coming soon" t={t} />
            </div>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => fireToast(setShowAddWidgetToast)}
              style={{
                background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
              }}
            >
              <PlusIcon /> Add new widget
            </button>
            <ComingSoonToast show={showAddWidgetToast} message="Widget customization coming soon" t={t} />
          </div>
        </div>
      </div>

      {/* ─── Three Metric Cards ────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Gross Income */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: t.muted, fontWeight: 500 }}>Gross Income</span>
            <div style={{ position: "relative" }}>
              <span
                onClick={() => fireToast(setShowCurrencyToast)}
                style={{ fontSize: 11, color: t.muted, border: `1px solid ${t.border}`, borderRadius: 999, padding: "2px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2 }}
              >
                USD <ChevronDownIcon />
              </span>
              <ComingSoonToast show={showCurrencyToast} message="Multi-currency support coming soon" t={t} />
            </div>
          </div>
          <FormattedNumber value={grossMonthlyIncome * 12} fontSize={28} fontWeight={600} showCents={false} color={t.text} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: surplus > 0 ? "#22c55e" : "#ef4444" }}>
              {surplus > 0 ? "↑" : "↓"} {expenseRatio > 0 ? (100 - expenseRatio).toFixed(0) : 0}% above expenses
            </span>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>12 pay periods</div>
          {surplus > 0 && (
            <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
              You earn extra {fmtCompact(surplus)}/mo compared to expenses
            </div>
          )}
        </div>

        {/* Total Expenses */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: t.muted, fontWeight: 500 }}>Total Expenses</span>
          </div>
          <FormattedNumber value={totalExpenses * 12} fontSize={28} fontWeight={600} showCents={false} color={t.text} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: expenseRatio > 80 ? "#f59e0b" : EV_500 }}>
              {expenseRatio.toFixed(0)}% of gross
            </span>
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
            {expenses.filter((e) => e.amount > 0).length} categories
          </div>
        </div>

        {/* Net Position */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: t.muted, fontWeight: 500 }}>Net Position</span>
          </div>
          <FormattedNumber
            value={Math.abs(annualNet)}
            prefix={annualNet < 0 ? "-$" : "$"}
            fontSize={28}
            fontWeight={600}
            showCents={false}
            color={annualNet >= 0 ? "#22c55e" : "#ef4444"}
          />
          <div style={{ fontSize: 12, color: t.muted, marginTop: 6 }}>
            Monthly: {monthlyNet >= 0 ? "+" : "-"}{fmtCompact(Math.abs(monthlyNet))}
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
            Savings rate: {savingsRate.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* ─── Income Overview Line Chart ────────────────────────────────── */}
      <IncomeLineChart t={t} grossMonthlyIncome={grossMonthlyIncome} totalExpenses={totalExpenses} />

      {/* ─── Two-column: Bar Chart + Statistics Donut ──────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <IncomeExpenseBarChart t={t} isDark={isDark} grossMonthlyIncome={grossMonthlyIncome} totalExpenses={totalExpenses} />
        <StatisticsDonut t={t} expenses={expenses} totalExpenses={totalExpenses} />
      </div>

      {/* ─── Key Financial Ratios ──────────────────────────────────────── */}
      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <SectionHeader label="Key financial ratios" t={t} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          <RatioItem
            label="Housing ratio"
            value={`${housingRatio.toFixed(0)}%`}
            color={ratioColor(housingRatio, 30, 40, true)}
            t={t}
          />
          <RatioItem
            label="Savings rate"
            value={`${savingsRate.toFixed(0)}%`}
            color={ratioColor(savingsRate, 20, 10)}
            t={t}
          />
          <RatioItem
            label="Expense ratio"
            value={`${expenseRatio.toFixed(0)}%`}
            color={ratioColor(expenseRatio, 70, 85, true)}
            t={t}
          />
          <RatioItem
            label="Income gap"
            value={incomeGap <= 0 ? fmtCompact(Math.abs(incomeGap)) + " surplus" : fmtCompact(incomeGap) + " gap"}
            color={incomeGap <= 0 ? "#22c55e" : incomeGap < 5000 ? "#f59e0b" : "#ef4444"}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
