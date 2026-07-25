import { useEffect, useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_200 } from "@/lib/app-shared";
import { CountUpNumber, eyebrow as eyebrowStyle } from "@/components/editorial";

export interface IncomeBarChartProps {
  t: ThemeConfig;
  isDark: boolean;
  currentIncome: number;
  requiredIncome: number;
  isMobile?: boolean;
}

export function IncomeBarChart({ t, isDark, currentIncome, requiredIncome, isMobile }: IncomeBarChartProps) {
  const barW = isMobile ? 10 : 14;
  const now = new Date();
  const months: { label: string; income: number; required: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    // Use current values for all months (no historical data available)
    months.push({ label, income: currentIncome, required: requiredIncome });
  }

  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.required]), 1);
  const requiredFill = isDark ? "rgba(255,255,255,0.15)" : EV_200;

  // Bars grow up from the axis on first paint (reduced-motion renders full height).
  const [grown, setGrown] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="lp-in"
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ ...eyebrowStyle, color: t.muted, marginBottom: 4 }}>Income vs Required</div>
          <div style={{ fontSize: 12, color: t.muted }}>Monthly comparison (7 months)</div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: t.muted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: EV_500 }} /> Income
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: requiredFill }} /> Required
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 140 }}>
        {months.map((m, i) => {
          const incomeH = maxVal > 0 ? (m.income / maxVal) * 120 : 0;
          const requiredH = maxVal > 0 ? (m.required / maxVal) * 120 : 0;
          const delay = `${i * 55}ms`;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                <div
                  style={{
                    width: barW,
                    height: grown ? incomeH : 0,
                    borderRadius: "4px 4px 0 0",
                    background: EV_500,
                    transition: "height 0.6s cubic-bezier(0.23,1,0.32,1)",
                    transitionDelay: delay,
                  }}
                />
                <div
                  style={{
                    width: barW,
                    height: grown ? requiredH : 0,
                    borderRadius: "4px 4px 0 0",
                    background: requiredFill,
                    transition: "height 0.6s cubic-bezier(0.23,1,0.32,1)",
                    transitionDelay: delay,
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: t.muted, fontFamily: "'Geist Mono', ui-monospace, monospace" }}>{m.label}</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${t.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: t.muted }}>Current Income</div>
          <CountUpNumber value={currentIncome} prefix="$" style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: t.muted }}>Required</div>
          <CountUpNumber value={requiredIncome} prefix="$" style={{ fontSize: "1.1rem", fontWeight: 700, color: t.text }} />
        </div>
      </div>
    </div>
  );
}
