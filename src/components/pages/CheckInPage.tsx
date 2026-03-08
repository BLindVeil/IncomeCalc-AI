import { useState } from "react";
import {
  ChevronLeft,
  TrendingUp,
  CheckCircle,
  CalendarCheck,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  applyDark,
  fmt,
  computeForExpenses,
  loadSnapshots,
  saveSnapshots,
  genId,
  generateICS,
  type ThemeConfig,
  type Theme,
  type UserTier,
  type PlanId,
  type ExpenseData,
  type CheckInSnapshot,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import type { CalcOutput } from "@/lib/calc";

export interface CheckInPageProps {
  currentExpenses: ExpenseData;
  currentTaxRate: number;
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  onForecast: () => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

export function CheckInPage({
  currentExpenses,
  currentTaxRate,
  onBack,
  onUpgrade,
  onForecast,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
}: CheckInPageProps) {
  const t = applyDark(currentTheme, isDark);

  const [snapshots, setSnapshots] = useState<CheckInSnapshot[]>(loadSnapshots);
  const [showForm, setShowForm] = useState(false);
  const [deltaReport, setDeltaReport] = useState<{ prev: CalcOutput; curr: CalcOutput; drivers: string[] } | null>(null);

  // Change form
  const [rentChange, setRentChange] = useState(0);
  const [newExpense, setNewExpense] = useState(0);
  const [debtChange, setDebtChange] = useState(0);
  const [savingsChange, setSavingsChange] = useState(0);
  const [noteText, setNoteText] = useState("");

  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  function startFromCurrent() {
    setShowForm(true);
    setRentChange(0);
    setNewExpense(0);
    setDebtChange(0);
    setSavingsChange(0);
    setNoteText("");
    setDeltaReport(null);
  }

  function submitCheckIn() {
    const baseExpenses = lastSnapshot ? { ...lastSnapshot.expenses } : { ...currentExpenses };
    const baseTax = lastSnapshot ? lastSnapshot.taxRate : currentTaxRate;

    const newExpenses: ExpenseData = {
      ...baseExpenses,
      housing: Math.max(0, baseExpenses.housing + rentChange),
      other: Math.max(0, baseExpenses.other + newExpense - debtChange),
      savings: Math.max(0, baseExpenses.savings + savingsChange),
    };

    const newOutputs = computeForExpenses(newExpenses, baseTax);
    const prevOutputs = lastSnapshot ? lastSnapshot.outputs : computeForExpenses(currentExpenses, currentTaxRate);

    // Top 3 drivers
    const drivers: string[] = [];
    if (rentChange !== 0) drivers.push(`Housing ${rentChange > 0 ? "increased" : "decreased"} by ${fmt(Math.abs(rentChange))}/mo`);
    if (debtChange !== 0) drivers.push(`Debt payments reduced by ${fmt(debtChange)}/mo`);
    if (savingsChange !== 0) drivers.push(`Savings ${savingsChange > 0 ? "increased" : "decreased"} by ${fmt(Math.abs(savingsChange))}/mo`);
    if (newExpense !== 0) drivers.push(`New expense of ${fmt(newExpense)}/mo added`);
    if (drivers.length === 0) drivers.push("No significant changes this month");

    const snap: CheckInSnapshot = {
      id: genId(),
      date: new Date().toISOString(),
      expenses: newExpenses,
      taxRate: baseTax,
      outputs: newOutputs,
      note: noteText || undefined,
    };

    const updated = [...snapshots, snap];
    setSnapshots(updated);
    saveSnapshots(updated);
    setDeltaReport({ prev: prevOutputs, curr: newOutputs, drivers: drivers.slice(0, 3) });
    setShowForm(false);
  }

  function downloadICS() {
    const ics = generateICS();
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incomecalc-checkin.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Limit history view for free users
  const visibleSnapshots = userTier === "premium" ? snapshots : snapshots.slice(-3);

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.5rem" }}>Monthly Check-In</h1>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>Track your financial progress month over month.</p>

        {/* Last snapshot summary */}
        {lastSnapshot && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", color: t.muted, marginBottom: "0.5rem" }}>
              Last check-in: {new Date(lastSnapshot.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { label: "Hourly Required", value: `${fmt(lastSnapshot.outputs.hourlyRequired)}/hr` },
                { label: "Annual Gross", value: fmt(lastSnapshot.outputs.annualGrossRequired) },
                { label: "Fragility Score", value: `${lastSnapshot.outputs.fragilityScore}/100` },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: "0.78rem", color: t.muted }}>{s.label}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delta report */}
        {deltaReport && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <TrendingUp size={18} style={{ color: t.primary }} />
              <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Change Report</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              {[
                { label: "Hourly Required", prev: deltaReport.prev.hourlyRequired, curr: deltaReport.curr.hourlyRequired, suffix: "/hr" },
                { label: "Annual Gross", prev: deltaReport.prev.annualGrossRequired, curr: deltaReport.curr.annualGrossRequired, suffix: "" },
                { label: "Fragility Score", prev: deltaReport.prev.fragilityScore, curr: deltaReport.curr.fragilityScore, suffix: "/100" },
              ].map((item) => {
                const diff = item.curr - item.prev;
                const isScore = item.label === "Fragility Score";
                const color = diff === 0 ? t.muted : (isScore ? (diff > 0 ? "#22c55e" : "#ef4444") : (diff > 0 ? "#ef4444" : "#22c55e"));
                return (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.78rem", color: t.muted }}>{item.label}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }}>{isScore ? `${item.curr}${item.suffix}` : `${fmt(item.curr)}${item.suffix}`}</div>
                    <div style={{ fontSize: "0.78rem", color, fontWeight: 600 }}>
                      {diff === 0 ? "No change" : `${diff > 0 ? "+" : ""}${isScore ? diff.toFixed(0) : fmt(diff)}`}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: t.text, marginBottom: "0.5rem" }}>Top Drivers:</div>
            {deltaReport.drivers.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.85rem", color: t.muted }}>
                <CheckCircle size={13} style={{ color: t.primary }} />
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Check-in form */}
        {showForm ? (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" }}>
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem", display: "block", marginBottom: "1rem" }}>What changed since last month?</span>
            {[
              { label: "Rent change ($)", value: rentChange, set: setRentChange },
              { label: "New monthly expense ($)", value: newExpense, set: setNewExpense },
              { label: "Debt payment change ($)", value: debtChange, set: setDebtChange },
              { label: "Savings goal change ($)", value: savingsChange, set: setSavingsChange },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.85rem", color: t.muted, width: "170px", flexShrink: 0 }}>{f.label}</span>
                <Input
                  type="number"
                  value={f.value === 0 ? "" : f.value}
                  onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, flex: 1 }}
                />
              </div>
            ))}
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: t.muted, display: "block", marginBottom: "0.3rem" }}>Any big life change?</span>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g., got a raise, moved apartments, paid off a loan"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: `1px solid ${t.border}`,
                  background: t.bg,
                  color: t.text,
                  fontSize: "0.88rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={submitCheckIn} style={{
                background: t.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.25rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
              }}>
                <CheckCircle size={15} /> Submit Check-In
              </button>
              <button onClick={() => setShowForm(false)} style={{
                background: "transparent", color: t.muted, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <button onClick={startFromCurrent} style={{
              background: t.primary, color: "#fff", border: "none", borderRadius: "10px", padding: "0.75rem 1.5rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
            }}>
              <CalendarCheck size={16} /> {lastSnapshot ? "New Check-In" : "Start from Current Calculator Inputs"}
            </button>
            <button onClick={downloadICS} style={{
              background: "transparent", color: t.primary, border: `1.5px solid ${t.primary}`, borderRadius: "10px", padding: "0.75rem 1.25rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
            }}>
              <Download size={16} /> Set Monthly Reminder (.ics)
            </button>
          </div>
        )}

        {/* History */}
        {visibleSnapshots.length > 0 && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
            <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem", display: "block", marginBottom: "1rem" }}>Check-In History</span>
            {visibleSnapshots.slice().reverse().map((snap) => (
              <div key={snap.id} style={{ padding: "0.75rem 0", borderBottom: `1px solid ${t.border}20`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: t.text, fontWeight: 600 }}>
                    {new Date(snap.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  {snap.note && <div style={{ fontSize: "0.78rem", color: t.muted, marginTop: "0.15rem" }}>{snap.note}</div>}
                </div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
                  <span style={{ color: t.muted }}>{fmt(snap.outputs.hourlyRequired)}/hr</span>
                  <span style={{ color: t.muted }}>{fmt(snap.outputs.annualGrossRequired)}/yr</span>
                  <span style={{ color: snap.outputs.fragilityScore >= 50 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>{snap.outputs.fragilityScore}/100</span>
                </div>
              </div>
            ))}
            {userTier !== "premium" && snapshots.length > 3 && (
              <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.85rem", background: t.primary + "08", border: `1px solid ${t.primary}20`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", color: t.muted }}>
                  {snapshots.length - 3} more check-ins hidden
                </span>
                <button onClick={() => onUpgrade("premium")} style={{ background: t.primary, color: "#fff", border: "none", borderRadius: "6px", padding: "0.3rem 0.7rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                  Get Premium
                </button>
              </div>
            )}
          </div>
        )}

        {/* Forecast from check-in CTA */}
        <button
          onClick={onForecast}
          style={{
            marginTop: "1.25rem",
            width: "100%",
            background: t.primary + "15",
            color: t.primary,
            border: `1px solid ${t.primary}30`,
            borderRadius: "10px",
            padding: "0.75rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
          }}
        >
          <TrendingUp size={16} />
          Forecast from this Check-In
          <span style={{ fontSize: "0.65rem", background: "#f59e0b20", color: "#f59e0b", borderRadius: "4px", padding: "0 4px", fontWeight: 600, border: "1px solid #f59e0b40", marginLeft: "0.25rem" }}>Premium</span>
        </button>
      </div>
    </div>
  );
}
