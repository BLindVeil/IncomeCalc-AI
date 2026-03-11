import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Check,
  Scissors,
  Star,
  Zap,
  Copy,
  CheckCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { FinancialDiagnosis, DiagnosisAction } from "@/lib/diagnosis-types";
import type { ThemeConfig, PlanId } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";

// ─── Sub-components ──────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: FinancialDiagnosis["riskLevel"] }) {
  const cfg = {
    low: { bg: "#22c55e20", border: "#22c55e", color: "#22c55e", label: "Low Risk" },
    medium: { bg: "#f59e0b20", border: "#f59e0b", color: "#f59e0b", label: "Medium Risk" },
    high: { bg: "#ef444420", border: "#ef4444", color: "#ef4444", label: "High Risk" },
  }[level];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "3px 10px",
        borderRadius: "20px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      <AlertTriangle size={11} />
      {cfg.label}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: DiagnosisAction["impact"] }) {
  const cfg = {
    low: { bg: "#64748b20", color: "#64748b" },
    medium: { bg: "#f59e0b20", color: "#f59e0b" },
    high: { bg: "#22c55e20", color: "#22c55e" },
  }[impact];
  return (
    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: "6px", background: cfg.bg, color: cfg.color }}>
      {impact} impact
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: DiagnosisAction["difficulty"] }) {
  const cfg = {
    easy: { bg: "#22c55e20", color: "#22c55e" },
    moderate: { bg: "#f59e0b20", color: "#f59e0b" },
    hard: { bg: "#ef444420", color: "#ef4444" },
  }[difficulty];
  return (
    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: "6px", background: cfg.bg, color: cfg.color }}>
      {difficulty}
    </span>
  );
}

function SectionLabel({ icon: Icon, label, color }: { icon: React.ComponentType<{ size: number }>; label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "0.55rem",
        fontSize: "0.78rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color,
      }}
    >
      <Icon size={13} />
      {label}
    </div>
  );
}

// ─── Action Card (extracted for reuse) ───────────────────────────────────────

function ActionCard({ move, index, t, isDark, expanded }: { move: DiagnosisAction; index: number; t: ThemeConfig; isDark: boolean; expanded?: boolean }) {
  if (expanded) {
    // Enhanced first-action card with structured breakdown
    const impactLabel = { low: "Minor improvement", medium: "Noticeable improvement", high: "Significant improvement" }[move.impact];
    const diffLabel = { easy: "Can start today", moderate: "Takes some effort", hard: "Requires commitment" }[move.difficulty];
    return (
      <div
        style={{
          padding: "1rem 1.1rem",
          borderRadius: "12px",
          background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)",
          border: `1px solid rgba(99,102,241,0.2)`,
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "0.92rem", color: t.text }}>
            {index + 1}. {move.title}
          </span>
          <ImpactBadge impact={move.impact} />
          <DifficultyBadge difficulty={move.difficulty} />
        </div>
        <p style={{ margin: "0 0 0.6rem", fontSize: "0.84rem", color: t.text, opacity: 0.85, lineHeight: 1.55 }}>
          {move.explanation}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          <div style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Impact</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: { low: "#64748b", medium: "#f59e0b", high: "#22c55e" }[move.impact] }}>{impactLabel}</div>
          </div>
          <div style={{ padding: "0.4rem 0.6rem", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Effort</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: { easy: "#22c55e", moderate: "#f59e0b", hard: "#ef4444" }[move.difficulty] }}>{diffLabel}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "10px",
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        border: `1px solid ${t.border}`,
        marginBottom: "0.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: t.text }}>
          {index + 1}. {move.title}
        </span>
        <ImpactBadge impact={move.impact} />
        <DifficultyBadge difficulty={move.difficulty} />
      </div>
      <p style={{ margin: 0, fontSize: "0.82rem", color: t.text, opacity: 0.8, lineHeight: 1.5 }}>
        {move.explanation}
      </p>
    </div>
  );
}

// ─── Main Card ───────────────────────────────────────────────────────────────

interface FinancialDiagnosisCardProps {
  diagnosis: FinancialDiagnosis;
  savingsRate: number;
  monthlySurplus: number;
  grossMonthly: number;
  totalMonthly: number;
  data: ExpenseData;
  isPremium: boolean;
  onUpgrade: (plan?: PlanId) => void;
  t: ThemeConfig;
  isDark: boolean;
}

