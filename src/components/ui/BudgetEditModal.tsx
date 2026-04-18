import { useState, useRef, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_600, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";

export interface BudgetEditModalProps {
  t: ThemeConfig;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  category: string;
  currentBudget: number;
  actualSpent: number;
  recommendedBudget: number;
  grossMonthlyIncome: number;
  onSave: (amount: number) => void;
  onReset: () => void;
}

const XIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function fmtCompact(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export function BudgetEditModal({
  t,
  isDark,
  isOpen,
  onClose,
  category,
  currentBudget,
  actualSpent,
  recommendedBudget,
  grossMonthlyIncome,
  onSave,
  onReset,
}: BudgetEditModalProps) {
  const [value, setValue] = useState(Math.round(currentBudget));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(Math.round(currentBudget));
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const pctOfIncome = grossMonthlyIncome > 0 ? ((value || 0) / grossMonthlyIncome) * 100 : 0;
  const isValid = value > 0 && value <= grossMonthlyIncome;

  const quickSetStyle: React.CSSProperties = {
    background: isDark ? t.bg : t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 12,
    color: t.muted,
    cursor: "pointer",
    fontFamily: MONO_FONT_STACK,
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
          maxWidth: 440,
          border: `1px solid ${t.border}`,
          position: "relative",
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
          Edit budget for {category}
        </h3>
        <p style={{ fontSize: 14, color: t.muted, margin: "0 0 24px" }}>
          Set a custom monthly limit for this category
        </p>

        {/* Current values */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: t.text }}>Currently spending</span>
          <span style={{ fontSize: 13, fontFamily: MONO_FONT_STACK, fontWeight: 600, color: t.text }}>{fmtCompact(actualSpent)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: t.muted }}>Recommended limit</span>
          <span style={{ fontSize: 13, fontFamily: MONO_FONT_STACK, color: t.muted }}>{fmtCompact(recommendedBudget)}</span>
        </div>
        <div style={{ height: 1, background: t.border, marginBottom: 20 }} />

        {/* Input */}
        <label style={{ fontSize: 13, fontWeight: 500, color: t.muted, display: "block", marginBottom: 8 }}>
          Monthly budget limit
        </label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <span
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              fontWeight: 600,
              fontFamily: MONO_FONT_STACK,
              color: t.muted,
              pointerEvents: "none",
            }}
          >
            $
          </span>
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={grossMonthlyIncome}
            value={value || ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setValue(isNaN(n) ? 0 : n);
            }}
            style={{
              width: "100%",
              padding: "12px 16px 12px 32px",
              fontSize: 18,
              fontWeight: 600,
              fontFamily: MONO_FONT_STACK,
              fontFeatureSettings: "'tnum', 'zero'",
              background: isDark ? t.bg : "#FFFFFF",
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              color: t.text,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = t.primary; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
          />
        </div>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>
          {pctOfIncome.toFixed(0)}% of your gross income
        </div>

        {/* Quick-set buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          <button style={quickSetStyle} onClick={() => setValue(Math.round(recommendedBudget))}>
            Recommended ({fmtCompact(recommendedBudget)})
          </button>
          <button style={quickSetStyle} onClick={() => setValue(Math.round(actualSpent * 0.9))}>
            -10%
          </button>
          <button style={quickSetStyle} onClick={() => setValue(Math.round(actualSpent * 0.8))}>
            -20%
          </button>
        </div>

        {/* Save */}
        <button
          onClick={() => { onSave(value); onClose(); }}
          disabled={!isValid}
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            cursor: isValid ? "pointer" : "default",
            opacity: isValid ? 1 : 0.5,
            pointerEvents: isValid ? "auto" : "none",
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          Save budget
        </button>

        {/* Reset */}
        <div
          onClick={() => { onReset(); onClose(); }}
          style={{
            textAlign: "center",
            marginTop: 12,
            fontSize: 13,
            color: t.muted,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Reset to recommended
        </div>
      </div>
    </div>
  );
}
