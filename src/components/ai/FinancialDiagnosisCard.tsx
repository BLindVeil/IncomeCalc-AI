import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import type { FinancialDiagnosis, DiagnosisAction } from "@/lib/diagnosis-types";
import { MONO_FONT_STACK } from "@/lib/app-shared";
import type { ThemeConfig } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/lib/useIsMobile";

// The report speaks in the editorial voice: ink text, hairline rules, mono
// numerals. Semantic colour appears exactly where it carries meaning — the
// risk read, and the two-paths contrast — never as decoration.

const RISK = {
  low: { color: "#40916C", label: "Low risk", note: "On track" },
  medium: { color: "#B45309", label: "Medium risk", note: "Room to improve" },
  high: { color: "#DC2626", label: "High risk", note: "Act now" },
} as const;

const IMPACT_LABEL = { low: "minor lift", medium: "noticeable lift", high: "big lift" } as const;
const EFFORT_LABEL = { easy: "start today", moderate: "some effort", hard: "real commitment" } as const;

const mono: React.CSSProperties = { fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" };

function ReportLabel({ children, t }: { children: React.ReactNode; t: ThemeConfig }) {
  return (
    <div style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "-0.01em", color: t.text, marginBottom: "0.5rem" }}>
      {children}
    </div>
  );
}

function ActionRow({ move, index, t, highlight }: { move: DiagnosisAction; index: number; t: ThemeConfig; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.85rem",
        padding: "0.85rem 0",
        borderTop: index > 0 ? `1px solid ${t.border}` : "none",
        background: highlight ? t.primarySoft : "transparent",
        borderRadius: highlight ? 10 : 0,
        paddingLeft: highlight ? "0.85rem" : 0,
        paddingRight: highlight ? "0.85rem" : 0,
      }}
    >
      <span style={{ ...mono, fontSize: "0.85rem", fontWeight: 600, color: t.muted, lineHeight: 1.5, flexShrink: 0 }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.92rem", fontWeight: 600, color: t.text, lineHeight: 1.45 }}>
          {move.title}
        </div>
        <p style={{ margin: "0.25rem 0 0.35rem", fontSize: "0.85rem", color: t.muted, lineHeight: 1.55 }}>
          {move.explanation}
        </p>
        <div style={{ fontSize: "0.76rem", color: t.subtle }}>
          <span style={{ color: move.impact === "high" ? "#40916C" : t.muted, fontWeight: 500 }}>
            {IMPACT_LABEL[move.impact]}
          </span>
          {" · "}
          {EFFORT_LABEL[move.difficulty]}
        </div>
      </div>
    </div>
  );
}

