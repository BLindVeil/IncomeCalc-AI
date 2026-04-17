import { useState, useEffect } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  ChevronLeft,
  Trophy,
  Lock,
  Plus,
  Copy,
  Edit3,
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  CheckCircle,
  Save,
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
  EXPENSE_FIELDS,
  MONO_FONT_STACK,
  type ThemeConfig,
  type UserTier,
  type PlanId,
  type ExpenseData,
  type Scenario,
} from "@/lib/app-shared";
import { Header } from "@/components/Header";
import { trackEvent } from "@/lib/analytics";
import { useScenarioStore, computeChanges } from "@/lib/scenario-store";
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
}: SimulatorPageProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const hasPaidAccess = userTier === "pro" || userTier === "premium";

  // Active workspace slot limits (distinct from saved-scenario storage limits)
  const workspaceLimit = userTier === "premium" ? 5 : userTier === "pro" ? 3 : 1;

  // All saved scenarios (persisted to localStorage as the user's scenario library)
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>(() => {
    const saved = loadScenarios();
    if (saved.length > 0) return saved;
    return [{ id: genId(), name: "Scenario A", expenses: { ...initialExpenses }, taxRate: initialTaxRate }];
  });

  // Track which scenario IDs are in the active workspace
  const [workspaceIds, setWorkspaceIds] = useState<string[]>(() => {
    // Start with only the first saved scenario (baseline) — no auto-clutter
    return savedScenarios.length > 0 ? [savedScenarios[0].id] : [];
  });

  // Track IDs that were created/used in this workspace session then closed
  // (only these should be reopenable — not old library items)
  const [closedWorkspaceIds, setClosedWorkspaceIds] = useState<string[]>([]);

  const [activeId, setActiveId] = useState<string>(workspaceIds[0] ?? "");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const addDashboardScenario = useScenarioStore((s) => s.addScenario);

  useEffect(() => { saveScenarios(savedScenarios); }, [savedScenarios]);

  // Derive visible workspace scenarios: only IDs in workspaceIds that exist in savedScenarios, clamped to limit
  const scenarios = workspaceIds
    .slice(0, workspaceLimit)
    .map((id) => savedScenarios.find((s) => s.id === id))
    .filter((s): s is Scenario => s != null);

  // If activeId is not in the visible workspace, reset to first visible
  useEffect(() => {
    if (!scenarios.find((s) => s.id === activeId) && scenarios.length > 0) {
      setActiveId(scenarios[0].id);
    }
  }, [activeId, scenarios]);

  const activeScenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  function addScenario() {
    if (scenarios.length >= workspaceLimit) return;
    // Clone from baseline (first workspace scenario), not from initialExpenses
    const baseline = scenarios[0];
    const newS: Scenario = {
      id: genId(),
      name: `Scenario ${String.fromCharCode(65 + scenarios.length)}`,
      expenses: baseline ? { ...baseline.expenses } : { ...initialExpenses },
      taxRate: baseline?.taxRate ?? initialTaxRate,
    };
    setSavedScenarios((prev) => [...prev, newS]);
    setWorkspaceIds((prev) => [...prev, newS.id]);
    setActiveId(newS.id);
    setAddedToast(newS.name);
    setTimeout(() => setAddedToast(null), 2500);
    trackEvent("scenario_added", { scenario_count: scenarios.length + 1, user_tier: userTier, source_page: "simulator" });
  }

  function reopenScenario(id: string) {
    if (scenarios.length >= workspaceLimit) return;
    if (workspaceIds.includes(id)) return;
    setWorkspaceIds((prev) => [...prev, id]);
    setClosedWorkspaceIds((prev) => prev.filter((cid) => cid !== id));
    setActiveId(id);
    trackEvent("scenario_reopened", { scenario_count: scenarios.length + 1, user_tier: userTier, source_page: "simulator" });
  }

  // Only show variations that were part of this workspace session then closed
  const closedVariations = closedWorkspaceIds
    .map((id) => savedScenarios.find((s) => s.id === id))
    .filter((s): s is Scenario => s != null);

  function duplicateScenario(id: string) {
    if (scenarios.length >= workspaceLimit) return;
    const src = scenarios.find((s) => s.id === id);
    if (!src) return;
    const dup: Scenario = { ...src, id: genId(), name: src.name + " (copy)", expenses: { ...src.expenses } };
    setSavedScenarios((prev) => [...prev, dup]);
    setWorkspaceIds((prev) => [...prev, dup.id]);
    setActiveId(dup.id);
  }

  function closeScenario(id: string) {
    if (scenarios.length <= 1) return;
    setWorkspaceIds((prev) => prev.filter((wid) => wid !== id));
    setClosedWorkspaceIds((prev) => prev.includes(id) ? prev : [...prev, id]);
    if (activeId === id) {
      const remaining = scenarios.filter((s) => s.id !== id);
      setActiveId(remaining[0]?.id ?? "");
    }
    trackEvent("scenario_closed", { scenario_count: scenarios.length - 1, user_tier: userTier, source_page: "simulator" });
  }

  function updateScenario(id: string, patch: Partial<Scenario>) {
    setSavedScenarios((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function updateExpense(id: string, field: keyof ExpenseData, value: number) {
    setSavedScenarios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, expenses: { ...s.expenses, [field]: value } } : s
      )
    );
  }

  const categoryLabels: Record<string, string> = {};
  for (const f of EXPENSE_FIELDS) categoryLabels[f.name] = f.label;

  function saveToDashboard(scenarioId: string) {
    const s = savedScenarios.find((sc) => sc.id === scenarioId);
    if (!s) return;
    const baseline = scenarios[0];
    const baseExpenses = baseline ? baseline.expenses : initialExpenses;
    const out = computeForExpenses(s.expenses, s.taxRate);
    const baseOut = computeForExpenses(baseExpenses, baseline?.taxRate ?? initialTaxRate);
    const changes = computeChanges(baseExpenses, s.expenses, categoryLabels);
    const monthlyImpact = baseOut.monthlyExpensesTotal - out.monthlyExpensesTotal;
    const annualImpact = monthlyImpact * 12;

    addDashboardScenario({
      name: s.name,
      description: changes.length > 0
        ? changes.map((c) => `${c.category}: $${c.before} → $${c.after}`).join(", ")
        : "No changes from baseline",
      status: "draft",
      progress: 0,
      changes,
      monthlyImpact,
      annualImpact,
      adjustedAnnualRequired: out.annualGrossRequired,
      taxRate: s.taxRate,
      expenses: { ...s.expenses },
      baselineExpenses: { ...baseExpenses },
    });

    setSavedToast(s.name);
    setTimeout(() => setSavedToast(null), 2500);
    trackEvent("scenario_saved_to_dashboard", { scenario_name: s.name, changes_count: changes.length });
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
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, position: "relative" as const }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={currentTheme} onLogoClick={onBack} />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "96px 1.5rem 4rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: "0.9rem", padding: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: t.text, margin: "0 0 0.5rem" }}>Scenario Lab</h1>
        <p style={{ color: t.muted, fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
          {hasPaidAccess
            ? "Compare different financial scenarios side by side."
            : "See how one change could shift your financial position."
          }
        </p>

        {/* Scenario tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {scenarios.map((s, i) => {
            const isActive = s.id === activeId;
            const isLocked = i >= workspaceLimit;
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
          {scenarios.length < workspaceLimit ? (
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
              <Plus size={14} /> Add Variation
            </button>
          ) : userTier === "premium" ? (
            <span
              style={{
                border: `1px dashed ${t.border}`,
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
                fontSize: "0.82rem",
                color: t.muted,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              {workspaceLimit}/{workspaceLimit} slots used
            </span>
          ) : (
            <button
              onClick={() => { const p = userTier === "free" ? "pro" as const : "premium" as const; trackEvent("upgrade_intent", { user_tier: userTier, source_page: "simulator", plan: p }); onUpgrade(p); }}
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
              <Lock size={12} /> Upgrade for more slots
            </button>
          )}
        </div>

        {/* Microcopy + toast */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", minHeight: "1.2rem" }}>
          {hasPaidAccess && (
            <span style={{ fontSize: "0.76rem", color: t.muted }}>
              New variations start as a copy of your current plan — change one thing to see the impact.
            </span>
          )}
          {addedToast && (
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "#22c55e", marginLeft: "auto", whiteSpace: "nowrap" }}>
              {addedToast} added — ready to edit
            </span>
          )}
          {savedToast && (
            <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "#22c55e", marginLeft: "auto", whiteSpace: "nowrap" }}>
              {savedToast} saved to Dashboard
            </span>
          )}
        </div>

        {/* Active scenario form */}
        {activeScenario && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
            {/* Left: form */}
            <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "1.25rem", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, color: t.text }}>{hasPaidAccess ? activeScenario.name : "Your Current Baseline"}</span>
                  {!hasPaidAccess && (
                    <span style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      color: t.muted,
                    }}>
                      Read-only
                    </span>
                  )}
                </div>
                {hasPaidAccess && (
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button onClick={() => duplicateScenario(activeScenario.id)} title="Duplicate" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><Copy size={14} /></button>
                    <button onClick={() => setEditingName(activeScenario.id)} title="Rename" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><Edit3 size={14} /></button>
                    {scenarios.length > 1 && <button onClick={() => closeScenario(activeScenario.id)} title="Close tab (scenario stays saved)" style={{ background: "transparent", border: "none", cursor: "pointer", color: t.muted, padding: "4px" }}><X size={14} /></button>}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <Label style={{ fontSize: "0.78rem", color: t.muted, display: "block", marginBottom: "0.25rem" }}>Tax Rate (%)</Label>
                <Input
                  type="number" min={0} max={70}
                  value={activeScenario.taxRate}
                  onChange={hasPaidAccess ? (e) => updateScenario(activeScenario.id, { taxRate: Math.min(70, Math.max(0, parseFloat(e.target.value) || 0)) }) : undefined}
                  readOnly={!hasPaidAccess}
                  style={{ background: t.bg, border: `1px solid ${t.border}`, color: hasPaidAccess ? t.text : t.muted, maxWidth: "120px", opacity: hasPaidAccess ? 1 : 0.6, cursor: hasPaidAccess ? undefined : "default" }}
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
                      onChange={hasPaidAccess ? (e) => updateExpense(activeScenario.id, field.name, Math.max(0, parseFloat(e.target.value) || 0)) : undefined}
                      readOnly={!hasPaidAccess}
                      placeholder="0"
                      style={{ background: t.bg, border: `1px solid ${t.border}`, color: hasPaidAccess ? t.text : t.muted, flex: 1, opacity: hasPaidAccess ? 1 : 0.6, cursor: hasPaidAccess ? undefined : "default" }}
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
                    onClick={() => {
                      if (hasPaidAccess) {
                        applyPreset(activeScenario.id, p.key);
                      } else {
                        trackEvent("upgrade_intent", { user_tier: userTier, source_page: "simulator", trigger: "preset_click" });
                        onUpgrade("pro");
                      }
                    }}
                    style={{
                      background: t.primary + "10",
                      border: `1px solid ${t.primary}25`,
                      borderRadius: "6px",
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.75rem",
                      color: hasPaidAccess ? t.primary : t.muted,
                      cursor: "pointer",
                      fontWeight: 500,
                      opacity: hasPaidAccess ? 1 : 0.6,
                    }}
                  >
                    {!hasPaidAccess && <Lock size={10} style={{ marginRight: "3px", verticalAlign: "middle" }} />}
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Free-tier lock banner */}
              {!hasPaidAccess && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    background: isDark ? `${t.primary}14` : `${t.primary}0D`,
                    border: `1px solid ${t.primary}33`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Lock size={13} style={{ color: t.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: t.muted, flex: 1 }}>
                    Upgrade to Pro to edit values and build custom scenarios.
                  </span>
                  <button
                    onClick={() => { trackEvent("upgrade_intent", { user_tier: userTier, source_page: "simulator", trigger: "form_lock_banner" }); onUpgrade("pro"); }}
                    style={{
                      background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Upgrade
                  </button>
                </div>
              )}
            </div>

            {/* Right: active scenario results */}
            {(() => {
              const out = computeForExpenses(activeScenario.expenses, activeScenario.taxRate);
              return (
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "1.25rem" }}>
                  <span style={{ fontWeight: 700, color: t.text, fontSize: "0.95rem", display: "block", marginBottom: "1rem" }}>{hasPaidAccess ? "Results" : "Your Numbers"}</span>
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
                      <span style={{ fontWeight: 600, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{row.value}</span>
                    </div>
                  ))}

                  {/* Save to Dashboard button */}
                  {hasPaidAccess && (
                    <button
                      onClick={() => saveToDashboard(activeScenario.id)}
                      style={{
                        marginTop: "1rem",
                        width: "100%",
                        background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "0.55rem 1rem",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <Save size={14} /> Save to Dashboard
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Free-tier comparison teaser ──────────────────────────────── */}
        {!hasPaidAccess && results.length === 1 && (() => {
          // Use the scenario's current expenses as the single source of truth
          const baseScenario = scenarios[0];
          const base = results[0].output;
          const expenses = baseScenario.expenses;
          const { rentRatio, savingsRatio, debtRatio, transportRatio } = base.ratios;

          // Pick the most impactful preview scenario based on user's actual data
          let previewExpenses: ExpenseData;
          let previewTitle: string;

          if (rentRatio > 0.30 && expenses.housing > 0) {
            const reduced = Math.round(expenses.housing * 0.85);
            previewExpenses = { ...expenses, housing: reduced };
            previewTitle = `What if you reduced housing by 15%?`;
          } else if (savingsRatio < 0.05) {
            previewExpenses = { ...expenses, savings: expenses.savings + 200 };
            previewTitle = `What if you started saving $200/month more?`;
          } else if (debtRatio > 0.20 && expenses.other > 0) {
            const reduced = Math.round(expenses.other * 0.80);
            previewExpenses = { ...expenses, other: reduced };
            previewTitle = `What if you cut debt payments by 20%?`;
          } else if (transportRatio > 0.15 && expenses.transport >= 150) {
            previewExpenses = { ...expenses, transport: expenses.transport - 150 };
            previewTitle = `What if you reduced transport by $150?`;
          } else {
            // Default: cut the biggest expense by 10%
            const expenseEntries: { key: keyof ExpenseData; val: number }[] = [
              { key: "housing", val: expenses.housing },
              { key: "food", val: expenses.food },
              { key: "transport", val: expenses.transport },
              { key: "healthcare", val: expenses.healthcare },
              { key: "utilities", val: expenses.utilities },
              { key: "entertainment", val: expenses.entertainment },
              { key: "clothing", val: expenses.clothing },
              { key: "other", val: expenses.other },
            ];
            const biggest = expenseEntries.reduce((a, b) => b.val > a.val ? b : a);
            const reduced = Math.round(biggest.val * 0.90);
            previewExpenses = { ...expenses, [biggest.key]: reduced };
            const fieldLabel = biggest.key === "other" ? "misc expenses" : biggest.key;
            previewTitle = `What if you cut ${fieldLabel} by 10%?`;
          }

          const previewOut = computeForExpenses(previewExpenses, baseScenario.taxRate);

          // Pre-compute deltas from the same source of truth
          const dMonthly = previewOut.monthlyRequiredTotal - base.monthlyRequiredTotal;
          // fragilityScore: 0 = very fragile, 100 = very stable — higher is better
          const dFragility = previewOut.fragilityScore - base.fragilityScore;
          const dHealth = previewOut.healthScore - base.healthScore;

          function formatDelta(delta: number, unit: "dollar" | "pts"): string {
            const sign = delta > 0 ? "+" : "";
            if (unit === "dollar") return sign + fmt(delta);
            return sign + delta.toFixed(0) + " pts";
          }

          return (
            <div style={{ marginBottom: "1.5rem" }}>
              {/* Preview header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <BarChart3 size={18} style={{ color: t.primary }} />
                <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>What One Change Could Do</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: t.muted, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", padding: "2px 7px", borderRadius: "6px" }}>Sample</span>
              </div>

              {/* Dynamic scenario title */}
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: t.primary, marginBottom: "0.65rem" }}>
                {previewTitle}
              </div>

              {/* Side-by-side preview: current vs hypothetical */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.65rem", marginBottom: "1rem" }}>
                {/* Baseline card */}
                <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "1rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: t.text, marginBottom: "0.6rem" }}>
                    Your Current Numbers
                  </div>
                  {[
                    { label: "Monthly Spend", value: fmt(base.monthlyRequiredTotal) },
                    { label: "Stability", value: `${base.fragilityScore}/100` },
                    { label: "Health Score", value: `${base.healthScore}/100` },
                  ].map((m) => (
                    <div key={m.label} style={{ padding: "0.25rem 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>{m.label}</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Preview "what if" card */}
                <div style={{ background: t.cardBg, border: `1px solid ${t.primary}40`, borderRadius: "16px", padding: "1rem", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${t.primary}, ${t.accent})` }} />
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: t.text, marginBottom: "0.6rem" }}>
                    After This Change
                  </div>
                  {([
                    { label: "Monthly Spend", value: fmt(previewOut.monthlyRequiredTotal), delta: dMonthly, good: dMonthly < 0, unit: "dollar" as const },
                    { label: "Stability", value: `${previewOut.fragilityScore}/100`, delta: dFragility, good: dFragility > 0, unit: "pts" as const },
                    { label: "Health Score", value: `${previewOut.healthScore}/100`, delta: dHealth, good: dHealth > 0, unit: "pts" as const },
                  ]).map((m) => (
                    <div key={m.label} style={{ padding: "0.25rem 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}` }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>{m.label}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{m.value}</span>
                        {Math.abs(m.delta) >= 0.1 && (
                          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: m.good ? "#22c55e" : "#ef4444", display: "inline-flex", alignItems: "center", gap: "2px", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                            {m.good ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {formatDelta(m.delta, m.unit)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade CTA */}
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "16px",
                  background: isDark ? `${t.primary}14` : `${t.primary}0D`,
                  border: `1px solid ${t.primary}33`,
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: t.text, marginBottom: "0.2rem" }}>
                    Build and compare your own scenarios
                  </div>
                  <div style={{ fontSize: "0.82rem", color: t.muted, lineHeight: 1.45 }}>
                    Create up to 3 scenarios with custom expenses, see delta comparisons, winner verdicts, and full metric breakdowns.
                  </div>
                </div>
                <button
                  onClick={() => { trackEvent("upgrade_intent", { user_tier: userTier, source_page: "simulator", plan: "pro" }); onUpgrade("pro"); }}
                  style={{
                    background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.55rem 1.25rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    whiteSpace: "nowrap",
                    boxShadow: `0 2px 10px ${t.primary}4D`,
                  }}
                >
                  <Lock size={13} />
                  Upgrade to Pro
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Full comparison (Pro / Premium) ─────────────────────────────── */}
        {hasPaidAccess && results.length > 1 && (() => {
          const baseline = results[0];

          // Delta helper: positive = good when higher is better, negative = good when lower is better
          function DeltaChip({ value, unit, invert }: { value: number; unit: string; invert?: boolean }) {
            if (Math.abs(value) < 0.1) return <span style={{ fontSize: "0.74rem", color: t.muted, display: "inline-flex", alignItems: "center", gap: "2px" }}><Minus size={10} /> —</span>;
            const isGood = invert ? value < 0 : value > 0;
            const color = isGood ? "#22c55e" : "#ef4444";
            const Icon = value > 0 ? TrendingUp : TrendingDown;
            const sign = value > 0 ? "+" : "";
            return (
              <span style={{ fontSize: "0.74rem", fontWeight: 600, color, display: "inline-flex", alignItems: "center", gap: "2px", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
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
                  gridTemplateColumns: isMobile ? "1fr" : `repeat(${results.length}, 1fr)`,
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
                        borderRadius: "16px",
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
                            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: t.text, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>{m.value}</span>
                            {!isBase && <DeltaChip value={m.delta} unit={m.unit} invert={m.invert} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* ── Detailed comparison table ─────────────────────── */}
              <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem" }}>
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
                            <td key={r.scenario.id} style={{ textAlign: "right", padding: "0.45rem 0.75rem", borderBottom: `1px solid ${t.border}20`, color: t.text, fontWeight: 500, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                              {row.fn(r.output)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Impact Summary / Decision Card ─────────────────── */}
              {winner && (() => {
                const dMonthly = winner.output.monthlyRequiredTotal - baseline.output.monthlyRequiredTotal;
                const dAnnual = winner.output.annualGrossRequired - baseline.output.annualGrossRequired;
                const dHealth = winner.output.healthScore - baseline.output.healthScore;
                const dFragility = winner.output.fragilityScore - baseline.output.fragilityScore;

                // Composite magnitude score (0–100 scale) to determine assessment tier
                // Weight monthly savings most, then health, then fragility
                const monthlySavings = Math.max(0, -dMonthly); // positive when winner spends less
                const monthlyPct = baseline.output.monthlyRequiredTotal > 0
                  ? (monthlySavings / baseline.output.monthlyRequiredTotal) * 100
                  : 0;
                const magnitude = monthlyPct * 2 + Math.abs(dHealth) + Math.abs(dFragility) * 0.5;

                let assessment: string;
                let assessmentColor: string;
                if (magnitude >= 30) {
                  assessment = "This is a major shift — worth serious consideration.";
                  assessmentColor = "#22c55e";
                } else if (magnitude >= 10) {
                  assessment = "This is a meaningful improvement that compounds over time.";
                  assessmentColor = "#22c55e";
                } else if (magnitude >= 3) {
                  assessment = "A modest adjustment — small but real progress.";
                  assessmentColor = "#f59e0b";
                } else {
                  assessment = "The difference is marginal — consider testing a bolder change.";
                  assessmentColor = t.muted;
                }

                // Build the plain-language summary parts
                const isWinnerBaseline = winner.scenario.id === baseline.scenario.id;
                const summaryParts: string[] = [];

                if (Math.abs(dMonthly) >= 1) {
                  summaryParts.push(
                    dMonthly < 0
                      ? `saves ${fmt(Math.abs(dMonthly))}/mo`
                      : `costs ${fmt(dMonthly)}/mo more`
                  );
                }
                if (Math.abs(dHealth) >= 1) {
                  summaryParts.push(
                    dHealth > 0
                      ? `improves your health score by ${dHealth.toFixed(0)} points`
                      : `lowers your health score by ${Math.abs(dHealth).toFixed(0)} points`
                  );
                }
                if (Math.abs(dAnnual) >= 1) {
                  summaryParts.push(
                    dAnnual < 0
                      ? `reduces your required income by ${fmt(Math.abs(dAnnual))}/year`
                      : `increases your required income by ${fmt(dAnnual)}/year`
                  );
                }

                const summaryText = isWinnerBaseline
                  ? "Your current baseline is already your strongest position. Try making a bolder change in one of your variations."
                  : summaryParts.length > 0
                    ? `Switching to ${winner.scenario.name} ${summaryParts.join(", ")}.`
                    : `${winner.scenario.name} is marginally better overall.`;

                return (
                  <div
                    style={{
                      background: t.cardBg,
                      border: `1px solid ${t.primary}30`,
                      borderRadius: "14px",
                      padding: "1.5rem",
                      marginBottom: "1.5rem",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Gradient accent bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${t.primary}, ${t.accent})` }} />

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                      <CheckCircle size={18} style={{ color: "#22c55e" }} />
                      <span style={{ fontWeight: 700, color: t.text, fontSize: "1.05rem" }}>Bottom Line</span>
                    </div>

                    {/* Summary text */}
                    <p style={{ margin: "0 0 0.85rem", fontSize: "0.95rem", color: t.text, lineHeight: 1.6, fontWeight: 500 }}>
                      {summaryText}
                    </p>

                    {/* Assessment badge */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.45rem 0.85rem",
                        borderRadius: "8px",
                        background: assessmentColor + "14",
                        border: `1px solid ${assessmentColor}30`,
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: assessmentColor, lineHeight: 1.4 }}>
                        {assessment}
                      </span>
                    </div>

                    {/* Key deltas row — only when winner is not baseline */}
                    {!isWinnerBaseline && (
                      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginTop: "1rem", paddingTop: "0.85rem", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` }}>
                        {[
                          { label: "Monthly", value: dMonthly, prefix: "$", invert: true },
                          { label: "Annual Income", value: dAnnual, prefix: "$", invert: true },
                          { label: "Health", value: dHealth, suffix: " pts", invert: false },
                          { label: "Stability", value: dFragility, suffix: " pts", invert: false },
                        ]
                          .filter((d) => Math.abs(d.value) >= 0.5)
                          .map((d) => {
                            const isGood = d.invert ? d.value < 0 : d.value > 0;
                            const color = isGood ? "#22c55e" : "#ef4444";
                            const sign = d.value > 0 ? "+" : "";
                            const display = d.prefix
                              ? `${sign}${fmt(d.value)}`
                              : `${sign}${d.value.toFixed(0)}${d.suffix}`;
                            return (
                              <div key={d.label}>
                                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.15rem" }}>{d.label}</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700, color, display: "flex", alignItems: "center", gap: "0.25rem", fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
                                  {isGood ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                  {display}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          );
        })()}

        {/* ── Closed Variations (workspace-only reopen area) ────────────── */}
        {hasPaidAccess && closedVariations.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <RotateCcw size={13} style={{ color: t.muted }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Closed Variations
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {closedVariations.map((s) => {
                const atLimit = scenarios.length >= workspaceLimit;
                return (
                  <button
                    key={s.id}
                    onClick={() => !atLimit && reopenScenario(s.id)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${atLimit ? t.border + "50" : t.border}`,
                      borderRadius: "8px",
                      padding: "0.35rem 0.7rem",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: atLimit ? t.muted + "80" : t.muted,
                      cursor: atLimit ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                    title={atLimit ? `Close an open tab first (${workspaceLimit} slot limit)` : `Reopen ${s.name}`}
                  >
                    <RotateCcw size={11} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
