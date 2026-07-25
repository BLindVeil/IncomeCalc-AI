import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";
import { INTENT_OPTIONS, writeIntent, type UserIntent } from "@/lib/intent";
import { trackEvent } from "@/lib/analytics";
import { Header } from "@/components/Header";
import { StepHeader, SelectableRow, CTAButton, Reveal, FONT_STACK } from "@/components/editorial";

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
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: FONT_STACK }}>
      <Header isDark={isDark} setIsDark={setIsDark} currentTheme={t} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 96px" }}>
        <button
          onClick={onBack}
          className="lp-in lp-underline"
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
            padding: "6px 0",
            marginBottom: 28,
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <StepHeader
          eyebrow="Step 1 of 2"
          title="What brings you here?"
          subtitle="Pick one. We'll use it to frame your results — changeable later."
          t={t}
          delay={40}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 36 }}>
          {INTENT_OPTIONS.map((opt, i) => (
            <Reveal key={opt.id} delay={220 + i * 60}>
              <SelectableRow
                selected={selected === opt.id}
                onSelect={() => setSelected(opt.id)}
                title={opt.title}
                description={opt.description}
                t={t}
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={220 + INTENT_OPTIONS.length * 60 + 40}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, gap: 16 }}>
            <button
              onClick={handleSkip}
              className="lp-underline"
              style={{
                background: "transparent",
                border: "none",
                color: t.muted,
                fontSize: 13,
                cursor: "pointer",
                padding: "6px 0",
                fontFamily: "inherit",
              }}
            >
              I'll figure it out later
            </button>

            <CTAButton t={t} isDark={isDark} onClick={handleContinue} disabled={!selected}>
              Continue
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
