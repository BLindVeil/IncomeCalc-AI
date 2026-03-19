import type { DiagnosisTone } from "@/lib/diagnosis-types";
import type { ThemeConfig } from "@/lib/app-shared";

const TONES: { value: DiagnosisTone; label: string; desc: string }[] = [
  { value: "direct", label: "Direct", desc: "Blunt & strategic" },
  { value: "supportive", label: "Supportive", desc: "Encouraging & specific" },
  { value: "disciplined", label: "Disciplined", desc: "Firm coaching" },
];

interface DiagnosisToneSelectorProps {
  value: DiagnosisTone;
  onChange: (tone: DiagnosisTone) => void;
  t: ThemeConfig;
  isDark: boolean;
  disabled?: boolean;
}

export function DiagnosisToneSelector({ value, onChange, t, isDark, disabled }: DiagnosisToneSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {TONES.map((tone) => {
        const active = value === tone.value;
        return (
          <button
            key={tone.value}
            onClick={() => onChange(tone.value)}
            disabled={disabled}
            style={{
              flex: "1 1 0",
              minWidth: "90px",
              padding: "0.55rem 0.75rem",
              borderRadius: "10px",
              border: active
                ? `2px solid ${t.primary}`
                : `1px solid ${t.border}`,
              background: active
                ? isDark ? `${t.primary}26` : `${t.primary}14`
                : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: active ? t.primary : t.text }}>
              {tone.label}
            </div>
            <div style={{ fontSize: "0.72rem", color: t.muted, marginTop: "2px" }}>
              {tone.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}
