import type { ThemeConfig } from "@/lib/app-shared";
import { MONO_FONT_STACK, EV_500, EV_200 } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";

export interface IncomeBarChartProps {
  t: ThemeConfig;
  isDark: boolean;
  currentIncome: number;
  requiredIncome: number;
}

export function IncomeBarChart({ t, isDark, currentIncome, requiredIncome }: IncomeBarChartProps) {
  const now = new Date();
  const months: { label: string; income: number; required: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    // Use current values for all months (no historical data available)
    months.push({ label, income: currentIncome, required: requiredIncome });
  }

  const maxVal = Math.max(...months.flatMap((m) => [m.income, m.required]), 1);

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Income vs Required</div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Monthly comparison (7 months)</div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: t.muted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: EV_500 }} /> Income
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.15)" : EV_200 }} /> Required
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 140 }}>
        {months.map((m, i) => {
          const incomeH = maxVal > 0 ? (m.income / maxVal) * 120 : 0;
          const requiredH = maxVal > 0 ? (m.required / maxVal) * 120 : 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                <div
                  style={{
                    width: 14,
                    height: incomeH,
                    borderRadius: "4px 4px 0 0",
                    background: EV_500,
                    transition: "height 0.4s ease",
                  }}
                />
                <div
                  style={{
                    width: 14,
                    height: requiredH,
                    borderRadius: "4px 4px 0 0",
                    background: isDark ? "rgba(255,255,255,0.15)" : EV_200,
                    transition: "height 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: t.muted, fontFamily: MONO_FONT_STACK }}>{m.label}</span>
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
          <FormattedNumber value={currentIncome} fontSize="1.1rem" fontWeight={700} color={t.text} centsColor={t.muted} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: t.muted }}>Required</div>
          <FormattedNumber value={requiredIncome} fontSize="1.1rem" fontWeight={700} color={t.text} centsColor={t.muted} />
        </div>
      </div>
    </div>
  );
}
