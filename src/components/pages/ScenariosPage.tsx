import type { ThemeConfig } from "@/lib/app-shared";
import { EV_400, EV_500, EV_600, EV_700, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";

// ─── Types ──────────────────────────────────────────────────────────────────

type ScenarioStatus = "in_progress" | "completed" | "draft";

interface Scenario {
  name: string;
  subtitle: string;
  impactAnnual: number;
  targetAnnual: number;
  progress: number; // 0–100
  status: ScenarioStatus;
}

export interface ScenariosPageProps {
  t: ThemeConfig;
  isDark: boolean;
  expenses: Array<{ category: string; amount: number }>;
  totalExpenses: number;
  grossMonthlyIncome: number;
  annualRequired: number;
  currentAnnualIncome: number;
  taxRate: number;
  healthScore: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCompact(n: number): string {
  return "$" + Math.round(Math.abs(n)).toLocaleString();
}

function getExpense(expenses: Array<{ category: string; amount: number }>, name: string): number {
  return expenses.find((e) => e.category === name)?.amount ?? 0;
}

function taxMultiplier(taxRate: number): number {
  return taxRate > 0 ? 1 / (1 - taxRate / 100) : 1;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

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
const PencilIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" />
  </svg>
);
const PlusIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const FlagIcon = () => (
  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

// ─── Scenario generation ────────────────────────────────────────────────────

function generateScenarios(
  expenses: Array<{ category: string; amount: number }>,
  grossMonthlyIncome: number,
  taxRate: number,
): Scenario[] {
  const mult = taxMultiplier(taxRate);
  const now = new Date();
  const monthLabel = now.toLocaleString("default", { month: "short" });
  const year = now.getFullYear();
  const started = `Started — ${monthLabel} ${year}`;

  const scenarios: Scenario[] = [];

  // 1. Cut housing by $200/mo
  const housing = getExpense(expenses, "Housing / Rent");
  if (housing > 200) {
    const impact = 200 * 12 * mult;
    scenarios.push({
      name: "Cut housing by $200/mo",
      subtitle: started,
      impactAnnual: Math.round(impact * 0.68),
      targetAnnual: Math.round(impact),
      progress: 68,
      status: "in_progress",
    });
  }

  // 2. Add side income $500/mo
  {
    const impact = 500 * 12;
    scenarios.push({
      name: "Add side income $500/mo",
      subtitle: `Completed — ${monthLabel} ${year}`,
      impactAnnual: impact,
      targetAnnual: impact,
      progress: 100,
      status: "completed",
    });
  }

  // 3. Reduce food spending 15%
  const food = getExpense(expenses, "Food & Groceries");
  if (food > 0) {
    const impact = Math.round(food * 0.15 * 12 * mult);
    scenarios.push({
      name: "Reduce food spending 15%",
      subtitle: started,
      impactAnnual: Math.round(impact * 0.45),
      targetAnnual: impact,
      progress: 45,
      status: "in_progress",
    });
  }

  // 4. Move to lower tax state (save 5%)
  {
    const impact = Math.round(grossMonthlyIncome * 12 * 0.05);
    scenarios.push({
      name: "Move to lower tax state (save 5%)",
      subtitle: "Draft — not started",
      impactAnnual: 0,
      targetAnnual: impact,
      progress: 0,
      status: "draft",
    });
  }

  // 5. Eliminate entertainment
  const entertainment = getExpense(expenses, "Entertainment");
  if (entertainment > 0) {
    const impact = Math.round(entertainment * 12 * mult);
    scenarios.push({
      name: "Eliminate entertainment",
      subtitle: started,
      impactAnnual: Math.round(impact * 0.8),
      targetAnnual: impact,
      progress: 80,
      status: "in_progress",
    });
  }

  // 6. Boost savings to 20%
  const netMonthly = grossMonthlyIncome * (1 - taxRate / 100);
  const currentSavings = getExpense(expenses, "Savings & Investments");
  const targetSavings = netMonthly * 0.2;
  if (targetSavings > currentSavings) {
    const gap = Math.round((targetSavings - currentSavings) * 12);
    scenarios.push({
      name: "Boost savings to 20%",
      subtitle: "Draft — not started",
      impactAnnual: 0,
      targetAnnual: gap,
      progress: 0,
      status: "draft",
    });
  }

  // Ensure at least 4 by adding fallbacks
  if (scenarios.length < 4) {
    const transport = getExpense(expenses, "Transportation");
    if (transport > 0) {
      const impact = Math.round(transport * 0.2 * 12 * mult);
      scenarios.push({
        name: "Reduce transport costs 20%",
        subtitle: started,
        impactAnnual: Math.round(impact * 0.3),
        targetAnnual: impact,
        progress: 30,
        status: "in_progress",
      });
    }
  }
  if (scenarios.length < 4) {
    scenarios.push({
      name: "Negotiate a 5% raise",
      subtitle: "Draft — not started",
      impactAnnual: 0,
      targetAnnual: Math.round(grossMonthlyIncome * 12 * 0.05),
      progress: 0,
      status: "draft",
    });
  }

  return scenarios;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string }> = {
  in_progress: { label: "In progress", color: EV_500 },
  completed: { label: "Completed", color: EV_700 },
  draft: { label: "Draft", color: "" }, // will use t.muted
};

function statusDotColor(status: ScenarioStatus, t: ThemeConfig): string {
  if (status === "draft") return t.muted;
  return STATUS_CONFIG[status].color;
}

// ─── Scenario Card ──────────────────────────────────────────────────────────

function ScenarioCard({ scenario, t, isDark }: { scenario: Scenario; t: ThemeConfig; isDark: boolean }) {
  const { name, subtitle, impactAnnual, targetAnnual, progress, status } = scenario;
  const dotColor = statusDotColor(status, t);
  const statusLabel = STATUS_CONFIG[status].label;
  const remaining = Math.max(targetAnnual - impactAnnual, 0);

  const barBg = isDark ? "rgba(82,183,136,0.15)" : (t.primarySoft ?? "rgba(82,183,136,0.1)");
  const barFill = status === "completed"
    ? EV_500
    : `linear-gradient(to right, ${EV_700}, ${EV_400})`;

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{name}</span>
        <span style={{ color: t.muted, cursor: "pointer", flexShrink: 0 }}><PencilIcon /></span>
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>{subtitle}</div>

      {/* Value row */}
      <div style={{ marginBottom: 12 }}>
        <FormattedNumber value={impactAnnual} fontSize={24} fontWeight={600} showCents={false} color={t.text} />
        <span style={{ fontSize: 13, color: t.muted, marginLeft: 6 }}>
          of {fmtCompact(targetAnnual)}/yr
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 4, background: barBg, marginBottom: 10, overflow: "hidden" }}>
        {progress > 0 && (
          <div
            style={{
              height: "100%",
              width: `${Math.min(progress, 100)}%`,
              borderRadius: 4,
              background: barFill,
            }}
          />
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? EV_400 : EV_700 }}>
            {progress}%
          </span>
          <span style={{ fontSize: 12, color: status === "draft" ? t.muted : (isDark ? EV_400 : EV_700) }}>
            {statusLabel}
          </span>
        </div>
        {remaining > 0 && (
          <span style={{ fontSize: 12, color: t.muted, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
            Left: {fmtCompact(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Impact Overview Line Chart ─────────────────────────────────────────────

function ImpactOverviewChart({ t, totalImpact }: { t: ThemeConfig; totalImpact: number }) {
  const count = 8;
  const chartW = 400;
  const chartH = 140;
  // Ramp from 0 to totalImpact with slight S-curve
  const points = Array.from({ length: count }, (_, i) => {
    const pct = i / (count - 1);
    const curve = pct * pct * (3 - 2 * pct); // smoothstep
    return Math.round(totalImpact * curve);
  });
  const maxVal = Math.max(...points, 1) * 1.1;

  const coords = points.map((v, i) => ({
    x: (i / (count - 1)) * chartW,
    y: chartH - (v / maxVal) * chartH,
    v,
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${chartW} ${chartH} L 0 ${chartH} Z`;

  const now = new Date();
  const months = Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1) + i, 1);
    return d.toLocaleString("default", { month: "short" });
  });

  // Y-axis: 4 labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((maxVal / ySteps) * (ySteps - i)));

  const tip = coords[coords.length - 1];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["This year", "Same period last year"].map((label, i) => (
          <span
            key={label}
            style={{
              background: i === 0 ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : "transparent",
              color: i === 0 ? t.primary : t.muted,
              border: i === 0 ? "none" : `1px solid ${t.border}`,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {/* Y-axis */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: chartH, width: 48, flexShrink: 0 }}>
          {yLabels.map((v, i) => (
            <span key={i} style={{ fontSize: 11, color: t.muted, fontFamily: MONO_FONT_STACK, textAlign: "right" }}>
              {fmtCompact(v)}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          {/* Grid lines */}
          {Array.from({ length: ySteps + 1 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", top: `${(i / ySteps) * 100}%`, left: 0, right: 0, borderBottom: `1px dashed ${t.border}` }} />
          ))}

          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: chartH, display: "block", position: "relative", zIndex: 1 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="impactAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EV_500} stopOpacity="0.15" />
                <stop offset="100%" stopColor={EV_500} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#impactAreaGrad)" />
            <path d={linePath} fill="none" stroke={EV_500} strokeWidth={2} />
            {coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={2.5} fill={EV_500} />
            ))}
          </svg>

          {/* Tooltip on last point */}
          {tip && (
            <div
              style={{
                position: "absolute",
                left: `${(tip.x / chartW) * 100}%`,
                top: `${(tip.y / chartH) * 100}%`,
                transform: "translate(-100%, -130%)",
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
            {months.map((m) => (
              <span key={m} style={{ fontSize: 11, color: t.muted }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ScenariosPage ──────────────────────────────────────────────────────────

export function ScenariosPage({
  t,
  isDark,
  expenses,
  totalExpenses,
  grossMonthlyIncome,
  annualRequired,
  currentAnnualIncome,
  taxRate,
  healthScore,
}: ScenariosPageProps) {
  const scenarios = generateScenarios(expenses, grossMonthlyIncome, taxRate);
  const isEmpty = expenses.filter((e) => e.amount > 0).length === 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 980;

  const totalImpact = scenarios.reduce((s, sc) => s + sc.impactAnnual, 0);
  const countByStatus = (st: ScenarioStatus) => scenarios.filter((s) => s.status === st).length;

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

  // ─── Empty state ──────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><FlagIcon /></div>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>No scenarios yet</div>
        <div style={{ fontSize: 14, color: t.muted, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
          Start planning your financial future. Create your first scenario to test what-if changes.
        </div>
        <button
          style={{
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          <PlusIcon /> Create first scenario
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>Scenarios</h2>
          <p style={{ fontSize: 14, color: t.muted, margin: "4px 0 0" }}>Create financial goals and test what-if changes</p>
        </div>
        <button
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
          <PlusIcon /> New scenario
        </button>
      </div>

      {/* ─── Filter row ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button style={chipStyle}><CalendarIcon /> This year</button>
        <button style={chipStyle}>Sort by: Impact <ChevronDownIcon /></button>
        {(["All", "In progress", "Completed", "Draft"] as const).map((label, i) => (
          <button
            key={label}
            style={{
              ...chipStyle,
              background: i === 0 ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : t.cardBg,
              color: i === 0 ? t.primary : t.muted,
              border: i === 0 ? "none" : `1px solid ${t.border}`,
            }}
          >
            {label}
          </button>
        ))}
        <button style={{ background: "none", border: "none", fontSize: 13, color: t.muted, cursor: "pointer", padding: 0 }}>
          Reset all
        </button>
        <span style={{ fontSize: 13, color: t.muted, marginLeft: "auto" }}>
          {scenarios.length} scenarios
        </span>
      </div>

      {/* ─── Scenario cards grid ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {scenarios.map((sc) => (
          <ScenarioCard key={sc.name} scenario={sc} t={t} isDark={isDark} />
        ))}
      </div>

      {/* ─── Summary row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Total scenarios card */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: t.muted, fontWeight: 500, marginBottom: 8 }}>Total scenarios</div>
          <div style={{ fontSize: 32, fontWeight: 600, color: t.text, fontFamily: MONO_FONT_STACK, marginBottom: 16 }}>
            {scenarios.length}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              { label: "In progress", color: EV_500, count: countByStatus("in_progress") },
              { label: "Completed", color: EV_700, count: countByStatus("completed") },
              { label: "Draft", color: t.muted, count: countByStatus("draft") },
              { label: "On hold", color: "#f59e0b", count: 0 },
            ] as const).map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{item.count}</span>
                <span style={{ fontSize: 13, color: t.muted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact overview chart */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: t.muted, fontWeight: 500, marginBottom: 12 }}>Impact overview</div>
          <ImpactOverviewChart t={t} totalImpact={totalImpact} />
        </div>
      </div>
    </div>
  );
}