export function FinancialDiagnosisCard({ diagnosis, savingsRate, monthlySurplus, grossMonthly, totalMonthly, data, isPremium, onUpgrade, t, isDark }: FinancialDiagnosisCardProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const sectionStyle = (accent: string): React.CSSProperties => ({
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    background: accent + "12",
    borderLeft: `3px solid ${accent}`,
    marginBottom: "0.65rem",
  });

  const fmtUsd = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");

  const surplusColor = monthlySurplus >= 0 ? "#22c55e" : "#ef4444";
  const savingsColor = savingsRate >= 20 ? "#22c55e" : savingsRate >= 10 ? "#f59e0b" : "#ef4444";
  const riskColor = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" }[diagnosis.riskLevel];

  function handleCopy() {
    const text = [
      `Financial Diagnosis`,
      ``,
      `Main Issue: ${diagnosis.mainIssue}`,
      `Summary: ${diagnosis.summary}`,
      `Risk Level: ${diagnosis.riskLevel}`,
      ``,
      `Highest-Impact Actions:`,
      ...diagnosis.topMoves.map((m, i) => `  ${i + 1}. ${m.title} (${m.impact} impact, ${m.difficulty}) — ${m.explanation}`),
      ``,
      `If Unchanged (30 days): ${diagnosis.ifUnchanged30d}`,
      `If Optimized (30 days): ${diagnosis.ifOptimized30d}`,
      `If Unchanged (12 months): ${diagnosis.ifUnchanged12m}`,
      `If Optimized (12 months): ${diagnosis.ifOptimized12m}`,
      ``,
      `Verdict: ${diagnosis.verdict}`,
      ...(diagnosis.cutFirst?.length ? [``, `Cut First:`, ...diagnosis.cutFirst.map((c) => `  - ${c}`)] : []),
      ...(diagnosis.hiddenStrength ? [``, `Hidden Strength: ${diagnosis.hiddenStrength}`] : []),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Derive diagnosis signals from existing financial data ─────────────

  const housingPct = grossMonthly > 0 ? (data.housing / grossMonthly) * 100 : 0;
  const fixedExpenses = data.housing + data.utilities + data.transport + data.healthcare;
  const fixedPct = totalMonthly > 0 ? (fixedExpenses / totalMonthly) * 100 : 0;

  const signals: string[] = [];
  if (housingPct > 40) signals.push("Housing exceeds 40% of income");
  else if (housingPct > 30) signals.push("Housing above 30% of income");
  if (savingsRate < 10) signals.push("Savings rate below recommended range");
  if (fixedPct > 70) signals.push("Fixed expenses dominating budget");
  if (monthlySurplus < 0) signals.push("Monthly expenses exceed income");
  if (grossMonthly > 3000 && savingsRate < 15) signals.push("Strong income potential but weak savings structure");
  if (data.entertainment > data.savings && data.savings > 0) signals.push("Discretionary spending exceeds savings");

  // ── Premium-only sections (rendered for both tiers, gated below) ───────

  const premiumSections = (
    <>
      {/* ── Remaining Actions (2+) ─────────────────────────────────────── */}
      {diagnosis.topMoves.slice(1).map((move, i) => (
        <ActionCard key={i + 1} move={move} index={i + 1} t={t} isDark={isDark} />
      ))}

      {/* ── Scenario Comparison ────────────────────────────────────────── */}
      <div style={{ marginTop: "1rem" }}>
        <SectionLabel icon={ArrowDown} label="If Nothing Changes" color="#f59e0b" />
        <div style={sectionStyle("#f59e0b")}>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>30 Days</span>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.84rem", color: t.text, lineHeight: 1.5 }}>{diagnosis.ifUnchanged30d}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>12 Months</span>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.84rem", color: t.text, lineHeight: 1.5 }}>{diagnosis.ifUnchanged12m}</p>
          </div>
        </div>

        <SectionLabel icon={ArrowUp} label="If Optimized" color="#22c55e" />
        <div style={sectionStyle("#22c55e")}>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase" }}>30 Days</span>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.84rem", color: t.text, lineHeight: 1.5 }}>{diagnosis.ifOptimized30d}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase" }}>12 Months</span>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.84rem", color: t.text, lineHeight: 1.5 }}>{diagnosis.ifOptimized12m}</p>
          </div>
        </div>
      </div>

      {/* ── Cut First ──────────────────────────────────────────────────── */}
      {diagnosis.cutFirst && diagnosis.cutFirst.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <SectionLabel icon={Scissors} label="Cut First" color="#ef4444" />
          <div style={sectionStyle("#ef4444")}>
            {diagnosis.cutFirst.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginBottom: i < diagnosis.cutFirst!.length - 1 ? "0.35rem" : 0 }}>
                <Check size={13} style={{ color: "#ef4444", marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "0.84rem", color: t.text, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hidden Strength ────────────────────────────────────────────── */}
      {diagnosis.hiddenStrength && (
        <div style={{ marginTop: "0.75rem" }}>
          <SectionLabel icon={Star} label="Hidden Strength" color="#8b5cf6" />
          <div style={sectionStyle("#8b5cf6")}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: t.text, lineHeight: 1.55 }}>{diagnosis.hiddenStrength}</p>
          </div>
        </div>
      )}

      {/* ── Verdict ────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
          border: "1px solid rgba(139,92,246,0.25)",
        }}
      >
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b5cf6", marginBottom: "0.35rem" }}>
          Verdict
        </div>
        <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: t.text, lineHeight: 1.55 }}>
          {diagnosis.verdict}
        </p>
      </div>
    </>
  );

  const visibleSignals = signals.slice(0, 3);

  return (
    <div>
      {/* ── Risk + Copy row ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <RiskBadge level={diagnosis.riskLevel} />
        {isPremium && (
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: t.muted,
              cursor: "pointer",
            }}
          >
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* ── Primary Diagnosis + Why This Matters (always visible) ──────── */}
      <div style={{ marginBottom: "1rem" }}>
        <SectionLabel icon={AlertTriangle} label="Primary Diagnosis" color="#ef4444" />
        <div
          style={{
            padding: "0.9rem 1rem",
            borderRadius: "10px",
            background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
            borderLeft: "3px solid #ef4444",
            marginBottom: "0.5rem",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: t.text, lineHeight: 1.4, marginBottom: "0.35rem" }}>
            {diagnosis.mainIssue}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: surplusColor }}>
              {monthlySurplus >= 0 ? "+" : ""}{fmtUsd(monthlySurplus)}/mo {monthlySurplus >= 0 ? "surplus" : "deficit"}
            </span>
            <span style={{ fontSize: "0.68rem", color: t.muted }}>·</span>
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: savingsColor }}>
              {savingsRate.toFixed(1)}% savings rate
            </span>
            <span style={{ fontSize: "0.68rem", color: t.muted }}>·</span>
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: riskColor }}>
              {diagnosis.riskLevel} risk
            </span>
          </div>
        </div>

        <SectionLabel icon={Zap} label="Why This Matters" color="#f59e0b" />
        <div style={sectionStyle("#f59e0b")}>
          {diagnosis.summary.includes(". ") ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {diagnosis.summary.split(/\.\s+/).filter(Boolean).map((sentence, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                  <span style={{ color: "#f59e0b", fontSize: "0.7rem", marginTop: "3px", flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: "0.84rem", color: t.text, lineHeight: 1.5, opacity: 0.9 }}>
                    {sentence.endsWith(".") ? sentence : sentence + "."}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "0.84rem", color: t.text, lineHeight: 1.55, opacity: 0.9 }}>
              {diagnosis.summary}
            </p>
          )}
        </div>
      </div>

      {/* ── Key Signals (capped at 3) ──────────────────────────────────── */}
      {visibleSignals.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <SectionLabel icon={ShieldAlert} label="Key Signals" color="#f59e0b" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {visibleSignals.map((signal, i) => (
              <span
                key={i}
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "#f59e0b",
                  lineHeight: 1.4,
                }}
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Bridge to Top Move ─────────────────────────────────────── */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderRadius: "10px",
          background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
          border: `1px solid rgba(99,102,241,0.15)`,
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: t.text, lineHeight: 1.5 }}>
          Next, see the single highest-impact action.
        </p>
      </div>

      {/* ── Premium deep-dive (collapsed by default, pro only) ───── */}
      {isPremium && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "0.55rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: t.muted,
              cursor: "pointer",
              marginTop: "0.75rem",
            }}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDetails ? "Hide full diagnosis" : "See full diagnosis"}
          </button>

          {showDetails && (
            <div style={{ marginTop: "0.75rem" }}>
              {premiumSections}
            </div>
          )}
        </>
      )}
    </div>
  );
}
