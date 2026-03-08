import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Trophy,
  Lock,
  Plus,
  Copy,
  Edit3,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyDark,
  fmt,
  computeForExpenses,
  loadScenarios,
  saveScenarios,
  genId,
  getScenarioLimit,
  EXPENSE_FIELDS,
  type ThemeConfig,
  type Theme,
  type UserTier,
  type PlanId,
  type ExpenseData,
  type Scenario,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import type { CalcOutput } from "@/lib/calc";

export interface SimulatorPageProps {
  initialExpenses: ExpenseData;
  initialTaxRate: number;
  onBack: () => void;
  onUpgrade: (plan?: PlanId) => void;
  userTier: UserTier;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
}

export function SimulatorPage({
  initialExpenses,
  initialTaxRate,
  onBack,
  onUpgrade,
  userTier,
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
}: SimulatorPageProps) {
  const t = applyDark(currentTheme, isDark);
  const limit = getScenarioLimit(userTier);

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = loadScenarios();
    if (saved.length > 0) return saved;
    return [{ id: genId(), name: "Scenario A", expenses: { ...initialExpenses }, taxRate: initialTaxRate }];
  });
  const [activeId, setActiveId] = useState<string>(scenarios[0]?.id ?? "");
  const [editingName, setEditingName] = useState<string | null>(null);

  useEffect(() => { saveScenarios(scenarios); }, [scenarios]);

  const activeScenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  function addScenario() {
    if (scenarios.length >= limit) return;
    const newS: Scenario = {
      id: genId(),
      name: `Scenario ${String.fromCharCode(65 + scenarios.length)}`,
      expenses: { ...initialExpenses },
      taxRate: initialTaxRate,
    };
    setScenarios((prev) => [...prev, newS]);
    setActiveId(newS.id);
  }

  function duplicateScenario(id: string) {
    if (scenarios.length >= limit) return;
    const src = scenarios.find((s) => s.id === id);
    if (!src) return;
    const dup: Scenario = { ...src, id: genId(), name: src.name + " (copy)", expenses: { ...src.expenses } };
    setScenarios((prev) => [...prev, dup]);
    setActiveId(dup.id);
  }

  function deleteScenario(id: string) {
    if (scenarios.length <= 1) return;
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(scenarios.find((s) => s.id !== id)?.id ?? "");
  }

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function updateExpense(id: string, field: keyof ExpenseData, value: number) {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, expenses: { ...s.expenses, [field]: value } } : s
      )
    );
  }

  // Compute results for all scenarios
  const results = scenarios.map((s) => ({
    scenario: s,
    output: computeForExpenses(s.expenses, s.taxRate),
  }));

  // Winner: lowest fragility = highest fragilityScore, tie-break lowest hourly
  const winner = results.reduce((best, curr) => {
    if (curr.output.fragilityScore > best.output.fragilityScore) return curr;
    if (curr.output.fragilityScore === best.output.fragilityScore && curr.output.hourlyRequired < best.output.hourlyRequired) return curr;
    return best;
  }, results[0]);

  // Preset quick toggles
  function applyPreset(id: string, preset: string) {
    const s = scenarios.find((sc) => sc.id === id);
    if (!s) return;
    const newExpenses = { ...s.expenses };
    if (preset === "rent+200") newExpenses.housing += 200;
    if (preset === "rent-200") newExpenses.housing = Math.max(0, newExpenses.housing - 200);
    if (preset === "debt-100") newExpenses.other = Math.max(0, newExpenses.other - 100);
    if (preset === "savings+200") newExpenses.savings += 200;
    updateScenario(id, { expenses: newExpenses });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF", position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} baseTheme={baseTheme} setTheme={setTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.5rem" }}>Scenario Simulator</h1>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>Compare different financial scenarios side by side.</p>

        {/* Scenario tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {scenarios.map((s, i) => {
            const isActive = s.id === activeId;
            const isLocked = i >= limit;
            return (
              <button
                key={s.id}
                onClick={() => !isLocked && setActiveId(s.id)}
                style={{
                  background: isActive ? t.primary : isLocked ? t.border + "50" : t.cardBg,
                  color: isActive ? "#fff" : isLocked ? t.muted : t.text,
                  border: `1px solid ${isActive ? t.primary : t.border}`,
                  borderRadius: "8px",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  filter: isLocked ? "blur(1px)" : "none",
                  position: "relative",
                }}
              >
                {winner && winner.scenario.id === s.id && <Trophy size={13} style={{ color: isActive ? "#fde68a" : "#f59e0b" }} />}
                {editingName === s.id ? (
                  <input
                    autoFocus
                    value={s.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateScenario(s.id, { name: e.target.value })}
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => { if (e.key === "Enter") setEditingName(null); }}
                    style={{ background: "transparent", border: "none", color: "inherit", fontSize: "inherit", fontWeight: "inherit", width: "80px", outline: "none" }}
                  />
                ) : (
                  <span onDoubleClick={() => setEditingName(s.id)}>{s.name}</span>
                )}
                {isLocked && <Lock size={12} />}
              </button>
            );
          })}
          {scenarios.length < limit ? (
            <button
              onClick={addScenario}
              style={{
                background: "transparent",
                border: `1px dashed ${t.border}`,
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
                fontSize: "0.85rem",
                color: t.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Plus size={14} /> Add
            </button>
          ) : (
            <button
              onClick={() => onUpgrade(userTier === "free" ? "pro" : "premium")}
              style={{
                background: "transparent",
                border: `1px dashed ${t.primary}50`,
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
                fontSize: "0.82rem",
                color: t.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Lock size={12} /> Upgrade to unlock more
            </button>
          )}
        </div>

        {/* Active scenario form */}
        {activeScenario && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
            {/* Left: form */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ fontWeight: 700, color: t.text }}>{activeScenario.name}</span>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button onClick={() => duplicateScenario(activeScenario.id)} title="Duplicate" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><Copy size={14} /></button>
                  <button onClick={() => setEditingName(activeScenario.id)} title="Rename" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><Edit3 size={14} /></button>
                  {scenarios.length > 1 && <button onClick={() => deleteScenario(activeScenario.id)} title="Delete" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}><Trash2 size={14} /></button>}
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.25rem" }}>Tax Rate (%)</Label>
                <Input
                  type="number" min={0} max={70}
                  value={activeScenario.taxRate}
                  onChange={(e) => updateScenario(activeScenario.id, { taxRate: Math.min(70, Math.max(0, parseFloat(e.target.value) || 0)) })}
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, maxWidth: "120px" }}
                />
              </div>

              {EXPENSE_FIELDS.map((field) => {
                const Icon = field.icon;
                const val = activeScenario.expenses[field.name];
                return (
                  <div key={field.name} style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.5rem" }}>
                    <Icon size={14} style={{ color: t.primary, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.82rem", color: t.text, width: "110px", flexShrink: 0 }}>{field.label}</span>
                    <Input
                      type="number" min={0}
                      value={val === 0 ? "" : val}
                      onChange={(e) => updateExpense(activeScenario.id, field.name, Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.text, flex: 1 }}
                    />
                  </div>
                );
              })}

              {/* Quick presets */}
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[
                  { key: "rent+200", label: "Rent +$200" },
                  { key: "rent-200", label: "Rent -$200" },
                  { key: "debt-100", label: "Debt -$100/mo" },
                  { key: "savings+200", label: "Savings +$200" },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(activeScenario.id, p.key)}
                    style={{
                      background: t.primary + "10",
                      border: `1px solid ${t.primary}25`,
                      borderRadius: "6px",
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.75rem",
                      color: t.primary,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: active scenario results */}
            {(() => {
              const out = computeForExpenses(activeScenario.expenses, activeScenario.taxRate);
              return (
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem", display: "block", marginBottom: "1rem" }}>Results</span>
                  {[
                    { label: "Hourly Required", value: `${fmt(out.hourlyRequired)}/hr` },
                    { label: "Annual Gross Required", value: fmt(out.annualGrossRequired) },
                    { label: "Monthly Required", value: fmt(out.monthlyRequiredTotal) },
                    { label: "Emergency Fund Target", value: fmt(out.emergencyFundTarget) },
                    { label: "Fragility Score", value: `${out.fragilityScore}/100 (${out.fragilityLabel})` },
                    { label: "Rent % of Monthly", value: `${(out.ratios.rentRatio * 100).toFixed(1)}%` },
                    { label: "Debt % of Monthly", value: `${(out.ratios.debtRatio * 100).toFixed(1)}%` },
                    { label: "Transport % of Monthly", value: `${(out.ratios.transportRatio * 100).toFixed(1)}%` },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: `1px solid ${t.border}20`, fontSize: "0.85rem" }}>
                      <span style={{ color: t.muted }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: t.text }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Comparison section */}
        {results.length > 1 && (() => {
          const baseline = results[0];

          // Delta helper: positive = good when higher is better, negative = good when lower is better
          function DeltaChip({ value, unit, invert }: { value: number; unit: string; invert?: boolean }) {
            if (Math.abs(value) < 0.1) return <span style={{ fontSize: "0.74rem", color: t.muted, display: "inline-flex", alignItems: "center", gap: "2px" }}><Minus size={10} /> —</span>;
            const isGood = invert ? value < 0 : value > 0;
            const color = isGood ? "#22c55e" : "#ef4444";
            const Icon = value > 0 ? TrendingUp : TrendingDown;
            const sign = value > 0 ? "+" : "";
            return (
              <span style={{ fontSize: "0.74rem", fontWeight: 600, color, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                <Icon size={11} /> {sign}{unit === "$" ? fmt(value) : value.toFixed(1) + unit}
              </span>
            );
          }

          return (
            <>
              {/* ── Winner summary strip ───────────────────────────── */}
              {winner && winner.scenario.id !== baseline.scenario.id && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(34,197,94,0.08))",
                    border: "1px solid rgba(245,158,11,0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Trophy size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: t.text, marginBottom: "0.15rem" }}>
                      {winner.scenario.name} is your strongest scenario
                    </div>
                    <div style={{ fontSize: "0.82rem", color: t.muted, lineHeight: 1.45 }}>
                      {(() => {
                        const parts: string[] = [];
                        const dFrag = winner.output.fragilityScore - baseline.output.fragilityScore;
                        const dMonth = winner.output.monthlyRequiredTotal - baseline.output.monthlyRequiredTotal;
                        const dHealth = winner.output.healthScore - baseline.output.healthScore;
                        if (Math.abs(dMonth) >= 1) parts.push(`${dMonth < 0 ? "saves" : "costs"} ${fmt(Math.abs(dMonth))}/mo vs. baseline`);
                        if (Math.abs(dFrag) >= 1) parts.push(`fragility ${dFrag > 0 ? "+" : ""}${dFrag.toFixed(0)} pts`);
                        if (Math.abs(dHealth) >= 1) parts.push(`health ${dHealth > 0 ? "+" : ""}${dHealth.toFixed(0)} pts`);
                        return parts.length > 0 ? parts.join(" · ") : "Marginally better overall position.";
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Key metrics comparison cards ──────────────────── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${results.length}, 1fr)`,
                  gap: "0.65rem",
                  marginBottom: "1.25rem",
                }}
              >
                {results.map((r, ri) => {
                  const isWinner = winner?.scenario.id === r.scenario.id;
                  const isBase = ri === 0;
                  const dMonthly = r.output.monthlyRequiredTotal - baseline.output.monthlyRequiredTotal;
                  const dEmergency = r.output.emergencyFundTarget - baseline.output.emergencyFundTarget;
                  const dAnnual = r.output.annualGrossRequired - baseline.output.annualGrossRequired;
                  const dFragility = r.output.fragilityScore - baseline.output.fragilityScore;
                  const dHealth = r.output.healthScore - baseline.output.healthScore;

                  return (
                    <div
                      key={r.scenario.id}
                      style={{
                        background: t.cardBg,
                        border: `${isWinner ? "2px" : "1px"} solid ${isWinner ? "#f59e0b50" : t.border}`,
                        borderRadius: "12px",
                        padding: "1rem",
                        position: "relative",
                      }}
                    >
                      {/* Winner badge */}
                      {isWinner && results.length > 1 && (
                        <div style={{
                          position: "absolute",
                          top: "-10px",
                          right: "12px",
                          background: "#f59e0b",
                          color: "#000",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}>
                          <Trophy size={10} /> Best
                        </div>
                      )}

                      {/* Scenario name */}
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: t.text, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        {r.scenario.name}
                        {isBase && <span style={{ fontSize: "0.65rem", fontWeight: 500, color: t.muted, textTransform: "uppercase" }}>(baseline)</span>}
                      </div>

                      {/* Key metrics with deltas */}
                      {[
                        { label: "Monthly Spend", value: fmt(r.output.monthlyRequiredTotal), delta: dMonthly, unit: "$", invert: true },
                        { label: "Emergency Fund", value: fmt(r.output.emergencyFundTarget), delta: dEmergency, unit: "$", invert: true },
                        { label: "Annual Gross Req.", value: fmt(r.output.annualGrossRequired), delta: dAnnual, unit: "$", invert: true },
                        { label: "Fragility", value: `${r.output.fragilityScore}/100`, delta: dFragility, unit: "pts", invert: false },
                        { label: "Health Score", value: `${r.output.healthScore}/100`, delta: dHealth, unit: "pts", invert: false },
                      ].map((m) => (
                        <div key={m.label} style={{ marginBottom: "0.45rem", padding: "0.3rem 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
                          <div style={{ fontSize: "0.68rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.1rem" }}>{m.label}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text }}>{m.value}</span>
                            {!isBase && <DeltaChip value={m.delta} unit={m.unit} invert={m.invert} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* ── Detailed comparison table ─────────────────────── */}
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <BarChart3 size={18} style={{ color: t.primary }} />
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Full Breakdown</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: t.muted, fontWeight: 600 }}>Metric</th>
                        {results.map((r) => (
                          <th key={r.scenario.id} style={{ textAlign: "right", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${t.border}`, color: t.text, fontWeight: 600 }}>
                            {winner?.scenario.id === r.scenario.id && <Trophy size={12} style={{ color: "#f59e0b", marginRight: "4px" }} />}
                            {r.scenario.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Hourly Required", fn: (o: CalcOutput) => `${fmt(o.hourlyRequired)}/hr` },
                        { label: "Annual Gross", fn: (o: CalcOutput) => fmt(o.annualGrossRequired) },
                        { label: "Monthly Total", fn: (o: CalcOutput) => fmt(o.monthlyRequiredTotal) },
                        { label: "Emergency Fund", fn: (o: CalcOutput) => fmt(o.emergencyFundTarget) },
                        { label: "Fragility", fn: (o: CalcOutput) => `${o.fragilityScore}/100` },
                        { label: "Health Score", fn: (o: CalcOutput) => `${o.healthScore}/100 (${o.healthLabel})` },
                        { label: "Rent %", fn: (o: CalcOutput) => `${(o.ratios.rentRatio * 100).toFixed(1)}%` },
                        { label: "Debt %", fn: (o: CalcOutput) => `${(o.ratios.debtRatio * 100).toFixed(1)}%` },
                        { label: "Transport %", fn: (o: CalcOutput) => `${(o.ratios.transportRatio * 100).toFixed(1)}%` },
                      ].map((row) => (
                        <tr key={row.label}>
                          <td style={{ padding: "0.45rem 0.75rem", borderBottom: `1px solid ${t.border}20`, color: t.muted }}>{row.label}</td>
                          {results.map((r) => (
                            <td key={r.scenario.id} style={{ textAlign: "right", padding: "0.45rem 0.75rem", borderBottom: `1px solid ${t.border}20`, color: t.text, fontWeight: 500 }}>
                              {row.fn(r.output)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
