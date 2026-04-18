import { useState, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_600, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";

export interface SetAllBudgetsModalProps {
  t: ThemeConfig;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  expenses: Array<{ category: string; amount: number }>;
  currentBudgets: Record<string, number>;
  recommendedBudgets: Record<string, number>;
  grossMonthlyIncome: number;
  onSaveAll: (budgets: Record<string, number>) => void;
}

const XIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function fmtCompact(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export function SetAllBudgetsModal({
  t,
  isDark,
  isOpen,
  onClose,
  expenses,
  currentBudgets,
  recommendedBudgets,
  grossMonthlyIncome,
  onSaveAll,
}: SetAllBudgetsModalProps) {
  const activeExpenses = expenses.filter((e) => e.amount > 0);

  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      const init: Record<string, number> = {};
      for (const e of activeExpenses) {
        init[e.category] = Math.round(currentBudgets[e.category] ?? recommendedBudgets[e.category] ?? 0);
      }
      setValues(init);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const total = Object.values(values).reduce((s, v) => s + (v || 0), 0);
  const exceedsIncome = total > grossMonthlyIncome;

  const setVal = (cat: string, v: number) => {
    setValues((prev) => ({ ...prev, [cat]: v }));
  };

  const resetAll = () => {
    const init: Record<string, number> = {};
    for (const e of activeExpenses) {
      init[e.category] = Math.round(recommendedBudgets[e.category] ?? 0);
    }
    setValues(init);
  };

  const handleSave = () => {
    const budgets: Record<string, number> = {};
    for (const [cat, v] of Object.entries(values)) {
      if (v > 0) budgets[cat] = v;
    }
    onSaveAll(budgets);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: 120,
    padding: "8px 12px",
    fontSize: 14,
    fontFamily: MONO_FONT_STACK,
    fontFeatureSettings: "'tnum', 'zero'",
    fontWeight: 500,
    textAlign: "right",
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: isDark ? t.bg : "#FFFFFF",
    color: t.text,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.cardBg,
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 600,
          border: `1px solid ${t.border}`,
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            background: "none",
            border: "none",
            color: t.muted,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <XIcon />
        </button>

        {/* Header */}
        <h3 style={{ fontSize: 18, fontWeight: 600, color: t.text, margin: "0 0 4px" }}>
          Set custom budgets
        </h3>
        <p style={{ fontSize: 14, color: t.muted, margin: "0 0 24px" }}>
          Customize budget limits for each category
        </p>

        {/* Category rows */}
        <div style={{ marginBottom: 20 }}>
          {activeExpenses.map((e) => (
            <div
              key={e.category}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: t.text }}>{e.category}</span>
              <span style={{ fontSize: 12, color: t.muted, fontFamily: MONO_FONT_STACK, whiteSpace: "nowrap" }}>
                Current: {fmtCompact(e.amount)}
              </span>
              <input
                type="number"
                min={1}
                max={grossMonthlyIncome}
                value={values[e.category] || ""}
                onChange={(ev) => {
                  const n = parseInt(ev.target.value, 10);
                  setVal(e.category, isNaN(n) ? 0 : n);
                }}
                style={inputStyle}
                onFocus={(ev) => { ev.currentTarget.style.borderColor = t.primary; }}
                onBlur={(ev) => { ev.currentTarget.style.borderColor = t.border; }}
              />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Total budget:</span>
          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: MONO_FONT_STACK, color: exceedsIncome ? t.danger : t.text }}>
            {fmtCompact(total)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: exceedsIncome ? 8 : 20 }}>
          <span style={{ fontSize: 13, color: t.muted }}>Income:</span>
          <span style={{ fontSize: 13, fontFamily: MONO_FONT_STACK, color: t.muted }}>{fmtCompact(grossMonthlyIncome)}</span>
        </div>
        {exceedsIncome && (
          <div style={{ fontSize: 12, color: t.danger, marginBottom: 20 }}>
            Total exceeds your monthly income
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={resetAll}
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              color: t.muted,
              cursor: "pointer",
            }}
          >
            Reset all to recommended
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
            }}
          >
            Save all budgets
          </button>
        </div>
      </div>
    </div>
  );
}
