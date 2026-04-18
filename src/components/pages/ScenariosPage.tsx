import { useState, useRef, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_400, EV_500, EV_600, EV_700, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";
import { useScenarioStore, type DashboardScenario, type DashboardScenarioStatus } from "@/lib/scenario-store";

// ─── Types ──────────────────────────────────────────────────────────────────

type ScenarioStatus = "in_progress" | "completed" | "draft";

interface SuggestedScenario {
  name: string;
  subtitle: string;
  impactAnnual: number;
  targetAnnual: number;
  progress: number;
  status: ScenarioStatus;
}

// Unified type for rendering
interface DisplayScenario {
  id: string;
  name: string;
  subtitle: string;
  impactAnnual: number;
  targetAnnual: number;
  progress: number;
  status: ScenarioStatus;
  isReal: boolean;
  realId?: string; // store id for real scenarios
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
  onBack?: () => void;
  onSimulator?: () => void;
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
const TrashIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

// ─── Scenario generation (suggestions) ─────────────────────────────────────

function generateSuggestions(
  expenses: Array<{ category: string; amount: number }>,
  grossMonthlyIncome: number,
  taxRate: number,
): SuggestedScenario[] {
  const mult = taxMultiplier(taxRate);
  const scenarios: SuggestedScenario[] = [];

  const housing = getExpense(expenses, "Housing / Rent");
  if (housing > 200) {
    scenarios.push({
      name: "Cut housing by $200/mo",
      subtitle: "Suggested scenario",
      impactAnnual: 0,
      targetAnnual: Math.round(200 * 12 * mult),
      progress: 0,
      status: "draft",
    });
  }

  {
    scenarios.push({
      name: "Add side income $500/mo",
      subtitle: "Suggested scenario",
      impactAnnual: 0,
      targetAnnual: 500 * 12,
      progress: 0,
      status: "draft",
    });
  }

  const food = getExpense(expenses, "Food & Groceries");
  if (food > 0) {
    scenarios.push({
      name: "Reduce food spending 15%",
      subtitle: "Suggested scenario",
      impactAnnual: 0,
      targetAnnual: Math.round(food * 0.15 * 12 * mult),
      progress: 0,
      status: "draft",
    });
  }

  {
    scenarios.push({
      name: "Move to lower tax state (save 5%)",
      subtitle: "Suggested scenario",
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
  draft: { label: "Draft", color: "" },
};

function statusDotColor(status: ScenarioStatus, t: ThemeConfig): string {
  if (status === "draft") return t.muted;
  return STATUS_CONFIG[status].color;
}

const STATUS_OPTIONS: Array<{ value: DashboardScenarioStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

// ─── Real Scenario Card ────────────────────────────────────────────────────

function RealScenarioCard({
  scenario,
  t,
  isDark,
  onEdit,
  onUpdateStatus,
  onUpdateProgress,
  onDelete,
}: {
  scenario: DashboardScenario;
  t: ThemeConfig;
  isDark: boolean;
  onEdit: () => void;
  onUpdateStatus: (status: DashboardScenarioStatus) => void;
  onUpdateProgress: (progress: number) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen]);

  const { name, description, annualImpact, adjustedAnnualRequired, progress, status, createdAt } = scenario;
  const dotColor = statusDotColor(status, t);
  const statusLabel = STATUS_CONFIG[status].label;

  const barBg = isDark ? "rgba(82,183,136,0.15)" : (t.primarySoft ?? "rgba(82,183,136,0.1)");
  const barFill = status === "completed"
    ? EV_500
    : `linear-gradient(to right, ${EV_700}, ${EV_400})`;

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{name}</span>
        <span
          onClick={() => setExpanded(!expanded)}
          style={{ color: t.muted, cursor: "pointer", flexShrink: 0 }}
        >
          <PencilIcon />
        </span>
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>
        {description.length > 60 ? description.slice(0, 60) + "..." : description}
        <span style={{ marginLeft: 6, opacity: 0.7 }}>{timeAgo(createdAt)}</span>
      </div>

      {/* Value row */}
      <div style={{ marginBottom: 12 }}>
        <FormattedNumber value={Math.abs(annualImpact)} fontSize={24} fontWeight={600} showCents={false} color={t.text} />
        <span style={{ fontSize: 13, color: t.muted, marginLeft: 6 }}>
          {annualImpact >= 0 ? "saved" : "added"}/yr
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 4, background: barBg, marginBottom: 10, overflow: "hidden" }}>
        {progress > 0 && (
          <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, borderRadius: 4, background: barFill }} />
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? EV_400 : EV_700 }}>{progress}%</span>
          <span style={{ fontSize: 12, color: status === "draft" ? t.muted : (isDark ? EV_400 : EV_700) }}>{statusLabel}</span>
        </div>
        {adjustedAnnualRequired > 0 && (
          <span style={{ fontSize: 12, color: t.muted, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
            Req: {fmtCompact(adjustedAnnualRequired)}
          </span>
        )}
      </div>

      {/* ─── Expanded edit panel ─────────────────────────────── */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
          {/* Status dropdown */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: t.muted, marginBottom: 4 }}>Status</div>
            <div ref={statusRef} style={{ position: "relative", display: "inline-block" }}>
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 13,
                  color: t.text,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }} />
                {statusLabel} <ChevronDownIcon />
              </button>
              {statusOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: 4,
                  zIndex: 20,
                  minWidth: 140,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                }}>
                  {STATUS_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        onUpdateStatus(opt.value);
                        if (opt.value === "completed") onUpdateProgress(100);
                        setStatusOpen(false);
                      }}
                      style={{
                        padding: "6px 10px",
                        fontSize: 13,
                        color: status === opt.value ? t.primary : t.text,
                        fontWeight: status === opt.value ? 600 : 400,
                        cursor: "pointer",
                        borderRadius: 6,
                        background: status === opt.value ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : "transparent",
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress slider */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: t.muted, marginBottom: 4 }}>
              Progress: {progress}%
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => onUpdateProgress(Number(e.target.value))}
              style={{ width: "100%", accentColor: EV_500 }}
            />
          </div>

          {/* Actions row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onEdit}
              style={{
                background: t.primarySoft ?? "rgba(82,183,136,0.1)",
                color: t.primary,
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <PencilIcon /> Edit in Simulator
            </button>
            {deleteConfirm ? (
              <>
                <button
                  onClick={() => { onDelete(); setDeleteConfirm(false); }}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <TrashIcon /> Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  style={{
                    background: "transparent",
                    color: t.muted,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  background: "transparent",
                  color: "#ef4444",
                  border: `1px solid rgba(239,68,68,0.3)`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <TrashIcon /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Suggested Scenario Card ───────────────────────────────────────────────

function SuggestedScenarioCard({
  scenario,
  t,
  isDark,
  onSimulator,
}: {
  scenario: SuggestedScenario;
  t: ThemeConfig;
  isDark: boolean;
  onSimulator?: () => void;
}) {
  const { name, targetAnnual } = scenario;

  return (
    <div style={{
      background: t.cardBg,
      border: `1px dashed ${t.border}`,
      borderRadius: 16,
      padding: 20,
      opacity: 0.85,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{name}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "2px 8px",
            borderRadius: 6,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: t.muted,
          }}
        >
          Suggested
        </span>
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>
        Potential annual impact: {fmtCompact(targetAnnual)}
      </div>

      <button
        onClick={onSimulator}
        style={{
          background: t.primarySoft ?? "rgba(82,183,136,0.1)",
          color: t.primary,
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <PlusIcon /> Try in Simulator
      </button>
    </div>
  );
}

// ─── Impact Overview Line Chart ─────────────────────────────────────────────

function ImpactOverviewChart({ t, realScenarios }: { t: ThemeConfig; realScenarios: DashboardScenario[] }) {
  const [impactPeriod, setImpactPeriod] = useState<string>("this_year");

  // Build real date-based data from scenario creation dates
  const now = new Date();
  const count = 8;
  const chartW = 400;
  const chartH = 140;

  // Create monthly buckets for the last 8 months
  const months: string[] = [];
  const monthStarts: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("default", { month: "short" }));
    monthStarts.push(d);
  }

  // Accumulate impact from real scenarios by their creation date
  const points = monthStarts.map((monthStart, idx) => {
    const monthEnd = idx < count - 1 ? monthStarts[idx + 1] : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let cumulative = 0;
    for (const sc of realScenarios) {
      const created = new Date(sc.createdAt);
      if (created < monthEnd) {
        // Scale by progress
        cumulative += Math.abs(sc.annualImpact) * (sc.progress / 100);
      }
    }
    return Math.round(cumulative);
  });

  const maxVal = Math.max(...points, 1) * 1.1;

  const coords = points.map((v, i) => ({
    x: (i / (count - 1)) * chartW,
    y: chartH - (v / maxVal) * chartH,
    v,
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${chartW} ${chartH} L 0 ${chartH} Z`;

  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((maxVal / ySteps) * (ySteps - i)));
  const tip = coords[coords.length - 1];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {([
          { label: "This year", value: "this_year" },
          { label: "Same period last year", value: "last_year" },
        ]).map((item) => {
          const isActive = impactPeriod === item.value;
          return (
            <span
              key={item.value}
              onClick={() => setImpactPeriod(item.value)}
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

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: chartH, width: 48, flexShrink: 0 }}>
          {yLabels.map((v, i) => (
            <span key={i} style={{ fontSize: 11, color: t.muted, fontFamily: MONO_FONT_STACK, textAlign: "right" }}>
              {fmtCompact(v)}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, position: "relative" }}>
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

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {months.map((m, i) => (
              <span key={i} style={{ fontSize: 11, color: t.muted }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
      {impactPeriod !== "this_year" && (
        <div style={{ fontSize: 12, color: t.muted, fontStyle: "italic", marginTop: 8 }}>
          Historical comparison available after one year of use
        </div>
      )}
    </div>
  );
}

// ─── ScenariosPage ──────────────────────────────────────────────────────────

type FilterValue = "all" | "in_progress" | "completed" | "draft";
type SortValue = "impact" | "name" | "progress";

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "impact", label: "Impact" },
  { value: "name", label: "Name" },
  { value: "progress", label: "Progress" },
];

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
  onBack,
  onSimulator,
}: ScenariosPageProps) {
  const isEmpty = expenses.filter((e) => e.amount > 0).length === 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 980;

  // Real scenarios from store
  const realScenarios = useScenarioStore((s) => s.scenarios);
  const updateScenario = useScenarioStore((s) => s.updateScenario);
  const deleteScenario = useScenarioStore((s) => s.deleteScenario);

  // Suggestions: show only if fewer than 3 real scenarios
  const suggestions = realScenarios.length < 3
    ? generateSuggestions(expenses, grossMonthlyIncome, taxRate).slice(0, Math.max(0, 3 - realScenarios.length))
    : [];

  // Build unified display list
  const allDisplay: DisplayScenario[] = [
    ...realScenarios.map((s): DisplayScenario => ({
      id: s.id,
      name: s.name,
      subtitle: s.description,
      impactAnnual: Math.abs(s.annualImpact),
      targetAnnual: Math.abs(s.annualImpact) || s.adjustedAnnualRequired,
      progress: s.progress,
      status: s.status,
      isReal: true,
      realId: s.id,
    })),
    ...suggestions.map((s, i): DisplayScenario => ({
      id: `suggestion-${i}`,
      name: s.name,
      subtitle: s.subtitle,
      impactAnnual: s.impactAnnual,
      targetAnnual: s.targetAnnual,
      progress: s.progress,
      status: s.status,
      isReal: false,
    })),
  ];

  // Filter + sort state
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("impact");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  // Filter (only applies to real scenarios; suggestions always show)
  const filtered = allDisplay.filter((s) => {
    if (!s.isReal) return true; // always show suggestions
    if (activeFilter === "all") return true;
    return s.status === activeFilter;
  });

  // Sort
  const scenarios = [...filtered].sort((a, b) => {
    // Real scenarios first
    if (a.isReal !== b.isReal) return a.isReal ? -1 : 1;
    if (sortBy === "impact") return b.impactAnnual - a.impactAnnual;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return b.progress - a.progress;
  });

  const totalImpact = realScenarios.reduce((s, sc) => s + Math.abs(sc.annualImpact) * (sc.progress / 100), 0);
  const countByStatus = (st: ScenarioStatus) => realScenarios.filter((s) => s.status === st).length;
  const totalCount = realScenarios.length;

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

  function handleDelete(id: string) {
    deleteScenario(id);
  }

  // ─── Empty state ──────────────────────────────────────────────────────
  if (isEmpty && realScenarios.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><FlagIcon /></div>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>No scenarios yet</div>
        <div style={{ fontSize: 14, color: t.muted, marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
          Start planning your financial future. Create your first scenario to test what-if changes.
        </div>
        <button
          onClick={onSimulator}
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
      {onBack && (
        <div onClick={onBack} style={{ fontSize: 14, color: t.muted, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back to Dashboard
        </div>
      )}
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>Scenarios</h2>
          <p style={{ fontSize: 14, color: t.muted, margin: "4px 0 0" }}>Create financial goals and test what-if changes</p>
        </div>
        <button
          onClick={onSimulator}
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
        <span
          style={{
            ...chipStyle,
            background: t.primarySoft ?? "rgba(82,183,136,0.1)",
            color: t.primary,
            border: "none",
            cursor: "default",
          }}
        >
          <CalendarIcon /> {new Date().getFullYear()}
        </span>

        {/* Sort dropdown */}
        <div ref={sortRef} style={{ position: "relative" }}>
          <button style={chipStyle} onClick={() => setSortOpen(!sortOpen)}>
            Sort by: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label} <ChevronDownIcon />
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
                minWidth: 160,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
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

        {/* Filter chips */}
        {([
          { label: "All", value: "all" as FilterValue },
          { label: "In progress", value: "in_progress" as FilterValue },
          { label: "Completed", value: "completed" as FilterValue },
          { label: "Draft", value: "draft" as FilterValue },
        ]).map((chip) => {
          const isActive = activeFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              style={{
                ...chipStyle,
                background: isActive ? (t.primarySoft ?? "rgba(82,183,136,0.1)") : t.cardBg,
                color: isActive ? t.primary : t.muted,
                border: isActive ? "none" : `1px solid ${t.border}`,
              }}
            >
              {chip.label}
            </button>
          );
        })}
        <button
          onClick={() => { setActiveFilter("all"); setSortBy("impact"); }}
          style={{ background: "none", border: "none", fontSize: 13, color: t.muted, cursor: "pointer", padding: 0 }}
        >
          Reset all
        </button>
        <span style={{ fontSize: 13, color: t.muted, marginLeft: "auto" }}>
          {totalCount} scenario{totalCount !== 1 ? "s" : ""}
          {suggestions.length > 0 && ` + ${suggestions.length} suggested`}
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
        {scenarios.map((sc) => {
          if (sc.isReal && sc.realId) {
            const real = realScenarios.find((r) => r.id === sc.realId);
            if (!real) return null;
            return (
              <RealScenarioCard
                key={real.id}
                scenario={real}
                t={t}
                isDark={isDark}
                onEdit={() => onSimulator?.()}
                onUpdateStatus={(status) => updateScenario(real.id, { status })}
                onUpdateProgress={(progress) => updateScenario(real.id, { progress })}
                onDelete={() => handleDelete(real.id)}
              />
            );
          }
          // Suggestion card
          const suggestion = suggestions.find((s) => sc.id === `suggestion-${suggestions.indexOf(s)}`);
          if (!suggestion) {
            // Fallback: find by matching name
            const idx = parseInt(sc.id.replace("suggestion-", ""), 10);
            const fallbackSuggestion = suggestions[idx];
            if (!fallbackSuggestion) return null;
            return (
              <SuggestedScenarioCard
                key={sc.id}
                scenario={fallbackSuggestion}
                t={t}
                isDark={isDark}
                onSimulator={onSimulator}
              />
            );
          }
          return (
            <SuggestedScenarioCard
              key={sc.id}
              scenario={suggestion}
              t={t}
              isDark={isDark}
              onSimulator={onSimulator}
            />
          );
        })}
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
            {totalCount}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              { label: "In progress", color: EV_500, count: countByStatus("in_progress") },
              { label: "Completed", color: EV_700, count: countByStatus("completed") },
              { label: "Draft", color: t.muted, count: countByStatus("draft") },
              { label: "Suggested", color: "#f59e0b", count: suggestions.length },
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
          <ImpactOverviewChart t={t} realScenarios={realScenarios} />
        </div>
      </div>
    </div>
  );
}
