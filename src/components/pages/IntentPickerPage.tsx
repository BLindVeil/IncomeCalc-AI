import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";
import { INTENT_OPTIONS, writeIntent, type UserIntent } from "@/lib/intent";
import { trackEvent } from "@/lib/analytics";
import { Header } from "@/components/Header";

export interface IntentPickerPageProps {
  t: ThemeConfig;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function IntentPickerPage({ t, isDark, setIsDark, onContinue, onBack }: IntentPickerPageProps) {
  const [selected, setSelected] = useState<UserIntent | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    writeIntent(selected);
    trackEvent("intent_selected", { intent: selected });
    onContinue();
  };

  const handleSkip = () => {
    writeIntent("curious");
    trackEvent("intent_skipped", {});
    onContinue();
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'Geist', -apple-system, system-ui, sans-serif" }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={t} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 96px" }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: t.muted,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 4px",
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div style={{ fontSize: 11, letterSpacing: "0.12em", fontWeight: 500, color: t.muted, textTransform: "uppercase", marginBottom: 12 }}>
          STEP 1 OF 2
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: t.text, margin: "0 0 8px" }}>
          What brings you here?
        </h1>

        <p style={{ fontSize: 15, color: t.muted, lineHeight: 1.55, margin: "0 0 32px" }}>
          Pick one. We'll use it to frame your results. Changeable later.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {INTENT_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                style={{
                  background: t.cardBg,
                  border: `1px solid ${isSelected ? t.accent : t.border}`,
                  borderRadius: 16,
                  padding: "20px 24px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  color: t.text,
                  transition: "border-color 150ms, background 150ms",
                  outline: "none",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = t.muted;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = isSelected ? t.accent : t.border;
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `2px solid ${isSelected ? t.accent : t.border}`,
                    background: isSelected ? t.accent : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 150ms, background 150ms",
                  }}
                >
                  {isSelected && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>
                    {opt.title}
                  </div>
                  <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.5 }}>
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, gap: 16 }}>
          <button
            onClick={handleSkip}
            style={{
              background: "transparent",
              border: "none",
              color: t.muted,
              fontSize: 13,
              textDecoration: "underline",
              cursor: "pointer",
              padding: "6px 4px",
              fontFamily: "inherit",
            }}
          >
            I'll figure it out later
          </button>

          <button
            onClick={handleContinue}
            disabled={!selected}
            style={{
              background: selected ? "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)" : t.border,
              color: selected ? "white" : t.muted,
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              borderRadius: 999,
              padding: "13px 24px",
              cursor: selected ? "pointer" : "not-allowed",
              transition: "opacity 150ms",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
              opacity: selected ? 1 : 0.7,
            }}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
