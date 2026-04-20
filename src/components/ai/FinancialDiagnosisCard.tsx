import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Check,
  Scissors,
  Star,
  Zap,
  Copy,
  CheckCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { useState } from "react";
import type { FinancialDiagnosis, DiagnosisAction } from "@/lib/diagnosis-types";
import { MONO_FONT_STACK } from "@/lib/app-shared";
import type { ThemeConfig, PlanId } from "@/lib/app-shared";
import type { ExpenseData } from "@/lib/calc";
import { trackEvent } from "@/lib/analytics";
import { useIsMobile } from "@/lib/useIsMobile";

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
          background: isDark ? `${t.primary}12` : `${t.primary}0A`,
          border: `1px solid ${t.primary}33`,
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
  onSimulator?: () => void;
  t: ThemeConfig;
  isDark: boolean;
}

export function FinancialDiagnosisCard({ diagnosis, savingsRate, monthlySurplus, grossMonthly, totalMonthly, data, isPremium, onUpgrade, onSimulator, t, isDark }: FinancialDiagnosisCardProps) {
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  const [showDetails, setShowDetails] = useState(!isMobile);

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

  const visibleSignals = signals.slice(0, 3);

  // ── Verdict block (reused for both premium and gated free) ──────────

  const verdictBlock = (
    <div
      style={{
        marginTop: "1rem",
        marginBottom: "0.65rem",
        borderRadius: "10px",
        background: `linear-gradient(135deg, ${t.primary}1A, ${t.accent}1A)`,
        border: `1px solid ${t.primary}40`,
        overflow: "hidden",
      }}
    >
      {/* Risk-colored urgency bar */}
      <div style={{ height: "3px", background: riskColor }} />
      <div style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.primary }}>
            Verdict
          </div>
          <span style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            padding: "1px 6px",
            borderRadius: "4px",
            background: riskColor + "18",
            color: riskColor,
          }}>
            {diagnosis.riskLevel === "high" ? "Act now" : diagnosis.riskLevel === "medium" ? "Room to improve" : "On track"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: t.text, lineHeight: 1.55 }}>
          {diagnosis.verdict}
        </p>
        {diagnosis.topMoves[0] && (
          <div style={{
            marginTop: "0.6rem",
            paddingTop: "0.55rem",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0 }}>
              <Zap size={12} style={{ color: "#22c55e", flexShrink: 0 }} />
              <span style={{ fontSize: "0.8rem", color: t.muted, fontWeight: 500 }}>
                Start with:
              </span>
              <span style={{ fontSize: "0.8rem", color: t.text, fontWeight: 600 }}>
                {diagnosis.topMoves[0].title}
              </span>
            </div>
            {onSimulator && (
              <button
                onClick={() => {
                  trackEvent("diagnosis_to_simulator_click", {
                    riskLevel: diagnosis.riskLevel,
                    topMoveTitle: diagnosis.topMoves[0].title,
                  });
                  onSimulator();
                }}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.primary}40`,
                  borderRadius: "6px",
                  padding: "0.3rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: t.primary,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Test in Simulator
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

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

      {/* ── Primary Diagnosis (always visible) ────────────────────────── */}
      <div style={{ marginBottom: "0" }}>
        <SectionLabel icon={AlertTriangle} label="Primary Diagnosis" color="#ef4444" />
        <div
          style={{
            padding: "0.9rem 1rem",
            borderRadius: "10px",
            background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
            borderLeft: "3px solid #ef4444",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: t.text, lineHeight: 1.4, marginBottom: "0.35rem" }}>
            {diagnosis.mainIssue}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: surplusColor, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
              {monthlySurplus >= 0 ? "+" : ""}{fmtUsd(monthlySurplus)}/mo {monthlySurplus >= 0 ? "surplus" : "deficit"}
            </span>
            <span style={{ fontSize: "0.68rem", color: t.muted }}>·</span>
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: savingsColor, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
              {savingsRate.toFixed(1)}% savings rate
            </span>
            <span style={{ fontSize: "0.68rem", color: t.muted }}>·</span>
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: riskColor }}>
              {diagnosis.riskLevel} risk
            </span>
          </div>
        </div>
      </div>

      {/* ── Verdict (always visible — gated for free users) ───────────── */}
      {isPremium ? (
        verdictBlock
      ) : (
        <div style={{ position: "relative", overflow: "hidden", marginTop: "1rem", marginBottom: "0.65rem" }}>
          <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
            {verdictBlock}
          </div>
          <div
            className="atv-locked-overlay"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Lock className="atv-lock-icon-glow" size={18} style={{ color: t.primary }} />
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: t.text }}>Unlock your verdict</span>
            <button
              onClick={() => onUpgrade("premium")}
              className="atv-btn-primary"
              style={{
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.45rem 1.2rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 3px 10px ${t.primary}4D`,
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* ── Collapsible: Full Analysis ─────────────────────────────────── */}
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
        }}
      >
        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showDetails ? "Hide details" : "See full analysis"}
      </button>

      {showDetails && (
        <div style={{ marginTop: "0.75rem" }}>
          {/* ── Why This Matters ──────────────────────────────────────── */}
          <SectionLabel icon={Zap} label="Why This Matters" color="#f59e0b" />
          <div style={sectionStyle("#f59e0b")}>
            {(() => {
              const sentences = diagnosis.summary.includes(". ")
                ? diagnosis.summary.split(/\.\s+/).filter(Boolean)
                : [diagnosis.summary];
              const visibleSentences = isPremium ? sentences : sentences.slice(0, 1);
              const hasMore = !isPremium && sentences.length > 1;

              return (
                <>
                  {visibleSentences.length > 1 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {visibleSentences.map((sentence, i) => (
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
                      {visibleSentences[0]?.endsWith(".") ? visibleSentences[0] : (visibleSentences[0] ?? "") + "."}
                    </p>
                  )}
                  {hasMore && (
                    <button
                      onClick={() => onUpgrade("premium")}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.3rem 0",
                        marginTop: "0.35rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#f59e0b",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Lock size={11} />
                      Unlock full analysis
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          {/* ── Key Signals (capped at 3) ────────────────────────────── */}
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

          {/* ── #1 Action (Premium) / Locked CTA (Free) ──────────────── */}
          {isPremium ? (
            <div>
              <SectionLabel icon={Zap} label="Start Here" color="#22c55e" />
              {diagnosis.topMoves[0] && (
                <ActionCard move={diagnosis.topMoves[0]} index={0} t={t} isDark={isDark} expanded />
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "1rem 1.1rem",
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${t.primary}14, ${t.accent}14)`,
                border: `1px solid ${t.primary}33`,
                textAlign: "center",
              }}
            >
              <Lock size={16} style={{ color: t.primary, marginBottom: "0.4rem" }} />
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", fontWeight: 600, color: t.text, lineHeight: 1.45 }}>
                Your ranked actions, scenario projections, and verdict are ready.
              </p>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: t.muted, lineHeight: 1.45 }}>
                See what to cut first, what happens in 30 days and 12 months, and the AI's final verdict on your position.
              </p>
              <button
                onClick={() => onUpgrade("premium")}
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.55rem 1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 3px 10px ${t.primary}4D`,
                }}
              >
                Unlock Full Diagnosis
              </button>
            </div>
          )}

          {/* ── Premium deep-dive sections ────────────────────────────── */}
          {isPremium && (
            <div style={{ marginTop: "0.75rem" }}>
              {/* ── Remaining Actions (2+) ─────────────────────────────── */}
              {diagnosis.topMoves.slice(1).map((move, i) => (
                <ActionCard key={i + 1} move={move} index={i + 1} t={t} isDark={isDark} />
              ))}

              {/* ── Scenario Comparison ────────────────────────────────── */}
              <div style={{ marginTop: "1rem" }}>
                <SectionLabel icon={ShieldAlert} label="Your Two Paths" color="#f59e0b" />

                {/* 30 Days */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
                    In 30 Days
                  </div>
                  <div
                    style={{
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "0.7rem 0.9rem", background: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                        <ArrowDown size={11} style={{ color: "#f59e0b" }} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Do nothing</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: t.text, lineHeight: 1.5, opacity: 0.9 }}>{diagnosis.ifUnchanged30d}</p>
                    </div>
                    <div style={{ height: "1px", background: t.border }} />
                    <div style={{ padding: "0.7rem 0.9rem", background: isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                        <ArrowUp size={11} style={{ color: "#22c55e" }} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.04em" }}>Take action</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: t.text, lineHeight: 1.5, opacity: 0.9 }}>{diagnosis.ifOptimized30d}</p>
                    </div>
                  </div>
                </div>

                {/* 12 Months */}
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
                    In 12 Months
                  </div>
                  <div
                    style={{
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "0.7rem 0.9rem", background: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                        <ArrowDown size={11} style={{ color: "#f59e0b" }} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Do nothing</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: t.text, lineHeight: 1.5, opacity: 0.9 }}>{diagnosis.ifUnchanged12m}</p>
                    </div>
                    <div style={{ height: "1px", background: t.border }} />
                    <div style={{ padding: "0.7rem 0.9rem", background: isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem" }}>
                        <ArrowUp size={11} style={{ color: "#22c55e" }} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.04em" }}>Take action</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: t.text, lineHeight: 1.5, opacity: 0.9 }}>{diagnosis.ifOptimized12m}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Cut First ──────────────────────────────────────────── */}
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

              {/* ── Hidden Strength ────────────────────────────────────── */}
              {diagnosis.hiddenStrength && (
                <div style={{ marginTop: "0.75rem" }}>
                  <SectionLabel icon={Star} label="Hidden Strength" color={t.primary} />
                  <div style={sectionStyle(t.primary)}>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: t.text, lineHeight: 1.55 }}>{diagnosis.hiddenStrength}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