function PathCell({ kind, text, t }: { kind: "hold" | "act"; text: string; t: ThemeConfig }) {
  const color = kind === "hold" ? "#B45309" : "#40916C";
  return (
    <div style={{ padding: "0.7rem 0.85rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em", color, marginBottom: "0.3rem" }}>
        {kind === "hold" ? "Do nothing" : "Take action"}
      </div>
      <p style={{ margin: 0, fontSize: "0.85rem", color: t.text, lineHeight: 1.55 }}>{text}</p>
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
  onUpgrade: () => void;
  onSimulator?: () => void;
  t: ThemeConfig;
  isDark: boolean;
}

export function FinancialDiagnosisCard({ diagnosis, savingsRate, monthlySurplus, grossMonthly, totalMonthly, data, isPremium, onUpgrade, onSimulator, t, isDark: _isDark }: FinancialDiagnosisCardProps) {
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  const [showDetails, setShowDetails] = useState(!isMobile);

  const risk = RISK[diagnosis.riskLevel];
  const fmtUsd = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  const surplusColor = monthlySurplus >= 0 ? "#40916C" : "#DC2626";

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
      `In 30 Days:`,
      `  Do nothing: ${diagnosis.ifUnchanged30d}`,
      `  Take action: ${diagnosis.ifOptimized30d}`,
      `In 12 Months:`,
      `  Do nothing: ${diagnosis.ifUnchanged12m}`,
      `  Take action: ${diagnosis.ifOptimized12m}`,
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

  // ── Derived signals from the real numbers ─────────────────────────────
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
  const visibleSignals = signals.slice(0, 3);

  const firstSummarySentence = (() => {
    const m = diagnosis.summary.match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : diagnosis.summary;
  })();

  return (
    <div style={{ marginTop: "1.25rem" }}>
      {/* ── Status line ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: risk.color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: risk.color }}>
            {risk.label}
          </span>
          <span style={{ fontSize: "0.82rem", color: t.subtle }}>— {risk.note}</span>
        </div>
        {isPremium && (
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: "0.75rem",
              fontWeight: 550,
              color: t.muted,
              cursor: "pointer",
            }}
          >
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy report"}
          </button>
        )}
      </div>

      {/* ── Primary finding ─────────────────────────────────────────────── */}
      <div style={{ fontSize: "1.3rem", fontWeight: 600, letterSpacing: "-0.016em", color: t.text, lineHeight: 1.3, marginBottom: "0.6rem" }}>
        {diagnosis.mainIssue}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap", paddingBottom: "1rem", borderBottom: `1px solid ${t.border}` }}>
        <span style={{ ...mono, fontSize: "0.85rem", fontWeight: 600, color: surplusColor }}>
          {monthlySurplus >= 0 ? "+" : ""}{fmtUsd(monthlySurplus)}/mo {monthlySurplus >= 0 ? "surplus" : "deficit"}
        </span>
        <span style={{ color: t.subtle, fontSize: "0.8rem" }}>·</span>
        <span style={{ ...mono, fontSize: "0.85rem", fontWeight: 600, color: t.text }}>
          {savingsRate.toFixed(1)}% <span style={{ fontWeight: 400, color: t.muted }}>savings rate</span>
        </span>
      </div>

      {isPremium ? (
        <>
          {/* ── Verdict ─────────────────────────────────────────────────── */}
          <div style={{ background: t.primarySoft, borderRadius: 12, padding: "1rem 1.1rem", margin: "1rem 0" }}>
            <ReportLabel t={t}>Verdict</ReportLabel>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 500, color: t.text, lineHeight: 1.6 }}>
              {diagnosis.verdict}
            </p>
            {diagnosis.topMoves[0] && (
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: `1px solid ${t.primary}26`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.6rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: t.text, minWidth: 0 }}>
                  <span style={{ color: t.muted }}>Start with:</span>{" "}
                  <strong style={{ fontWeight: 600 }}>{diagnosis.topMoves[0].title}</strong>
                </span>
                {onSimulator && (
                  <button
                    onClick={() => {
                      trackEvent("diagnosis_to_simulator_click", {
                        riskLevel: diagnosis.riskLevel,
                        topMoveTitle: diagnosis.topMoves[0].title,
                      });
                      onSimulator();
                    }}
                    className="lp-press"
                    style={{
                      background: "transparent",
                      border: `1px solid ${t.borderStrong}`,
                      borderRadius: 999,
                      padding: "7px 14px",
                      fontSize: "0.78rem",
                      fontWeight: 550,
                      color: t.text,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Test in Simulator
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Details toggle ──────────────────────────────────────────── */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              background: "transparent",
              border: "none",
              padding: "0.6rem 0",
              fontSize: "0.82rem",
              fontWeight: 550,
              color: t.muted,
              cursor: "pointer",
            }}
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDetails ? "Hide the full report" : "Read the full report"}
          </button>

          {showDetails && (
            <div>
              {/* Why this matters */}
              <div style={{ paddingTop: "1rem", borderTop: `1px solid ${t.border}` }}>
                <ReportLabel t={t}>Why this matters</ReportLabel>
                <p style={{ margin: 0, fontSize: "0.9rem", color: t.muted, lineHeight: 1.65, maxWidth: "62ch" }}>
                  {diagnosis.summary}
                </p>
                {visibleSignals.length > 0 && (
                  <p style={{ margin: "0.6rem 0 0", fontSize: "0.8rem", color: t.subtle, lineHeight: 1.6 }}>
                    {visibleSignals.join("  ·  ")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: `1px solid ${t.border}` }}>
                <ReportLabel t={t}>Do this, in order</ReportLabel>
                {diagnosis.topMoves.map((move, i) => (
                  <ActionRow key={i} move={move} index={i} t={t} highlight={i === 0} />
                ))}
              </div>

              {/* Two paths */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: `1px solid ${t.border}` }}>
                <ReportLabel t={t}>Your two paths</ReportLabel>
                {[
                  { title: "In 30 days", hold: diagnosis.ifUnchanged30d, act: diagnosis.ifOptimized30d },
                  { title: "In 12 months", hold: diagnosis.ifUnchanged12m, act: diagnosis.ifOptimized12m },
                ].map(({ title, hold, act }) => (
                  <div key={title} style={{ marginBottom: "0.85rem" }}>
                    <div style={{ ...mono, fontSize: "0.72rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
                      {title}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        border: `1px solid ${t.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ borderRight: isMobile ? "none" : `1px solid ${t.border}`, borderBottom: isMobile ? `1px solid ${t.border}` : "none" }}>
                        <PathCell kind="hold" text={hold} t={t} />
                      </div>
                      <PathCell kind="act" text={act} t={t} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Cut first */}
              {diagnosis.cutFirst && diagnosis.cutFirst.length > 0 && (
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: `1px solid ${t.border}` }}>
                  <ReportLabel t={t}>Cut first</ReportLabel>
                  {diagnosis.cutFirst.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.4rem" }}>
                      <span style={{ ...mono, fontSize: "0.82rem", color: t.subtle, flexShrink: 0 }}>—</span>
                      <span style={{ fontSize: "0.88rem", color: t.text, lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hidden strength */}
              {diagnosis.hiddenStrength && (
                <div style={{ marginTop: "1.25rem", background: t.primarySoft, borderRadius: 12, padding: "1rem 1.1rem" }}>
                  <ReportLabel t={t}>Hidden strength</ReportLabel>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: t.text, lineHeight: 1.6 }}>{diagnosis.hiddenStrength}</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── Free preview: the first insight, real and unblurred ─────── */}
          <p style={{ margin: "1rem 0 0", fontSize: "0.9rem", color: t.muted, lineHeight: 1.65, maxWidth: "62ch" }}>
            {firstSummarySentence}
          </p>
          {visibleSignals.length > 0 && (
            <p style={{ margin: "0.6rem 0 0", fontSize: "0.8rem", color: t.subtle, lineHeight: 1.6 }}>
              {visibleSignals.join("  ·  ")}
            </p>
          )}

          {/* ── The unlock — one block, priced, honest ──────────────────── */}
          <div style={{ background: t.primarySoft, borderRadius: 12, padding: "1.25rem 1.35rem", marginTop: "1.25rem" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", color: t.text, marginBottom: "0.35rem" }}>
              Your full report is ready.
            </div>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: t.muted, lineHeight: 1.6, maxWidth: "52ch" }}>
              The ranked actions, your 30-day and 12-month projections, what to cut
              first, and the final verdict — written from these exact numbers.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
              <button
                onClick={() => onUpgrade()}
                className="lp-press"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 22px",
                  background: t.text,
                  color: t.cardBg,
                  border: "none",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 550,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                }}
              >
                Unlock Full Diagnosis — <span style={mono}>$29</span> once
              </button>
              <span style={{ fontSize: "0.78rem", color: t.muted }}>
                One payment. No subscription.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
